import { Request, Response } from "express";
import prisma from "../../prismaClient";
import { Project } from "@prisma/client";
import { projectReturnSelect } from "../../lib/returnSignatures";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";

export const getProject = async (req: Request, res: Response) => {
  const id: string = req.params.project_id;
  try {
    const post = await prisma.project
      .findUnique({
        where: { id },
        select: projectReturnSelect,
      })
      .catch((error: any) => {
        console.error("Error fetching projects:", error);
        res.status(400).json({
          message: "An error occurred while fetching projects",
        });
      });

    // Check if the project exists
    if (!post) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    // Successfully return the projects
    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      message: "An error occurred while fetching projects",
    });
  }
};

export const createProject = async (req: Request, res: Response) => {
  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Validate request body
  if (!req.body || !req.body.name) {
    return res.status(400).json({
      message: "The name field is required.",
    });
  }

  // Validate name
  if (typeof req.body.name !== "string" || req.body.name.trim() === "") {
    return res.status(400).json({
      message: "Invalid name. It must be a non-empty string.",
    });
  }

  // Make sure name is unique for the user
  const existingProject = await prisma.project.findFirst({
    where: { name: req.body.name, ownerId: authReq.user.id },
    select: { id: true },
  });

  if (existingProject) {
    return res.status(400).json({
      message: "You already have a project with this name.",
    });
  }

  // Prepare the project creation data
  const creationData: {
    ownerId: Project["ownerId"];
    name: Project["name"];
    description?: Project["description"];
    projectType?: Project["projectType"];
  } = {
    ownerId: authReq.user.id,
    name: req.body.name,
  };

  // Validate optional project type
  if (req.body.projectType) {
    if (
      req.body.projectType !== "KANBAN" &&
      req.body.projectType !== "SCRUM" &&
      req.body.projectType !== "WATERFALL"
    ) {
      return res.status(400).json({
        message:
          "Invalid project type. Allowed values are: KANBAN, SCRUM, WATERFALL.",
      });
    }
    creationData.projectType = req.body.projectType;
  }

  // Optional description field
  if (req.body.description) {
    creationData.description = req.body.description;
  }

  try {
    // Use a transaction to create both project and default feature
    const result = await prisma.$transaction(async (tx) => {
      // Create the project first
      const newProject = await tx.project.create({
        data: creationData,
      });

      // Create a default feature for the project
      await tx.feature.create({
        data: {
          projectId: newProject.id,
          title: "BASE", // Uses the default from schema, but being explicit
          description: "Default feature for project management",
        },
      });

      // Add the project creator as an ADMIN member of the project
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: authReq.user!.id,
          role: "ADMIN",
          memberStatus: "ACTIVE",
        },
      });

      // Return the project with all related data
      return await tx.project.findUnique({
        where: { id: newProject.id },
        select: projectReturnSelect,
      });
    });

    // Successfully return the project with its default feature
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      message: "An error occurred while creating the project",
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const id: string = req.params.project_id;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Make sure the project status is ARCHIVED
    const isArchived = existingProject.status === "ARCHIVED";
    if (!isArchived) {
      return res.status(400).json({
        message: "The project must be archived before deleting features.",
      });
    }

    // Use a transaction to delete all related records and the project
    await prisma.$transaction(async (tx) => {
      // 1. First, get all features for this project
      const features = await tx.feature.findMany({
        where: { projectId: id },
        select: { id: true },
      });

      // 2. Delete all tickets associated with these features
      if (features.length > 0) {
        const featureIds = features.map((feature) => feature.id);
        await tx.ticket.deleteMany({
          where: { featureId: { in: featureIds } },
        });
      }

      // 3. Delete all features for this project
      await tx.feature.deleteMany({
        where: { projectId: id },
      });

      // 4. Delete all project members
      await tx.projectMember.deleteMany({
        where: { projectId: id },
      });

      // 5. Finally, delete the project itself
      await tx.project.delete({
        where: { id },
      });
    });

    // Successfully return a no content response
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      message: "An error occurred while deleting the project",
    });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  const id: string = req.params.project_id;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Validate request body
  if (
    !req.body ||
    !req.body.status ||
    (req.body.status !== "ACTIVE" && req.body.status !== "ARCHIVED")
  ) {
    return res.status(400).json({
      message:
        "The status field is required and must be either ACTIVE or ARCHIVED.",
    });
  }

  try {
    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Update the project's status
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status: req.body.status },
      select: projectReturnSelect,
    });

    // Successfully return the updated project
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({
      message: "An error occurred while updating the project status",
    });
  }
};

export const updateDescription = async (req: Request, res: Response) => {
  const id: string = req.params.project_id;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Validate request body
  if (!req.body || typeof req.body.description !== "string") {
    return res.status(400).json({
      message: "The field description is required and must be a string.",
    });
  }

  try {
    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Update the project's description
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { description: req.body.description },
      select: projectReturnSelect,
    });

    // Successfully return the updated project
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project description:", error);
    res.status(500).json({
      message: "An error occurred while updating the project description",
    });
  }
};
