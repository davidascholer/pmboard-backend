import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
const { sign } = jwt;

export const generateJWT = (user: User): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not defined.");
  }
  return sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};
