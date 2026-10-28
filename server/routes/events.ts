import { Router } from "express";
import { getEvents, bookEvent } from "../db.js";
import { handleServerError } from "../middleware.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (err: any) {
    handleServerError(res, err, "Events GET Error");
  }
});

router.post("/book", async (req, res) => {
  try {
    const { eventId, userEmail } = req.body;
    const result = await bookEvent(eventId, userEmail);

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
