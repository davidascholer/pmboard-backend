import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const { verify } = jwt;
import prisma from "../prismaClient";
import { userReturnSelect } from "../lib/returnSignatures";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }

  try {
      const decode = verify(token, process.env.JWT_SECRET || "") as {
        email: string;
        id: string;
      };
  
    const user = await prisma.user.findUnique({
      where: { email: decode.email },
      select: userReturnSelect,
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user ?? undefined;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
