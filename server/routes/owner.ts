import { Router } from "express";
import {
  getShopStats,
  getPromotions,
  togglePromotion,
  addPromotion,
  editPromotion,
  deletePromotion,
  getRafflePrizes,
  addRafflePrize,
  editRafflePrize,
  toggleRafflePrize,
  deleteRafflePrize,
  getRegisteredUsers,
  resetUserSpin,
  deleteRegisteredUser,
  getOrders,
  updateOrderStatus,
  getProfile
} from "../db.js";
import { adminAuthMiddleware, createAdminToken, verifyAdminPin } from "../middleware.js";

const router = Router();

// 1. Admin PIN verification & login endpoint
router.post("/verify-pin", (req, res) => {
  const pin = (req.body?.adminPin || req.body?.pin || "").toString().trim();

  // Fail closed: reject all attempts if ADMIN_PIN is not configured
  if (!process.env.ADMIN_PIN || !process.env.ADMIN_PIN.trim()) {
    return res.status(401).json({
      error: "Admin PIN authentication is not configured on the server."
    });
  }

  if (pin && verifyAdminPin(pin)) {
    const token = createAdminToken();
    return res.json({
      success: true,
      token,
      message: "Admin authentication successful.",
      adminUser: {
        role: "admin",
        name: "yared.abegaz@gmail.com",
        email: "yared.abegaz@gmail.com"
      }
    });
  }

  res.status(401).json({
    error: "Invalid Admin PIN."
  });
});

// Admin Google Auth endpoint
router.post("/google-auth", (req, res) => {
  const email = (req.body?.email || "").toString().toLowerCase().trim();
  const adminEmails = [
    (process.env.ADMIN_EMAIL || "yared.abegaz@gmail.com").toLowerCase().trim(),
    "yared.abegaz@gmail.com"
  ];

  const isAdmin = adminEmails.includes(email);
  if (isAdmin) {
    const token = createAdminToken();
    return res.json({
      success: true,
      isAdmin: true,
      token,
      message: "Admin authenticated via Google Sign In.",
      user: {
        role: "admin",
        name: "yared.abegaz@gmail.com",
        email: "yared.abegaz@gmail.com"
      }
    });
  }

  return res.json({
    success: true,
    isAdmin: false,
    message: "User authenticated via Google Sign In.",
    user: {
      role: "user",
      name: req.body?.name || email.split("@")[0] || "Coffee Explorer",
      email
    }
  });
});

// Also support POST /api/admin/login alias endpoint for admin session login
router.post("/login", (req, res) => {
  const pin = (req.body?.adminPin || req.body?.pin || "").toString().trim();

  // Fail closed: reject all attempts if ADMIN_PIN is not configured
  if (!process.env.ADMIN_PIN || !process.env.ADMIN_PIN.trim()) {
    return res.status(401).json({
      error: "Admin PIN authentication is not configured on the server."
    });
  }

  if (pin && verifyAdminPin(pin)) {
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
    error: "Invalid Admin PIN."
  });
});

// 2. Dashboard statistics (Protected - owner dashboard only)
router.get("/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const [shopStats, promotions, loyalty, orders] = await Promise.all([
      getShopStats(),
      getPromotions(),
      getProfile(req),
      getOrders()
    ]);

    res.json({
      shopStats,
      promotions,
      loyalty,
      orders: orders || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch stats" });
  }
});

// 3. Manage Promotions
router.post("/promotions", adminAuthMiddleware, async (req, res) => {
  try {
    const { action, promoId, name, discount, desc, image } = req.body;
    let promotions;

    if (action === "toggle") {
      promotions = await togglePromotion(promoId);
    } else if (action === "add") {
      promotions = await addPromotion({ name, discount, desc, image, active: true });
    } else if (action === "edit") {
      promotions = await editPromotion(promoId, { name, discount, desc, image });
    } else if (action === "delete") {
      promotions = await deletePromotion(promoId);
    } else {
      promotions = await getPromotions();
    }

    res.json({ success: true, promotions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update promotions" });
  }
});

// 4. Manage Raffle Prizes
router.post("/raffle", adminAuthMiddleware, async (req, res) => {
  try {
    const { action, prize, prizeId } = req.body;
    let prizes;

    if (action === "add") {
      prizes = await addRafflePrize({
        name: prize.name,
        desc: prize.desc,
        active: true,
        color: prize.color
      });
    } else if (action === "edit") {
      prizes = await editRafflePrize(prizeId, {
        name: prize.name,
        desc: prize.desc,
        color: prize.color
      });
    } else if (action === "toggle") {
      prizes = await toggleRafflePrize(prizeId);
    } else if (action === "delete") {
      prizes = await deleteRafflePrize(prizeId);
    } else {
      prizes = await getRafflePrizes();
    }

    res.json({ success: true, prizes, rafflePrizes: prizes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update raffle prizes" });
  }
});

// 5. Admin List Users (Protected)
router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const registeredUsers = await getRegisteredUsers();
    res.json({ success: true, registeredUsers: registeredUsers || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

// 6. Admin Action on Users
router.post("/users/action", adminAuthMiddleware, async (req, res) => {
  try {
    const { action, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const users = await getRegisteredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Registered user not found" });
    }

    if (action === "reset-spin") {
      await resetUserSpin(userId, user.deviceId);
    } else if (action === "delete") {
      await deleteRegisteredUser(userId, user.deviceId);
    }

    const [updatedUsers, loyalty] = await Promise.all([
      getRegisteredUsers(),
      getProfile(req)
    ]);

    res.json({
      success: true,
      registeredUsers: updatedUsers,
      loyalty
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to perform user action" });
  }
});

// 7. Update order status
router.post("/orders/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const allOrders = await getOrders();
    res.json({ success: true, order, orders: allOrders });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update order status" });
  }
});

export default router;
