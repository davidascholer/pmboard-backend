import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import projectRouter from "./routes/projectRouter.js";
import userRouter from "./routes/userRouter.js";
import authRouter from "./routes/authRouter.js";
import ticketRouter from "./routes/ticketRouter.js";
import testRouter from "./routes/testRouter.js";
import mfaRouter from "./routes/mfaRouter.js";
import featureRouter from "./routes/featureRouter.js";
import projectMemberRouter from "./routes/projectMemberRouter.js";

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
// app.use(cookieParser()); // Use if you need to parse cookies globally

if (process.env.PROD === "true") {
  app.use(
    cors({
      origin: "https://pmboard.io",
      credentials: true,
    })
  );
} else {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
}

// Global logging middleware (only active when not in production)
app.use(loggingMiddleware);

// Routes
app.use("/pmboard/api/v1/test", testRouter);
app.use("/pmboard/api/v1/users", userRouter);
app.use("/pmboard/api/v1/mfa", mfaRouter);
app.use("/pmboard/api/v1/auth", authRouter);
app.use("/pmboard/api/v1/projects", projectRouter);
app.use("/pmboard/api/v1/project-members", projectMemberRouter);
app.use("/pmboard/api/v1/features", featureRouter);
app.use("/pmboard/api/v1/tickets", ticketRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));
