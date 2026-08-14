/**
 * index.ts
 *
 * Application bootstrap for the Campaign Notes API server.
 *
 * This file wires together Express middleware, route handlers, a health-check
 * endpoint, and a global error handler. It is the process entry point for the
 * backend.
 */

// Express core types and framework.
import express, { Request, Response, NextFunction } from "express";

// Security / utility middleware.
import cors from "cors"; // Enables cross-origin resource sharing for the React client.
import helmet from "helmet"; // Sets sensible HTTP security headers.
import cookieParser from "cookie-parser"; // Parses cookies so route handlers can read the auth token.

// Load environment variables from server/.env before anything else uses them.
import dotenv from "dotenv";
import { ZodError } from "zod"; // Used to format validation errors in the global handler.

dotenv.config();

// Route modules for each domain of the API.
import authRouter from "./routes/auth";
import campaignsRouter from "./routes/campaigns";
import nodesRouter from "./routes/nodes";
import blocksRouter from "./routes/blocks";
import calendarsRouter from "./routes/calendars";

// Create the Express application instance.
const app = express();

// Server port: use the value from environment variables or fall back to 3001.
const PORT = process.env.PORT || 3001;

/**
 * Global middleware stack.
 *
 * Order matters here: helmet runs first to secure headers, cors allows the
 * Vite dev server on localhost:5173 to make credentialed requests, json parsing
 * exposes the request body, and cookie-parser exposes req.cookies.
 */
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

/**
 * Health check endpoint.
 *
 * Used by Docker Compose, CI/CD pipelines, or a developer to confirm the API
 * is alive and responsive.
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Mount API routers.
 *
 * Each router lives in server/src/routes and handles a distinct resource:
 *   - /api/auth      registration, login, logout, current user
 *   - /api/campaigns campaign CRUD and membership management
 *   - /api/nodes     campaign nodes (characters, locations, sessions, etc.)
 *   - /api/blocks    content blocks attached to nodes
 */
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/nodes", nodesRouter);
app.use("/api/blocks", blocksRouter);
app.use("/api/campaigns/:campaignId/calendar", calendarsRouter);

/**
 * Root endpoint.
 *
 * Returns a friendly message and a short list of available endpoints. This is
 * useful when visiting the API directly in a browser.
 */
app.get("/", (req, res) => {
  res.json({
    message: "Campaign Notes API is running",
    endpoints: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/campaigns",
      "/api/campaigns/my",
      "/api/nodes",
      "/api/blocks",
    ],
  });
});

/**
 * Global error-handling middleware.
 *
 * Catches any error that bubbles up from route handlers or middleware. If the
 * error is a Zod validation failure, respond with a 400 and the flattened field
 * errors so the client can display them. Otherwise log the error and return a
 * generic 500 to avoid leaking internal details.
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.flatten() });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

// Start the HTTP server and listen on the configured port.
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
