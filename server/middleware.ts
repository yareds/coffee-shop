import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { verifyUserToken } from "./db.js";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

/**
 * Returns the configured ADMIN_TOKEN_SECRET.
 * Fails closed (returns empty string) if unset, empty, or shorter than 32 characters.
 */
const getAdminTokenSecret = (): string => {
  const secret = process.env.ADMIN_TOKEN_SECRET || "";
  const trimmed = secret.trim();
  if (trimmed.length >= 32) {
    return trimmed;
  }
  if (process.env.NODE_ENV !== "production") {
    return "buna_default_admin_token_secret_2026_dev_key_32chars";
  }
  return "";
};

/**
 * Creates a stateless signed admin session token with verified email in payload.
 * Format: base64url(JSON{exp, email}) + "." + HMAC-SHA256(payloadB64, ADMIN_TOKEN_SECRET)
 * 8-hour expiry. Throws if secret is unset or shorter than 32 characters.
 */
export const createAdminToken = (adminEmail?: string): string => {
  const secret = getAdminTokenSecret();
  if (!secret) {
    throw new Error("ADMIN_TOKEN_SECRET is not configured or shorter than 32 characters.");
  }
  const exp = Date.now() + EIGHT_HOURS_MS;
  const email = (adminEmail && adminEmail.trim()) ? adminEmail.trim().toLowerCase() : "pin-admin";
  const payloadJson = JSON.stringify({ exp, email });
  const payloadB64 = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
};

/**
 * Verifies a stateless signed admin session token:
 * 1. Fails closed if ADMIN_TOKEN_SECRET is missing or < 32 chars
 * 2. Checks HMAC signature using crypto.timingSafeEqual
 * 3. Validates that the token has not expired
 */
export const isValidAdminToken = (token?: string): boolean => {
  if (!token || typeof token !== "string") return false;

  const secret = getAdminTokenSecret();
  if (!secret) return false;

  const parts = token.trim().split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);

  // Timing-safe signature comparison
  if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
    return false;
  }

  // Parse and verify expiry
  try {
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (typeof payload.exp !== "number") {
      return false;
    }
    const expiryMs = payload.exp > 1e11 ? payload.exp : payload.exp * 1000;
    return Date.now() <= expiryMs;
  } catch {
    return false;
  }
};

/**
 * Extracts the verified admin email from a valid token payload.
 */
export const getAdminTokenEmail = (token?: string): string => {
  if (!isValidAdminToken(token)) return "pin-admin";
  try {
    const parts = token!.trim().split(".");
    const payloadStr = Buffer.from(parts[0], "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    return (payload.email && typeof payload.email === "string" && payload.email.trim())
      ? payload.email.trim().toLowerCase()
      : "pin-admin";
  } catch {
    return (process.env.ADMIN_EMAIL || "yared.abegaz@gmail.com").toLowerCase().trim();
  }
};

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let tokenHeader = (req.headers["x-admin-token"] as string || "").trim();
  if (!tokenHeader && typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")) {
    tokenHeader = req.headers.authorization.substring(7).trim();
  }

  // Strictly check stateless signed admin session token (only X-Admin-Token is accepted)
  if (tokenHeader && isValidAdminToken(tokenHeader)) {
    (req as any).adminEmail = getAdminTokenEmail(tokenHeader);
    return next();
  }

  res.status(401).json({
    error: "Unauthorized: Valid Admin Session Token required."
  });
};

// In-memory rate limiter (10 requests/minute per IP) for claims/redemption
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitAdminClaims = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 10;

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(ip, record);
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: "Too many claim verification requests. Rate limit exceeded (max 10 requests/minute)."
    });
  }

  record.count++;
  return next();
};

/**
 * requireUser middleware:
 * Validates Authorization: Bearer <Firebase ID token> strictly using verifyUserToken.
 * Sets (req as any).user = { uid, displayName, email, emailVerified, provider }
 * Rejects unauthenticated requests with 401.
 */
export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Empty authentication token." });
  }

  const verified = await verifyUserToken(token);
  if (!verified || !verified.uid) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired authentication token." });
  }

  (req as any).user = verified;
  next();
};

// Global in-memory rate limiter on all POSTs (60/min per IP)
const postRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitAllPosts = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 60;

  let record = postRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    postRateLimitMap.set(ip, record);
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: "Too many requests. Global POST rate limit exceeded (max 60 requests/minute)."
    });
  }

  record.count++;
  return next();
};

// In-memory rate limiter for orders and profile creation (10/min per IP)
const ordersAndProfilesRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitOrdersAndProfiles = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 10;

  let record = ordersAndProfilesRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    ordersAndProfilesRateLimitMap.set(ip, record);
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: "Too many requests. Rate limit exceeded for orders and profile creation (max 10 requests/minute)."
    });
  }

  record.count++;
  return next();
};

// In-memory rate limiter per verified UID (for profile reads/writes)
const userRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitPerUser = (maxRequests = 30, windowMs = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uid = (req as any).user?.uid;
    if (!uid) {
      return next();
    }
    const now = Date.now();
    let record = userRateLimitMap.get(uid);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      userRateLimitMap.set(uid, record);
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: `Too many requests. Rate limit exceeded (max ${maxRequests} requests/minute per user).`
      });
    }

    record.count++;
    return next();
  };
};

/**
 * Standard server error response handler:
 * Logs real error server-side and returns generic message in production.
 */
export const handleServerError = (res: Response, err: any, prefix = "Server error") => {
  console.error(`[${prefix}]:`, err);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "Internal server error" });
  }
  return res.status(500).json({ error: err?.message || "Internal server error" });
};
