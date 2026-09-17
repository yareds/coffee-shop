import { Router } from "express";
import {
  getProfile,
  saveProfile,
  getRegisteredUsers,
  addRegisteredUser,
  updateRegisteredUser,
  addActivityLog
} from "../db.js";

const router = Router();

const otpStore: Record<string, { code: string; expires: number; name: string; email: string; deviceId: string }> = {};

// Helper to determine tier level
function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" {
  if (points > 500) return "Diamond";
  if (points > 400) return "Platinum";
  if (points > 300) return "Gold";
  if (points > 150) return "Silver";
  return "Bronze";
}

// GET Loyalty Profile
router.get("/", async (req, res) => {
  try {
    const profile = await getProfile(req);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get profile" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const profile = await getProfile(req);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get profile" });
  }
});

// Reward points
router.post("/reward-points", async (req, res) => {
  try {
    const { points, reason } = req.body;
    const profile = await getProfile(req);
    profile.points += Number(points) || 0;
    profile.level = calculateTier(profile.points);

    await saveProfile(profile);

    if (reason) {
      await addActivityLog(`${reason} (+${points} pts)`);
    }

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to award points" });
  }
});

router.post("/add-points", async (req, res) => {
  try {
    const { points, reason } = req.body;
    const profile = await getProfile(req);
    profile.points += Number(points) || 0;
    profile.level = calculateTier(profile.points);

    await saveProfile(profile);

    if (reason) {
      await addActivityLog(`${reason} (+${points} pts)`);
    }

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add points" });
  }
});

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, phone, deviceId } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and mobile phone number are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getRegisteredUsers();
    const existingUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (existingUser && existingUser.hasSpun) {
      return res.status(400).json({
        error: "⚠️ Spin Already Used: This account has already used its first-time welcome raffle spin."
      });
    }

    const phoneAlreadyRegistered = users.some(u => u.phone === phone && u.email && u.email.toLowerCase() !== cleanEmail);
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});

// Verify OTP & Signup
router.post("/verify-otp-signup", async (req, res) => {
  try {
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

    const profile = await getProfile(req);
    profile.signedUp = true;
    profile.customerName = name;
    profile.customerEmail = email;
    profile.customerPhone = phone;

    const users = await getRegisteredUsers();
    let regUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (regUser) {
      await updateRegisteredUser(regUser.id, {
        name,
        phone,
        deviceId: deviceId || "default-device"
      });
      profile.hasSpunWheel = regUser.hasSpun || false;
      profile.rafflePrize = regUser.prize || "";
      profile.hasCollectedPrize = regUser.hasCollected || false;
    } else {
      profile.hasSpunWheel = false;
      profile.rafflePrize = "";
      profile.hasCollectedPrize = false;

      await addRegisteredUser({
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

    await saveProfile(profile);

    await addActivityLog(
      `🎉 ${name} verified +${phone.slice(-4)} via OTP & registered for the Heritage Raffle!`
    );

    delete otpStore[phone];
    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify OTP" });
  }
});

// Raffle Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, deviceId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const profile = await getProfile(req);
    profile.signedUp = true;
    profile.customerName = name;
    profile.customerEmail = email;

    const users = await getRegisteredUsers();
    let regUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (regUser) {
      await updateRegisteredUser(regUser.id, { name });
      profile.hasSpunWheel = regUser.hasSpun || false;
      profile.rafflePrize = regUser.prize || "";
      profile.hasCollectedPrize = regUser.hasCollected || false;
    } else {
      profile.hasSpunWheel = false;
      profile.rafflePrize = "";
      profile.hasCollectedPrize = false;

      await addRegisteredUser({
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

    await saveProfile(profile);

    await addActivityLog(`${name} (${email}) registered for the lucky raffle!`);

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to sign up" });
  }
});

// Spin Raffle
router.post("/spin-raffle", async (req, res) => {
  try {
    const { prize } = req.body;
    if (!prize) {
      return res.status(400).json({ error: "Prize is required" });
    }

    const profile = await getProfile(req);

    if (profile.hasSpunWheel) {
      return res.status(400).json({ error: "You have already used your first-time raffle spin!" });
    }

    profile.hasSpunWheel = true;
    profile.rafflePrize = prize;

    const userEmail = profile.customerEmail || (req.headers["x-user-email"] as string) || "";
    if (userEmail) {
      const users = await getRegisteredUsers();
      const regUser = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
      if (regUser) {
        await updateRegisteredUser(regUser.id, {
          hasSpun: true,
          prize
        });
      }
    }

    await saveProfile(profile);

    await addActivityLog(
      `🎉 ${profile.customerName || "Customer"} spun the Raffle Wheel and won ${prize}!`
    );

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to spin raffle" });
  }
});

// Collect Prize
router.post("/collect-raffle", async (req, res) => {
  try {
    const profile = await getProfile(req);

    if (!profile.hasSpunWheel) {
      return res.status(400).json({ error: "You must spin the wheel before collecting your prize!" });
    }

    profile.hasCollectedPrize = true;

    const userEmail = profile.customerEmail || (req.headers["x-user-email"] as string) || "";
    if (userEmail) {
      const users = await getRegisteredUsers();
      const regUser = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
      if (regUser) {
        await updateRegisteredUser(regUser.id, {
          hasCollected: true
        });
      }
    }

    await saveProfile(profile);

    await addActivityLog(
      `🎉 ${profile.customerName || "Customer"} collected free welcome coffee coupon: "${profile.rafflePrize}"!`
    );

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to collect raffle prize" });
  }
});

// Lucky Bean Game
router.post("/lucky-bean", async (req, res) => {
  try {
    const profile = await getProfile(req);
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

    profile.level = calculateTier(profile.points);
    await saveProfile(profile);

    await addActivityLog(`Lucky Bean cracked open: ${rolled.title}!`);

    res.json({ success: true, prize: rolled, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to play lucky bean" });
  }
});

// Redeem free drink stamps
router.post("/redeem-free-drink", async (req, res) => {
  try {
    const profile = await getProfile(req);
    if (profile.stampsCount < 10) {
      return res.status(400).json({ error: "Not enough stamps collected yet!" });
    }

    profile.stampsCount = 0;
    profile.points += 50;
    profile.level = calculateTier(profile.points);

    await saveProfile(profile);

    await addActivityLog("Redeemed 10 digital stamps for a FREE specialty coffee! (+50 points)");

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to redeem free drink" });
  }
});

// Exchange points
router.post("/exchange-points", async (req, res) => {
  try {
    const { pointsCost, prizeTitle } = req.body;
    const profile = await getProfile(req);
    const cost = Number(pointsCost) || 0;

    if (profile.points < cost) {
      return res.status(400).json({ error: "Insufficient loyalty points!" });
    }

    profile.points -= cost;
    profile.level = calculateTier(profile.points);

    await saveProfile(profile);

    await addActivityLog(`Exchanged ${cost} points for: '${prizeTitle}'`);

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to exchange points" });
  }
});

export default router;
