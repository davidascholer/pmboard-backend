import { Request, Response, NextFunction } from "express";

/**
 * Logging middleware that prints request and response details
 * Only logs when not in production (when PROD is not set to "true")
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only log if not in production
  if (process.env.PROD !== "true") {
    const startTime = Date.now();
    
    // Log the incoming request
    console.log("\n=== INCOMING REQUEST ===");
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Don't log sensitive information like passwords
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
      if (sanitizedBody.newPassword) sanitizedBody.newPassword = "[REDACTED]";
      console.log("Body:", JSON.stringify(sanitizedBody, null, 2));
    }
    
    if (req.params && Object.keys(req.params).length > 0) {
      console.log("Params:", JSON.stringify(req.params, null, 2));
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      console.log("Query:", JSON.stringify(req.query, null, 2));
    }

    // Capture the original res.json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to log the response
    res.json = function(body: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log("\n=== OUTGOING RESPONSE ===");
      console.log(`${new Date().toISOString()} - ${res.statusCode} ${req.method} ${req.originalUrl}`);
      console.log(`Duration: ${duration}ms`);
      console.log("Response Body:", JSON.stringify(body, null, 2));
      console.log("========================\n");
      
      // Call the original json method
      return originalJson(body);
    };

    // Capture the original res.send method for non-JSON responses
    const originalSend = res.send.bind(res);
    
    res.send = function(body: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log("\n=== OUTGOING RESPONSE ===");
      console.log(`${new Date().toISOString()} - ${res.statusCode} ${req.method} ${req.originalUrl}`);
      console.log(`Duration: ${duration}ms`);
      
      if (body) {
        console.log("Response Body:", body);
      } else {
        console.log("Response: No content");
      }
      console.log("========================\n");
      
      // Call the original send method
      return originalSend(body);
    };
  }
  
  next();
};
