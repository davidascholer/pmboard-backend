import express from "express";
import {
  addFeatureToProject,
  createProject,
  deleteProject,
  getProject,
  removeFeatureFromProject,
  updateDescription,
  updateStatus,
} from "../controllers/project/projectController";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
import validateProjectOwnerOrMember from "../middleware/validateProjectOwnerOrMember";
import { authenticateUser } from "../middleware/auth";
import validateProjectOwner from "../middleware/validateProjectOwner";
const projectRouter = express.Router();

projectRouter.get("/:id", authenticateUser, validateProjectOwnerOrMember, getProject);
projectRouter.post("/", authenticateUser, createProject);
projectRouter.delete("/:id", authenticateUser, validateProjectOwner, deleteProject);
projectRouter.patch(
  "/update-description/:id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  updateDescription
);
projectRouter.patch(
  "/update-status/:id",
  authenticateUser,
  validateProjectOwner,
  updateStatus
);
projectRouter.patch(
  "/add-feature/:id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  addFeatureToProject
);
projectRouter.patch(
  "/remove-feature/:id/:featureId",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  removeFeatureFromProject
);

export default projectRouter;
