import { Request, Response } from "express";
import prisma from "../../prismaClient";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";

// Get all tickets for a project
export const readTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id } = req.params;

    const tickets = await prisma.ticket.findMany({
      where: {
        feature: {
          projectId: project_id,
        },
      },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single ticket
export const readTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new ticket
export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id } = req.params;
    const { title, description, featureId, priority, status, section } = req.body;

    if (!title || !featureId) {
      return res.status(400).json({ 
        message: "Title and featureId are required" 
      });
    }

    // Verify the feature belongs to the project
    const feature = await prisma.feature.findFirst({
      where: {
        id: parseInt(featureId),
        projectId: project_id,
      },
    });

    if (!feature) {
      return res.status(404).json({ 
        message: "Feature not found in this project" 
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || "",
        featureId: parseInt(featureId),
        priority: priority || "NONE",
        status: status || "UNASSIGNED",
        section: section || "ACTIVE",
      },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a ticket
export const updateTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const updateData = req.body;

    // Verify ticket exists and belongs to the project
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: updateData,
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a ticket
export const deleteTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;

    // Verify ticket exists and belongs to the project
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await prisma.ticket.delete({
      where: { id: ticket_id },
    });

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add assignee to ticket
export const addAssignee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectId: project_id,
        memberStatus: "ACTIVE",
      },
    });

    if (!projectMember) {
      return res.status(404).json({ 
        message: "User is not an active member of this project" 
      });
    }

    // Check if already assigned
    const existingAssignment = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        assignees: {
          some: {
            id: projectMember.id,
          },
        },
      },
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: "User is already assigned to this ticket" 
      });
    }

    // Add assignee
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: {
        assignees: {
          connect: { id: projectMember.id },
        },
      },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error adding assignee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove assignee from ticket
export const removeAssignee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Find the project member
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectId: project_id,
      },
    });

    if (!projectMember) {
      return res.status(404).json({ 
        message: "User is not a member of this project" 
      });
    }

    // Remove assignee
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: {
        assignees: {
          disconnect: { id: projectMember.id },
        },
      },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error removing assignee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get timelog for a ticket (returns the timeLog field)
export const getTimelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
      select: {
        id: true,
        title: true,
        timeLog: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      ticketId: ticket.id,
      title: ticket.title,
      timeLog: ticket.timeLog || 0,
    });
  } catch (error) {
    console.error("Error fetching timelog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create/Update timelog for a ticket
export const createTimelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { timeLog } = req.body;

    if (timeLog === undefined || timeLog < 0) {
      return res.status(400).json({ 
        message: "timeLog is required and must be a non-negative number" 
      });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { timeLog },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating timelog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update timelog (alias for createTimelog)
export const updateTimelog = createTimelog;

// Delete timelog (set to 0)
export const deleteTimelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { timeLog: 0 },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error deleting timelog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket description
export const updateDescription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { description } = req.body;

    if (description === undefined) {
      return res.status(400).json({ message: "description is required" });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { description },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating description:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket status
export const updateStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { status } = req.body;

    const validStatuses = ["UNASSIGNED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `status is required and must be one of: ${validStatuses.join(", ")}` 
      });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { status },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket priority
export const updatePriority = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { priority } = req.body;

    const validPriorities = ["NONE", "LOW", "MODERATE", "HIGH", "URGENT"];
    
    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        message: `priority is required and must be one of: ${validPriorities.join(", ")}` 
      });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { priority },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating priority:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket section
export const updateSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { section } = req.body;

    const validSections = ["ACTIVE", "ARCHIVED", "BACKLOG"];
    
    if (!section || !validSections.includes(section)) {
      return res.status(400).json({ 
        message: `section is required and must be one of: ${validSections.join(", ")}` 
      });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { section },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket title
export const updateTitle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, ticket_id } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "title is required and cannot be empty" });
    }

    // Verify ticket exists and belongs to the project
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticket_id,
        feature: {
          projectId: project_id,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { title: title.trim() },
      include: {
        feature: true,
        assignees: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating title:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};