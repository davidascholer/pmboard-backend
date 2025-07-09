import { Request, Response } from "express";
import projectReturnSelect from "./projectReturnSignatures";
import prisma from "../../prismaClient";

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const allPosts = await prisma.project
      .findMany({
        select: projectReturnSelect,
      })
      .catch((error:any) => {
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
      .catch((error:any) => {
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