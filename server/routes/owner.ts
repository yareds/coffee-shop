import { Router } from "express";
import {
  getShopStats,
  getPromotions,
  togglePromotion,
  addPromotion,
  editPromotion,
  deletePromotion,
  getAllPredictionMatches,
  savePredictionMatch,
  voidPredictionMatch,
  settlePredictionMatch,
  getMatchStats,
  getMatchWinners,
  markPredictionPrizeCollected,
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

// 4. Manage Weekly Match Predictions (Protected)
router.get("/predictions/matches", adminAuthMiddleware, async (req, res) => {
  try {
    const matches = await getAllPredictionMatches();
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const stats = await getMatchStats(m.id);
        const winners = m.status === "settled" ? await getMatchWinners(m.id) : [];
        return {
          ...m,
          stats,
          winners
        };
      })
    );
    res.json({ success: true, matches: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch prediction matches" });
  }
});

router.post("/predictions/matches", adminAuthMiddleware, async (req, res) => {
  try {
    const { id, homeTeam, awayTeam, competition, kickoffAt, prizeDescription, players } = req.body;
    if (!homeTeam || !awayTeam || !kickoffAt) {
      return res.status(400).json({ error: "homeTeam, awayTeam, and kickoffAt are required." });
    }

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: "A list of players is required for users to pick from." });
    }

    const result = await savePredictionMatch({
      id,
      homeTeam,
      awayTeam,
      competition,
      kickoffAt,
      prizeDescription,
      players
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      match: result.match,
      warning: result.warning,
      message: result.warning ? `Match saved (${result.warning})` : "Match saved successfully."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save match" });
  }
});

router.post("/predictions/void", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    const result = await voidPredictionMatch(matchId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, match: result.match, message: "Match marked as void." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to void match" });
  }
});

router.post("/predictions/settle", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId, homeGoals, awayGoals, playerGoals } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }

    const hGoals = Number(homeGoals);
    const aGoals = Number(awayGoals);
    if (isNaN(hGoals) || isNaN(aGoals) || hGoals < 0 || aGoals < 0) {
      return res.status(400).json({ error: "homeGoals and awayGoals must be non-negative integers." });
    }

    const result = await settlePredictionMatch(
      matchId,
      Math.floor(hGoals),
      Math.floor(aGoals),
      playerGoals || {}
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const winners = await getMatchWinners(matchId);
    res.json({
      success: true,
      match: result.match,
      stats: result.stats,
      winners,
      message: `Match settled successfully. ${result.stats?.grandPrizeWinnersCount || 0} grand prize winner(s) identified!`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to settle match" });
  }
});

router.post("/predictions/collect-prize", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId, uid, collected } = req.body;
    if (!matchId || !uid) {
      return res.status(400).json({ error: "matchId and uid are required." });
    }

    const isCollected = collected !== undefined ? Boolean(collected) : true;
    const result = await markPredictionPrizeCollected(matchId, uid, isCollected);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const winners = await getMatchWinners(matchId);
    res.json({ success: true, winners, message: `Prize status updated for user.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to mark prize collected" });
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
