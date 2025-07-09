import express from "express";
import {
  getProject,
  getProjects,
} from "../controllers/project/projectController.js";
const projectRouter = express.Router();

projectRouter.get("/", getProjects);
projectRouter.get('/:id', getProject);

// // Create new post
// router.post('/', createPost);

// // Update Post
// router.put('/:id', updatePost);

// // Delete Post
// router.delete('/:id', deletePost);

export default projectRouter;
