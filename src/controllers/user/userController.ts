import { Request, Response } from "express";
import { userReturnSelect } from "../../lib/returnSignatures";
import prisma from "../../prismaClient";
import { User } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { generateJWT } from "../auth/util";
import { AuthenticatedRequest } from "../../middleware/auth";

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
    const { password: _password, ...partialUser } = authReq.user;
    res.status(200).json(partialUser);
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
    const { password: _password, ...partialUser } = user;
    return res.status(200).json({
      ...partialUser,
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

    // Create the user with a default membership
    const newUser = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        name: req.body.name,
        membership: {
          create: {
            status: "FREE", // Default membership status
          },
        },
      },
      select: userReturnSelect,
    });
    const { password: _password, ...newpartialUser } = newUser;
    res.status(201).json({
      ...newpartialUser,
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
  // Validate token in url parameter
  const token = req.params.token;
  if (!token || typeof token !== "string") {
    return res.status(400).json({
      message: "Invalid token parameter",
    });
  }

  try {
    // Find the token and associated user
    const tokenRecord = await prisma.token.findUnique({
      where: { token: token },
      include: { user: true },
    });

    // Check if token exists
    if (!tokenRecord) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    // Check if token is expired (5 minutes expiration)
    const now = new Date();
    console.log("Token expiration:", tokenRecord.expiresAt, "Now:", now);
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

    const { password: _password, ...partialUser } = updatedUser;
    res.status(200).json({
      message: "User activated successfully",
      user: partialUser,
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
  const token = req.params.token;
  if (!token || typeof token !== "string") {
    return res.status(400).json({
      message: "Invalid token parameter",
    });
  }

  try {
    // Find the token and associated user
    const tokenRecord = await prisma.token.findUnique({
      where: { token: token },
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

    const { password: _password, ...partialUser } = updatedUser;
    res.status(200).json({
      message: "User deactivated successfully",
      user: partialUser,
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      message: "An error occurred while deactivating user",
    });
  }
};

export const userDelete = async (req: Request, res: Response) => {
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

    // Delete the user
    await prisma.user.delete({
      where: { id: tokenRecord.userId },
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "An error occurred while deleting user",
    });
  }
};

/**
 * Creates a new token for the specified user, replacing any existing token.
 * @param user - The user for whom to create the token
 * @returns The newly created token string
 */
export const createUserToken = async (user: User) => {
  // Delete any existing token for the user first
  await prisma.token.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // Create a new token for the user
  const token = await prisma.token.create({
    data: {
      userId: user.id,
    },
  });
  return token.token;
};

/**
 * Updates the password for a user
 * @urlparam token - The token in the URL to verify the user (to lookup the user while also verifying the email)
 * @param req.body.email - The email of the user
 * @param req.body.newPassword - The new password for the user
 * @returns Success or error response
 */
export const updateUserPassword = async (req: Request, res: Response) => {
  // Validate token url param
  const token = req.params.token;

  // Validate the email parameter
  if (!req.body.email || typeof req.body.email !== "string") {
    return res.status(400).json({
      message: "Invalid email parameter",
    });
  }

  // Validate newPassword parameter
  if (!req.body.newPassword || typeof req.body.newPassword !== "string") {
    return res.status(400).json({
      message: "Invalid newPassword parameter",
    });
  }

  try {
    // Find the token and associated user
    const tokenRecord = await prisma.token.findUnique({
      where: { token: token },
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

    // Verify the token matches the email
    if (tokenRecord.user.email !== req.body.email) {
      return res.status(400).json({
        message: "Token does not match the email",
      });
    }

    // Hash the new password
    const hashedPassword = await hash(req.body.newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    });

    // Delete the token after successful password update
    await prisma.token.delete({
      where: { id: tokenRecord.id },
    });

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      message: "An error occurred while updating password",
    });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Validate settings parameter
    if (!req.body.settings || typeof req.body.settings !== "object") {
      return res.status(400).json({
        message: "Invalid settings parameter",
      });
    }

    // Update the user's settings
    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.id },
      data: { settings: req.body.settings },
      select: userReturnSelect,
    });

    const { password: _password, ...partialUser } = updatedUser;
    res.status(200).json({
      message: "Settings updated successfully",
      user: partialUser,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({
      message: "An error occurred while updating settings",
    });
  }
};

/**
 * Verify Membership
 * If the user has a nextMembership scheduled, and the start date has passed,
 * update the user's current membership to the nextMembership and clear nextMembership.
 * @returns The updated user with the new membership status
 */
export const verifyAndUpdateMembership = async (
  req: Request,
  res: Response
) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Fetch the user with current and next membership
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      include: {
        membership: true,
        nextMembership: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if there is a nextMembership and if its start date has passed
    if (user.nextMembership && user.nextMembership.startsAt <= new Date()) {
      // Update the user's current membership to the nextMembership
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          membership: {
            update: {
              status: user.nextMembership.status,
              startedAt: user.nextMembership.startsAt,
              endsAt: user.nextMembership.endsAt,
            },
          },
          nextMembership: {
            delete: true, // Clear the nextMembership after applying it
          },
        },
        select: userReturnSelect,
      });

      const { password: _password, ...partialUser } = updatedUser;
      return res.status(200).json({
        message: "Membership updated successfully",
        user: partialUser,
      });
    }

    // If no update was needed, return the current user info
    const { password: _password, ...partialUser } = user;
    return res.status(200).json({
      message: "No membership update needed",
      user: partialUser,
    });
  } catch (error) {
    console.error("Error verifying/updating membership:", error);
    return res.status(500).json({
      message: "An error occurred while verifying/updating membership",
    });
  }
};

/**
 * Update Membership
 * Update the user's current membership.
 * @param req - The request object with membership status in the body
 * @param res - The response object
 * @returns The updated user with the new membership status
 */
export const updateMembership = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Validate membership parameter
    if (
      !req.body ||
      !req.body.membershipStatus ||
      typeof req.body.membershipStatus !== "string" ||
      !["FREE", "STARTUP", "TEAM", "ENTERPRISE"].includes(
        req.body.membershipStatus
      ) ||
      !req.body.expiry ||
      typeof req.body.expiry !== "string" ||
      !["MONTH", "YEAR"].includes(req.body.expiry)
    ) {
      return res.status(400).json({
        message: "Invalid membership status or expiry parameter",
      });
    }

    // Update the user's membership
    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        membership: {
          update: {
            status: req.body.membershipStatus,
            startedAt: new Date(),
            endsAt:
              req.body.expiry === "MONTH"
                ? new Date(new Date().setMonth(new Date().getMonth() + 1))
                : new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1)
                  ),
          },
        },
      },
      select: userReturnSelect,
    });

    const { password: _password, ...partialUser } = updatedUser;
    res.status(200).json({
      message: "Membership updated successfully",
      user: partialUser,
    });
  } catch (error) {
    console.error("Error updating membership:", error);
    return res.status(500).json({
      message: "An error occurred while updating membership",
    });
  }
};

/**
 * Update Next Membership
 * Update the user's next membership.
 * @param req - The request object with membership status in the body
 * @param res - The response object
 * @returns The updated user with the new next membership status
 */
export const updateNextMembership = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Validate nextMembership parameter
    if (
      !req.body ||
      !req.body.membershipStatus ||
      typeof req.body.membershipStatus !== "string" ||
      !["FREE", "STARTUP", "TEAM", "ENTERPRISE"].includes(
        req.body.membershipStatus
      ) ||
      !req.body.startsAt ||
      isNaN(Date.parse(req.body.startsAt)) ||
      !req.body.expiry ||
      typeof req.body.expiry !== "string" ||
      !["MONTH", "YEAR"].includes(req.body.expiry)
    ) {
      return res.status(400).json({
        message: "Invalid nextMembership status or expiry parameter",
      });
    }

    const startsAt = new Date(req.body.startsAt);
    if (startsAt <= new Date()) {
      return res.status(400).json({
        message: "startsAt must be a future date",
      });
    }

    // Update the user's nextMembership
    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        nextMembership: {
          upsert: {
            create: {
              status: req.body.membershipStatus,
              startsAt: startsAt,
              endsAt:
                req.body.expiry === "MONTH"
                  ? new Date(startsAt.setMonth(startsAt.getMonth() + 1))
                  : new Date(startsAt.setFullYear(startsAt.getFullYear() + 1)),
            },
            update: {
              status: req.body.membershipStatus,
              startsAt: startsAt,
              endsAt:
                req.body.expiry === "MONTH"
                  ? new Date(startsAt.setMonth(startsAt.getMonth() + 1))
                  : new Date(startsAt.setFullYear(startsAt.getFullYear() + 1)),
            },
          },
        },
      },
      select: userReturnSelect,
    });

    const { password: _password, ...partialUser } = updatedUser;
    res.status(200).json({
      message: "Next membership updated successfully",
      user: partialUser,
    });
  } catch (error) {
    console.error("Error updating next membership:", error);
    return res.status(500).json({
      message: "An error occurred while updating next membership",
    });
  }
};
