import { Request, Response } from "express";
import prisma from "../../prismaClient";

export const addFeatureToProject = async (req: Request, res: Response) => {
  const projectId: string = req.params.project_id;

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

  // Make sure the title is unique within the project
  const existingFeature = await prisma.feature.findFirst({
    where: {
      projectId,
      title: req.body.title,
    },
    select: { id: true },
  });

  if (existingFeature) {
    return res.status(400).json({
      message: "A feature with this title already exists in the project.",
    });
  }

  // Prepare the feature data
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
  const projectId: string = req.params.project_id;
  const featureId: number = parseInt(req.params.id, 10);

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
      select: { id: true, title: true },
    });

    if (!existingFeature) {
      return res.status(404).json({
        message: "Feature not found in the specified project",
      });
    }

    // Validate title is not BASE
    if (existingFeature.title.trim().toUpperCase() === "BASE") {
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
