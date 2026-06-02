import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { ZodError } from "zod";

dotenv.config();

import authRouter from "./routes/auth";
import campaignsRouter from "./routes/campaigns";
import nodesRouter from "./routes/nodes";
import blocksRouter from "./routes/blocks";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/nodes", nodesRouter);
app.use("/api/blocks", blocksRouter);

app.get("/", (req, res) => {
  res.json({
    message: "CampaignHub API is running",
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

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.flatten() });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
