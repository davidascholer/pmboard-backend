import { Request, Response } from "express";
import prisma from "../../prismaClient";
import { projectReturnSelect } from "../../lib/returnSignatures";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";

export const getProjectMembers = async (req: Request, res: Response) => {
  const projectId: string = req.params.project_id;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        User: {
          select: {
            name: true,
          },
        },
      },
    });

    // Successfully return the project members
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching project members:", error);
    res.status(500).json({
      message: "An error occurred while fetching project members",
    });
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  const projectId: string = req.params.project_id;
  const { userId, role } = req.body;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  // Validate request body
  if (!userId || !role) {
    return res.status(400).json({
      message: "User ID and role are required.",
    });
  }

  // Validate role
  const validRoles = ["ADMIN", "MEMBER"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
    });
  }

  try {
    // Check if the user is already a member of the project
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "User is already a member of the project.",
      });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
        memberStatus: "PENDING", // New members start with PENDING status
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({
      message: "An error occurred while adding the project member.",
    });
  }
};

export const updateProjectMemberRole = async (req: Request, res: Response) => {
  const projectId: string = req.params.project_id;
  const memberId: string = req.params.member_id;
  const { role } = req.body;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Validate request body
  if (!role) {
    return res.status(400).json({
      message: "Role is required.",
    });
  }

  // Validate role
  const validRoles = ["ADMIN", "MEMBER"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
    });
  }

  try {
    const updatedMember = await prisma.projectMember.updateMany({
      where: { id: memberId, projectId },
      data: {
        role,
      },
    });

    if (updatedMember.count === 0) {
      return res.status(404).json({
        message: "Project member not found.",
      });
    }

    res.status(200).json({
      message: "Project member role updated successfully.",
    });
  } catch (error) {
    console.error("Error updating project member role:", error);
    res.status(500).json({
      message: "An error occurred while updating the project member role.",
    });
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  const projectId: string = req.params.project_id;
  const memberId: string = req.params.member_id;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const deletedMember = await prisma.projectMember.deleteMany({
      where: { id: memberId, projectId },
    });

    if (deletedMember.count === 0) {
      return res.status(404).json({
        message: "Project member not found.",
      });
    }

    res.status(200).json({
      message: "Project member removed successfully.",
    });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({
      message: "An error occurred while removing the project member.",
    });
  }
};

export const updateProjectMemberStatus = async (
  req: Request,
  res: Response
) => {
  const projectId: string = req.params.project_id;
  const memberId: string = req.params.member_id;
  const { memberStatus } = req.body;

  // Validated the request user
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Validate request body
  if (!memberStatus) {
    return res.status(400).json({
      message: "Member status is required.",
    });
  }

  // Validate memberStatus
  const validStatuses = ["PENDING", "ACTIVE", "INACTIVE"];
  if (!validStatuses.includes(memberStatus)) {
    return res.status(400).json({
      message: `Invalid member status. Valid statuses are: ${validStatuses.join(
        ", "
      )}`,
    });
  }

  try {
    const updatedMember = await prisma.projectMember.updateMany({
      where: { id: memberId, projectId },
      data: {
        memberStatus,
      },
    });

    if (updatedMember.count === 0) {
      return res.status(404).json({
        message: "Project member not found.",
      });
    }

    res.status(200).json({
      message: "Project member status updated successfully.",
    });
  } catch (error) {
    console.error("Error updating project member status:", error);
    res.status(500).json({
      message: "An error occurred while updating the project member status.",
    });
  }
};
