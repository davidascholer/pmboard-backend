import { getTest, postTest } from "./testController";

test("test endpoint", async () => {
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
  console.log("mockResponse", mockResponse);
  expect(mockResponse.status).toHaveBeenCalledWith(200);
  // If empty
  // expect(mockResponse.status).toHaveBeenCalledWith(404);
  // expect(mockResponse.json).toHaveBeenCalledWith({ message: "No test entries found." });
});
