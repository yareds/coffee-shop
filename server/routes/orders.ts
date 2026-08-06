import { Router } from "express";
import { getState, saveDb, getProfile, Order } from "../db.js";

const router = Router();

// Region list for automatic passport stamping
const ethiopianRegionNames = ["Yirgacheffe", "Sidama", "Guji", "Harrar", "Limu", "Jimma"];

// Create an order (from Cart or Custom Drink Builder)
router.post("/", (req, res) => {
  const state = getState();
  const { items, totalPrice, customerName, customerEmail, isCustomBrew, customDetails } = req.body;

  const profile = getProfile(req);
  const deviceId = profile.deviceId || (req.headers["x-device-id"] as string) || "guest";

  const orderPrice = Number(totalPrice) || 150;
  
  const order: Order = {
    id: "ord_" + Date.now().toString(36),
    customerName: customerName || profile.customerName || "Buna Guest",
    customerEmail: customerEmail || profile.customerEmail || "",
    deviceId,
    items: Array.isArray(items) ? items : [
      {
        id: "custom_" + Date.now(),
        name: customDetails?.region ? `Custom ${customDetails.region} Brew` : "Custom Jebena Coffee",
        price: orderPrice,
        quantity: 1,
        details: customDetails ? `${customDetails.roast || "Medium"} Roast, ${customDetails.method || "Jebena"}, ${customDetails.size || "Regular"}` : undefined
      }
    ],
    totalPrice: orderPrice,
    status: "Brewing",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isCustomBrew: !!isCustomBrew
  };

  if (!state.orders) {
    state.orders = [];
  }
  state.orders.unshift(order);

  // Update shop stats
  state.shopStats.revenue += orderPrice;
  state.shopStats.orders += 1;

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

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `New Order #${order.id.slice(-4)} placed by ${order.customerName} (${order.totalPrice} ETB). (+${pointsEarned} pts, +1 Bean)`,
    time: "Just now"
  });

  saveDb();

  res.json({
    success: true,
    order,
    loyalty: profile,
    stamped,
    message: `Order #${order.id.slice(-4)} placed successfully! Brewing in progress.`
  });
});

// Custom coffee simulator shortcut route (compatible with existing frontend)
router.post("/custom", (req, res) => {
  const state = getState();
  const { region, roast, method, sugar, milk, spices, size, price } = req.body;
  const profile = getProfile(req);

  const orderPrice = Number(price) || 150;

  state.shopStats.revenue += orderPrice;
  state.shopStats.orders += 1;
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

  if (!state.orders) {
    state.orders = [];
  }
  state.orders.unshift(order);

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `New Custom Brew Order #${order.id.slice(-4)}: ${region || "Buna"} (${size}). (+1 Virtual Bean)`,
    time: "Just now"
  });

  saveDb();
  res.json({
    success: true,
    order,
    loyalty: profile,
    stamped,
    message: stamped ? `Successfully brewed! Passport stamped for ${region}!` : "Enjoy your custom hand-brew!"
  });
});

// Fetch active user or admin orders
router.get("/", (req, res) => {
  const state = getState();
  const profile = getProfile(req);
  const deviceId = profile.deviceId || (req.headers["x-device-id"] as string);
  const email = profile.customerEmail;

  if (!state.orders) {
    state.orders = [];
  }

  // Filter for user unless admin
  const userOrders = state.orders.filter(o => 
    (email && o.customerEmail?.toLowerCase() === email.toLowerCase()) || 
    (deviceId && o.deviceId === deviceId)
  );

  res.json({
    success: true,
    orders: userOrders
  });
});

export default router;
