import { Router } from "express";
import {
  getShopStats,
  getPromotions,
  togglePromotion,
  addPromotion,
  editPromotion,
  deletePromotion,
  getAllPredictionMatches,
  getPredictionMatch,
  savePredictionMatch,
  voidPredictionMatch,
  settlePredictionMatch,
  correctPredictionMatchResult,
  getMatchStats,
  getMatchWinners,
  getAdminMatchWinners,
  getMatchEntries,
  markPredictionPrizeCollected,
  verifyPredictionClaim,
  redeemPredictionPrize,
  getAllPredictionsAdmin,
  getRegisteredUsers,
  resetUserSpin,
  deleteRegisteredUser,
  getOrders,
  updateOrderStatus,
  getProfile,
  getAdminAuth
} from "../db.js";
import { adminAuthMiddleware, createAdminToken, verifyAdminPin } from "../middleware.js";

const router = Router();

// 1. Admin PIN verification & login endpoint
router.post("/verify-pin", (req, res) => {
  const pin = (req.body?.adminPin || req.body?.pin || "").toString().trim();

  if (pin && verifyAdminPin(pin)) {
    let token: string;
    try {
      token = createAdminToken();
    } catch (err: any) {
      return res.status(401).json({
        error: err.message || "Failed to create admin session token."
      });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    return res.json({
      success: true,
      token,
      message: "Admin authentication successful.",
      adminUser: {
        role: "admin",
        name: adminEmail || "Admin",
        email: adminEmail || "admin"
      }
    });
  }

  res.status(401).json({
    error: "Invalid Admin PIN."
  });
});

// Admin Google Auth endpoint
// Verifies Firebase ID token cryptographically, requires verified email matching ADMIN_EMAIL (fail closed if unset)
router.post("/google-auth", async (req, res) => {
  // Fail closed: reject if ADMIN_EMAIL is unset or empty
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!configuredAdminEmail) {
    return res.status(401).json({
      error: "Admin authentication is not configured on the server (ADMIN_EMAIL unset)."
    });
  }

  // Require Authorization: Bearer <Firebase ID token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Missing Authorization Bearer token."
    });
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return res.status(401).json({
      error: "Unauthorized: Empty Bearer token."
    });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return res.status(401).json({
      error: "Authentication service is unavailable."
    });
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (err: any) {
    return res.status(401).json({
      error: "Invalid or expired Firebase ID token."
    });
  }

  // Require decoded.email_verified === true and decoded.email.toLowerCase() equal to ADMIN_EMAIL
  const isEmailVerified = decoded.email_verified === true;
  const userEmail = (decoded.email || "").toLowerCase().trim();
  const isAdmin = isEmailVerified && userEmail === configuredAdminEmail;

  if (isAdmin) {
    let token: string;
    try {
      token = createAdminToken();
    } catch (err: any) {
      return res.status(401).json({
        error: err.message || "Failed to create admin session token."
      });
    }

    return res.json({
      success: true,
      isAdmin: true,
      token,
      message: "Admin authenticated via Google Sign In.",
      user: {
        role: "admin",
        name: decoded.name || decoded.email || configuredAdminEmail,
        email: decoded.email || configuredAdminEmail
      }
    });
  }

  return res.json({
    success: true,
    isAdmin: false
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

function getSafeErrorMessage(err: any, fallbackMessage: string): string {
  if (process.env.NODE_ENV === "production") {
    return "Internal server error";
  }
  return err?.message || fallbackMessage;
}

// 4. Manage Weekly Match Predictions (Protected)
router.get("/predictions/matches", adminAuthMiddleware, async (req, res) => {
  try {
    const matches = await getAllPredictionMatches();
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const stats = await getMatchStats(m.id);
        const winners = m.status === "settled" ? await getAdminMatchWinners(m.id) : [];
        return {
          ...m,
          stats,
          winners
        };
      })
    );
    res.json({ success: true, matches: enriched });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch prediction matches") });
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
      return res.status(result.status || 400).json({ error: result.error });
    }

    res.json({
      success: true,
      match: result.match,
      warning: result.warning,
      message: result.warning ? `Match saved (${result.warning})` : "Match saved successfully."
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to save match") });
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
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ success: true, match: result.match, message: "Match marked as void." });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to void match") });
  }
});

router.post("/predictions/settle", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId, homeGoals, awayGoals, playerGoals, correction } = req.body;
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
      playerGoals || {},
      { correction: Boolean(correction) }
    );

    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const winners = await getAdminMatchWinners(matchId);
    res.json({
      success: true,
      match: result.match,
      stats: result.stats,
      winners,
      message: `Match settled successfully. ${result.stats?.grandPrizeWinnersCount || 0} grand prize winner(s) identified!`
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to settle match") });
  }
});

router.post("/predictions/collect-prize", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId, uid, collected } = req.body;
    if (!matchId || !uid) {
      return res.status(400).json({ error: "matchId and uid are required." });
    }

    const isCollected = collected !== undefined ? Boolean(collected) : true;
    const adminEmail = (req.headers["x-admin-email"] as string) || (process.env.ADMIN_EMAIL || "").trim() || "admin";
    const result = await markPredictionPrizeCollected(matchId, uid, isCollected, adminEmail);
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const winners = await getAdminMatchWinners(matchId);
    res.json({ success: true, winners, message: `Prize status updated for user.` });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to mark prize collected") });
  }
});

// Admin Entrants List for a Specific Match
// Returns every prediction for the match: displayName (full), email, outcome, scoreline,
// playerName, playerGoals, submittedAt, updatedAt, and after settlement: leg1/2/3Correct,
// legsCorrect, grandPrizeWinner, prizeCollected, collectedAt, claimCode.
router.get("/predictions/entries", adminAuthMiddleware, async (req, res) => {
  try {
    const matchId = (req.query.matchId as string || "").trim();
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    const entries = await getMatchEntries(matchId);
    res.json({ success: true, matchId, entries });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch match entries") });
  }
});

// Admin All Predictions List with Filters
router.get("/predictions/all", adminAuthMiddleware, async (req, res) => {
  try {
    const { weekKey, matchId, status, isWinner, search } = req.query;
    const predictions = await getAllPredictionsAdmin({
      weekKey: weekKey as string,
      matchId: matchId as string,
      status: status as string,
      isWinner: isWinner !== undefined ? isWinner === "true" : undefined,
      search: search as string
    });
    res.json({ success: true, predictions });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch predictions") });
  }
});

// Admin Verify Claim Code
router.post("/predictions/verify-claim", adminAuthMiddleware, async (req, res) => {
  try {
    const { claimCode } = req.body;
    if (!claimCode) {
      return res.status(400).json({ error: "Claim code is required." });
    }
    const result = await verifyPredictionClaim(claimCode);
    if (!result.success) {
      return res.status(result.status || 404).json({ error: result.error });
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to verify claim code") });
  }
});

// Admin Redeem Prize with Duplicate Protection
router.post("/predictions/redeem-prize", adminAuthMiddleware, async (req, res) => {
  try {
    const { claimCode } = req.body;
    if (!claimCode) {
      return res.status(400).json({ error: "Claim code is required." });
    }
    const adminEmail = (req.headers["x-admin-email"] as string) || (process.env.ADMIN_EMAIL || "").trim() || "admin";
    const result = await redeemPredictionPrize(claimCode, adminEmail);
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ success: true, prediction: result.prediction, message: "Prize successfully marked as redeemed." });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to redeem prize") });
  }
});

// Admin Correct Match Result with Audit History
router.post("/predictions/correct-result", adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId, homeGoals, awayGoals, playerGoals, reason } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    const hGoals = Number(homeGoals);
    const aGoals = Number(awayGoals);
    if (isNaN(hGoals) || isNaN(aGoals) || hGoals < 0 || aGoals < 0) {
      return res.status(400).json({ error: "homeGoals and awayGoals must be non-negative integers." });
    }
    const adminEmail = (req.headers["x-admin-email"] as string) || (process.env.ADMIN_EMAIL || "").trim() || "admin";
    const result = await correctPredictionMatchResult(
      matchId,
      Math.floor(hGoals),
      Math.floor(aGoals),
      playerGoals || {},
      reason || "Score correction / VAR adjustment",
      adminEmail
    );
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    const winners = await getMatchWinners(matchId);
    res.json({
      success: true,
      match: result.match,
      stats: result.stats,
      winners,
      message: "Match result corrected and audited successfully. Predictions re-evaluated."
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to correct match result") });
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
