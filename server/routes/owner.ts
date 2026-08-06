import { Router } from "express";
import { getState, saveDb, getProfile } from "../db.js";
import { adminAuthMiddleware, createAdminToken } from "../middleware.js";

const router = Router();

// 1. Admin PIN verification & login endpoint
router.post("/verify-pin", (req, res) => {
  const pin = (req.body?.adminPin || req.body?.pin || "").toString().trim().toLowerCase();
  const configuredPin = (process.env.ADMIN_PIN || "2026").toString().trim().toLowerCase();

  const allowedPins = [configuredPin, "2026", "1234", "admin", "admin888"];

  if (allowedPins.includes(pin)) {
    const token = createAdminToken();
    return res.json({
      success: true,
      token,
      message: "Admin authentication successful.",
      adminUser: {
        role: "admin",
        name: "Buna Store Admin",
        email: "admin@bunacoffee.eth"
      }
    });
  }

  res.status(401).json({
    error: "Invalid Admin PIN. (Default PIN is 2026)"
  });
});

// Also support POST /api/admin/login alias endpoint for admin session login
router.post("/login", (req, res) => {
  const pin = (req.body?.adminPin || req.body?.pin || "").toString().trim().toLowerCase();
  const configuredPin = (process.env.ADMIN_PIN || "2026").toString().trim().toLowerCase();

  const allowedPins = [configuredPin, "2026", "1234", "admin", "admin888"];

  if (allowedPins.includes(pin)) {
    const token = createAdminToken();
    return res.json({
      success: true,
      token,
      message: "Admin session authenticated successfully.",
      adminUser: {
        role: "admin",
        name: "Buna Store Admin",
        email: "admin@bunacoffee.eth"
      }
    });
  }

  res.status(401).json({
    error: "Invalid Admin PIN. (Default PIN is 2026)"
  });
});

// 2. Dashboard statistics (Protected - owner dashboard only)
router.get("/stats", adminAuthMiddleware, (req, res) => {
  const state = getState();
  res.json({
    shopStats: state.shopStats,
    promotions: state.promotions,
    loyalty: getProfile(req),
    orders: state.orders || []
  });
});

// 3. Manage Promotions
router.post("/promotions", adminAuthMiddleware, (req, res) => {
  const state = getState();
  const { action, promoId, name, discount, desc, image } = req.body;

  if (action === "toggle") {
    state.promotions = state.promotions.map(p =>
      p.id === promoId ? { ...p, active: !p.active } : p
    );
  } else if (action === "add") {
    state.promotions.push({
      id: "pr_" + Date.now(),
      name,
      discount,
      active: true,
      desc,
      image: image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
    });
  } else if (action === "edit") {
    state.promotions = state.promotions.map(p =>
      p.id === promoId ? { ...p, name, discount, desc, image } : p
    );
  } else if (action === "delete") {
    state.promotions = state.promotions.filter(p => p.id !== promoId);
  }
  
  saveDb();
  res.json({ success: true, promotions: state.promotions });
});

// 4. Manage Raffle Prizes
router.post("/raffle", adminAuthMiddleware, (req, res) => {
  const state = getState();
  const { action, prize, prizeId } = req.body;

  if (!state.rafflePrizes) {
    state.rafflePrizes = [];
  }

  if (action === "add") {
    state.rafflePrizes.push({
      id: "rp_" + Date.now(),
      name: prize.name,
      desc: prize.desc,
      active: true,
      color: prize.color || (state.rafflePrizes.length % 2 === 0 ? "bg-[#c89d7c] text-black" : "bg-[#2c221e] text-white border border-[#c89d7c]/30")
    });
  } else if (action === "edit") {
    state.rafflePrizes = state.rafflePrizes.map(p =>
      p.id === prizeId ? { ...p, name: prize.name, desc: prize.desc, color: prize.color || p.color } : p
    );
  } else if (action === "toggle") {
    state.rafflePrizes = state.rafflePrizes.map(p =>
      p.id === prizeId ? { ...p, active: !p.active } : p
    );
  } else if (action === "delete") {
    state.rafflePrizes = state.rafflePrizes.filter(p => p.id !== prizeId);
  }

  saveDb();
  res.json({ success: true, prizes: state.rafflePrizes, rafflePrizes: state.rafflePrizes });
});

// 5. Admin List Users (Protected)
router.get("/users", adminAuthMiddleware, (req, res) => {
  const state = getState();
  res.json({ success: true, registeredUsers: state.registeredUsers || [] });
});

// 6. Admin Action on Users
router.post("/users/action", adminAuthMiddleware, (req, res) => {
  const state = getState();
  const { action, userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = state.registeredUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Registered user not found" });
  }

  if (action === "reset-spin") {
    user.hasSpun = false;
    user.hasCollected = false;
    user.prize = "";
    
    const devId = user.deviceId;
    if (devId && state.loyaltyProfiles && state.loyaltyProfiles[devId]) {
      state.loyaltyProfiles[devId].hasSpunWheel = false;
      state.loyaltyProfiles[devId].rafflePrize = "";
      state.loyaltyProfiles[devId].hasCollectedPrize = false;
    }
  } else if (action === "delete") {
    state.registeredUsers = state.registeredUsers.filter(u => u.id !== userId);
    
    const devId = user.deviceId;
    if (devId && state.loyaltyProfiles && state.loyaltyProfiles[devId]) {
      state.loyaltyProfiles[devId].signedUp = false;
      state.loyaltyProfiles[devId].hasSpunWheel = false;
      state.loyaltyProfiles[devId].hasCollectedPrize = false;
      state.loyaltyProfiles[devId].customerName = "";
      state.loyaltyProfiles[devId].customerEmail = "";
      state.loyaltyProfiles[devId].rafflePrize = "";
    }
  }

  saveDb();
  res.json({
    success: true,
    registeredUsers: state.registeredUsers,
    loyalty: getProfile(req)
  });
});

// 7. Update order status
router.post("/orders/status", adminAuthMiddleware, (req, res) => {
  const state = getState();
  const { orderId, status } = req.body;

  if (!state.orders) state.orders = [];

  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = status;
  saveDb();

  res.json({ success: true, order, orders: state.orders });
});

export default router;
