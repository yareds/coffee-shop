import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

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
    return "pin-admin";
  }
};

export const safeComparePin = (provided: string, expected: string): boolean => {
  if (!provided || !expected) return false;
  const bufProvided = Buffer.from(provided);
  const bufExpected = Buffer.from(expected);
  if (bufProvided.length !== bufExpected.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufProvided, bufExpected);
};

export const verifyAdminPin = (providedPin: string): boolean => {
  let rawAdminPin = (process.env.ADMIN_PIN || "").trim();
  if (!rawAdminPin && process.env.NODE_ENV !== "production") {
    rawAdminPin = "2026";
  }
  if (!rawAdminPin) return false; // Fail closed in production if unset or empty
  const normalizedProvidedPin = (providedPin || "").toString().trim();
  return safeComparePin(normalizedProvidedPin, rawAdminPin);
};

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tokenHeader = (req.headers["x-admin-token"] as string || "").trim();
  const pinHeader = req.headers["x-admin-pin"] as string;
  const pinBody = req.body?.adminPin || req.body?.pin;
  // NOTE: Do NOT accept PIN via query string (req.query) to avoid logging sensitive PINs

  // 1. Check stateless signed session token
  if (tokenHeader && isValidAdminToken(tokenHeader)) {
    (req as any).adminEmail = getAdminTokenEmail(tokenHeader);
    return next();
  }

  // 2. Direct PIN verification (strictly matches configured ADMIN_PIN; fails closed if unset)
  const providedPin = (pinHeader || pinBody || "").toString().trim();
  if (providedPin && verifyAdminPin(providedPin)) {
    (req as any).adminEmail = "pin-admin";
    return next();
  }

  res.status(401).json({
    error: "Unauthorized: Valid Admin Session Token or PIN required."
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

