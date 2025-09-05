import express from "express";
import {
  createTicket,
  deleteTicket,
  readTicket,
  updateTicket,
} from "../controllers/ticket/ticketController";
import { authenticateUser } from "../middleware/authenticateUser";
import validateProjectMember from "../middleware/validateProjectMember";
const ticketRouter = express.Router();

ticketRouter.get("/:project_id", authenticateUser, validateProjectMember, readTicket);
ticketRouter.post("/", createTicket);
ticketRouter.patch("/", updateTicket);
ticketRouter.delete("/", deleteTicket);

export default ticketRouter;
