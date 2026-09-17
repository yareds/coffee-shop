import { Router } from "express";
import {
  getMenuItems,
  addMenuItem,
  editMenuItem,
  toggleMenuItemStatus,
  deleteMenuItem
} from "../db.js";
import { adminAuthMiddleware } from "../middleware.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const items = await getMenuItems();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch menu items" });
  }
});

router.post("/", adminAuthMiddleware, async (req, res) => {
  try {
    const { action, item } = req.body;
    let menuItems;

    if (action === "toggle-status") {
      menuItems = await toggleMenuItemStatus(item.id);
    } else if (action === "edit") {
      menuItems = await editMenuItem(item.id, item);
    } else if (action === "add") {
      menuItems = await addMenuItem(item);
    } else if (action === "delete") {
      menuItems = await deleteMenuItem(item.id);
    } else {
      menuItems = await getMenuItems();
    }

    res.json({ success: true, menuItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update menu items" });
  }
});

export default router;
