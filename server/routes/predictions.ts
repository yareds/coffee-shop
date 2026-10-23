import { Router } from "express";
import {
  getFeaturedMatch,
  getPredictionMatch,
  getAllPredictionMatches,
  getUserPrediction,
  saveUserPrediction,
  getMatchStats,
  getMatchWinners,
  verifyUserToken,
  getUserAllPredictions,
  verifyPredictionClaim
} from "../db.js";

const router = Router();

// Helper to extract Bearer token from Authorization header
function extractBearerToken(req: any): string | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function getSafeErrorMessage(err: any, fallbackMessage: string): string {
  if (process.env.NODE_ENV === "production") {
    return "Internal server error";
  }
  return err?.message || fallbackMessage;
}

// 1. GET /api/predictions/featured
// Returns the active or upcoming featured match, serverNow, total entries,
// and optionally user's verified prediction (if Authorization header is supplied)
router.get("/featured", async (req, res) => {
  try {
    const { match, totalEntries, serverNow } = await getFeaturedMatch();
    if (!match) {
      return res.json({
        success: true,
        match: null,
        totalEntries: 0,
        serverNow,
        userPrediction: null
      });
    }

    let userPrediction = null;
    const token = extractBearerToken(req);
    if (token) {
      const user = await verifyUserToken(token);
      if (user && user.uid) {
        userPrediction = await getUserPrediction(match.id, user.uid);
      }
    }

    let stats = null;
    let winners: Array<{ displayName: string; prizeCollected: boolean }> | null = null;

    if (match.status === "settled") {
      stats = await getMatchStats(match.id);
      winners = await getMatchWinners(match.id);
    }

    res.json({
      success: true,
      match,
      totalEntries,
      serverNow,
      userPrediction,
      stats,
      winners
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch featured match") });
  }
});

// 2. GET /api/predictions/matches
// Returns list of matches for viewing schedule and past results
router.get("/matches", async (req, res) => {
  try {
    const matches = await getAllPredictionMatches();
    res.json({ success: true, matches });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch matches") });
  }
});

// 3. GET /api/predictions/match/:id
router.get("/match/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await getPredictionMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const serverNow = new Date().toISOString();
    let userPrediction = null;
    const token = extractBearerToken(req);
    if (token) {
      const user = await verifyUserToken(token);
      if (user && user.uid) {
        userPrediction = await getUserPrediction(match.id, user.uid);
      }
    }

    let stats = null;
    let winners: Array<{ displayName: string; prizeCollected: boolean }> | null = null;
    if (match.status === "settled") {
      stats = await getMatchStats(match.id);
      winners = await getMatchWinners(match.id);
    }

    res.json({
      success: true,
      match,
      serverNow,
      userPrediction,
      stats,
      winners
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch match details") });
  }
});

// 4. GET /api/predictions/mine & GET /api/predictions/my-predictions
// Returns all predictions submitted by the authenticated user across all matches,
// joined with each match's teams, kickoff, status, prize, and result, newest first.
const handleUserPredictions = async (req: any, res: any) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Sign in required to view your predictions." });
    }

    const user = await verifyUserToken(token);
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
    }

    const predictions = await getUserAllPredictions(user.uid);
    res.json({ success: true, predictions, serverNow: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to fetch user predictions") });
  }
};

router.get("/mine", handleUserPredictions);
router.get("/my-predictions", handleUserPredictions);

// 5. GET /api/predictions/claim/:code
// Public verification lookup for coffee shop counter
router.get("/claim/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const result = await verifyPredictionClaim(code);
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Failed to verify claim code") });
  }
});

// 6. POST /api/predictions
// Submit or edit user prediction before kickoff.
// Requires valid Google ID token via Authorization: Bearer <token>.
// Server enforces verified uid and server-side kickoff lock check.
router.post("/", async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: You must be signed in with Google to submit a match day prediction."
      });
    }

    const user = await verifyUserToken(token);
    if (!user || !user.uid) {
      return res.status(401).json({
        error: "Invalid or expired session. Please sign in with Google again."
      });
    }

    const { matchId, outcome, scoreline, playerName, playerGoals } = req.body;
    if (!matchId || typeof matchId !== "string" || !matchId.trim()) {
      return res.status(400).json({ error: "matchId is required and must be a non-empty string." });
    }

    if (typeof outcome !== "string" || !outcome.trim()) {
      return res.status(400).json({ error: "outcome is required and must be a string." });
    }

    if (typeof scoreline !== "string" || !scoreline.trim()) {
      return res.status(400).json({ error: "scoreline is required and must be a string." });
    }

    if (typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required and must be a string." });
    }

    const goalsNum = Number(playerGoals);
    if (playerGoals === undefined || playerGoals === null || !Number.isInteger(goalsNum) || goalsNum < 0 || goalsNum > 10) {
      return res.status(400).json({ error: "playerGoals must be an integer between 0 and 10." });
    }

    const result = await saveUserPrediction(
      matchId.trim(),
      user.uid,
      user.displayName,
      {
        outcome,
        scoreline,
        playerName,
        playerGoals: goalsNum
      },
      user.email
    );

    if (!result.success) {
      return res.status(result.status || 400).json({
        error: result.error || "Failed to save prediction",
        serverNow: result.serverNow
      });
    }

    res.json({
      success: true,
      prediction: result.prediction,
      serverNow: result.serverNow,
      message: "Prediction saved successfully! You can modify your picks anytime until kickoff."
    });
  } catch (err: any) {
    res.status(500).json({ error: getSafeErrorMessage(err, "Server error processing prediction") });
  }
});

export default router;
