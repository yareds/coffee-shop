import { Router } from "express";
import { getState, saveDb } from "../db.js";
import { adminAuthMiddleware } from "../middleware.js";

const router = Router();

router.get("/", (req, res) => {
  const state = getState();
  res.json(state.menuItems);
});

router.post("/", adminAuthMiddleware, (req, res) => {
  const state = getState();
  const { action, item } = req.body;

  if (action === "toggle-status") {
    state.menuItems = state.menuItems.map(m =>
      m.id === item.id ? { ...m, soldOut: !m.soldOut } : m
    );
  } else if (action === "edit") {
    state.menuItems = state.menuItems.map(m =>
      m.id === item.id ? { ...m, ...item } : m
    );
  } else if (action === "add") {
    const newItem = {
      ...item,
      id: "m_" + Date.now(),
      rating: 5.0,
      soldOut: false
    };
    state.menuItems.push(newItem);
  } else if (action === "delete") {
    state.menuItems = state.menuItems.filter(m => m.id !== item.id);
  }
  
  saveDb();
  res.json({ success: true, menuItems: state.menuItems });
});

export default router;
