import express from "express";
import projectRouter from "./routes/projectRouter.js"
import userRouter from "./routes/userRouter.js";

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());

// Routes
app.use("/users", userRouter);
app.use("/projects", projectRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));

