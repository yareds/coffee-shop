process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection]", err);
});

import express from "express";
import path from "path";
import dotenv from "dotenv";

import menuRouter from "./server/routes/menu.js";
import ordersRouter from "./server/routes/orders.js";
import loyaltyRouter from "./server/routes/loyalty.js";
import ownerRouter from "./server/routes/owner.js";
import wallRouter from "./server/routes/wall.js";
import eventsRouter from "./server/routes/events.js";
import ethiopiaRouter, { ethiopianRegions } from "./server/routes/ethiopia.js";
import predictionsRouter from "./server/routes/predictions.js";
import { getPromotions } from "./server/db.js";

import { rateLimitAllPosts, rateLimitOrdersAndProfiles, handleServerError } from "./server/middleware.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Security headers on every response
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://*.firebaseapp.com https://accounts.google.com;"
  );

  // Set X-Frame-Options: DENY for API routes, and for production non-preview environments
  const isPreview = process.env.K_SERVICE?.startsWith("ais-dev-") || process.env.K_SERVICE?.startsWith("ais-pre-") || process.env.NODE_ENV !== "production";
  if (!isPreview || req.path.startsWith("/api")) {
    res.setHeader("X-Frame-Options", "DENY");
  }
  next();
});

app.use(express.json());

// In-memory rate limiters: global 60/min on all POSTs, 10/min for orders and profile creation
app.post("*", rateLimitAllPosts);
app.post(["/api/orders*", "/api/order*", "/api/loyalty/profile", "/api/loyalty"], rateLimitOrdersAndProfiles);

// API Routes
app.use("/api/predictions", predictionsRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/order", ordersRouter); // Backwards compatibility for /api/order/custom
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", ownerRouter);
app.use("/api/wall", wallRouter);
app.use("/api/events", eventsRouter);
app.use("/api/ethiopia", ethiopiaRouter);
app.use("/api/passport", ethiopiaRouter);

// Public promotions endpoint (doesn't leak owner revenue or order stats)
app.get("/api/promotions", async (req, res) => {
  try {
    const activePromos = await getPromotions(true);
    res.json({ success: true, promotions: activePromos });
  } catch (err: any) {
    handleServerError(res, err, "Promotions GET Error");
  }
});

// Backwards compatibility for GET /api/ethiopia/regions
app.get("/api/ethiopia/regions", (req, res) => {
  res.json(ethiopianRegions);
});

// Check environment secrets outside local dev
const checkSecretsOnStartup = () => {
  const isLocalDev = process.env.NODE_ENV !== "production" && !process.env.K_SERVICE;
  if (!isLocalDev) {
    const missing: string[] = [];
    if (!process.env.ADMIN_EMAIL?.trim()) missing.push("ADMIN_EMAIL");
    if (!process.env.ADMIN_TOKEN_SECRET?.trim() || process.env.ADMIN_TOKEN_SECRET.trim().length < 32) {
      missing.push("ADMIN_TOKEN_SECRET (unset or < 32 chars)");
    }
    if (missing.length > 0) {
      console.error(`🚨 SECURITY CONFIGURATION ERROR ON STARTUP: Missing required production secrets: ${missing.join(", ")}`);
    }
  }
};

// 404 for unknown /api/* routes
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global 500 handler: in production returns generic message and logs real error server-side
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  handleServerError(res, err, `Unhandled Express Error: ${req.method} ${req.url}`);
});

// Server Initialization
const startServer = async () => {
  checkSecretsOnStartup();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use((req, res, next) => {
      if (req.path.endsWith(".cjs") || req.path.endsWith(".map") || req.path.endsWith(".ts")) {
        return res.status(404).end();
      }
      next();
    });
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BUNA server running on http://localhost:${PORT}`);
  });
};

export { app };

if (process.env.FUNCTIONS_TARGET !== "true") {
  startServer();
}

