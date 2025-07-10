import express from "express";
import {
  createUser,
  getUser,
} from "../controllers/user/userController";
const userRouter = express.Router();

userRouter.get("/", getUser);
userRouter.post("/", createUser);

export default userRouter;
