import express from "express";
import {
  refreshToken,
} from "../controllers/auth/authController";
import cookieParser from "cookie-parser";
const authRouter = express.Router();

// authRouter.get("/access", authenticate, authenticateUser);
authRouter.get("/refresh", cookieParser(), refreshToken);

export default authRouter;
