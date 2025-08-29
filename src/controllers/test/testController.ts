import { Request, Response } from "express";
import prisma from "../../prismaClient";

export const getTest = async (req: Request, res: Response) => {
  const allTests = await prisma.test.findMany();
  if (allTests.length === 0) {
    return res.status(404).json({ message: "No test entries found." });
  }
  return res
    .status(200)
    .json({ message: "Test endpoint is working!", data: allTests });
};

export const postTest = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }
  const newTest = await prisma.test.create({
    data: { name },
  });
  return res
    .status(201)
    .json({ message: "New test entry created!", data: newTest });
};

export const deleteAllTests = async (req: Request, res: Response) => {
  await prisma.test.deleteMany({});
  return res.status(200).json({ message: "All test entries deleted." });
};