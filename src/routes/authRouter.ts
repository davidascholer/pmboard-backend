import express from "express";
import {
  refreshToken,
} from "../controllers/auth/authController";
const authRouter = express.Router();

// authRouter.get("/access", authenticate, authenticateUser);
authRouter.get("/refresh", refreshToken);

export default authRouter;
