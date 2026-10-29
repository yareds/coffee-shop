import { Router } from "express";
import { getEvents, bookEvent } from "../db.js";
import { requireUser, rateLimitPerUser, handleServerError } from "../middleware.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (err: any) {
    handleServerError(res, err, "Events GET Error");
  }
});

router.post("/book", requireUser, rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const { eventId } = req.body;
    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "eventId is required." });
    }

    // Ignore client-provided userEmail; use verified identity from token
    const bookerIdentity = user.email || user.displayName || "Verified User";
    const result = await bookEvent(eventId, bookerIdentity);

    if (result.success) {
      res.json({ success: true, events: result.events });
    } else {
      res.status(400).json({ error: result.error || "No seats available or event not found" });
    }
  } catch (err: any) {
    handleServerError(res, err, "Events Book POST Error");
  }
});

export default router;
