import { Request, Response } from "express";
import userReturnSelect from "./userReturnSignatures";
import prisma from "../../prismaClient";
import { User } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { generateJWT } from "../auth/util";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";

export const getAuthenticatedUser = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Return the authenticated user info
    const { password: _password, ...userWithoutPassword } = authReq.user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      message: "An error occurred while fetching user",
    });
  }
};

export const userSignIn = async (req: Request, res: Response) => {
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
          message: "An error occurred while fetching the user",
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

    // Successfully return the user info w access and refresh tokens
    const { password: _password, ...userWithoutPassword } = user;
    return res.status(200).json({
      ...userWithoutPassword,
      a: generateJWT(user, "access", "1h"),
      r: generateJWT(user, "refresh", "30d"),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      message: "An error occurred while fetching user",
    });
  }
};

export const userSignUp = async (req: Request, res: Response) => {
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
  // Validate name parameter
  if (!req.body.name || typeof req.body.name !== "string") {
    return res.status(400).json({
      message: "Invalid name parameter",
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
        name: req.body.name,
      },
      select: userReturnSelect,
    });
    const { password: _password, ...newUserWithoutPassword } = newUser;
    res.status(201).json({
      ...newUserWithoutPassword,
      a: generateJWT(newUser, "access", "1h"),
      r: generateJWT(newUser, "refresh", "30d"),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "An error occurred while creating user",
    });
  }
};

export const userActivate = async (req: Request, res: Response) => {
  // Validate token parameter
  if (!req.body.token || typeof req.body.token !== "string") {
    return res.status(400).json({
      message: "Invalid token parameter",
    });
  }

  try {
    // Find the token and associated user
    const tokenRecord = await prisma.token.findUnique({
      where: { token: req.body.token },
      include: { user: true },
    });

    // Check if token exists
    if (!tokenRecord) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    // Check if token is expired
    const now = new Date();
    if (tokenRecord.expiresAt < now) {
      return res.status(400).json({
        message: "Token has expired",
      });
    }

    // Update user to active status
    const updatedUser = await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isActive: true },
      select: userReturnSelect,
    });

    // Delete the token after successful activation
    await prisma.token.delete({
      where: { id: tokenRecord.id },
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: "User activated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({
      message: "An error occurred while activating user",
    });
  }
};

export const userDeactivate = async (req: Request, res: Response) => {
  // Validate token parameter
  if (!req.body.token || typeof req.body.token !== "string") {
    return res.status(400).json({
      message: "Invalid token parameter",
    });
  }

  try {
    // Find the token and associated user
    const tokenRecord = await prisma.token.findUnique({
      where: { token: req.body.token },
      include: { user: true },
    });

    // Check if token exists
    if (!tokenRecord) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    // Check if token is expired
    const now = new Date();
    if (tokenRecord.expiresAt < now) {
      return res.status(400).json({
        message: "Token has expired",
      });
    }

    // Update user to inactive status
    const updatedUser = await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isActive: false },
      select: userReturnSelect,
    });

    // Delete the token after successful deactivation
    await prisma.token.delete({
      where: { id: tokenRecord.id },
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: "User deactivated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      message: "An error occurred while deactivating user",
    });
  }
};

const userCreateToken = async (user: User) => {
  // Create a new token for the user
  const token = await prisma.token.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Token valid for 5 minutes
    },
  });
  return token.token;
}