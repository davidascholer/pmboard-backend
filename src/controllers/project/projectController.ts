import { Request, Response } from "express";
import prisma from "../../prismaClient";
import { Project } from "@prisma/client";
import { projectReturnSelect } from "../../lib/returnSignatures";

export const getProject = async (req: Request, res: Response) => {
  const id: string = req.params.id;
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
  // Validate request body
  if (!req.body || !req.body.name || !req.body.ownerId) {
    return res.status(400).json({
      message: "The fields name and ownerId are required.",
    });
  }

  // Validate name
  if (typeof req.body.name !== "string" || req.body.name.trim() === "") {
    return res.status(400).json({
      message: "Invalid name. It must be a non-empty string.",
    });
  }

  // Validate ownerId
  if (typeof req.body.ownerId !== "string" || req.body.ownerId.trim() === "") {
    return res.status(400).json({
      message: "Invalid ownerId. It must be a non-empty string.",
    });
  }

  // Validate owner
  const owner = await prisma.user.findUnique({
    where: { id: req.body.ownerId },
    select: { id: true },
  });
  if (!owner) {
    return res.status(404).json({
      message: "Owner not found.",
    });
  }

  const creationData: {
    ownerId: Project["ownerId"];
    name: Project["name"];
    description?: Project["description"];
    projectType?: Project["projectType"];
  } = {
    ownerId: req.body.ownerId,
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

export const updateDescription = async (req: Request, res: Response) => {
  const id: string = req.params.id;

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

export const addFeatureToProject = async (req: Request, res: Response) => {
  const projectId: string = req.params.id;

  // Validate title
  if (
    !req.body ||
    !req.body.title ||
    typeof req.body.title !== "string" ||
    req.body.title.trim() === ""
  ) {
    return res.status(400).json({
      message: "Invalid title. It must be a non-empty string.",
    });
  }

  // Validate title name
  if (req.body.title.trim().toUpperCase() === "BASE") {
    return res.status(400).json({
      message: "Invalid title. 'Base' is a reserved title.",
    });
  }

  const featureData: {
    title: string;
    description?: string;
  } = {
    title: req.body.title,
  };

  // Optional description field
  if (req.body.description) {
    if (typeof req.body.description !== "string") {
      return res.status(400).json({
        message: "Invalid description. It must be a string.",
      });
    }
    featureData.description = req.body.description;
  }

  try {
    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Create the new feature associated with the project
    const newFeature = await prisma.feature.create({
      data: {
        projectId,
        ...featureData,
      },
    });

    // Successfully return the newly created feature
    res.status(201).json(newFeature);
  } catch (error) {
    console.error("Error adding feature to project:", error);
    res.status(500).json({
      message: "An error occurred while adding the feature to the project",
    });
  }
};

export const removeFeatureFromProject = async (req: Request, res: Response) => {
  const projectId: string = req.params.id;
  const featureId: number = parseInt(req.params.featureId, 10);

  if (isNaN(featureId)) {
    return res.status(400).json({
      message: "Invalid featureId. It must be a number.",
    });
  }

  try {
    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check that the tickets in the feature are reassigned or deleted
    const ticketsInFeature = await prisma.ticket.findMany({
      where: { featureId },
      select: { id: true },
    });

    if (ticketsInFeature.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete feature with assigned tickets. Please reassign or delete the tickets first.",
      });
    }

    // Check if the feature exists and is associated with the project
    const existingFeature = await prisma.feature.findFirst({
      where: { id: featureId, projectId },
      select: { id: true },
    });

    if (!existingFeature) {
      return res.status(404).json({
        message: "Feature not found in the specified project",
      });
    }

    // Validate title is not BASE
    if (req.body.title.trim().toUpperCase() === "BASE") {
      return res.status(400).json({
        message: "The base feature may not be deleted.",
      });
    }

    // Delete the feature
    await prisma.feature.delete({
      where: { id: featureId },
    });

    // Successfully return a no content response
    res.status(204).send();
  } catch (error) {
    console.error("Error removing feature from project:", error);
    res.status(500).json({
      message: "An error occurred while removing the feature from the project",
    });
  }
};
