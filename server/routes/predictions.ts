import { Router } from "express";
import {
  getFeaturedMatch,
  getPredictionMatch,
  getAllPredictionMatches,
  getUserPrediction,
  saveUserPrediction,
  getMatchStats,
  getMatchWinners,
  verifyUserToken
} from "../db.js";

const router = Router();

// Helper to extract Bearer token from Authorization header
function extractBearerToken(req: any): string | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
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
    res.status(500).json({ error: err.message || "Failed to fetch featured match" });
  }
});

// 2. GET /api/predictions/matches
// Returns list of matches for viewing schedule and past results
router.get("/matches", async (req, res) => {
  try {
    const matches = await getAllPredictionMatches();
    res.json({ success: true, matches });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch matches" });
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
    res.status(500).json({ error: err.message || "Failed to fetch match details" });
  }
});

// 4. POST /api/predictions
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
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required." });
    }

    const result = await saveUserPrediction(matchId, user.uid, user.displayName, {
      outcome,
      scoreline,
      playerName,
      playerGoals
    });

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
    res.status(500).json({ error: err.message || "Server error processing prediction" });
  }
});

export default router;
