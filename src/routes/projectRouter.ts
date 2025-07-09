import express from "express";
import {
  createProject,
  getProject,
  getProjects,
} from "../controllers/project/projectController.js";
const projectRouter = express.Router();

projectRouter.get("/", getProjects);
projectRouter.get('/:id', getProject);
projectRouter.post('/', createProject);

// // Update Post
// router.put('/:id', updatePost);

// // Delete Post
// router.delete('/:id', deletePost);

export default projectRouter;
