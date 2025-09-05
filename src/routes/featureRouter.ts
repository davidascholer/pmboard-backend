import express from "express";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
import { authenticateUser } from "../middleware/authenticateUser";
import { addFeatureToProject, removeFeatureFromProject } from "../controllers/feature/featureController";
const featureRouter = express.Router();

featureRouter.post(
  "/:project_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  addFeatureToProject
);
featureRouter.delete(
  "/:project_id/:id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  removeFeatureFromProject
);

export default featureRouter;
