import express from "express";
import projectRouter from "./routes/projectRouter.js"

const port = process.env.PORT || 8000;
console.log("port", process.env.PORT);

const app = express();

// Routes
app.use("/projects", projectRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));

