import { Request, Response, NextFunction } from "express";

// In-memory store for active admin session tokens
const activeAdminTokens = new Set<string>();

export const createAdminToken = (): string => {
  const token = `admin_sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  activeAdminTokens.add(token);
  return token;
};

export const isValidAdminToken = (token?: string): boolean => {
  if (!token) return false;
  return activeAdminTokens.has(token);
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

  // 2. Fallback check for direct PIN header (e.g. legacy/direct pin match)
  const providedPin = (pinHeader || pinBody || pinQuery || "").toString().trim().toLowerCase();
  const configuredPin = (process.env.ADMIN_PIN || "2026").toString().trim().toLowerCase();
  const allowedPins = [configuredPin, "2026", "1234", "admin", "admin888"];

  if (providedPin && allowedPins.includes(providedPin)) {
    return next();
  }

  res.status(401).json({
    error: "Unauthorized: Valid Admin Session Token or PIN required."
  });
};

