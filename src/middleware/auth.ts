import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const { verify } = jwt;
import prisma from "../prismaClient";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    throw new Error("Unauthorized");
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    throw new Error("Token not found");
  }

  try {
    const decode = verify(token, process.env.JWT_SECRET || "") as {
      email: string;
      id: string;
    };
    console.log("Decoded token:", decode);
    const user = await prisma.user.findUnique({
      where: { email: decode.email },
    });
    req.user = user ?? undefined;
    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
};
