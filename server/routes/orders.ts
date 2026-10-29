import { Router } from "express";
import {
  createOrder,
  getOrders,
  getMenuItems,
  getUserProfileByUid,
  getOrCreateUserProfile,
  saveUserProfile,
  updateShopStats,
  addActivityLog,
  awardUserPointsWithDailyCap,
  Order,
  OrderItem
} from "../db.js";
import { requireUser, rateLimitPerUser, handleServerError } from "../middleware.js";

const router = Router();

// Region list for automatic passport stamping
const ethiopianRegionNames = ["Yirgacheffe", "Sidama", "Guji", "Harrar", "Limu", "Jimma"];

// All orders routes strictly require an authenticated user
router.use(requireUser);

// 1. Fetch active user orders (strictly caller's orders only)
router.get("/", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    // Return ONLY the caller's verified orders, ignoring all client headers or query overrides
    const userOrders = await getOrders({ uid: user.uid });

    res.json({
      success: true,
      orders: userOrders
    });
  } catch (err: any) {
    handleServerError(res, err, "Fetch Orders Error");
  }
});

// 2. Create an order (from Cart or Custom Drink Builder)
// Recomputes the total on the server from menu item IDs and quantities (quantity 1-20, at most 20 items).
// Ignores client totalPrice and item prices. Computes points and revenue from the server total.
router.post("/", rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const { items, isCustomBrew, customDetails } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return res.status(400).json({ error: "Order must contain between 1 and 20 items." });
    }

    // Fetch authoritative menu items from database
    const allMenuItems = await getMenuItems();
    const menuMap = new Map(allMenuItems.map(m => [m.id, m]));

    let serverTotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const rawItem of items) {
      if (!rawItem || typeof rawItem !== "object") {
        return res.status(400).json({ error: "Invalid item format." });
      }

      const quantity = Number(rawItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ error: "Quantity for each item must be an integer between 1 and 20." });
      }

      const itemId = String(rawItem.id || "").trim();
      let authoritativePrice = 0;
      let itemName = "";
      let itemDetails = typeof rawItem.details === "string" ? rawItem.details.slice(0, 200) : undefined;

      if (menuMap.has(itemId)) {
        const official = menuMap.get(itemId)!;
        authoritativePrice = official.price;
        itemName = official.name;
      } else if (itemId === "custom" || itemId.startsWith("custom_") || itemId.startsWith("c_") || isCustomBrew) {
        // Fixed standard base price for custom traditional Jebena / hand brew
        authoritativePrice = 150;
        itemName = customDetails?.region ? `Custom ${customDetails.region} Brew` : "Custom Jebena Coffee";
        if (customDetails) {
          itemDetails = `${customDetails.roast || "Medium"} Roast, ${customDetails.method || "Jebena"}, ${customDetails.size || "Regular"}`;
        }
      } else {
        return res.status(400).json({ error: `Unknown menu item ID: ${itemId}` });
      }

      serverTotal += authoritativePrice * quantity;
      validatedItems.push({
        id: itemId,
        name: itemName,
        price: authoritativePrice, // Server authoritative price
        quantity,
        details: itemDetails
      });
    }

    // Ignore client totalPrice completely
    const profile = await getOrCreateUserProfile(user);

    // Compute points and revenue strictly from the server total
    const pointsEarned = Math.round(serverTotal * 0.2) + 20;
    awardUserPointsWithDailyCap(user.uid, profile, pointsEarned);
    profile.beansCount += 1;

    if (profile.stampsCount < 10) {
      profile.stampsCount += 1;
    }

    // Automatic passport stamping if custom brew region matches an origin
    let stamped = false;
    if (customDetails?.region && ethiopianRegionNames.includes(customDetails.region)) {
      if (!profile.passportStamps.includes(customDetails.region)) {
        profile.passportStamps.push(customDetails.region);
        awardUserPointsWithDailyCap(user.uid, profile, 50);
        stamped = true;
      }
    }

    await saveUserProfile(user.uid, profile);

    const order: Order = {
      id: "ord_" + Date.now().toString(36),
      uid: user.uid,
      customerName: user.displayName || (user.email ? user.email.split("@")[0] : "Buna Guest"),
      customerEmail: user.email || "",
      deviceId: "verified-user",
      items: validatedItems,
      totalPrice: serverTotal,
      status: "Brewing",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCustomBrew: Boolean(isCustomBrew)
    };

    await createOrder(order);

    // Update shop stats with real server total
    await updateShopStats(stats => ({
      ...stats,
      revenue: stats.revenue + serverTotal,
      orders: stats.orders + 1
    }));

    await addActivityLog(
      `New Order #${order.id.slice(-4)} placed by ${order.customerName} (${serverTotal} ETB). (+${pointsEarned} pts, +1 Bean)`
    );

    res.json({
      success: true,
      order,
      loyalty: profile,
      stamped,
      message: `Order #${order.id.slice(-4)} placed successfully! Brewing in progress.`
    });
  } catch (err: any) {
    handleServerError(res, err, "Order Create Error");
  }
});

// 3. Custom coffee simulator route (backward compatibility)
router.post("/custom", rateLimitPerUser(15, 60000), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const { region, roast, method, size } = req.body;
    // Server-enforced base price for custom brew: 150 ETB (ignoring client price)
    const serverPrice = 150;

    const profile = await getOrCreateUserProfile(user);

    awardUserPointsWithDailyCap(user.uid, profile, 25);
    profile.beansCount += 1;

    if (profile.stampsCount < 10) {
      profile.stampsCount += 1;
    }

    let stamped = false;
    if (region && ethiopianRegionNames.includes(region) && !profile.passportStamps.includes(region)) {
      profile.passportStamps.push(region);
      awardUserPointsWithDailyCap(user.uid, profile, 50);
      stamped = true;
    }

    const order: Order = {
      id: "ord_" + Date.now().toString(36),
      uid: user.uid,
      customerName: user.displayName || (user.email ? user.email.split("@")[0] : "Custom Brewer"),
      customerEmail: user.email || "",
      deviceId: "verified-user",
      items: [
        {
          id: "custom_" + Date.now(),
          name: `Custom ${region || "Buna"} Hand-Brew`,
          price: serverPrice,
          quantity: 1,
          details: `${roast || "Medium"} Roast, ${method || "Jebena"}, ${size || "Regular"}`
        }
      ],
      totalPrice: serverPrice,
      status: "Brewing",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCustomBrew: true
    };

    await createOrder(order);
    await saveUserProfile(user.uid, profile);

    await updateShopStats(stats => ({
      ...stats,
      revenue: stats.revenue + serverPrice,
      orders: stats.orders + 1
    }));

    await addActivityLog(
      `New Custom Brew Order #${order.id.slice(-4)}: ${region || "Buna"} (${size || "Regular"}). (+1 Virtual Bean)`
    );

    res.json({
      success: true,
      order,
      loyalty: profile,
      stamped,
      message: stamped ? `Successfully brewed! Passport stamped for ${region}!` : "Enjoy your custom hand-brew!"
    });
  } catch (err: any) {
    handleServerError(res, err, "Custom Order Error");
  }
});

export default router;
