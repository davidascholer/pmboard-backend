import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticateUser";
import { emailMfaToken, mfaCreateToken } from "./util";

/**
 * Creates a new MFA token for the specified user.
 * @param user - The user for whom to create the MFA token
 * @returns The newly created MFA token string
 */
export const mfaEmailToken = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Create a new token for the user
    const token = await mfaCreateToken(authReq.user);

    // Email the token to the user's email address
    const emailResponse = await emailMfaToken(authReq, token);

    // Successfully return the email response
    return res.status(200).json({
      emailResponse,
    });
  } catch (error) {
    console.error("Error creating MFA token:", error);
    return res.status(500).json({
      message: "An error occurred while creating MFA token",
    });
  }
};

export const sendMfaToken = async (req: Request, res: Response) => {
  try {
    // Validated the request user
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Create a new token for the user
    const token = await mfaCreateToken(authReq.user);

    // Successfully return the email response
    return res.status(200).json({
      token,
    });
  } catch (error) {
    console.error("Error sending MFA token:", error);
    return res.status(500).json({
      message: "An error occurred while sending MFA token",
    });
  }
};
