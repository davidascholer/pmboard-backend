import request from "supertest";
import express from "express";
import projectRouter from "./projectRouter";
import { authenticateUser } from "../middleware/auth";
import * as projectController from "../controllers/project/projectController";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
import validateProjectOwnerOrMember from "../middleware/validateProjectOwnerOrMember";

// Mock the auth middleware
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

// Mock the project validation middleware
jest.mock("../middleware/validateProjectOwnerOrAdmin", () =>
  jest.fn((req, res, next) => next())
);

jest.mock("../middleware/validateProjectOwnerOrMember", () =>
  jest.fn((req, res, next) => next())
);

// Mock all project controller functions
jest.mock("../controllers/project/projectController", () => ({
  getProject: jest.fn(),
  createProject: jest.fn(),
  updateDescription: jest.fn(),
  addFeatureToProject: jest.fn(),
  removeFeatureFromProject: jest.fn(),
}));

describe("Project Router", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/projects", projectRouter);
    jest.clearAllMocks();
  });

  describe("GET /projects/:id", () => {
    it("should call getProject controller with correct route", async () => {
      const mockResponse = {
        id: "project-id",
        name: "Test Project",
        description: "Test Description",
        features: [],
      };

      (projectController.getProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(200).json(mockResponse);
        }
      );

      const response = await request(app).get("/projects/project-id");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(projectController.getProject).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrMember).toHaveBeenCalledTimes(1);
    });

    it("should handle missing project ID", async () => {
      (projectController.getProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({ message: "Project not found" });
        }
      );

      const response = await request(app).get("/projects/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should validate project ownership or membership", async () => {
      await request(app).get("/projects/project-id");

      expect(validateProjectOwnerOrMember).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /projects", () => {
    it("should create a new project successfully", async () => {
      const requestBody = {
        name: "New Project",
        ownerId: "user-id",
        description: "New project description",
        projectType: "KANBAN",
      };

      const mockResponse = {
        id: "new-project-id",
        name: "New Project",
        description: "New project description",
        ownerId: "user-id",
        projectType: "KANBAN",
        features: [
          {
            id: 1,
            title: "BASE",
            description: "Default feature for project management",
          },
        ],
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(201).json(mockResponse);
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
      expect(projectController.createProject).toHaveBeenCalledTimes(1);
    });

    it("should require name and ownerId fields", async () => {
      const requestBody = {
        description: "Missing required fields",
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "The fields name and ownerId are required.",
          });
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The fields name and ownerId are required."
      );
    });

    it("should validate project type", async () => {
      const requestBody = {
        name: "Test Project",
        ownerId: "user-id",
        projectType: "INVALID_TYPE",
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message:
              "Invalid project type. Allowed values are: KANBAN, SCRUM, WATERFALL.",
          });
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid project type. Allowed values are: KANBAN, SCRUM, WATERFALL."
      );
    });

    it("should handle empty name", async () => {
      const requestBody = {
        name: "",
        ownerId: "user-id",
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid name. It must be a non-empty string.",
          });
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid name. It must be a non-empty string."
      );
    });

    it("should handle invalid ownerId", async () => {
      const requestBody = {
        name: "Test Project",
        ownerId: "",
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid ownerId. It must be a non-empty string.",
          });
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid ownerId. It must be a non-empty string."
      );
    });

    it("should handle non-existent owner", async () => {
      const requestBody = {
        name: "Test Project",
        ownerId: "nonexistent-user-id",
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({
            message: "Owner not found.",
          });
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Owner not found.");
    });

    it("should create project with default KANBAN type", async () => {
      const requestBody = {
        name: "Test Project",
        ownerId: "user-id",
      };

      const mockResponse = {
        id: "new-project-id",
        name: "Test Project",
        ownerId: "user-id",
        projectType: "KANBAN", // Default type
        features: [
          {
            id: 1,
            title: "BASE",
            description: "Default feature for project management",
          },
        ],
      };

      (projectController.createProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(201).json(mockResponse);
        }
      );

      const response = await request(app)
        .post("/projects")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.projectType).toBe("KANBAN");
    });
  });

  describe("PATCH /projects/update-description/:id", () => {
    it("should update project description successfully", async () => {
      const requestBody = {
        description: "Updated description",
      };

      const mockResponse = {
        id: "project-id",
        name: "Test Project",
        description: "Updated description",
        features: [],
      };

      (projectController.updateDescription as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(200).json(mockResponse);
        }
      );

      const response = await request(app)
        .patch("/projects/update-description/project-id")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(projectController.updateDescription).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should require description field", async () => {
      const requestBody = {};

      (projectController.updateDescription as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "The field description is required and must be a string.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/update-description/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The field description is required and must be a string."
      );
    });

    it("should handle non-existent project", async () => {
      const requestBody = {
        description: "Updated description",
      };

      (projectController.updateDescription as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({
            message: "Project not found",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/update-description/nonexistent-id")
        .send(requestBody);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should validate project ownership or admin role", async () => {
      const requestBody = {
        description: "Updated description",
      };

      await request(app)
        .patch("/projects/update-description/project-id")
        .send(requestBody);

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /projects/add-feature/:id", () => {
    it("should add feature to project successfully", async () => {
      const requestBody = {
        title: "New Feature",
        description: "Feature description",
      };

      const mockResponse = {
        id: 2,
        title: "New Feature",
        description: "Feature description",
        projectId: "project-id",
        createdAt: "2025-09-04T23:48:13.495Z", // Use string format for JSON response
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(201).json(mockResponse);
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
      expect(projectController.addFeatureToProject).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should require title field", async () => {
      const requestBody = {
        description: "Feature without title",
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid title. It must be a non-empty string.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid title. It must be a non-empty string."
      );
    });

    it("should reject reserved 'BASE' title", async () => {
      const requestBody = {
        title: "BASE",
        description: "Should not be allowed",
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid title. 'Base' is a reserved title.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid title. 'Base' is a reserved title."
      );
    });

    it("should reject reserved 'base' title (case insensitive)", async () => {
      const requestBody = {
        title: "base",
        description: "Should not be allowed",
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid title. 'Base' is a reserved title.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid title. 'Base' is a reserved title."
      );
    });

    it("should handle empty title", async () => {
      const requestBody = {
        title: "",
        description: "Empty title",
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid title. It must be a non-empty string.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid title. It must be a non-empty string."
      );
    });

    it("should handle non-existent project", async () => {
      const requestBody = {
        title: "New Feature",
        description: "Feature description",
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({
            message: "Project not found",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/nonexistent-id")
        .send(requestBody);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should add feature without description", async () => {
      const requestBody = {
        title: "Feature Without Description",
      };

      const mockResponse = {
        id: 3,
        title: "Feature Without Description",
        description: null,
        projectId: "project-id",
        createdAt: "2025-09-04T23:48:13.495Z", // Use string format for JSON response
      };

      (projectController.addFeatureToProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(201).json(mockResponse);
        }
      );

      const response = await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.description).toBeNull();
    });

    it("should validate project ownership or admin role", async () => {
      const requestBody = {
        title: "New Feature",
      };

      await request(app)
        .patch("/projects/add-feature/project-id")
        .send(requestBody);

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /projects/remove-feature/:id/:featureId", () => {
    it("should remove feature from project successfully", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(204).send();
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/project-id/2")
        .send();

      expect(response.status).toBe(204);
      expect(projectController.removeFeatureFromProject).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid featureId", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "Invalid featureId. It must be a number.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/project-id/invalid-id")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid featureId. It must be a number."
      );
    });

    it("should handle non-existent project", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({
            message: "Project not found",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/nonexistent-id/2")
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should handle non-existent feature", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(404).json({
            message: "Feature not found in the specified project",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/project-id/999")
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        "Feature not found in the specified project"
      );
    });

    it("should prevent deletion of BASE feature", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message: "The base feature may not be deleted.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/project-id/1")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("The base feature may not be deleted.");
    });

    it("should prevent deletion of feature with assigned tickets", async () => {
      (projectController.removeFeatureFromProject as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(400).json({
            message:
              "Cannot delete feature with assigned tickets. Please reassign or delete the tickets first.",
          });
        }
      );

      const response = await request(app)
        .patch("/projects/remove-feature/project-id/2")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Cannot delete feature with assigned tickets. Please reassign or delete the tickets first."
      );
    });

    it("should validate project ownership or admin role", async () => {
      await request(app)
        .patch("/projects/remove-feature/project-id/2")
        .send();

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP Method Restrictions", () => {
    it("should not allow POST to GET endpoints", async () => {
      const response = await request(app)
        .post("/projects/project-id")
        .send({});

      expect(response.status).toBe(404);
    });

    it("should not allow GET to POST endpoints", async () => {
      const response = await request(app).get("/projects");

      expect(response.status).toBe(404);
    });

    it("should not allow GET to PATCH endpoints", async () => {
      const response = await request(app).get("/projects/update-description/project-id");

      expect(response.status).toBe(404);
    });

    it("should not allow PUT to PATCH endpoints", async () => {
      const response = await request(app)
        .put("/projects/add-feature/project-id")
        .send({ title: "Test" });

      expect(response.status).toBe(404);
    });

    it("should not allow DELETE to any endpoints", async () => {
      const response = await request(app).delete("/projects/project-id");

      expect(response.status).toBe(404);
    });
  });

  describe("Middleware Integration", () => {
    it("should apply validateProjectOwnerOrMember to GET route", async () => {
      await request(app).get("/projects/project-id");

      expect(validateProjectOwnerOrMember).toHaveBeenCalledTimes(1);
    });

    it("should apply validateProjectOwnerOrAdmin to update-description route", async () => {
      await request(app)
        .patch("/projects/update-description/project-id")
        .send({ description: "test" });

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should apply validateProjectOwnerOrAdmin to add-feature route", async () => {
      await request(app)
        .patch("/projects/add-feature/project-id")
        .send({ title: "test" });

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should apply validateProjectOwnerOrAdmin to remove-feature route", async () => {
      await request(app)
        .patch("/projects/remove-feature/project-id/2")
        .send();

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should not apply authentication middleware to createProject route", async () => {
      // The createProject route doesn't have authentication middleware
      // This test ensures it remains accessible without authentication
      await request(app)
        .post("/projects")
        .send({ name: "Test", ownerId: "user-id" });

      expect(projectController.createProject).toHaveBeenCalledTimes(1);
    });
  });
});
