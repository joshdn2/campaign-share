"use strict";
/**
 * auth.ts
 *
 * Authentication middleware.
 *
 * This module verifies the JSON Web Token stored in the `token` cookie. When
 * the token is valid, the decoded user identity is attached to `req.user` so
 * downstream route handlers can identify the caller and enforce authorization.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT secret used to verify token signatures. In production this should be set
// via the JWT_SECRET environment variable; a fallback is provided only for
// local development convenience.
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
/**
 * Express middleware that requires a valid authentication cookie.
 *
 * Reads the `token` cookie, verifies it against JWT_SECRET, and attaches the
 * decoded payload to `req.user`. If the cookie is missing or invalid, the
 * request is rejected with HTTP 401 and the handler chain stops.
 *
 * @param req - Express request object (contains cookies and will receive user).
 * @param res - Express response object used to send 401 errors.
 * @param next - Call to proceed to the next middleware/route handler.
 */
function requireAuth(req, res, next) {
    // Extract the signed JWT from the request cookies (cookie-parser must run first).
    const token = req.cookies?.token;
    // No token means the user is not logged in.
    if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    try {
        // Verify the token and cast the payload to the expected shape.
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach the authenticated user's identity to the request for downstream use.
        req.user = { userId: payload.userId, email: payload.email };
        // Continue to the requested route handler.
        next();
    }
    catch {
        // Verification failed (expired, tampered with, or bad signature).
        res.status(401).json({ error: "Invalid token" });
    }
}
