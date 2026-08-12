/**
 * routes/auth.ts
 *
 * Authentication routes for the CampaignShare API.
 *
 * This router handles user registration, login, logout, and fetching the
 * currently authenticated user. Passwords are hashed with bcrypt before
 * storage, and successful login issues an HTTP-only cookie containing a JWT.
 */

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { registerSchema, loginSchema, updateUserSchema } from "../lib/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

// JWT secret and cookie settings. The secret signs tokens; SALT_ROUNDS controls
// the bcrypt hashing cost. JWT_SECRET must be supplied via the environment so
// that the same secret is never hardcoded in source control.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
// Runtime check above guarantees a string; narrow the type for jwt.sign/verify.
const JWT_SECRET_VALUE: string = JWT_SECRET;
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 *
 * Flow:
 * 1. Validate the request body against registerSchema.
 * 2. Ensure no other user already uses the requested email.
 * 3. Hash the password with bcrypt.
 * 4. Persist the user record and return a safe subset of fields.
 */
router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { email, username, password } = parse.data;

  // Reject duplicate registrations early to avoid leaking whether a password
  // hash exists for an email.
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    res.status(409).json({ error: "Username already in use" });
    return;
  }

  // Hash the plaintext password before storing it in the database.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  res.status(201).json(user);
});

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user and issues a JWT cookie.
 *
 * Flow:
 * 1. Validate the request body.
 * 2. Look up the user by email.
 * 3. Compare the provided password with the stored bcrypt hash.
 * 4. Sign a JWT and set it as an HTTP-only cookie.
 * 5. Return the user profile.
 */
router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Sign a token containing the user's identity. It expires in 7 days.
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET_VALUE, {
    expiresIn: "7d",
  });

  // Set the token in an HTTP-only cookie so the browser sends it automatically
  // on subsequent requests. `secure` is only enabled in production to keep
  // local development over HTTP working.
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  });
});

/**
 * POST /api/auth/logout
 *
 * Clears the authentication cookie, effectively logging the user out.
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user based on the `token` cookie.
 *
 * This is useful on page load: the client can verify whether an existing
 * session is still valid without re-entering credentials.
 */
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/**
 * PATCH /api/auth/me
 *
 * Updates the currently authenticated user's profile.
 *
 * Requires a valid auth cookie. Only the fields provided in the body are
 * updated. Returns the updated safe subset of the user record.
 */
router.patch("/me", requireAuth, async (req, res) => {
  const parse = updateUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { username } = parse.data;

  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== req.user!.userId) {
      res.status(409).json({ error: "Username already in use" });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      username: username ?? undefined,
    },
    select: { id: true, email: true, username: true },
  });

  res.json({ user });
});

export default router;
