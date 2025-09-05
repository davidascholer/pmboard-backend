import express from "express";
import {
  createProject,
  deleteProject,
  getProject,
  updateDescription,
  updateStatus,
} from "../controllers/project/projectController";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
import validateProjectOwnerOrMember from "../middleware/validateProjectOwnerOrMember";
import { authenticateUser } from "../middleware/authenticateUser";
import validateProjectOwner from "../middleware/validateProjectOwner";
const projectRouter = express.Router();

projectRouter.get("/:project_id", authenticateUser, validateProjectOwnerOrMember, getProject);
projectRouter.post("/", authenticateUser, createProject);
projectRouter.delete("/:project_id", authenticateUser, validateProjectOwner, deleteProject);
projectRouter.patch(
  "/update-description/:project_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  updateDescription
);
projectRouter.patch(
  "/update-status/:project_id",
  authenticateUser,
  validateProjectOwner,
  updateStatus
);

export default projectRouter;
