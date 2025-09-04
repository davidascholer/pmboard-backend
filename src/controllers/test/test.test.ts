import { getTest, postTest, deleteAllTests } from "./testController";

describe("Test Controller", () => {
  test("test get before post", async () => {
    const mockRequest = {
      body: {},
      // params: { id: "123" },
      // query: { sort: "asc" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getTest(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  test("test post", async () => {
    const mockRequest = {
      body: { name: "User Name" },
      // params: { id: "123" },
      // query: { sort: "asc" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await postTest(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test("test get after post", async () => {
    const mockRequest = {
      body: {},
      // params: { id: "123" },
      // query: { sort: "asc" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getTest(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("test delete all", async () => {
    const mockRequest = {
      body: {},
      // params: { id: "123" },
      // query: { sort: "asc" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await deleteAllTests(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("test get after delete", async () => {
    const mockRequest = {
      body: {},
      // params: { id: "123" },
      // query: { sort: "asc" },
    };
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getTest(mockRequest as any, mockResponse as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });
});
