import express from "express";
import projectRouter from "./routes/projectRouter.js"
import userRouter from "./routes/userRouter.js";
import authRouter from "./routes/authRouter.js";
import ticketRouter from "./routes/ticketRouter.js";

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());

// Routes
app.use("pmboard/api/v1/users", userRouter);
app.use("pmboard/api/v1/auth", authRouter);
app.use("pmboard/api/v1/projects", projectRouter);
app.use("pmboard/api/v1/tickets", ticketRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));

