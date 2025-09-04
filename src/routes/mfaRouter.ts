import express from "express";
import { mfaEmailToken, sendMfaToken } from "../controllers/mfa/mfaController";
import { authenticateUser } from "../middleware/auth";
const mfaRouter = express.Router();

mfaRouter.post("/email-token", authenticateUser, mfaEmailToken);
mfaRouter.post("/get-token", authenticateUser, sendMfaToken);

export default mfaRouter;
