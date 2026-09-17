process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection]", err);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import menuRouter from "./server/routes/menu.js";
import ordersRouter from "./server/routes/orders.js";
import loyaltyRouter from "./server/routes/loyalty.js";
import ownerRouter from "./server/routes/owner.js";
import wallRouter from "./server/routes/wall.js";
import eventsRouter from "./server/routes/events.js";
import ethiopiaRouter, { ethiopianRegions } from "./server/routes/ethiopia.js";
import { getPromotions, getRafflePrizes } from "./server/db.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
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
    res.status(500).json({ error: err.message || "Failed to fetch promotions" });
  }
});

// Backwards compatibility for GET /api/raffle/prizes
app.get("/api/raffle/prizes", async (req, res) => {
  try {
    const prizes = await getRafflePrizes();
    res.json(prizes || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch prizes" });
  }
});

// Backwards compatibility for GET /api/ethiopia/regions
app.get("/api/ethiopia/regions", (req, res) => {
  res.json(ethiopianRegions);
});

// Server Initialization
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
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

startServer();
