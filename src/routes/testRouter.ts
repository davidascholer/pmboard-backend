import express from "express";
import { getTest, postTest } from "../controllers/test/testController";
const testRouter = express.Router();

testRouter.get("/", getTest);
testRouter.post("/", postTest);

export default testRouter;
