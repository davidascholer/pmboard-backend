import express from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import validateProjectMember from "../middleware/validateProjectMember";
import {
  readTickets,
  readTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addAssignee,
  removeAssignee,
  getTimelog,
  createTimelog,
  updateTimelog,
  deleteTimelog,
  updateDescription,
  updateStatus,
  updatePriority,
  updateSection,
  updateTitle,
} from "../controllers/ticket/ticketController";

const ticketRouter = express.Router();

// tickets
ticketRouter.get("/:project_id", authenticateUser, validateProjectMember, readTickets);
ticketRouter.get("/:project_id/:ticket_id", authenticateUser, validateProjectMember, readTicket);
ticketRouter.post("/:project_id", authenticateUser, validateProjectMember, createTicket);
ticketRouter.patch("/:project_id/:ticket_id", authenticateUser, validateProjectMember, updateTicket);
ticketRouter.delete("/:project_id/:ticket_id", authenticateUser, validateProjectMember, deleteTicket);
// assignees
ticketRouter.patch("/add-assignee/:project_id/:ticket_id", authenticateUser, validateProjectMember, addAssignee);
ticketRouter.patch("/remove-assignee/:project_id/:ticket_id", authenticateUser, validateProjectMember, removeAssignee);
ticketRouter.get("/timelog/:project_id/:ticket_id", authenticateUser, validateProjectMember, getTimelog );
// timelog
ticketRouter.post("/timelog/:project_id/:ticket_id", authenticateUser, validateProjectMember, createTimelog);
ticketRouter.patch("/timelog/:project_id/:ticket_id/:timelog_id", authenticateUser, validateProjectMember, updateTimelog);
ticketRouter.delete("/timelog/:project_id/:ticket_id/:timelog_id", authenticateUser, validateProjectMember, deleteTimelog);
// description
ticketRouter.patch("/update-description/:project_id/:ticket_id", authenticateUser, validateProjectMember, updateDescription);
// status
ticketRouter.patch("/update-status/:project_id/:ticket_id", authenticateUser, validateProjectMember, updateStatus);
// priority
ticketRouter.patch("/update-priority/:project_id/:ticket_id", authenticateUser, validateProjectMember, updatePriority);
// section
ticketRouter.patch("/update-section/:project_id/:ticket_id", authenticateUser, validateProjectMember, updateSection);
// title
ticketRouter.patch("/update-title/:project_id/:ticket_id", authenticateUser, validateProjectMember, updateTitle);

export default ticketRouter;
