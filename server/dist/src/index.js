"use strict";
/**
 * index.ts
 *
 * Application bootstrap for the CampaignShare API server.
 *
 * This file wires together Express middleware, route handlers, a health-check
 * endpoint, and a global error handler. It is the process entry point for the
 * backend.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express core types and framework.
const express_1 = __importDefault(require("express"));
// Security / utility middleware.
const cors_1 = __importDefault(require("cors")); // Enables cross-origin resource sharing for the React client.
const helmet_1 = __importDefault(require("helmet")); // Sets sensible HTTP security headers.
const cookie_parser_1 = __importDefault(require("cookie-parser")); // Parses cookies so route handlers can read the auth token.
// Load environment variables from server/.env before anything else uses them.
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod"); // Used to format validation errors in the global handler.
dotenv_1.default.config();
// Route modules for each domain of the API.
const auth_1 = __importDefault(require("./routes/auth"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const nodes_1 = __importDefault(require("./routes/nodes"));
const blocks_1 = __importDefault(require("./routes/blocks"));
const calendars_1 = __importDefault(require("./routes/calendars"));
// Create the Express application instance.
const app = (0, express_1.default)();
// Server port: use the value from environment variables or fall back to 3001.
const PORT = process.env.PORT || 3001;
/**
 * Global middleware stack.
 *
 * Order matters here: helmet runs first to secure headers, cors allows the
 * Vite dev server on localhost:5173 to make credentialed requests, json parsing
 * exposes the request body, and cookie-parser exposes req.cookies.
 */
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
app.use("/api/auth", auth_1.default);
app.use("/api/campaigns", campaigns_1.default);
app.use("/api/nodes", nodes_1.default);
app.use("/api/blocks", blocks_1.default);
app.use("/api/campaigns/:campaignId/calendar", calendars_1.default);
/**
 * Root endpoint.
 *
 * Returns a friendly message and a short list of available endpoints. This is
 * useful when visiting the API directly in a browser.
 */
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
/**
 * Global error-handling middleware.
 *
 * Catches any error that bubbles up from route handlers or middleware. If the
 * error is a Zod validation failure, respond with a 400 and the flattened field
 * errors so the client can display them. Otherwise log the error and return a
 * generic 500 to avoid leaking internal details.
 */
app.use((err, req, res, _next) => {
    console.error("Unhandled error:", err);
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ error: err.flatten() });
        return;
    }
    res.status(500).json({ error: "Internal server error" });
});
// Start the HTTP server and listen on the configured port.
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
