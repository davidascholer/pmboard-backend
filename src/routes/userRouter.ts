import express from "express";
import {
  authenticateUser,
  createUser,
  getUser,
} from "../controllers/user/userController";
import { authenticate } from "../middleware/auth";
const userRouter = express.Router();

userRouter.get("/", getUser);
userRouter.post("/", createUser);
userRouter.get("/auth", authenticate, authenticateUser);

export default userRouter;
