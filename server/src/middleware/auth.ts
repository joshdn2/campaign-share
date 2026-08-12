/**
 * auth.ts
 *
 * Authentication middleware.
 *
 * This module verifies the JSON Web Token stored in the `token` cookie. When
 * the token is valid, the decoded user identity is attached to `req.user` so
 * downstream route handlers can identify the caller and enforce authorization.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT secret used to verify token signatures. It must be supplied via the
// JWT_SECRET environment variable; no fallback is provided.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Shape of the authenticated user attached to an Express Request.
 */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Extend the global Express Request type so TypeScript knows about `req.user`.
 *
 * This declaration merging pattern keeps route handlers type-safe without
 * having to cast `req` everywhere.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

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
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Extract the signed JWT from the request cookies (cookie-parser must run first).
  const token = req.cookies?.token;

  // No token means the user is not logged in.
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    // Verify the token and cast the payload to the expected shape.
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    // Attach the authenticated user's identity to the request for downstream use.
    req.user = { userId: payload.userId, email: payload.email };

    // Continue to the requested route handler.
    next();
  } catch {
    // Verification failed (expired, tampered with, or bad signature).
    res.status(401).json({ error: "Invalid token" });
  }
}
