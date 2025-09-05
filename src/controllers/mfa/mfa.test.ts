import { mfaEmailToken, verifyMfaToken, deleteMfaToken } from "./mfaController";
import { User } from "@prisma/client";

// Mock the prisma client
jest.mock("../../prismaClient", () => ({
  token: {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

import prisma from "../../prismaClient";
import nodemailer from "nodemailer";

const mockPrisma = jest.mocked(prisma);
const mockNodemailer = jest.mocked(nodemailer);
const mockSendMail = jest.fn();

// Setup nodemailer mock
beforeAll(() => {
  (mockNodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: mockSendMail,
  });
});

describe("MFA Endpoints", () => {
  const mockUser: User = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    password: "hashedpassword",
    isActive: true,
    settings: { background: "default" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken = {
    id: "token-123",
    token: "mock-token-uuid",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    createdAt: new Date(),
    userId: "user-123",
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockClear();
  });

  describe("mfaEmailToken", () => {
    test("should create token for authenticated user", async () => {
      const mockRequest = {
        user: mockUser,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockEmailResponse = {
        success: true,
        messageId: "mock-message-id",
        message: `MFA token sent successfully to ${mockUser.email}`,
      };

      (mockPrisma.token.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (mockPrisma.token.create as jest.Mock).mockResolvedValue(mockToken);
      mockSendMail.mockResolvedValue({ messageId: "mock-message-id" });

      await mfaEmailToken(mockRequest as any, mockResponse as any);

      expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(mockPrisma.token.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: mockUser.email,
          subject: "Your MFA Token - PM Board",
          html: expect.stringContaining(mockToken.token),
          text: expect.stringContaining(mockToken.token),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        emailResponse: mockEmailResponse,
      });
    });

    test("should return 401 for unauthenticated user", async () => {
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await mfaEmailToken(mockRequest as any, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
      expect(mockPrisma.token.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.token.create).not.toHaveBeenCalled();
    });

    test("should replace existing token", async () => {
      const mockRequest = {
        user: mockUser,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      (mockPrisma.token.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      }); // Indicates existing token was deleted
      (mockPrisma.token.create as jest.Mock).mockResolvedValue(mockToken);
      mockSendMail.mockResolvedValue({ messageId: "mock-message-id" });

      await mfaEmailToken(mockRequest as any, mockResponse as any);

      expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(mockPrisma.token.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
      expect(mockSendMail).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("verifyMfaToken", () => {
    test("should return user for valid token", async () => {
      (mockPrisma.token.findUnique as jest.Mock).mockResolvedValue(mockToken);

      const result = await verifyMfaToken("mock-token-uuid");

      expect(mockPrisma.token.findUnique).toHaveBeenCalledWith({
        where: { token: "mock-token-uuid" },
        include: { user: true },
      });
      expect(result).toEqual(mockUser);
    });

    test("should throw error for non-existent token", async () => {
      (mockPrisma.token.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(verifyMfaToken("invalid-token")).rejects.toThrow(
        "Token not found"
      );

      expect(mockPrisma.token.findUnique).toHaveBeenCalledWith({
        where: { token: "invalid-token" },
        include: { user: true },
      });
    });

    test("should throw error for expired token", async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago (expired)
      };
      (mockPrisma.token.findUnique as jest.Mock).mockResolvedValue(
        expiredToken
      );

      await expect(verifyMfaToken("expired-token")).rejects.toThrow(
        "Token has expired"
      );

      expect(mockPrisma.token.findUnique).toHaveBeenCalledWith({
        where: { token: "expired-token" },
        include: { user: true },
      });
    });

    test("should handle database errors", async () => {
      (mockPrisma.token.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(verifyMfaToken("some-token")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("deleteMfaToken", () => {
    test("should delete token successfully", async () => {
      (mockPrisma.token.delete as jest.Mock).mockResolvedValue(mockToken);

      await deleteMfaToken("mock-token-uuid");

      expect(mockPrisma.token.delete).toHaveBeenCalledWith({
        where: { token: "mock-token-uuid" },
      });
    });

    test("should handle database errors when deleting token", async () => {
      (mockPrisma.token.delete as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(deleteMfaToken("some-token")).rejects.toThrow(
        "Database error"
      );

      expect(mockPrisma.token.delete).toHaveBeenCalledWith({
        where: { token: "some-token" },
      });
    });

    test("should handle non-existent token deletion", async () => {
      (mockPrisma.token.delete as jest.Mock).mockRejectedValue(
        new Error("Record to delete does not exist.")
      );

      await expect(deleteMfaToken("non-existent-token")).rejects.toThrow(
        "Record to delete does not exist."
      );
    });
  });

  describe("Token lifecycle integration", () => {
    test("should create, verify, and delete token in sequence", async () => {
      // Create token
      const createRequest = { user: mockUser };
      const createResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      (mockPrisma.token.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (mockPrisma.token.create as jest.Mock).mockResolvedValue(mockToken);
      mockSendMail.mockResolvedValue({ messageId: "mock-message-id" });

      await mfaEmailToken(createRequest as any, createResponse as any);

      expect(createResponse.status).toHaveBeenCalledWith(200);
      expect(createResponse.json).toHaveBeenCalledWith({
        emailResponse: expect.objectContaining({
          success: true,
          messageId: "mock-message-id",
        }),
      });

      // Verify token
      (mockPrisma.token.findUnique as jest.Mock).mockResolvedValue(mockToken);
      const verifiedUser = await verifyMfaToken(mockToken.token);
      expect(verifiedUser).toEqual(mockUser);

      // Delete token
      (mockPrisma.token.delete as jest.Mock).mockResolvedValue(mockToken);
      await deleteMfaToken(mockToken.token);
      expect(mockPrisma.token.delete).toHaveBeenCalledWith({
        where: { token: mockToken.token },
      });
    });
  });
});
