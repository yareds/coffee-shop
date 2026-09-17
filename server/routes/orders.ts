import { Router } from "express";
import {
  createOrder,
  getOrders,
  getProfile,
  saveProfile,
  updateShopStats,
  addActivityLog,
  Order
} from "../db.js";

const router = Router();

// Region list for automatic passport stamping
const ethiopianRegionNames = ["Yirgacheffe", "Sidama", "Guji", "Harrar", "Limu", "Jimma"];

// Create an order (from Cart or Custom Drink Builder)
router.post("/", async (req, res) => {
  try {
    const { items, totalPrice, customerName, customerEmail, isCustomBrew, customDetails } = req.body;

    const profile = await getProfile(req);
    const deviceId = profile.deviceId || (req.headers["x-device-id"] as string) || "guest";
    const orderPrice = Number(totalPrice) || 150;

    const order: Order = {
      id: "ord_" + Date.now().toString(36),
      customerName: customerName || profile.customerName || "Buna Guest",
      customerEmail: customerEmail || profile.customerEmail || "",
      deviceId,
      items: Array.isArray(items)
        ? items
        : [
            {
              id: "custom_" + Date.now(),
              name: customDetails?.region ? `Custom ${customDetails.region} Brew` : "Custom Jebena Coffee",
              price: orderPrice,
              quantity: 1,
              details: customDetails
                ? `${customDetails.roast || "Medium"} Roast, ${customDetails.method || "Jebena"}, ${customDetails.size || "Regular"}`
                : undefined
            }
          ],
      totalPrice: orderPrice,
      status: "Brewing",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCustomBrew: !!isCustomBrew
    };

    await createOrder(order);

    // Update shop stats
    await updateShopStats(stats => ({
      ...stats,
      revenue: stats.revenue + orderPrice,
      orders: stats.orders + 1
    }));

    // Award points & beans
    const pointsEarned = Math.round(orderPrice * 0.2) + 20;
    profile.points += pointsEarned;
    profile.beansCount += 1;

    if (profile.stampsCount < 10) {
      profile.stampsCount += 1;
    }

    // Automatic passport stamping if custom brew region matches an origin
    let stamped = false;
    if (customDetails?.region && ethiopianRegionNames.includes(customDetails.region)) {
      if (!profile.passportStamps.includes(customDetails.region)) {
        profile.passportStamps.push(customDetails.region);
        profile.points += 50;
        stamped = true;
      }
    }

    await saveProfile(profile);

    await addActivityLog(
      `New Order #${order.id.slice(-4)} placed by ${order.customerName} (${order.totalPrice} ETB). (+${pointsEarned} pts, +1 Bean)`
    );

    res.json({
      success: true,
      order,
      loyalty: profile,
      stamped,
      message: `Order #${order.id.slice(-4)} placed successfully! Brewing in progress.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to place order" });
  }
});

// Custom coffee simulator shortcut route (compatible with existing frontend)
router.post("/custom", async (req, res) => {
  try {
    const { region, roast, method, price, size } = req.body;
    const profile = await getProfile(req);
    const orderPrice = Number(price) || 150;

    await updateShopStats(stats => ({
      ...stats,
      revenue: stats.revenue + orderPrice,
      orders: stats.orders + 1
    }));

    profile.points += 25;
    profile.beansCount += 1;

    if (profile.stampsCount < 10) {
      profile.stampsCount += 1;
    }

    let stamped = false;
    if (region && ethiopianRegionNames.includes(region) && !profile.passportStamps.includes(region)) {
      profile.passportStamps.push(region);
      profile.points += 50;
      stamped = true;
    }

    const order: Order = {
      id: "ord_" + Date.now().toString(36),
      customerName: profile.customerName || "Custom Brewer",
      customerEmail: profile.customerEmail || "",
      deviceId: profile.deviceId || "guest",
      items: [
        {
          id: "c_" + Date.now(),
          name: `Custom ${region || "Buna"} Hand-Brew`,
          price: orderPrice,
          quantity: 1,
          details: `${roast || "Medium"} Roast, ${method || "Jebena"}, ${size || "Regular"}`
        }
      ],
      totalPrice: orderPrice,
      status: "Brewing",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCustomBrew: true
    };

    await createOrder(order);
    await saveProfile(profile);

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
    res.status(500).json({ error: err.message || "Failed to place custom brew order" });
  }
});

// Fetch active user orders
router.get("/", async (req, res) => {
  try {
    const profile = await getProfile(req);
    const deviceId = profile.deviceId || (req.headers["x-device-id"] as string);
    const email = profile.customerEmail;

    const userOrders = await getOrders({ email, deviceId });

    res.json({
      success: true,
      orders: userOrders
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch orders" });
  }
});

export default router;
