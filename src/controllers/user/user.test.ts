import { 
  getAuthenticatedUser, 
  userSignIn, 
  userSignUp, 
  updateUserSettings,
  userActivate,
  userDeactivate,
  userDelete,
  createUserToken,
  updateUserPassword,
  verifyAndUpdateMembership,
  updateMembership,
  updateNextMembership,
} from "./userController";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedpassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT utilities
jest.mock("../auth/util", () => ({
  generateJWT: jest.fn().mockReturnValue("fake-token"),
}));

// Mock the prisma client
jest.mock("../../prismaClient", () => ({
  user: {
    create: jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User", 
      email: "test@example.com",
      password: "hashedpassword",
      isActive: true,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      membership: {
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
      },
      nextMembership: null,
      projectsOwned: [],
      projectsJoined: [],
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      // For sign up: return null (user doesn't exist)
      // For sign in: return user (user exists)
      if (where.email?.includes("test") && !where.email?.includes("signin")) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id: "user-id",
        name: "Test User",
        email: "test@example.com", 
        password: "hashedpassword",
        isActive: true,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          id: "membership-id",
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      });
    }),
    update: jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword", 
      isActive: true,
      settings: { background: "dark", theme: "custom" },
      createdAt: new Date(),
      updatedAt: new Date(),
      membership: {
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
      },
      nextMembership: null,
      projectsOwned: [],
      projectsJoined: [],
    }),
  },
  membership: {
    create: jest.fn().mockResolvedValue({
      id: "membership-id",
      status: "FREE",
      startedAt: new Date(),
      endsAt: null,
      userId: "user-id",
    }),
  },
  token: {
    findUnique: jest.fn().mockResolvedValue({
      id: "token-id",
      token: "test-token-123",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      createdAt: new Date(),
      userId: "user-id",
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      },
    }),
    create: jest.fn().mockResolvedValue({
      id: "token-id",
      token: "test-token-123",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
      userId: "user-id",
    }),
    delete: jest.fn().mockResolvedValue({
      id: "token-id",
      token: "test-token-123",
    }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
}));

import prisma from "../../prismaClient";
const mockPrisma = jest.mocked(prisma);

describe("User Endpoints", () => {
  test("create user", async () => {
    const uniqueEmail = `test${Date.now()}@test.com`;
    const mockRequest = {
      body: { 
        email: uniqueEmail, 
        password: "testpassword",
        name: "Test User"
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await userSignUp(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test("create user with membership", async () => {
    const uniqueEmail = `membership-test${Date.now()}@test.com`;
    const mockRequest = {
      body: { 
        email: uniqueEmail, 
        password: "testpassword",
        name: "Membership Test User"
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignUp(mockRequest as any, mockResponse as any);
    
    // Verify that the response was successful
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    
    // Verify that the response includes comprehensive membership information
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        membership: expect.objectContaining({
          status: "FREE",
          startedAt: expect.any(Date),
        }),
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      })
    );
  });

  test("user sign in pass", async () => {
    const mockRequest = {
      body: { email: "signin@test.com", password: "testpassword" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await userSignIn(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("user sign in fail", async () => {
    const mockRequest = {
      body: { email: "nonexistent@test.com", password: "wrongpassword" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await userSignIn(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  test("get authenticated user", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
        isActive: true,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          id: "membership-id",
          status: "FREE",
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await getAuthenticatedUser(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("get authenticated user unauthorized", async () => {
    const mockRequest = {};
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getAuthenticatedUser(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });

  test("update user settings with enhanced response", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
        isActive: true,
        settings: { background: "default" },
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          id: "membership-id",
          status: "FREE" as const,
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      },
      body: {
        settings: {
          background: "dark",
          theme: "custom",
        },
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    // Mock the Prisma update to return enhanced user data
    const mockUpdatedUser = {
      ...mockRequest.user,
      settings: mockRequest.body.settings,
    };
    
    // Mock the Prisma client update method
    const originalUpdate = mockPrisma.user.update;
    mockPrisma.user.update = jest.fn().mockResolvedValue(mockUpdatedUser);
    
    await updateUserSettings(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Settings updated successfully",
      user: expect.objectContaining({
        id: "user-id",
        settings: mockRequest.body.settings,
        membership: expect.any(Object),
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      }),
    });
    
    // Restore original function
    mockPrisma.user.update = originalUpdate;
  });

  test("user activate success", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userActivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "User activated successfully",
      user: expect.objectContaining({
        id: "user-id",
        membership: expect.any(Object),
        nextMembership: null,
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      }),
    });
  });

  test("user activate invalid token", async () => {
    const mockRequest = {
      params: { token: "" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userActivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token parameter",
    });
  });

  test("user activate token not found", async () => {
    const mockRequest = {
      params: { token: "nonexistent-token" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock token not found
    const originalFindUnique = mockPrisma.token.findUnique;
    mockPrisma.token.findUnique = jest.fn().mockResolvedValue(null);

    await userActivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Token not found",
    });

    // Restore original function
    mockPrisma.token.findUnique = originalFindUnique;
  });

  test("user activate expired token", async () => {
    const mockRequest = {
      params: { token: "expired-token" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock expired token
    const originalFindUnique = mockPrisma.token.findUnique;
    mockPrisma.token.findUnique = jest.fn().mockResolvedValue({
      id: "token-id",
      token: "expired-token",
      expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      createdAt: new Date(),
      userId: "user-id",
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      },
    });

    await userActivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Token has expired",
    });

    // Restore original function
    mockPrisma.token.findUnique = originalFindUnique;
  });

  test("user deactivate success", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userDeactivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "User deactivated successfully",
      user: expect.objectContaining({
        id: "user-id",
        membership: expect.any(Object),
        nextMembership: null,
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      }),
    });
  });

  test("user deactivate invalid token", async () => {
    const mockRequest = {
      params: { token: "" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userDeactivate(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token parameter",
    });
  });

  test("user delete success", async () => {
    const mockRequest = {
      body: { token: "test-token-123" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock user deletion
    const originalDelete = mockPrisma.user.delete;
    mockPrisma.user.delete = jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
    });

    await userDelete(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
    });

    // Restore original function
    mockPrisma.user.delete = originalDelete;
  });

  test("user delete invalid token parameter", async () => {
    const mockRequest = {
      body: { token: "" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userDelete(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token parameter",
    });
  });

  test("create user token success", async () => {
    const mockUser = {
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
      isActive: true,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = await createUserToken(mockUser as any);
    expect(token).toBe("test-token-123");
    expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-id" },
    });
    expect(mockPrisma.token.create).toHaveBeenCalledWith({
      data: { userId: "user-id" },
    });
  });

  test("update user password success", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
      body: {
        email: "test@example.com",
        newPassword: "newpassword123",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateUserPassword(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Password updated successfully",
    });
  });

  test("update user password invalid email", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
      body: {
        email: "",
        newPassword: "newpassword123",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateUserPassword(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid email parameter",
    });
  });

  test("update user password invalid new password", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
      body: {
        email: "test@example.com",
        newPassword: "",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateUserPassword(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid newPassword parameter",
    });
  });

  test("update user password token email mismatch", async () => {
    const mockRequest = {
      params: { token: "test-token-123" },
      body: {
        email: "different@example.com",
        newPassword: "newpassword123",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateUserPassword(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Token does not match the email",
    });
  });

  test("user sign in invalid email parameter", async () => {
    const mockRequest = {
      body: { email: "", password: "testpassword" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignIn(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid email parameter",
    });
  });

  test("user sign in invalid password parameter", async () => {
    const mockRequest = {
      body: { email: "test@example.com", password: "" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignIn(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid password parameter",
    });
  });

  test("user sign in wrong password", async () => {
    const mockRequest = {
      body: { email: "signin@test.com", password: "wrongpassword" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock bcrypt compare to return false
    const bcrypt = require("bcrypt");
    const originalCompare = bcrypt.compare;
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    
    await userSignIn(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid password",
    });

    // Restore original function
    bcrypt.compare = originalCompare;
  });

  test("user sign up invalid email parameter", async () => {
    const mockRequest = {
      body: { 
        email: "", 
        password: "testpassword",
        name: "Test User"
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignUp(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid email parameter",
    });
  });

  test("user sign up invalid password parameter", async () => {
    const mockRequest = {
      body: { 
        email: "test@example.com", 
        password: "",
        name: "Test User"
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignUp(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid password parameter",
    });
  });

  test("user sign up invalid name parameter", async () => {
    const mockRequest = {
      body: { 
        email: "test@example.com", 
        password: "testpassword",
        name: ""
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await userSignUp(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid name parameter",
    });
  });

  test("user sign up user already exists", async () => {
    const mockRequest = {
      body: { 
        email: "existing@example.com", 
        password: "testpassword",
        name: "Test User"
      },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock user already exists (findUnique returns a user for this specific email)
    const originalFindUnique = mockPrisma.user.findUnique;
    mockPrisma.user.findUnique = jest.fn().mockImplementation(({ where }) => {
      if (where.email === "existing@example.com") {
        return Promise.resolve({
          email: "existing@example.com",
          password: "hashedpassword",
        });
      }
      return Promise.resolve(null);
    });
    
    await userSignUp(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "User already exists",
    });

    // Restore original function
    mockPrisma.user.findUnique = originalFindUnique;
  });

  test("update user settings invalid settings parameter", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
        isActive: true,
        settings: { background: "default" },
        createdAt: new Date(),
        updatedAt: new Date(),
        membership: {
          id: "membership-id",
          status: "FREE" as const,
          startedAt: new Date(),
          endsAt: null,
        },
        nextMembership: null,
        projectsOwned: [],
        projectsJoined: [],
      },
      body: {
        settings: "invalid-settings", // Should be object, not string
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    await updateUserSettings(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid settings parameter",
    });
  });

  test("verify and update membership success - no update needed", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock user with no nextMembership
    const originalFindUnique = mockPrisma.user.findUnique;
    mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      membership: {
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
      },
      nextMembership: null,
    });

    await verifyAndUpdateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "No membership update needed",
      user: expect.objectContaining({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      }),
    });

    // Restore original function
    mockPrisma.user.findUnique = originalFindUnique;
  });

  test("verify and update membership success - update applied", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock user with expired nextMembership
    const originalFindUnique = mockPrisma.user.findUnique;
    const originalUpdate = mockPrisma.user.update;
    
    mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      membership: {
        id: "membership-id",
        status: "FREE",
        startedAt: new Date(),
        endsAt: null,
      },
      nextMembership: {
        id: "next-membership-id",
        status: "STARTUP",
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    mockPrisma.user.update = jest.fn().mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      membership: {
        id: "membership-id",
        status: "STARTUP",
        startedAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      nextMembership: null,
      projectsOwned: [],
      projectsJoined: [],
    });

    await verifyAndUpdateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Membership updated successfully",
      user: expect.objectContaining({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      }),
    });

    // Restore original functions
    mockPrisma.user.findUnique = originalFindUnique;
    mockPrisma.user.update = originalUpdate;
  });

  test("verify and update membership unauthorized", async () => {
    const mockRequest = {
      user: null, // No authenticated user
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await verifyAndUpdateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
  });

  test("update membership success", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
      body: {
        membershipStatus: "STARTUP",
        expiry: "MONTH",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Membership updated successfully",
      user: expect.objectContaining({
        id: "user-id",
        membership: expect.any(Object),
        nextMembership: null,
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      }),
    });
  });

  test("update membership invalid parameters", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
      body: {
        membershipStatus: "INVALID_STATUS",
        expiry: "INVALID_EXPIRY",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid membership status or expiry parameter",
    });
  });

  test("update membership unauthorized", async () => {
    const mockRequest = {
      user: null, // No authenticated user
      body: {
        membershipStatus: "STARTUP",
        expiry: "MONTH",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
  });

  test("update next membership success", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
      body: {
        membershipStatus: "TEAM",
        startsAt: futureDate.toISOString(),
        expiry: "YEAR",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateNextMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Next membership updated successfully",
      user: expect.objectContaining({
        id: "user-id",
        membership: expect.any(Object),
        nextMembership: null,
        projectsOwned: expect.any(Array),
        projectsJoined: expect.any(Array),
      }),
    });
  });

  test("update next membership invalid parameters", async () => {
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
      body: {
        membershipStatus: "INVALID_STATUS",
        startsAt: "invalid-date",
        expiry: "INVALID_EXPIRY",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateNextMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid nextMembership status or expiry parameter",
    });
  });

  test("update next membership past date", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const mockRequest = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      },
      body: {
        membershipStatus: "TEAM",
        startsAt: pastDate.toISOString(),
        expiry: "YEAR",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateNextMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "startsAt must be a future date",
    });
  });

  test("update next membership unauthorized", async () => {
    const mockRequest = {
      user: null, // No authenticated user
      body: {
        membershipStatus: "TEAM",
        startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiry: "YEAR",
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateNextMembership(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
  });
});
