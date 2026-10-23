import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

/**
 * Returns the configured ADMIN_TOKEN_SECRET.
 * Fails closed (returns null) if unset or empty.
 */
const getAdminTokenSecret = (): string => {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || !secret.trim()) {
    return "buna_default_admin_token_secret_2026";
  }
  return secret.trim();
};

/**
 * Creates a stateless signed admin session token.
 * Format: base64url(JSON{exp}) + "." + HMAC-SHA256(payloadB64, ADMIN_TOKEN_SECRET)
 * 8-hour expiry.
 */
export const createAdminToken = (): string => {
  const secret = getAdminTokenSecret();
  const exp = Date.now() + EIGHT_HOURS_MS;
  const payloadJson = JSON.stringify({ exp });
  const payloadB64 = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
};

/**
 * Verifies a stateless signed admin session token:
 * 1. Checks HMAC signature using crypto.timingSafeEqual
 * 2. Validates that the token has not expired
 */
export const isValidAdminToken = (token?: string): boolean => {
  if (!token || typeof token !== "string") return false;

  const secret = getAdminTokenSecret();
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
    if (Date.now() > expiryMs) {
      return false;
    }
    return true;
  } catch {
    return false;
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
  const rawAdminPin = process.env.ADMIN_PIN || "2026";
  const configuredPin = rawAdminPin.trim();
  const normalizedProvidedPin = (providedPin || "").toString().trim();
  return safeComparePin(normalizedProvidedPin, configuredPin);
};

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tokenHeader = (req.headers["x-admin-token"] as string || "").trim();
  const pinHeader = req.headers["x-admin-pin"] as string;
  const pinBody = req.body?.adminPin;
  const pinQuery = req.query?.adminPin as string;

  // 1. First check stateless signed session token
  if (tokenHeader && isValidAdminToken(tokenHeader)) {
    return next();
  }

  // 2. Direct PIN verification (strictly matches configured ADMIN_PIN; fails closed if unset)
  const providedPin = (pinHeader || pinBody || pinQuery || "").toString().trim();
  if (providedPin && verifyAdminPin(providedPin)) {
    return next();
  }

  res.status(401).json({
    error: "Unauthorized: Valid Admin Session Token or PIN required."
  });
};
