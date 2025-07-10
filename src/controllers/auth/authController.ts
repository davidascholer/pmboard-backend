import { Request, Response } from "express";
import prisma from "../../prismaClient";
import { generateJWT } from "./util";
import { verify } from "jsonwebtoken";
import { AuthenticatedRequest } from "../../middleware/auth";

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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Validate refresh token parameter
    if (!req.body.r || typeof req.body.r !== "string") {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT secret is not defined.");
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    const decode = verify(req.body.r, process.env.JWT_SECRET) as {
      email: string;
      id: string;
    };

    if (!decode) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: decode.email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Successfully return the access token
    res.status(200).json({
      a: generateJWT(user, "access", "1h"),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(404).json({
      message: "Unable to refresh access token",
      error: (error as Error).message,
    });
  }
};
