import express from "express";
import {
  addFeatureToProject,
  createProject,
  getProject,
  removeFeatureFromProject,
  updateDescription,
} from "../controllers/project/projectController";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
import validateProjectOwnerOrMember from "../middleware/validateProjectOwnerOrMember";
const projectRouter = express.Router();

projectRouter.get("/:id", validateProjectOwnerOrMember, getProject);
projectRouter.post("/", createProject);
projectRouter.patch(
  "/update-description/:id",
  validateProjectOwnerOrAdmin,
  updateDescription
);
projectRouter.patch(
  "/add-feature/:id",
  validateProjectOwnerOrAdmin,
  addFeatureToProject
);
projectRouter.patch(
  "/remove-feature/:id/:featureId",
  validateProjectOwnerOrAdmin,
  removeFeatureFromProject
);

export default projectRouter;
