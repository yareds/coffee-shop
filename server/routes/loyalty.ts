import { Router } from "express";
import { getState, saveDb, getProfile } from "../db.js";

const router = Router();

const otpStore: Record<string, { code: string; expires: number; name: string; email: string; deviceId: string }> = {};

// GET Loyalty Profile
router.get("/", (req, res) => {
  res.json(getProfile(req));
});

router.get("/profile", (req, res) => {
  res.json(getProfile(req));
});

// Reward points
router.post("/reward-points", (req, res) => {
  const { points, reason } = req.body;
  const profile = getProfile(req);
  profile.points += Number(points) || 0;

  const pts = profile.points;
  let level = profile.level;
  if (pts > 500) level = "Diamond";
  else if (pts > 400) level = "Platinum";
  else if (pts > 300) level = "Gold";
  else if (pts > 150) level = "Silver";
  else level = "Bronze";

  profile.level = level as any;

  if (reason) {
    const state = getState();
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${reason} (+${points} pts)`,
      time: "Just now"
    });
  }

  saveDb();
  res.json({ success: true, loyalty: profile });
});

router.post("/add-points", (req, res) => {
  const { points, reason } = req.body;
  const profile = getProfile(req);
  profile.points += Number(points) || 0;

  const pts = profile.points;
  let level = profile.level;
  if (pts > 500) level = "Diamond";
  else if (pts > 400) level = "Platinum";
  else if (pts > 300) level = "Gold";
  else if (pts > 150) level = "Silver";
  else level = "Bronze";

  profile.level = level as any;

  if (reason) {
    const state = getState();
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${reason} (+${points} pts)`,
      time: "Just now"
    });
  }

  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Send OTP
router.post("/send-otp", (req, res) => {
  const { name, email, phone, deviceId } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Name, email, and mobile phone number are required." });
  }

  const state = getState();
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = state.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser && existingUser.hasSpun) {
    return res.status(400).json({ 
      error: "⚠️ Spin Already Used: This account has already used its first-time welcome raffle spin." 
    });
  }

  const phoneAlreadyRegistered = state.registeredUsers.some(u => u.phone === phone && u.email.toLowerCase() !== cleanEmail);
  if (phoneAlreadyRegistered) {
    return res.status(400).json({ 
      error: "⚠️ Phone Number In Use: This mobile number is linked to another registered account." 
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000,
    name,
    email,
    deviceId: deviceId || "default-device"
  };

  res.json({ 
    success: true, 
    message: `A carrier-based SMS OTP passcode has been dispatched to ${phone}.`,
    demoCode: code 
  });
});

// Verify OTP & Signup
router.post("/verify-otp-signup", (req, res) => {
  const { name, email, phone, code, deviceId } = req.body;
  if (!name || !email || !phone || !code) {
    return res.status(400).json({ error: "All fields including the verification code are required." });
  }

  const record = otpStore[phone];
  if (!record) {
    return res.status(400).json({ error: "⚠️ No verification session found: Please request a new SMS OTP code." });
  }
  if (record.code !== code) {
    return res.status(400).json({ error: "⚠️ Incorrect Passcode: The OTP passcode you entered is invalid. Please try again." });
  }
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.status(400).json({ error: "⚠️ Code Expired: This passcode has expired. Please request a new OTP code." });
  }

  const state = getState();
  const profile = getProfile(req);
  profile.signedUp = true;
  profile.customerName = name;
  profile.customerEmail = email;
  profile.customerPhone = phone;

  let regUser = state.registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (regUser) {
    regUser.name = name;
    regUser.phone = phone;
    regUser.deviceId = deviceId || "default-device";
    profile.hasSpunWheel = regUser.hasSpun || false;
    profile.rafflePrize = regUser.prize || "";
    profile.hasCollectedPrize = regUser.hasCollected || false;
  } else {
    profile.hasSpunWheel = false;
    profile.rafflePrize = "";
    profile.hasCollectedPrize = false;

    state.registeredUsers.unshift({
      id: "u_" + Date.now(),
      name,
      email,
      phone,
      deviceId: deviceId || "default-device",
      hasSpun: false,
      hasCollected: false,
      prize: "",
      date: new Date().toLocaleString()
    });
  }

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `🎉 ${name} verified +${phone.slice(-4)} via OTP & registered for the Heritage Raffle!`,
    time: "Just now"
  });

  delete otpStore[phone];
  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Raffle Signup
router.post("/signup", (req, res) => {
  const { name, email, deviceId } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const state = getState();
  const profile = getProfile(req);
  profile.signedUp = true;
  profile.customerName = name;
  profile.customerEmail = email;

  let regUser = state.registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (regUser) {
    regUser.name = name;
    profile.hasSpunWheel = regUser.hasSpun || false;
    profile.rafflePrize = regUser.prize || "";
    profile.hasCollectedPrize = regUser.hasCollected || false;
  } else {
    profile.hasSpunWheel = false;
    profile.rafflePrize = "";
    profile.hasCollectedPrize = false;

    state.registeredUsers.unshift({
      id: "u_" + Date.now(),
      name,
      email,
      phone: "",
      deviceId: deviceId || "default-device",
      hasSpun: false,
      hasCollected: false,
      prize: "",
      date: new Date().toLocaleString()
    });
  }

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `${name} (${email}) registered for the lucky raffle!`,
    time: "Just now"
  });

  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Spin Raffle
router.post("/spin-raffle", (req, res) => {
  const { prize } = req.body;
  if (!prize) {
    return res.status(400).json({ error: "Prize is required" });
  }

  const state = getState();
  const profile = getProfile(req);

  if (profile.hasSpunWheel) {
    return res.status(400).json({ error: "You have already used your first-time raffle spin!" });
  }

  profile.hasSpunWheel = true;
  profile.rafflePrize = prize;

  const userEmail = profile.customerEmail || (req.headers["x-user-email"] as string) || "";
  const regUser = state.registeredUsers.find(u => 
    userEmail && u.email.toLowerCase() === userEmail.toLowerCase()
  );

  if (regUser) {
    regUser.hasSpun = true;
    regUser.prize = prize;
  }

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `🎉 ${profile.customerName || "Customer"} spun the Raffle Wheel and won ${prize}!`,
    time: "Just now"
  });

  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Collect Prize
router.post("/collect-raffle", (req, res) => {
  const state = getState();
  const profile = getProfile(req);

  if (!profile.hasSpunWheel) {
    return res.status(400).json({ error: "You must spin the wheel before collecting your prize!" });
  }

  profile.hasCollectedPrize = true;

  const userEmail = profile.customerEmail || (req.headers["x-user-email"] as string) || "";
  const regUser = state.registeredUsers.find(u => 
    userEmail && u.email.toLowerCase() === userEmail.toLowerCase()
  );
  if (regUser) {
    regUser.hasCollected = true;
  }

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `🎉 ${profile.customerName || "Customer"} collected free welcome coffee coupon: "${profile.rafflePrize}"!`,
    time: "Just now"
  });

  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Lucky Bean Game
router.post("/lucky-bean", (req, res) => {
  const state = getState();
  const profile = getProfile(req);
  if (profile.beansCount <= 0) {
    return res.status(400).json({ error: "No beans remaining! Try custom ordering or buying coffee." });
  }
  
  profile.beansCount -= 1;
  
  const prizes = [
    { title: "5% Discount", code: "LUCKY5", type: "discount" },
    { title: "10% Discount", code: "LUCKY10", type: "discount" },
    { title: "Free Organic Cookie", code: "FREECOOKIE", type: "freebie" },
    { title: "Double Reward Points", code: "DOUBLEPTS", type: "points" },
    { title: "Free Espresso Shot", code: "FREESHOT", type: "freebie" },
    { title: "Rare Golden Bean!", code: "GOLDENBUNA", type: "rare" }
  ];
  
  const rolled = prizes[Math.floor(Math.random() * prizes.length)];
  
  if (rolled.type === "points") {
    profile.points += 50;
  } else if (rolled.type === "rare") {
    if (!profile.unlockedBadges.includes("Rare Golden Bean")) {
      profile.unlockedBadges.push("Rare Golden Bean");
    }
    profile.points += 100;
  }
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `Lucky Bean cracked open: ${rolled.title}!`,
    time: "Just now"
  });
  
  saveDb();
  res.json({ success: true, prize: rolled, loyalty: profile });
});

// Redeem free drink stamps
router.post("/redeem-free-drink", (req, res) => {
  const state = getState();
  const profile = getProfile(req);
  if (profile.stampsCount < 10) {
    return res.status(400).json({ error: "Not enough stamps collected yet!" });
  }
  
  profile.stampsCount = 0;
  profile.points += 50;
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: "Redeemed 10 digital stamps for a FREE specialty coffee! (+50 points)",
    time: "Just now"
  });
  
  saveDb();
  res.json({ success: true, loyalty: profile });
});

// Exchange points
router.post("/exchange-points", (req, res) => {
  const state = getState();
  const { pointsCost, prizeTitle } = req.body;
  const profile = getProfile(req);
  if (profile.points < (Number(pointsCost) || 0)) {
    return res.status(400).json({ error: "Insufficient loyalty points!" });
  }
  
  profile.points -= Number(pointsCost);
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `Exchanged ${pointsCost} points for: '${prizeTitle}'`,
    time: "Just now"
  });
  
  saveDb();
  res.json({ success: true, loyalty: profile });
});

export default router;
