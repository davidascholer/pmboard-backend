import { User } from "@prisma/client";
import jwt, { SignOptions } from "jsonwebtoken";
const { sign } = jwt;

export const generateJWT = (
  user: User,
  tokenType: "access" | "refresh",
  expiry?: SignOptions["expiresIn"]
): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not defined.");
  }
  return sign({ email: user.email, tokenType, id: user.id }, process.env.JWT_SECRET, {
    expiresIn: expiry || "1h",
  });
};
