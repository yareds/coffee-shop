import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// In-memory store for active admin session tokens
const activeAdminTokens = new Set<string>();

export const createAdminToken = (): string => {
  const token = `admin_sess_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
  activeAdminTokens.add(token);
  return token;
};

export const isValidAdminToken = (token?: string): boolean => {
  if (!token) return false;
  return activeAdminTokens.has(token);
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
  const rawAdminPin = process.env.ADMIN_PIN;
  // Fail closed: If ADMIN_PIN is not set or empty, reject all PIN attempts
  if (!rawAdminPin || !rawAdminPin.trim()) {
    return false;
  }
  const configuredPin = rawAdminPin.trim();
  const normalizedProvidedPin = (providedPin || "").toString().trim();
  return safeComparePin(normalizedProvidedPin, configuredPin);
};

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tokenHeader = req.headers["x-admin-token"] as string;
  const pinHeader = req.headers["x-admin-pin"] as string;
  const pinBody = req.body?.adminPin;
  const pinQuery = req.query?.adminPin as string;

  // 1. First check session token
  if (tokenHeader && activeAdminTokens.has(tokenHeader.trim())) {
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


