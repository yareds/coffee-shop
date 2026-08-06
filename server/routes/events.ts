import { Router } from "express";
import { getState, saveDb } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const state = getState();
  res.json(state.events);
});

router.post("/book", (req, res) => {
  const state = getState();
  const { eventId, userEmail } = req.body;
  const eventIndex = state.events.findIndex(e => e.id === eventId);

  if (eventIndex !== -1 && state.events[eventIndex].seats > 0) {
    state.events[eventIndex].seats -= 1;

    state.shopStats.orders += 1;
    state.shopStats.revenue += state.events[eventIndex].price;
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${userEmail || "Someone"} booked '${state.events[eventIndex].title}'`,
      time: "Just now"
    });

    saveDb();
    res.json({ success: true, events: state.events });
  } else {
    res.status(400).json({ error: "No seats available or event not found" });
  }
});

export default router;
