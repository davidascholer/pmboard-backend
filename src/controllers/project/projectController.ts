import { Request, Response } from "express";
import projectReturnSelect from "./projectReturnSignatures";
import prisma from "../../prismaClient";
import { Project } from "@prisma/client";

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const allPosts = await prisma.project
      .findMany({
        select: projectReturnSelect,
      })
      .catch((error: any) => {
        console.error("Error fetching projects:", error);
        res.status(400).json({
          message: "An error occurred while fetching projects",
        });
      });

    // Successfully return the projects
    res.status(200).json(allPosts);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      message: "An error occurred while fetching projects",
    });
  }
};

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
    const post = await prisma.project
      .create({
        data: {
          name: req.body.name,
          description: req.body.description,
          projectType: req.body.projectType,
          owner: req.body.owner,
        },
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
