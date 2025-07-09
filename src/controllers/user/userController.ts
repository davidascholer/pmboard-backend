import { Request, Response } from "express";
import userReturnSelect from "./userReturnSignatures";
import prisma from "../../prismaClient";
import { User } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { generateJWT } from "./util";
import { AuthenticatedRequest } from "../../middleware/auth";

export const getUser = async (req: Request, res: Response) => {
  // Validate email parameter
  if (!req.body.email || typeof req.body.email !== "string") {
    return res.status(400).json({
      message: "Invalid email parameter",
    });
  }
  // Validate password parameter
  if (!req.body.password || typeof req.body.password !== "string") {
    return res.status(400).json({
      message: "Invalid id parameter",
    });
  }

  // Find the user by email
  try {
    const user = await prisma.user
      .findUnique({
        where: { email: req.body.email },
        select: userReturnSelect,
      })
      .catch((error: any) => {
        console.error("Error fetching user:", error);
        res.status(400).json({
          message: "An error occurred while fetching projects",
        });
      });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if the password matches
    const isPasswordValid = await compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Successfully return the user info
    const { password: _password, ...userWithoutPassword } = user;
    res.status(200).json({ ...userWithoutPassword, access: generateJWT(user) });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "An error occurred while fetching user",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  console.log("create request body", req.body);
  // Validate email parameter
  if (!req.body.email || typeof req.body.email !== "string") {
    return res.status(400).json({
      message: "Invalid email parameter",
    });
  }

  // Validate password parameter
  if (!req.body.password || typeof req.body.password !== "string") {
    return res.status(400).json({
      message: "Invalid password parameter",
    });
  }

  // Check if the user exists
  try {
    const user = await prisma.user
      .findUnique({
        where: { email: req.body.email },
        select: {
          email: true,
          password: true,
        },
      })
      .catch((error: any) => {
        console.error("Error fetching projects:", error);
        res.status(400).json({
          message: "An error occurred while fetching projects",
        });
      });
    if (user) {
      return res.status(404).json({
        message: "User already exists",
      });
    }

    // Todo: Validate email and password format

    // Has the password
    const hashedPassword = await hash(req.body.password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
      },
      select: userReturnSelect,
    });
    const { password: _password, ...newUserWithoutPassword } = newUser;
    res
      .status(201)
      .json({ ...newUserWithoutPassword, access: generateJWT(newUser) });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "An error occurred while creating user",
    });
  }
};

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // Check if the user is authenticated
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Return the authenticated user info
  const { password: _password, ...userWithoutPassword } = req.user;
  res.status(200).json(userWithoutPassword);
};
