import request from "supertest";
import express from "express";
import userRouter from "./userRouter";
import { authenticateUser } from "../middleware/authenticateUser";
import * as userController from "../controllers/user/userController";

// Mock the middleware
jest.mock("../middleware/auth", () => ({
  authenticateUser: jest.fn((req, res, next) => {
    // Mock authenticated user
    req.user = {
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
      isActive: true,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      membership: {
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
      },
      nextMembership: null,
      projectsOwned: [],
      projectsJoined: [],
    };
    next();
  }),
}));

// Mock all user controller functions
jest.mock("../controllers/user/userController", () => ({
  getAuthenticatedUser: jest.fn(),
  userSignIn: jest.fn(),
  userSignUp: jest.fn(),
  updateUserPassword: jest.fn(),
  updateUserSettings: jest.fn(),
  userActivate: jest.fn(),
  userDeactivate: jest.fn(),
  userDelete: jest.fn(),
  verifyAndUpdateMembership: jest.fn(),
  updateMembership: jest.fn(),
  updateNextMembership: jest.fn(),
}));

describe("User Router", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/user", userRouter);

    // Reset all mocks
    jest.clearAllMocks();

    // Set default successful responses for all mocked functions
    (userController.getAuthenticatedUser as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        });
      }
    );

    (userController.userSignIn as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        message: "Sign in successful",
        token: "jwt-token",
        user: { id: "user-id", name: "Test User", email: "test@example.com" },
      });
    });

    (userController.userSignUp as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({
        message: "User created successfully",
        user: { id: "user-id", name: "Test User", email: "test@example.com" },
      });
    });

    (userController.updateUserPassword as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "Password updated successfully",
        });
      }
    );

    (userController.updateUserSettings as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "Settings updated successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );

    (userController.userActivate as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "User activated successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );

    (userController.userDeactivate as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "User deactivated successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );

    (userController.userDelete as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        message: "User deleted successfully",
      });
    });

    (userController.verifyAndUpdateMembership as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "Membership verified successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );

    (userController.updateMembership as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "Membership updated successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );

    (userController.updateNextMembership as jest.Mock).mockImplementation(
      (req, res) => {
        res.status(200).json({
          message: "Next membership updated successfully",
          user: { id: "user-id", name: "Test User", email: "test@example.com" },
        });
      }
    );
  });

  describe("GET /user", () => {
    it("should get authenticated user", async () => {
      const response = await request(app).get("/user");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      });
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.getAuthenticatedUser).toHaveBeenCalled();
    });
  });

  describe("POST /user/signin", () => {
    it("should sign in user", async () => {
      const loginData = {
        email: "test@example.com",
        password: "testpassword",
      };

      const response = await request(app).post("/user/signin").send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Sign in successful");
      expect(userController.userSignIn).toHaveBeenCalled();
      expect(authenticateUser).not.toHaveBeenCalled(); // No auth middleware for signin
    });
  });

  describe("POST /user/signup", () => {
    it("should sign up user", async () => {
      const signupData = {
        email: "test@example.com",
        password: "testpassword",
        name: "Test User",
      };

      const response = await request(app).post("/user/signup").send(signupData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User created successfully");
      expect(userController.userSignUp).toHaveBeenCalled();
      expect(authenticateUser).not.toHaveBeenCalled(); // No auth middleware for signup
    });
  });

  describe("PATCH /user/update-password/:token", () => {
    it("should update user password", async () => {
      const passwordData = {
        email: "test@example.com",
        newPassword: "newpassword123",
      };

      const response = await request(app)
        .patch("/user/update-password/test-token-123")
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password updated successfully");
      expect(userController.updateUserPassword).toHaveBeenCalled();
      expect(authenticateUser).not.toHaveBeenCalled(); // No auth middleware for password update
    });
  });

  describe("PATCH /user/update-settings", () => {
    it("should update user settings", async () => {
      const settingsData = {
        settings: { theme: "dark", notifications: true },
      };

      const response = await request(app)
        .patch("/user/update-settings")
        .send(settingsData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Settings updated successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.updateUserSettings).toHaveBeenCalled();
    });
  });

  describe("PATCH /user/activate/:token", () => {
    it("should activate user", async () => {
      const response = await request(app).patch("/user/activate/test-token-123");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User activated successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.userActivate).toHaveBeenCalled();
    });
  });

  describe("PATCH /user/deactivate/:token", () => {
    it("should deactivate user", async () => {
      const response = await request(app).patch(
        "/user/deactivate/test-token-123"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deactivated successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.userDeactivate).toHaveBeenCalled();
    });
  });

  describe("GET /user/verify-membership", () => {
    it("should verify and update membership", async () => {
      const response = await request(app).get("/user/verify-membership");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Membership verified successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.verifyAndUpdateMembership).toHaveBeenCalled();
    });
  });

  describe("PATCH /user/update-membership", () => {
    it("should update membership", async () => {
      const membershipData = {
        membershipStatus: "STARTUP",
        expiry: "MONTH",
      };

      const response = await request(app)
        .patch("/user/update-membership")
        .send(membershipData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Membership updated successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.updateMembership).toHaveBeenCalled();
    });
  });

  describe("PATCH /user/update-next-membership", () => {
    it("should update next membership", async () => {
      const nextMembershipData = {
        membershipStatus: "TEAM",
        startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        expiry: "YEAR",
      };

      const response = await request(app)
        .patch("/user/update-next-membership")
        .send(nextMembershipData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Next membership updated successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.updateNextMembership).toHaveBeenCalled();
    });
  });

  describe("POST /user/delete/:token", () => {
    it("should delete user", async () => {
      const deleteData = {
        token: "test-token-123",
      };

      const response = await request(app)
        .post("/user/delete/test-token-123")
        .send(deleteData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted successfully");
      expect(authenticateUser).toHaveBeenCalled();
      expect(userController.userDelete).toHaveBeenCalled();
    });
  });

  describe("Authentication Middleware", () => {
    it("should require authentication for protected routes", async () => {
      // Mock authentication failure
      (authenticateUser as jest.Mock).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ message: "Unauthorized" });
      });

      const response = await request(app).get("/user");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should not require authentication for public routes", async () => {
      const response = await request(app).post("/user/signin").send({
        email: "test@example.com",
        password: "testpassword",
      });

      expect(response.status).toBe(200);
      expect(authenticateUser).not.toHaveBeenCalled();
    });
  });

  describe("Route Parameters", () => {
    it("should pass token parameter to activate endpoint", async () => {
      await request(app).patch("/user/activate/my-special-token");

      expect(userController.userActivate).toHaveBeenCalled();
      const call = (userController.userActivate as jest.Mock).mock.calls[0];
      expect(call[0].params.token).toBe("my-special-token");
    });

    it("should pass token parameter to deactivate endpoint", async () => {
      await request(app).patch("/user/deactivate/my-special-token");

      expect(userController.userDeactivate).toHaveBeenCalled();
      const call = (userController.userDeactivate as jest.Mock).mock.calls[0];
      expect(call[0].params.token).toBe("my-special-token");
    });

    it("should pass token parameter to update password endpoint", async () => {
      await request(app)
        .patch("/user/update-password/my-special-token")
        .send({
          email: "test@example.com",
          newPassword: "newpassword",
        });

      expect(userController.updateUserPassword).toHaveBeenCalled();
      const call = (userController.updateUserPassword as jest.Mock).mock.calls[0];
      expect(call[0].params.token).toBe("my-special-token");
    });

    it("should pass token parameter to delete endpoint", async () => {
      await request(app)
        .post("/user/delete/my-special-token")
        .send({ token: "my-special-token" });

      expect(userController.userDelete).toHaveBeenCalled();
      const call = (userController.userDelete as jest.Mock).mock.calls[0];
      expect(call[0].params.token).toBe("my-special-token");
    });
  });

  describe("Request Body Validation", () => {
    it("should pass request body to controller functions", async () => {
      const testData = { test: "data" };

      await request(app).patch("/user/update-settings").send(testData);

      expect(userController.updateUserSettings).toHaveBeenCalled();
      const call = (userController.updateUserSettings as jest.Mock).mock.calls[0];
      expect(call[0].body).toEqual(testData);
    });

    it("should handle empty request body", async () => {
      await request(app).get("/user/verify-membership");

      expect(userController.verifyAndUpdateMembership).toHaveBeenCalled();
      const call = (userController.verifyAndUpdateMembership as jest.Mock).mock.calls[0];
      expect(call[0].body).toBeUndefined(); // GET requests don't have a body
    });
  });

  describe("Error Handling", () => {
    it("should handle controller errors gracefully", async () => {
      (userController.getAuthenticatedUser as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(500).json({ message: "Internal server error" });
        }
      );

      const response = await request(app).get("/user");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle invalid JSON in request body", async () => {
      const response = await request(app)
        .post("/user/signin")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });
  });

  describe("HTTP Methods", () => {
    it("should only accept GET for / endpoint", async () => {
      const postResponse = await request(app).post("/user");
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put("/user");
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete("/user");
      expect(deleteResponse.status).toBe(404);
    });

    it("should only accept POST for signin endpoint", async () => {
      const getResponse = await request(app).get("/user/signin");
      expect(getResponse.status).toBe(404);

      const putResponse = await request(app).put("/user/signin");
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete("/user/signin");
      expect(deleteResponse.status).toBe(404);
    });

    it("should only accept PATCH for update endpoints", async () => {
      const getResponse = await request(app).get("/user/update-settings");
      expect(getResponse.status).toBe(404);

      const postResponse = await request(app).post("/user/update-settings");
      expect(postResponse.status).toBe(404);

      const deleteResponse = await request(app).delete("/user/update-settings");
      expect(deleteResponse.status).toBe(404);
    });
  });
});
