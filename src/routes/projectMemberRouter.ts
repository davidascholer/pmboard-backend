import express from "express";
import validateProjectOwnerOrMember from "../middleware/validateProjectOwnerOrMember";
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
  updateProjectMemberStatus,
} from "../controllers/project-member/projectMemberController";
import { authenticateUser } from "../middleware/authenticateUser";
import validateProjectOwnerOrAdmin from "../middleware/validateProjectOwnerOrAdmin";
const projectMemberRouter = express.Router();

projectMemberRouter.get(
  "/:project_id",
  authenticateUser,
  validateProjectOwnerOrMember,
  getProjectMembers
);

projectMemberRouter.post(
  "/:project_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  addProjectMember
);

projectMemberRouter.delete(
  "/:project_id/:member_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  removeProjectMember
);

projectMemberRouter.post(
  "/update-status/:project_id/:member_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  updateProjectMemberStatus
);

projectMemberRouter.post(
  "/update-role/:project_id/:member_id",
  authenticateUser,
  validateProjectOwnerOrAdmin,
  updateProjectMemberRole
);

export default projectMemberRouter;
