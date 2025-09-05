import {
  getAuthenticatedUser,
  userSignIn,
  userSignUp,
  updateUserSettings,
  userActivate,
  userDeactivate,
  userDelete,
  createUserToken,
  updateUserPassword,
  verifyAndUpdateMembership,
  updateMembership,
  updateNextMembership,
} from "./userController";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedpassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT utilities
jest.mock("../auth/util", () => ({
  generateJWT: jest.fn().mockReturnValue("fake-token"),
}));

// Mock the prisma client
jest.mock("../../prismaClient", () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        isActive: true,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        // For sign up: return null (user doesn't exist)
        // For sign in: return user (user exists)
        if (where.email?.includes("test") && !where.email?.includes("signin")) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          password: "hashedpassword",
          isActive: true,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          membership: {
            status: "FREE",
            startedAt: new Date(),
            endsAt: null,
          },
          nextMembership: null,
          projectsOwned: [],
          projectsJoined: [],
        });
      }),
      update: jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        isActive: true,
        settings: { background: "dark", theme: "custom" },
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      }),
      delete: jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      }),
    },
    membership: {
      create: jest.fn().mockResolvedValue({
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
        userId: "user-id",
      }),
    },
    token: {
      findUnique: jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
      }),
      create: jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        userId: "user-id",
      }),
      delete: jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
      }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $disconnect: jest.fn(),
  },
}));

import prisma from "../../prismaClient";
const mockPrisma = jest.mocked(prisma);

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close any open handles
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("getAuthenticatedUser", () => {
    it("should return authenticated user information", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          password: "testpassword",
          isActive: true,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          membership: {
            status: "FREE",
            startedAt: new Date(),
            endsAt: null,
          },
          nextMembership: null,
          projectsOwned: [],
          projectsJoined: [],
        },
      } as unknown as AuthenticatedRequest;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getAuthenticatedUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything(),
        })
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      const mockRequest = {} as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getAuthenticatedUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });
  });

  describe("userSignIn", () => {
    it("should sign in user with valid credentials", async () => {
      const mockRequest = {
        body: { email: "signin@test.com", password: "testpassword" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignIn(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          a: "fake-token",
          r: "fake-token",
        })
      );
    });

    it("should return 400 for invalid email parameter", async () => {
      const mockRequest = {
        body: { email: "", password: "testpassword" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignIn(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid email parameter",
      });
    });

    it("should return 400 for invalid password parameter", async () => {
      const mockRequest = {
        body: { email: "test@example.com", password: "" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignIn(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid password parameter",
      });
    });

    it("should return 404 when user not found", async () => {
      const mockRequest = {
        body: { email: "nonexistent@test.com", password: "testpassword" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock user not found
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await userSignIn(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 401 for invalid password", async () => {
      const mockRequest = {
        body: { email: "signin@test.com", password: "wrongpassword" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Ensure user is found first, then mock password comparison failure
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "signin@test.com",
        password: "hashedpassword",
        isActive: true,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      });

      // Mock password comparison failure
      const bcrypt = require("bcrypt");
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await userSignIn(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid password",
      });

      // Restore original function
      bcrypt.compare = originalCompare;
    });
  });

  describe("userSignUp", () => {
    it("should create user successfully", async () => {
      const uniqueEmail = `test${Date.now()}@test.com`;
      const mockRequest = {
        body: {
          email: uniqueEmail,
          password: "testpassword",
          name: "Test User",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Reset findUnique to return null for new user (user doesn't exist)
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await userSignUp(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          a: "fake-token",
          r: "fake-token",
        })
      );
    });

    it("should return 400 for invalid email parameter", async () => {
      const mockRequest = {
        body: {
          email: "",
          password: "testpassword",
          name: "Test User",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignUp(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid email parameter",
      });
    });

    it("should return 400 for invalid password parameter", async () => {
      const mockRequest = {
        body: {
          email: "test@example.com",
          password: "",
          name: "Test User",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignUp(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid password parameter",
      });
    });

    it("should return 400 for invalid name parameter", async () => {
      const mockRequest = {
        body: {
          email: "test@example.com",
          password: "testpassword",
          name: "",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userSignUp(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid name parameter",
      });
    });

    it("should return 404 when user already exists", async () => {
      const mockRequest = {
        body: {
          email: "existing@example.com",
          password: "testpassword",
          name: "Test User",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock user already exists
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        email: "existing@example.com",
        password: "hashedpassword",
      });

      await userSignUp(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User already exists",
      });
    });
  });

  describe("userActivate", () => {
    it("should activate user successfully", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userActivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User activated successfully",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should return 400 for invalid token parameter", async () => {
      const mockRequest = {
        params: { token: "" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userActivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid token parameter",
      });
    });

    it("should return 404 when token not found", async () => {
      const mockRequest = {
        params: { token: "nonexistent-token" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock token not found
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue(null);

      await userActivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Token not found",
      });
    });

    it("should return 400 when token is expired", async () => {
      const mockRequest = {
        params: { token: "expired-token" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock expired token
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
        id: "token-id",
        token: "expired-token",
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
      });

      await userActivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Token has expired",
      });
    });
  });

  describe("userDeactivate", () => {
    it("should deactivate user successfully", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Reset token mock to return valid token
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
      });

      await userDeactivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User deactivated successfully",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should return 400 for invalid token parameter", async () => {
      const mockRequest = {
        params: { token: "" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userDeactivate(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid token parameter",
      });
    });
  });

  describe("userDelete", () => {
    it("should delete user successfully", async () => {
      const mockRequest = {
        body: { token: "test-token-123" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Reset token mock to return valid token
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
      });

      await userDelete(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should return 400 for invalid token parameter", async () => {
      const mockRequest = {
        body: { token: "" },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await userDelete(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid token parameter",
      });
    });
  });

  describe("createUserToken", () => {
    it("should create a new token for user", async () => {
      const mockUser = {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        isActive: true,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const token = await createUserToken(mockUser);

      expect(token).toBe("test-token-123");
      expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-id" },
      });
      expect(mockPrisma.token.create).toHaveBeenCalledWith({
        data: { userId: "user-id" },
      });
    });
  });

  describe("updateUserPassword", () => {
    it("should update password successfully", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
        body: {
          email: "test@example.com",
          newPassword: "newpassword123",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Reset token mock to return valid token
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
      });

      await updateUserPassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Password updated successfully",
      });
    });

    it("should return 400 for invalid email parameter", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
        body: {
          email: "",
          newPassword: "newpassword123",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateUserPassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid email parameter",
      });
    });

    it("should return 400 for invalid newPassword parameter", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
        body: {
          email: "test@example.com",
          newPassword: "",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateUserPassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid newPassword parameter",
      });
    });

    it("should return 400 when token does not match email", async () => {
      const mockRequest = {
        params: { token: "test-token-123" },
        body: {
          email: "different@example.com",
          newPassword: "newpassword123",
        },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Reset token mock to return valid token with different email
      mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
        id: "token-id",
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdAt: new Date(),
        userId: "user-id",
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com", // Different from the email in the request
        },
      });

      await updateUserPassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Token does not match the email",
      });
    });
  });

  describe("updateUserSettings", () => {
    it("should update user settings successfully", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          password: "testpassword",
          isActive: true,
          settings: { background: "default" },
          createdAt: new Date(),
          updatedAt: new Date(),
          membership: {
            status: "FREE",
            startedAt: new Date(),
            endsAt: null,
          },
          nextMembership: null,
          projectsOwned: [],
          projectsJoined: [],
        },
        body: {
          settings: {
            background: "dark",
            theme: "custom",
          },
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateUserSettings(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Settings updated successfully",
        user: expect.objectContaining({
          id: "user-id",
          settings: { background: "dark", theme: "custom" },
        }),
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const mockRequest = {
        body: {
          settings: {
            background: "dark",
          },
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateUserSettings(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 400 for invalid settings parameter", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
        },
        body: {
          settings: "invalid-settings", // Should be object, not string
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateUserSettings(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid settings parameter",
      });
    });
  });

  describe("verifyAndUpdateMembership", () => {
    it("should return no update needed when no nextMembership", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock user with no nextMembership
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        membership: {
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
      });

      await verifyAndUpdateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No membership update needed",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should update membership when nextMembership start date has passed", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock user with expired nextMembership
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        membership: {
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: {
          status: "STARTUP",
          startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      await verifyAndUpdateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Membership updated successfully",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const mockRequest = {} as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await verifyAndUpdateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });
  });

  describe("updateMembership", () => {
    it("should update membership successfully", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
        body: {
          membershipStatus: "STARTUP",
          expiry: "MONTH",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Membership updated successfully",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should return 400 for invalid membership parameters", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
        body: {
          membershipStatus: "INVALID_STATUS",
          expiry: "INVALID_EXPIRY",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid membership status or expiry parameter",
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const mockRequest = {
        body: {
          membershipStatus: "STARTUP",
          expiry: "MONTH",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });
  });

  describe("updateNextMembership", () => {
    it("should update next membership successfully", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
        body: {
          membershipStatus: "TEAM",
          startsAt: futureDate.toISOString(),
          expiry: "YEAR",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateNextMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Next membership updated successfully",
        user: expect.objectContaining({
          id: "user-id",
        }),
      });
    });

    it("should return 400 for invalid next membership parameters", async () => {
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
        body: {
          membershipStatus: "INVALID_STATUS",
          startsAt: "invalid-date",
          expiry: "INVALID_EXPIRY",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateNextMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid nextMembership status or expiry parameter",
      });
    });

    it("should return 400 when startsAt is in the past", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const mockRequest = {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
        body: {
          membershipStatus: "TEAM",
          startsAt: pastDate.toISOString(),
          expiry: "YEAR",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateNextMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "startsAt must be a future date",
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const mockRequest = {
        body: {
          membershipStatus: "TEAM",
          startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiry: "YEAR",
        },
      } as unknown as AuthenticatedRequest;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateNextMembership(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });
  });
});
