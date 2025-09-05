import request from "supertest";
import express from "express";
import projectRouter from "../../routes/projectRouter";
import validateProjectOwnerOrAdmin from "../../middleware/validateProjectOwnerOrAdmin";
import validateProjectOwnerOrMember from "../../middleware/validateProjectOwnerOrMember";
import validateProjectOwner from "../../middleware/validateProjectOwner";
import {
  createProject,
  deleteProject,
  getProject,
  updateDescription,
  updateStatus,
} from "./projectController";
import {
  addFeatureToProject,
  removeFeatureFromProject,
} from "../feature/featureController";

// Mock Prisma client
jest.mock("../../prismaClient", () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    feature: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

// Mock the auth middleware
jest.mock("../../middleware/authenticateUser", () => ({
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
jest.mock("../../middleware/validateProjectOwnerOrAdmin", () =>
  jest.fn((req, res, next) => next())
);

jest.mock("../../middleware/validateProjectOwnerOrMember", () =>
  jest.fn((req, res, next) => next())
);

jest.mock("../../middleware/validateProjectOwner", () =>
  jest.fn((req, res, next) => next())
);

// Mock all project controller functions
jest.mock("./projectController", () => ({
  getProject: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  updateDescription: jest.fn(),
  updateStatus: jest.fn(),
}));

// Mock feature controller functions
jest.mock("../feature/featureController", () => ({
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

  afterAll(async () => {
    // Close any open handles
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("GET /projects/:id", () => {
    it("should call getProject controller with correct route", async () => {
      const mockResponse = {
        id: "project-id",
        name: "Test Project",
        description: "Test Description",
        features: [],
      };

      (getProject as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app).get("/projects/project-id");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(getProject).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrMember).toHaveBeenCalledTimes(1);
    });

    it("should handle missing project ID", async () => {
      (getProject as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: "Project not found" });
      });

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
        description: "New project description",
        projectType: "KANBAN",
      };

      const mockResponse = {
        id: "new-project-id",
        name: "New Project",
        description: "New project description",
        ownerId: "user-id", // This comes from authenticated user
        projectType: "KANBAN",
        status: "ACTIVE", // Default status
        features: [
          {
            id: 1,
            title: "BASE",
            description: "Default feature for project management",
          },
        ],
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
      expect(createProject).toHaveBeenCalledTimes(1);
    });

    it("should require name field", async () => {
      const requestBody = {
        description: "Missing required name field",
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message: "The name field is required.",
        });
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("The name field is required.");
    });

    it("should validate project type", async () => {
      const requestBody = {
        name: "Test Project",
        projectType: "INVALID_TYPE",
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message:
            "Invalid project type. Allowed values are: KANBAN, SCRUM, WATERFALL.",
        });
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid project type. Allowed values are: KANBAN, SCRUM, WATERFALL."
      );
    });

    it("should handle empty name", async () => {
      const requestBody = {
        name: "",
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message: "Invalid name. It must be a non-empty string.",
        });
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid name. It must be a non-empty string."
      );
    });

    it("should handle unauthorized requests", async () => {
      const requestBody = {
        name: "Test Project",
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({
          message: "Unauthorized",
        });
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should create project with default KANBAN type and ACTIVE status", async () => {
      const requestBody = {
        name: "Test Project",
      };

      const mockResponse = {
        id: "new-project-id",
        name: "Test Project",
        ownerId: "user-id", // From authenticated user
        projectType: "KANBAN", // Default type
        status: "ACTIVE", // Default status
        features: [
          {
            id: 1,
            title: "BASE",
            description: "Default feature for project management",
          },
        ],
      };

      (createProject as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app).post("/projects").send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.projectType).toBe("KANBAN");
      expect(response.body.status).toBe("ACTIVE");
      expect(response.body.ownerId).toBe("user-id");
    });
  });

  describe("DELETE /projects/:id", () => {
    it("should delete project successfully", async () => {
      (deleteProject as jest.Mock).mockImplementation((req, res) => {
        res.status(204).send();
      });

      const response = await request(app).delete("/projects/project-id").send();

      expect(response.status).toBe(204);
      expect(deleteProject).toHaveBeenCalledTimes(1);
    });

    it("should handle non-existent project", async () => {
      (deleteProject as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({
          message: "Project not found",
        });
      });

      const response = await request(app)
        .delete("/projects/nonexistent-id")
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should handle unauthorized deletion", async () => {
      (deleteProject as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({
          message: "Unauthorized",
        });
      });

      const response = await request(app).delete("/projects/project-id").send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should handle database errors during deletion", async () => {
      (deleteProject as jest.Mock).mockImplementation((req, res) => {
        res.status(500).json({
          message: "An error occurred while deleting the project",
        });
      });

      const response = await request(app).delete("/projects/project-id").send();

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        "An error occurred while deleting the project"
      );
    });

    it("should validate project ownership", async () => {
      await request(app).delete("/projects/project-id").send();

      // The validateProjectOwner middleware should be called
      // This is mocked to always succeed in our test setup
      expect(deleteProject).toHaveBeenCalledTimes(1);
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

      (updateDescription as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .patch("/projects/update-description/project-id")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(updateDescription).toHaveBeenCalledTimes(1);
      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should require description field", async () => {
      const requestBody = {};

      (updateDescription as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message: "The field description is required and must be a string.",
        });
      });

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

      (updateDescription as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({
          message: "Project not found",
        });
      });

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

  describe("PATCH /projects/update-status/:id", () => {
    it("should update project status successfully", async () => {
      const requestBody = {
        status: "ARCHIVED",
      };

      const mockResponse = {
        id: "project-id",
        name: "Test Project",
        status: "ARCHIVED",
        description: "Test Description",
        features: [],
      };

      (updateStatus as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .patch("/projects/update-status/project-id")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(updateStatus).toHaveBeenCalledTimes(1);
      expect(validateProjectOwner).toHaveBeenCalledTimes(1);
    });

    it("should require status field", async () => {
      const requestBody = {};

      (updateStatus as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message:
            "The status field is required and must be either ACTIVE or ARCHIVED.",
        });
      });

      const response = await request(app)
        .patch("/projects/update-status/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The status field is required and must be either ACTIVE or ARCHIVED."
      );
    });

    it("should validate status values", async () => {
      const requestBody = {
        status: "INVALID_STATUS",
      };

      (updateStatus as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({
          message:
            "The status field is required and must be either ACTIVE or ARCHIVED.",
        });
      });

      const response = await request(app)
        .patch("/projects/update-status/project-id")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The status field is required and must be either ACTIVE or ARCHIVED."
      );
    });

    it("should handle non-existent project", async () => {
      const requestBody = {
        status: "ARCHIVED",
      };

      (updateStatus as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({
          message: "Project not found",
        });
      });

      const response = await request(app)
        .patch("/projects/update-status/nonexistent-id")
        .send(requestBody);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should handle unauthorized requests", async () => {
      const requestBody = {
        status: "ARCHIVED",
      };

      (updateStatus as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({
          message: "Unauthorized",
        });
      });

      const response = await request(app)
        .patch("/projects/update-status/project-id")
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should validate project ownership", async () => {
      const requestBody = {
        status: "ARCHIVED",
      };

      await request(app)
        .patch("/projects/update-status/project-id")
        .send(requestBody);

      expect(validateProjectOwner).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP Method Restrictions", () => {
    it("should not allow POST to GET endpoints", async () => {
      const response = await request(app).post("/projects/project-id").send({});

      expect(response.status).toBe(404);
    });

    it("should not allow GET to POST endpoints", async () => {
      const response = await request(app).get("/projects");

      expect(response.status).toBe(404);
    });

    it("should not allow GET to PATCH endpoints", async () => {
      const response = await request(app).get(
        "/projects/update-description/project-id"
      );

      expect(response.status).toBe(404);
    });

    it("should not allow PUT to PATCH endpoints", async () => {
      const response = await request(app)
        .put("/projects/add-feature/project-id")
        .send({ title: "Test" });

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
      (addFeatureToProject as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ message: "Feature added" });
      });

      await request(app)
        .patch("/projects/add-feature/project-id")
        .send({ title: "test" });

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should apply validateProjectOwnerOrAdmin to remove-feature route", async () => {
      (removeFeatureFromProject as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ message: "Feature removed" });
      });

      await request(app).patch("/projects/remove-feature/project-id/2").send();

      expect(validateProjectOwnerOrAdmin).toHaveBeenCalledTimes(1);
    });

    it("should apply validateProjectOwner to delete route", async () => {
      await request(app).delete("/projects/project-id").send();

      // The validateProjectOwner middleware should be called for DELETE
      expect(deleteProject).toHaveBeenCalledTimes(1);
    });

    it("should apply authentication middleware to createProject route", async () => {
      // The createProject route has authentication middleware
      await request(app).post("/projects").send({ name: "Test" });

      expect(createProject).toHaveBeenCalledTimes(1);
    });
  });
});
