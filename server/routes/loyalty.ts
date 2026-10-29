import { Router } from "express";
import {
  getUserProfileByUid,
  getOrCreateUserProfile,
  saveUserProfile,
  createDefaultProfile,
  awardUserPointsWithDailyCap,
  REWARDS_CATALOG,
  generateRedemptionShortCode,
  createRedemptionRecord,
  addActivityLog
} from "../db.js";
import { requireUser, rateLimitPerUser, handleServerError } from "../middleware.js";

const router = Router();

// Helper to determine tier level
function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" {
  if (points > 500) return "Diamond";
  if (points > 400) return "Platinum";
  if (points > 300) return "Gold";
  if (points > 150) return "Silver";
  return "Bronze";
}

// 1. Explicitly deleted endpoints - must return 404
router.all(["/add-points", "/reward-points", "/send-otp", "/verify-otp-signup", "/signup"], (req, res) => {
  return res.status(404).json({ error: "Endpoint removed" });
});

// 2. Pre-validate exchange-points payload: reject unknown IDs and negative or non-integer values with 400
router.post("/exchange-points", (req, res, next) => {
  const { rewardId } = req.body || {};

  for (const [key, val] of Object.entries(req.body || {})) {
    if (typeof val === "number" && (!Number.isInteger(val) || val <= 0)) {
      return res.status(400).json({ error: `Invalid ${key}: must be a strictly positive integer.` });
    }
    if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val)) && Number(val) <= 0) {
      return res.status(400).json({ error: `Invalid ${key}: value cannot be negative or zero.` });
    }
  }

  if (!rewardId || typeof rewardId !== "string" || !REWARDS_CATALOG[rewardId]) {
    return res.status(400).json({ error: "Invalid, unknown or missing rewardId." });
  }

  next();
});

// All /api/loyalty/* routes strictly require a verified user
router.use(requireUser);

// GET Loyalty Profile (strictly read-only; A GET must NEVER create a profile in DB or memory!)
router.get(["/", "/profile"], rateLimitPerUser(30, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    // Key the profile by the verified uid.
    // Ignore x-user-email, x-user-id, x-device-id, userEmail, email in query/headers.
    const existing = await getUserProfileByUid(user.uid);
    if (existing) {
      return res.json(existing);
    }

    // If profile does not exist yet, return in-memory representation WITHOUT persisting to DB.
    // A GET must never create a profile.
    const unpersistedDefault = createDefaultProfile(
      user.uid,
      user.displayName || (user.email ? user.email.split("@")[0] : "Explorer"),
      user.email || ""
    );
    res.json(unpersistedDefault);
  } catch (err: any) {
    handleServerError(res, err, "Loyalty GET Error");
  }
});

// Lucky Bean Game (Rate-limited per verified UID)
router.post("/lucky-bean", rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const profile = await getOrCreateUserProfile(user);
    if (profile.beansCount <= 0) {
      return res.status(400).json({ error: "No beans remaining! Try custom ordering or buying coffee." });
    }

    profile.beansCount -= 1;

    const prizes = [
      { title: "5% Discount", code: "LUCKY5", type: "discount" },
      { title: "10% Discount", code: "LUCKY10", type: "discount" },
      { title: "Free Organic Cookie", code: "FREECOOKIE", type: "freebie" },
      { title: "Double Reward Points", code: "DOUBLEPTS", type: "points" },
      { title: "Free Espresso Shot", code: "FREESHOT", type: "freebie" },
      { title: "Rare Golden Bean!", code: "GOLDENBUNA", type: "rare" }
    ];

    const rolled = prizes[Math.floor(Math.random() * prizes.length)];

    if (rolled.type === "points") {
      awardUserPointsWithDailyCap(user.uid, profile, 50);
    } else if (rolled.type === "rare") {
      if (!profile.unlockedBadges.includes("Rare Golden Bean")) {
        profile.unlockedBadges.push("Rare Golden Bean");
      }
      awardUserPointsWithDailyCap(user.uid, profile, 100);
    }

    profile.level = calculateTier(profile.points);
    await saveUserProfile(user.uid, profile);

    await addActivityLog(`Lucky Bean cracked open by ${profile.customerName || "Customer"}: ${rolled.title}!`);

    res.json({ success: true, prize: rolled, loyalty: profile });
  } catch (err: any) {
    handleServerError(res, err, "Lucky Bean POST Error");
  }
});

// Redeem free drink stamps (Rate-limited per verified UID)
router.post("/redeem-free-drink", rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const profile = await getUserProfileByUid(user.uid);
    if (!profile || profile.stampsCount < 10) {
      return res.status(400).json({ error: "Not enough stamps collected yet!" });
    }

    profile.stampsCount = 0;
    awardUserPointsWithDailyCap(user.uid, profile, 50);
    profile.level = calculateTier(profile.points);

    await saveUserProfile(user.uid, profile);

    await addActivityLog(`Redeemed 10 digital stamps for a FREE specialty coffee! (+50 points)`);

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    handleServerError(res, err, "Redeem Free Drink Error");
  }
});

// Exchange points: accepts only { rewardId } from server-side rewards catalog.
// Reject unknown IDs and any non-integer or non-positive value.
// Create a redemption record (uid, rewardId, cost, status "pending", short code).
router.post("/exchange-points", rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const { rewardId } = req.body || {};

    // Reject missing, unknown or non-string rewardId
    if (!rewardId || typeof rewardId !== "string" || !REWARDS_CATALOG[rewardId]) {
      return res.status(400).json({ error: "Invalid, unknown or missing rewardId." });
    }

    // Reject any non-integer or non-positive numeric value passed in the payload
    for (const [key, val] of Object.entries(req.body)) {
      if (typeof val === "number") {
        if (!Number.isInteger(val) || val <= 0) {
          return res.status(400).json({ error: `Invalid ${key}: must be a strictly positive integer.` });
        }
      }
    }

    const catalogItem = REWARDS_CATALOG[rewardId];
    const cost = catalogItem.cost;

    const profile = await getUserProfileByUid(user.uid);
    if (!profile || profile.points < cost) {
      return res.status(400).json({ error: "Insufficient loyalty points!" });
    }

    profile.points -= cost;
    profile.level = calculateTier(profile.points);

    await saveUserProfile(user.uid, profile);

    const redemption = await createRedemptionRecord({
      uid: user.uid,
      rewardId: catalogItem.id,
      rewardName: catalogItem.name,
      cost,
      status: "pending",
      shortCode: generateRedemptionShortCode(),
      customerName: user.displayName || profile.customerName || "Explorer",
      customerEmail: user.email || profile.customerEmail || "",
      createdAt: new Date().toISOString()
    });

    await addActivityLog(`Exchanged ${cost} points for '${catalogItem.name}' (Code: ${redemption.shortCode})`);

    res.json({
      success: true,
      loyalty: profile,
      redemption
    });
  } catch (err: any) {
    handleServerError(res, err, "Exchange Points Error");
  }
});

export default router;
