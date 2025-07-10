import express from "express";
import {
  createTicket,
  deleteTicket,
  readTicket,
  updateTicket,
} from "../controllers/ticket/ticketController";
const ticketRouter = express.Router();

ticketRouter.get("/:id", readTicket);
ticketRouter.post("/", createTicket);
ticketRouter.patch("/", updateTicket);
ticketRouter.delete("/", deleteTicket);

export default ticketRouter;
