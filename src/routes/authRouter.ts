import express from "express";
import { authenticate } from "../middleware/auth";
import {
  authenticateUser,
  refreshToken,
} from "../controllers/auth/authController";
const authRouter = express.Router();

authRouter.get("/", authenticate, authenticateUser);
authRouter.get("/refresh", refreshToken);

export default authRouter;
