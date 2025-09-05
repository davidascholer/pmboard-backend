// Validate that the user is the owner of the project they are trying to access
import { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";
import { AuthenticatedRequest } from "./authenticateUser";

const validateProjectOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized project ownership",
    });
  }

  const projectId = req.params.project_id;
  const userId = authReq.user.id;

  if (!projectId || !userId) {
    return res.status(400).json({
      message: "Project ID and User ID are required.",
    });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, members: true },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isOwner = project.ownerId === userId;
    // Check if the user is a member with ADMIN role
    const isAdminMember = project.members.some(
      (member) => member.userId === userId && member.role === "ADMIN"
    );

    if (!isAdminMember && !isOwner) {
      return res.status(403).json({
        message: "Invalid permissions.",
      });
    }

    next();
  } catch (error) {
    console.error("Error validating project owner:", error);
    return res.status(500).json({
      message: "An error occurred while validating project owner.",
    });
  }
};

export default validateProjectOwnerOrAdmin;
