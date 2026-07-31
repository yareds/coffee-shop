import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Gemini AI SDK if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("Using local intelligence fallback (GEMINI_API_KEY not set yet).");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database / Local State
let state = {
  menuItems: [
    {
      id: "m1",
      name: "Traditional Jebena Brew (Abol)",
      description: "First and strongest round of traditional Ethiopian coffee, slow-brewed in a clay jebena. Rich, full-bodied, and served with a sprig of cardamom.",
      category: "traditional",
      price: 150.0,
      rating: 4.9,
      ingredients: ["Organic Harrar Beans", "Cardamom", "Water"],
      calories: 5,
      caffeine: 150,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m2",
      name: "Yirgacheffe Pour Over",
      description: "Light-roasted single origin with signature jasmine floral aromas, bright citrus acidity, and a clean peach-like finish.",
      category: "coffee",
      price: 180.0,
      rating: 4.8,
      ingredients: ["Washed Yirgacheffe Beans", "Water"],
      calories: 2,
      caffeine: 120,
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m3",
      name: "Spiced Cardamom Macchiato",
      description: "Espresso sweetened with traditional cardamom-infused house syrup and topped with velvety microfoam.",
      category: "coffee",
      price: 160.0,
      rating: 4.7,
      ingredients: ["Espresso", "Milk", "Cardamom Syrup"],
      calories: 120,
      caffeine: 90,
      image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m4",
      name: "Sambusa Duo",
      description: "Two crispy pastry pockets stuffed with seasoned brown lentils, onions, and jalapeños. Perfect coffee pairing.",
      category: "pastry",
      price: 120.0,
      rating: 4.6,
      ingredients: ["Flour pastry", "Lentils", "Green chili", "Spices"],
      calories: 210,
      caffeine: 0,
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m5",
      name: "Authentic Clay Jebena Pot",
      description: "Handcrafted traditional black clay coffee pot imported from Addis Ababa artisans. Holds 4 cups.",
      category: "merchandise",
      price: 1200.0,
      rating: 4.9,
      ingredients: ["Clay", "Traditional kiln fired"],
      calories: 0,
      caffeine: 0,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m6",
      name: "Sidama Natural Hand-Brew",
      description: "Natural-process single origin showcasing dense blueberry juice notes, dark honey sweetness, and velvety mouthfeel.",
      category: "coffee",
      price: 190.0,
      rating: 4.9,
      ingredients: ["Sidama Natural Beans", "Water"],
      calories: 2,
      caffeine: 130,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    },
    {
      id: "m7",
      name: "Traditional Ceremonial Sini Set",
      description: "Set of six beautiful hand-painted ceramic cups traditionally used in the Ethiopian coffee ceremony.",
      category: "merchandise",
      price: 900.0,
      rating: 4.8,
      ingredients: ["Ceramic", "Hand-painted gold gilding"],
      calories: 0,
      caffeine: 0,
      image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=60",
      soldOut: false,
      seasonal: false,
    }
  ],
  events: [
    {
      id: "ev1",
      title: "Traditional Coffee Ceremony & Tasting",
      description: "Experience the complete traditional Ethiopian coffee ceremony. Wash, roast, grind, and brew beans over charcoal with local honey and popcorn.",
      date: "2026-07-25",
      time: "15:00 - 17:00",
      price: 1500,
      seats: 8,
      maxSeats: 12,
      category: "tasting",
    },
    {
      id: "ev2",
      title: "Latte Art & Jebena Masterclass",
      description: "Learn how to pour professional latte art and adapt traditional clay jebena brewing techniques for contemporary home use.",
      date: "2026-07-29",
      time: "18:00 - 19:30",
      price: 2250,
      seats: 5,
      maxSeats: 8,
      category: "class",
    },
    {
      id: "ev3",
      title: "Ethio-Jazz Live Session & Cold Brew Tasting",
      description: "Enjoy live performances of classic 1970s Ethio-Jazz while sipping on custom-infused cold brew blends.",
      date: "2026-08-02",
      time: "19:00 - 22:00",
      price: 750,
      seats: 25,
      maxSeats: 40,
      category: "music",
    }
  ],
  wallPosts: [
    {
      id: "p1",
      author: "Yared A.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
      text: "The traditional Jebena Brew here feels exactly like Sunday morning in Addis Ababa. Absolutely amazing roast, and love the authentic popcorn accompaniment!",
      rating: 5,
      date: "2026-07-19",
      likes: 12,
      category: "story",
    },
    {
      id: "p2",
      author: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      text: "Look at this gorgeous latte art poured in the traditional Sini cup! Tastes incredible, super bright and fruity.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
      date: "2026-07-18",
      likes: 24,
      category: "latte-art",
    },
    {
      id: "p3",
      author: "Marcus Brown",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
      text: "Tried the Yirgacheffe pour-over today. Highly recommended for anyone who loves light roasts. Very floral, tea-like body.",
      rating: 4,
      date: "2026-07-17",
      likes: 8,
      category: "review",
    }
  ],
  promotions: [
    { id: "pr1", name: "Rainy Day Bundle", discount: 15, active: true, desc: "15% off any traditional Jebena brew + Sambusa duo on rainy mornings!", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80" },
    { id: "pr2", name: "Commuter Rush Hour", discount: 10, active: false, desc: "10% off between 7:00 AM - 9:00 AM weekdays.", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60" },
    { id: "pr3", name: "Ethio-Jazz Weekend Especial", discount: 20, active: true, desc: "20% off whole beans during live music sessions.", image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=60" }
  ],
  loyaltyProfile: {
    points: 240,
    level: "Gold",
    streak: 4,
    beansCount: 3,
    stampsCount: 4,
    passportStamps: ["Sidama", "Yirgacheffe"],
    unlockedBadges: ["Sidama Explorer", "Yirgacheffe Lover"],
    referralCode: "BUNA-YARED9",
    referralsCount: 2,
    signedUp: false,
    hasSpunWheel: false,
    customerName: "",
    customerEmail: "",
    rafflePrize: "",
  },
  loyaltyProfiles: {} as Record<string, any>,
  rafflePrizes: [
    { id: "rp1", name: "Traditional Jebena Brew (Abol)", desc: "Rich and spiced ceremonial pour", active: true, color: "bg-[#c89d7c] text-black" },
    { id: "rp2", name: "Yirgacheffe Pour Over", desc: "Floral, bright jasmine & citrus cup", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
    { id: "rp3", name: "Spiced Cardamom Macchiato", desc: "Creamy espresso with house-infused cardamom", active: true, color: "bg-[#c89d7c] text-black" },
    { id: "rp4", name: "Sidama Natural Hand-Brew", desc: "Blueberry jam acidity and heavy body", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
    { id: "rp5", name: "Guji Honey Cold Brew", desc: "Sweet, refreshing forest canopy beans", active: true, color: "bg-[#c89d7c] text-black" },
    { id: "rp6", name: "Harrar Double Espresso", desc: "Deep chocolate and wild berry undertones", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" }
  ],
  registeredUsers: [
    { id: "u1", name: "Abebe Kebede", email: "abebe@buna.com", phone: "+15550199111", hasSpun: true, hasCollected: true, prize: "Traditional Jebena Brew (Abol)", date: "2026-07-20 09:30 AM", deviceId: "device_1" },
    { id: "u2", name: "Martha Tesfaye", email: "martha@buna.com", phone: "+15550199222", hasSpun: true, hasCollected: true, prize: "Yirgacheffe Pour Over", date: "2026-07-20 10:15 AM", deviceId: "device_2" },
    { id: "u3", name: "Dawit Wolde", email: "dawit@buna.com", phone: "+15550199333", hasSpun: false, hasCollected: false, prize: "", date: "2026-07-20 11:05 AM", deviceId: "device_3" }
  ],
  shopStats: {
    revenue: 85000,
    orders: 98,
    returningRate: 68,
    peakHour: "9:00 AM",
    averageTicket: 450.00,
    activityLog: [
      { id: "act1", text: "Abebe just booked 'Traditional Coffee Ceremony'", time: "Just now" },
      { id: "act2", text: "Yared earned the 'Yirgacheffe Lover' badge!", time: "5m ago" },
      { id: "act3", text: "Emma stamped her coffee passport for Sidama!", time: "12m ago" },
      { id: "act4", text: "Michael just opened a Lucky Bean: Free Cookie!", time: "25m ago" }
    ],
    beanInventory: [
      { name: "Yirgacheffe (Washed)", current: 8.5, max: 15, unit: "kg" },
      { name: "Sidama (Natural)", current: 12.0, max: 20, unit: "kg" },
      { name: "Guji (Honey)", current: 3.2, max: 15, unit: "kg" },
      { name: "Harrar (Dry-Processed)", current: 11.5, max: 15, unit: "kg" },
      { name: "Organic Whole Milk", current: 18.0, max: 40, unit: "L" },
      { name: "Oat Milk", current: 24.0, max: 30, unit: "L" }
    ]
  }
};

// Ethiopia coffee regional data
const ethiopianRegions = [
  {
    id: "r1",
    name: "Yirgacheffe",
    elevation: "1,900m - 2,200m",
    process: "Washed / Natural",
    notes: ["Jasmine", "Citrus", "Bergamot", "Lemon Tea", "Peach"],
    farmer: "Abebech & family, Yirgacheffe Specialty Highlands",
    history: "Nestled in the Gedeo zone, Yirgacheffe is globally renowned for producing pristine, floral, and tea-like coffees. It is considered the birthplace of washed coffee processes in Ethiopia.",
    drinks: ["Yirgacheffe Pour Over", "Iced Citrus Brew"],
    badgeName: "Yirgacheffe Lover",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r2",
    name: "Sidama",
    elevation: "1,500m - 2,200m",
    process: "Natural / Washed",
    notes: ["Blueberry", "Citrus", "Floral", "Red Honey"],
    farmer: "Demeke Alamu, Sidama Highland Co-operative",
    history: "Sidama coffees are grown in expansive highland valleys. They are celebrated for their fruit-forward profile, deep sweetness, crisp citric acidity, and rich texture.",
    drinks: ["Sidama Natural Hand-Brew", "Sidama Espresso"],
    badgeName: "Sidama Explorer",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r3",
    name: "Guji",
    elevation: "1,800m - 2,100m",
    process: "Natural / Honey",
    notes: ["Wild Strawberry", "Peach", "Chocolate", "Honey Cream"],
    farmer: "Zenabu Tsegaye, Guji Forest Canopy Growers",
    history: "Guji's unique microclimate and dense forest soil yield remarkably sweet, complex cup profiles. Once grouped under Sidamo, it is now celebrated as a standalone premier origin.",
    drinks: ["Guji Nitro Cold Brew", "Guji AeroPress Cup"],
    badgeName: "Guji Adventurer",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r4",
    name: "Harrar",
    elevation: "1,500m - 2,100m",
    process: "Dry-Processed (Natural)",
    notes: ["Blueberry", "Wine-like Acid", "Dark Chocolate", "Blackberry"],
    farmer: "Tadesse Kebede, Eastern Harrar Hills",
    history: "One of the oldest coffee-growing regions in the world, Harrar yields highly distinctive, wild, winy, and complex dry-processed beans with rich chocolate undertones.",
    drinks: ["Traditional Jebena Brew (Abol)", "Harrar Double Shot"],
    badgeName: "Harrar Expert",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r5",
    name: "Limu",
    elevation: "1,400m - 1,900m",
    process: "Washed",
    notes: ["Black Tea", "Orange Peel", "Sweet Caramel", "Jasmine"],
    farmer: "Mulatu Chala, Limu Organic Growers Association",
    history: "Limu coffees are grown in southwest highlands. They are well-balanced with a round body, delicate floral notes, and clean citrus notes.",
    drinks: ["Limu Pour Over", "Limu French Press"],
    badgeName: "Limu Enthusiast",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r6",
    name: "Jimma",
    elevation: "1,400m - 2,000m",
    process: "Natural / Washed",
    notes: ["Caramel Cream", "Toasted Almond", "Milk Chocolate", "Low Acid"],
    farmer: "Fikru Hailu, Kossa Geshe Estates",
    history: "Historically famous for bulk natural coffees, Jimma now boasts incredible specialty farms producing rich, chocolatey, low-acid beans ideal for rich espressos.",
    drinks: ["Jimma Macchiato", "Traditional Jebena Brew (Tona)"],
    badgeName: "Jimma Pioneer",
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=60"
  }
];

// Helper to save state (optional, just inside state variable is fine for runtime, but writing is neat)
const statePath = path.join(process.cwd(), "data-store.json");
const loadState = () => {
  try {
    if (fs.existsSync(statePath)) {
      const loaded = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      state = { ...state, ...loaded };
      if (!state.registeredUsers) {
        state.registeredUsers = [
          { id: "u1", name: "Abebe Kebede", email: "abebe@buna.com", phone: "+15550199111", hasSpun: true, hasCollected: true, prize: "Traditional Jebena Brew (Abol)", date: "2026-07-20 09:30 AM", deviceId: "device_1" },
          { id: "u2", name: "Martha Tesfaye", email: "martha@buna.com", phone: "+15550199222", hasSpun: true, hasCollected: true, prize: "Yirgacheffe Pour Over", date: "2026-07-20 10:15 AM", deviceId: "device_2" },
          { id: "u3", name: "Dawit Wolde", email: "dawit@buna.com", phone: "+15550199333", hasSpun: false, hasCollected: false, prize: "", date: "2026-07-20 11:05 AM", deviceId: "device_3" }
        ];
      }
    }
  } catch (e) {
    console.error("Could not load stored state, using defaults:", e);
  }
};
const saveState = () => {
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Could not write state to file:", e);
  }
};

loadState();

// Helper to get device or user-specific profile
const getProfile = (req: any) => {
  const deviceId = (req.query.deviceId || req.headers["x-device-id"] || req.body.deviceId || "default-device") as string;
  const rawEmail = (req.headers["x-user-email"] || req.query.userEmail || req.body.userEmail || req.body.email || "") as string;
  const userEmail = rawEmail.trim().toLowerCase();

  const key = userEmail ? `user_${userEmail}` : `dev_${deviceId}`;

  if (!state.loyaltyProfiles) {
    state.loyaltyProfiles = {};
  }

  if (!state.loyaltyProfiles[key]) {
    state.loyaltyProfiles[key] = {
      ...state.loyaltyProfile,
      referralCode: "BUNA-" + (userEmail ? userEmail.slice(0, 4).toUpperCase() : deviceId.slice(-6).toUpperCase()),
      deviceId,
      customerEmail: userEmail || "",
      customerName: userEmail ? userEmail.split("@")[0] : "",
      signedUp: false,
      hasSpunWheel: false,
      rafflePrize: "",
      hasCollectedPrize: false
    };
  }

  // Sync profile with registeredUsers record if exists
  if (userEmail) {
    const regUser = state.registeredUsers.find(u => u.email.toLowerCase() === userEmail);
    if (regUser) {
      state.loyaltyProfiles[key].signedUp = true;
      if (regUser.name) state.loyaltyProfiles[key].customerName = regUser.name;
      if (regUser.email) state.loyaltyProfiles[key].customerEmail = regUser.email;
      if (regUser.phone) state.loyaltyProfiles[key].customerPhone = regUser.phone;
      state.loyaltyProfiles[key].hasSpunWheel = regUser.hasSpun || false;
      state.loyaltyProfiles[key].rafflePrize = regUser.prize || state.loyaltyProfiles[key].rafflePrize || "";
      state.loyaltyProfiles[key].hasCollectedPrize = regUser.hasCollected || false;
    }
  }

  return state.loyaltyProfiles[key];
};

// API Endpoints

// 1. Menu Management
app.get("/api/menu", (req, res) => {
  res.json(state.menuItems);
});

app.post("/api/menu", (req, res) => {
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
  
  // Update inventory slightly on action for realism
  saveState();
  res.json({ success: true, menuItems: state.menuItems });
});

// 2. Events Management
app.get("/api/events", (req, res) => {
  res.json(state.events);
});

app.post("/api/events/book", (req, res) => {
  const { eventId, userEmail } = req.body;
  const eventIndex = state.events.findIndex(e => e.id === eventId);
  if (eventIndex !== -1 && state.events[eventIndex].seats > 0) {
    state.events[eventIndex].seats -= 1;
    
    // Add activity
    state.shopStats.orders += 1;
    state.shopStats.revenue += state.events[eventIndex].price;
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${userEmail || "Someone"} booked '${state.events[eventIndex].title}'`,
      time: "Just now"
    });
    
    saveState();
    res.json({ success: true, events: state.events });
  } else {
    res.status(400).json({ error: "No seats available or event not found" });
  }
});

// 3. Community Coffee Wall
app.get("/api/wall", (req, res) => {
  res.json(state.wallPosts);
});

app.post("/api/wall", (req, res) => {
  const { author, text, rating, image, category } = req.body;
  const newPost = {
    id: "p_" + Date.now(),
    author: author || "Coffee Lover",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    text,
    rating,
    image,
    date: new Date().toISOString().split("T")[0],
    likes: 0,
    category: category || "review"
  };
  
  state.wallPosts.unshift(newPost);
  
  // Earn points for contribution
  state.loyaltyProfile.points += 15;
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `${newPost.author} contributed to the Community Wall! (+15 pts)`,
    time: "Just now"
  });
  
  saveState();
  res.json({ success: true, wallPosts: state.wallPosts, loyalty: state.loyaltyProfile });
});

// 4. Loyalty Profile
app.get("/api/loyalty", (req, res) => {
  res.json(getProfile(req));
});

app.get("/api/loyalty/profile", (req, res) => {
  res.json(getProfile(req));
});

app.post("/api/loyalty/reward-points", (req, res) => {
  const { points, reason } = req.body;
  const profile = getProfile(req);
  profile.points += points;
  
  // Re-calculate levels
  const pts = profile.points;
  let level = profile.level;
  if (pts > 500) level = "Diamond";
  else if (pts > 400) level = "Platinum";
  else if (pts > 300) level = "Gold";
  else if (pts > 150) level = "Silver";
  else level = "Bronze";
  
  profile.level = level as any;
  
  if (reason) {
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${reason} (+${points} pts)`,
      time: "Just now"
    });
  }
  
  saveState();
  res.json({ success: true, loyalty: profile });
});

app.post("/api/loyalty/add-points", (req, res) => {
  const { points, reason } = req.body;
  const profile = getProfile(req);
  profile.points += points;
  
  // Re-calculate levels
  const pts = profile.points;
  let level = profile.level;
  if (pts > 500) level = "Diamond";
  else if (pts > 400) level = "Platinum";
  else if (pts > 300) level = "Gold";
  else if (pts > 150) level = "Silver";
  else level = "Bronze";
  
  profile.level = level as any;
  
  if (reason) {
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `${reason} (+${points} pts)`,
      time: "Just now"
    });
  }
  
  saveState();
  res.json({ success: true, loyalty: profile });
});

// In-memory store for SMS OTP codes
const otpStore: Record<string, { code: string; expires: number; name: string; email: string; deviceId: string }> = {};

// Send SMS OTP code
app.post("/api/loyalty/send-otp", (req, res) => {
  const { name, email, phone, deviceId } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Name, email, and mobile phone number are required." });
  }

  // Account level check
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = state.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser && existingUser.hasSpun) {
    return res.status(400).json({ 
      error: "⚠️ Spin Already Used: This account has already used its first-time welcome raffle spin." 
    });
  }

  // Phone uniqueness check for active accounts
  const phoneAlreadyRegistered = state.registeredUsers.some(u => u.phone === phone && u.email.toLowerCase() !== cleanEmail);
  if (phoneAlreadyRegistered) {
    return res.status(400).json({ 
      error: "⚠️ Phone Number In Use: This mobile number is linked to another registered account." 
    });
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Save to OTP memory store
  otpStore[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5 min expiry
    name,
    email,
    deviceId: deviceId || "default-device"
  };

  console.log(`[SMS OTP Simulator] Code for ${phone}: ${code}`);

  res.json({ 
    success: true, 
    message: `A simulated carrier-based SMS OTP passcode has been dispatched to ${phone}.`,
    demoCode: code 
  });
});

// Verify OTP & Signup
app.post("/api/loyalty/verify-otp-signup", (req, res) => {
  const { name, email, phone, code, deviceId } = req.body;
  if (!name || !email || !phone || !code) {
    return res.status(400).json({ error: "All fields including the verification code are required." });
  }

  // Verify OTP
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

  const profile = getProfile(req);
  profile.signedUp = true;
  profile.customerName = name;
  profile.customerEmail = email;
  profile.customerPhone = phone;

  // Find or create registered user
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

  delete otpStore[phone]; // cleanup
  saveState();
  res.json({ success: true, loyalty: profile });
});

// Raffle Wheel Signup
app.post("/api/loyalty/signup", (req, res) => {
  const { name, email, deviceId } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

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

  saveState();
  res.json({ success: true, loyalty: profile });
});

// Raffle Wheel Spin
app.post("/api/loyalty/spin-raffle", (req, res) => {
  const { prize, deviceId } = req.body;
  if (!prize) {
    return res.status(400).json({ error: "Prize is required" });
  }

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

  saveState();
  res.json({ success: true, loyalty: profile });
});

// Raffle Wheel Collect Prize
app.post("/api/loyalty/collect-raffle", (req, res) => {
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

  saveState();
  res.json({ success: true, loyalty: profile });
});

// GET Raffle Prizes
app.get("/api/raffle/prizes", (req, res) => {
  if (!state.rafflePrizes) {
    state.rafflePrizes = [
      { id: "p1", name: "Traditional Jebena Brew (Abol)", desc: "Rich and spiced ceremonial pour", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "p2", name: "Yirgacheffe Pour Over", desc: "Floral, bright jasmine & citrus cup", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
      { id: "p3", name: "Spiced Cardamom Macchiato", desc: "Creamy espresso with house-infused cardamom", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "p4", name: "Sidama Natural Hand-Brew", desc: "Blueberry jam acidity and heavy body", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
      { id: "p5", name: "Guji Honey Cold Brew", desc: "Sweet, refreshing forest canopy beans", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "p6", name: "Harrar Double Espresso", desc: "Deep chocolate and wild berry undertones", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" }
    ];
  }
  res.json(state.rafflePrizes);
});

// Admin change/update raffle prizes
app.post("/api/owner/raffle", (req, res) => {
  const { action, prize, prizeId } = req.body;
  if (!state.rafflePrizes) {
    state.rafflePrizes = [
      { id: "rp1", name: "Traditional Jebena Brew (Abol)", desc: "Rich and spiced ceremonial pour", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "rp2", name: "Yirgacheffe Pour Over", desc: "Floral, bright jasmine & citrus cup", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
      { id: "rp3", name: "Spiced Cardamom Macchiato", desc: "Creamy espresso with house-infused cardamom", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "rp4", name: "Sidama Natural Hand-Brew", desc: "Blueberry jam acidity and heavy body", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" },
      { id: "rp5", name: "Guji Honey Cold Brew", desc: "Sweet, refreshing forest canopy beans", active: true, color: "bg-[#c89d7c] text-black" },
      { id: "rp6", name: "Harrar Double Espresso", desc: "Deep chocolate and wild berry undertones", active: true, color: "bg-[#2c221e] text-white border border-[#c89d7c]/30" }
    ];
  }

  // Ensure all existing prizes have ids and active flags
  state.rafflePrizes = state.rafflePrizes.map((p, index) => ({
    id: p.id || `rp_${index + 1}`,
    name: p.name,
    desc: p.desc,
    active: p.active !== undefined ? p.active : true,
    color: p.color || (index % 2 === 0 ? "bg-[#c89d7c] text-black" : "bg-[#2c221e] text-white border border-[#c89d7c]/30")
  }));

  if (action === "add") {
    state.rafflePrizes.push({
      id: "rp_" + Date.now(),
      name: prize.name,
      desc: prize.desc,
      active: true,
      color: prize.color || (state.rafflePrizes.length % 2 === 0 ? "bg-[#c89d7c] text-black" : "bg-[#2c221e] text-white border border-[#c89d7c]/30")
    });
  } else if (action === "edit") {
    state.rafflePrizes = state.rafflePrizes.map(p =>
      p.id === prizeId ? { ...p, name: prize.name, desc: prize.desc, color: prize.color || p.color } : p
    );
  } else if (action === "toggle") {
    state.rafflePrizes = state.rafflePrizes.map(p =>
      p.id === prizeId ? { ...p, active: !p.active } : p
    );
  } else if (action === "delete") {
    state.rafflePrizes = state.rafflePrizes.filter(p => p.id !== prizeId);
  }

  saveState();
  res.json({ success: true, prizes: state.rafflePrizes, rafflePrizes: state.rafflePrizes });
});

// Admin list registered raffle users
app.get("/api/owner/users", (req, res) => {
  res.json({ success: true, registeredUsers: state.registeredUsers || [] });
});

// Admin reset or delete raffle user
app.post("/api/owner/users/action", (req, res) => {
  const { action, userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = state.registeredUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Registered user not found" });
  }

  if (action === "reset-spin") {
    user.hasSpun = false;
    user.hasCollected = false;
    user.prize = "";
    
    // Clear in device-specific profile
    const devId = user.deviceId;
    if (devId && state.loyaltyProfiles && state.loyaltyProfiles[devId]) {
      state.loyaltyProfiles[devId].hasSpunWheel = false;
      state.loyaltyProfiles[devId].rafflePrize = "";
      state.loyaltyProfiles[devId].hasCollectedPrize = false;
    }
  } else if (action === "delete") {
    state.registeredUsers = state.registeredUsers.filter(u => u.id !== userId);
    
    // Clear in device-specific profile
    const devId = user.deviceId;
    if (devId && state.loyaltyProfiles && state.loyaltyProfiles[devId]) {
      state.loyaltyProfiles[devId].signedUp = false;
      state.loyaltyProfiles[devId].hasSpunWheel = false;
      state.loyaltyProfiles[devId].hasCollectedPrize = false;
      state.loyaltyProfiles[devId].customerName = "";
      state.loyaltyProfiles[devId].customerEmail = "";
      state.loyaltyProfiles[devId].rafflePrize = "";
    }
  }

  saveState();
  res.json({
    success: true,
    registeredUsers: state.registeredUsers,
    loyalty: getProfile(req)
  });
});

// Lucky Bean Game Roll
app.post("/api/loyalty/lucky-bean", (req, res) => {
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
    profile.unlockedBadges.push("Rare Golden Bean");
    profile.points += 100;
  }
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `Lucky Bean cracked open: ${rolled.title}!`,
    time: "Just now"
  });
  
  saveState();
  res.json({ success: true, prize: rolled, loyalty: profile });
});

// Redeem full stamp card
app.post("/api/loyalty/redeem-free-drink", (req, res) => {
  const profile = getProfile(req);
  if (profile.stampsCount < 10) {
    return res.status(400).json({ error: "Not enough stamps collected yet!" });
  }
  
  profile.stampsCount = 0; // reset
  profile.points += 50; // extra points for completing a card
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: "Redeemed 10 digital stamps for a FREE specialty coffee! (+50 points)",
    time: "Just now"
  });
  
  saveState();
  res.json({ success: true, loyalty: profile });
});

// Exchange points for rewards
app.post("/api/loyalty/exchange-points", (req, res) => {
  const { pointsCost, prizeTitle } = req.body;
  const profile = getProfile(req);
  if (profile.points < pointsCost) {
    return res.status(400).json({ error: "Insufficient loyalty points!" });
  }
  
  profile.points -= pointsCost;
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `Exchanged ${pointsCost} points for: '${prizeTitle}'`,
    time: "Just now"
  });
  
  saveState();
  res.json({ success: true, loyalty: profile });
});

// Coffee Passport regional stamp
app.get("/api/ethiopia/regions", (req, res) => {
  res.json(ethiopianRegions);
});

app.post("/api/passport/stamp", (req, res) => {
  const { regionName } = req.body;
  const region = ethiopianRegions.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  
  if (!region) {
    return res.status(404).json({ error: "Region not found" });
  }
  
  const profile = getProfile(req);
  if (!profile.passportStamps.includes(region.name)) {
    profile.passportStamps.push(region.name);
    profile.points += 50; // generous stamp reward
    
    if (!profile.unlockedBadges.includes(region.badgeName)) {
      profile.unlockedBadges.push(region.badgeName);
    }
    
    // Check if Complete Ethiopia Collection is unlocked
    if (profile.passportStamps.length === ethiopianRegions.length && 
        !profile.unlockedBadges.includes("Ethiopian Coffee Master")) {
      profile.unlockedBadges.push("Ethiopian Coffee Master");
      profile.points += 200; // ultimate reward!
    }
    
    state.shopStats.activityLog.unshift({
      id: "act_" + Date.now(),
      text: `Stamped coffee passport for ${region.name}! (+50 pts)`,
      time: "Just now"
    });
    
    saveState();
  }
  
  res.json({ success: true, loyalty: profile });
});

// 5. Owner Dashboard Statistics
app.get("/api/owner/stats", (req, res) => {
  res.json({
    shopStats: state.shopStats,
    promotions: state.promotions,
    loyalty: getProfile(req)
  });
});

app.post("/api/owner/promotions", (req, res) => {
  const { action, promoId, name, discount, desc, image } = req.body;
  if (action === "toggle") {
    state.promotions = state.promotions.map(p =>
      p.id === promoId ? { ...p, active: !p.active } : p
    );
  } else if (action === "add") {
    state.promotions.push({
      id: "pr_" + Date.now(),
      name,
      discount,
      active: true,
      desc,
      image: image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
    });
  } else if (action === "edit") {
    state.promotions = state.promotions.map(p =>
      p.id === promoId ? { ...p, name, discount, desc, image } : p
    );
  } else if (action === "delete") {
    state.promotions = state.promotions.filter(p => p.id !== promoId);
  }
  
  saveState();
  res.json({ success: true, promotions: state.promotions });
});

// Custom Coffee Simulator purchase endpoint
app.post("/api/order/custom", (req, res) => {
  const { region, roast, method, sugar, milk, spices, size, price, calories, caffeine } = req.body;
  const profile = getProfile(req);

  // Record sale
  state.shopStats.revenue += price;
  state.shopStats.orders += 1;
  profile.points += 25; // 25 points for custom order
  profile.beansCount += 1; // earns a bean
  
  if (profile.stampsCount < 10) {
    profile.stampsCount += 1;
  }
  
  // If region is a specialty Ethiopian region, stamp passport automatically!
  const ethiopianNames = ethiopianRegions.map(r => r.name);
  let stamped = false;
  if (region && ethiopianNames.includes(region) && !profile.passportStamps.includes(region)) {
    profile.passportStamps.push(region);
    const regionObj = ethiopianRegions.find(r => r.name === region);
    if (regionObj && !profile.unlockedBadges.includes(regionObj.badgeName)) {
      profile.unlockedBadges.push(regionObj.badgeName);
    }
    stamped = true;
  }
  
  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `New order: Custom Hand-Brewed ${region || "Buna"} (${size}). (+1 Virtual Bean)`,
    time: "Just now"
  });
  
  saveState();
  res.json({ 
    success: true, 
    loyalty: profile,
    stamped,
    message: stamped ? `Successfully brewed! Passport stamped for ${region}!` : "Enjoy your custom hand-brew!"
  });
});

// 6. Gemini-powered API Routes

// Route A: AI Coffee Personality Quiz
app.post("/api/gemini/quiz", async (req, res) => {
  const { answers } = req.body; // Array of selected answers or object
  
  const prompt = `Analyze these coffee lifestyle survey answers and classify the user into a specific Ethiopian Coffee Personality:
  Survey answers:
  ${JSON.stringify(answers, null, 2)}
  
  Return a structured JSON representing their personality. Choose one of these major archetypes or invent a highly descriptive coffee title:
  - Floral Explorer (loves bright Yirgacheffe, tea-like brews)
  - Bold Traditionalist (loves rich Harrar, robust jebena brews, bold body)
  - Forest Adventurer (loves rare Guji natural honey-processed, stone fruits)
  - Sweet Cardamom Dreamer (loves spiced coffees, sweet lattes, pastries)
  - Night Owl / Espresso Enthusiast (dense chocolate Sidama, strong double-shots)
  
  The response must strictly follow this JSON schema structure, returning exactly this object:
  {
    "personality": "string - title of the coffee personality",
    "description": "string - 2-3 inspiring sentences explaining their coffee identity",
    "recommendedDrinks": ["array of 2 drink names from the menu or matching traditional styles"],
    "recommendedPastries": ["array of 2 pastries or pairing items"],
    "recommendedSpecials": ["array of 2 premium seasonal suggestions"],
    "funFact": "string - a short, charming fun fact about Ethiopian coffee culture matching their style"
  }`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personality: { type: Type.STRING },
              description: { type: Type.STRING },
              recommendedDrinks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedPastries: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedSpecials: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              funFact: { type: Type.STRING }
            },
            required: ["personality", "description", "recommendedDrinks", "recommendedPastries", "recommendedSpecials", "funFact"]
          }
        }
      });
      
      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (error) {
      console.error("Gemini quiz generation error:", error);
    }
  }

  // Fallback if API key not present or error
  // Determine personality deterministically from mock responses
  let personality = "Floral Explorer";
  let description = "You enjoy the fine, delicate, and aromatic complexities of coffee. Bright tea-like floral bodies keep your mind active and clear.";
  let recommendedDrinks = ["Yirgacheffe Pour Over", "Iced Citrus Brew"];
  let recommendedPastries = ["Sambusa Duo", "Baklava Slice"];
  let recommendedSpecials = ["Lavender Cardamom Drizzle"];
  let funFact = "In Ethiopia, coffee is traditionally served with popped corn. Popcorn’s toasted aroma matches the delicate floral notes of highland coffee beans.";

  const isSweet = answers && JSON.stringify(answers).toLowerCase().includes("sweet");
  const isBold = answers && (JSON.stringify(answers).toLowerCase().includes("strong") || JSON.stringify(answers).toLowerCase().includes("bold") || JSON.stringify(answers).toLowerCase().includes("espresso"));
  
  if (isSweet) {
    personality = "Sweet Cardamom Dreamer";
    description = "You love rich, sweet undertones with comforting spices. A hot cup representing the cozy cardamom scents of Ethiopian spice markets is your happy place.";
    recommendedDrinks = ["Spiced Cardamom Macchiato", "Vanilla Bean Foam Latte"];
    recommendedPastries = ["Cardamom Honey Scone", "Sweet Sambusa"];
    recommendedSpecials = ["Traditional Spiced Macchiato"];
    funFact = "Spices like cardamom, clove, and cinnamon are often roasted alongside coffee beans in Ethiopian households to create specialized festive beverages.";
  } else if (isBold) {
    personality = "Bold Traditionalist";
    description = "You respect time-tested traditions and powerful, full-bodied flavors. Dark chocolate, earthy spices, and robust slow Jebena extractions align with your focused focus.";
    recommendedDrinks = ["Traditional Jebena Brew (Abol)", "Harrar Espresso Shot"];
    recommendedPastries = ["Sambusa Duo", "Spiced Nut Bread"];
    recommendedSpecials = ["Traditional Spiced Jebena Brew"];
    funFact = "An Ethiopian coffee ceremony features three distinct rounds: Abol (strength), Tona (community), and Baraka (blessing).";
  }

  res.json({
    personality,
    description,
    recommendedDrinks,
    recommendedPastries,
    recommendedSpecials,
    funFact,
    isFallback: true
  });
});

// Route B: Mood-based Coffee Recommendations
app.post("/api/gemini/mood", async (req, res) => {
  const { mood } = req.body;
  
  const prompt = `The user is currently feeling: "${mood}".
  Recommend a coffee drink and explain how this fits their exact mental and emotional state.
  Reference traditional Ethiopian coffee or standard cafe beverages.
  
  Return a structured JSON with this schema:
  {
    "drink": "string - recommended drink name",
    "explanation": "string - a warm, empathetic 2-sentence explanation of why it suits their mood"
  }`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              drink: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["drink", "explanation"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (e) {
      console.error("Gemini mood recommendation error:", e);
    }
  }

  // Fallback
  let drink = "Traditional Jebena Brew (Abol)";
  let explanation = "Slow down and ground yourself. The slow, aromatic roasting of a traditional Jebena brew matches your focused mind and provides a robust, clarifying energy boost.";
  
  if (mood === "sleepy") {
    drink = "Harrar Double Shot Espresso";
    explanation = "Wake up your senses! The vibrant wine-like acidity and heavy chocolate body of natural Harrar coffee delivers a robust spark to clear your mental fog.";
  } else if (mood === "stressed") {
    drink = "Spiced Cardamom Macchiato";
    explanation = "Cardamom has ancient comforting properties. Combined with steamed, velvety warm milk, it forms a calming blanket to soothe your active nerves.";
  } else if (mood === "focused" || mood === "working") {
    drink = "Yirgacheffe Pour Over";
    explanation = "A pristine, clean cup with crisp citrus notes that encourages concentration. Highly aromatic without being heavy, keeping you light and sharp.";
  } else if (mood === "celebrating" || mood === "happy") {
    drink = "Guji Nitro Cold Brew";
    explanation = "Bubbling, creamy, and loaded with natural berry juice sweetness. It's an adventurous and refreshing beverage to double your joyous celebration!";
  }

  res.json({ drink, explanation, isFallback: true });
});

// Route C: Taste-based Ethiopian Origin Recommender
app.post("/api/gemini/recommend", async (req, res) => {
  const { adventurous, fruity, chocolate, floral, wineAcid, strongBody } = req.body;
  
  const prompt = `Help this customer find their perfect Ethiopian single origin coffee region.
  Customer preferences:
  - Adventurous Level: ${adventurous}/5
  - Loves Fruity flavors: ${fruity}/5
  - Loves Chocolate notes: ${chocolate}/5
  - Loves Floral aromas: ${floral}/5
  - Loves Wine-like acidity: ${wineAcid}/5
  - Prefers Strong body: ${strongBody}/5
  
  Match them with one of the premium regions (Yirgacheffe, Sidama, Guji, Harrar, Limu, or Jimma).
  Return a structured JSON with this schema:
  {
    "region": "string - Name of recommended region",
    "percentageMatch": "number - e.g. 96",
    "reason": "string - 2 sentences detailing how their preferences match this specific region's terroir and profile",
    "brewingMethod": "string - e.g. V60 Pour Over",
    "farmerHighlight": "string - A charming imaginary or representative local farmer story",
    "flavorNotes": ["array of 3 flavor terms"]
  }`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              region: { type: Type.STRING },
              percentageMatch: { type: Type.INTEGER },
              reason: { type: Type.STRING },
              brewingMethod: { type: Type.STRING },
              farmerHighlight: { type: Type.STRING },
              flavorNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["region", "percentageMatch", "reason", "brewingMethod", "farmerHighlight", "flavorNotes"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (e) {
      console.error("Gemini region recommender error:", e);
    }
  }

  // Fallback
  let region = "Yirgacheffe";
  let percentageMatch = 95;
  let reason = "You'll absolutely love Yirgacheffe because you enjoy light, bright floral coffees with delicate peach sweetness and crisp citrus notes.";
  let brewingMethod = "Hario V60 Pour Over";
  let farmerHighlight = "Grown by Abebech and her sisters on a 2-hectare organic garden plot shaded by false banana trees.";
  let flavorNotes = ["Jasmine", "Meyer Lemon", "White Peach"];

  if (chocolate > 3 || strongBody > 3) {
    region = "Harrar";
    percentageMatch = 92;
    reason = "Harrar is perfect for you because of its wild chocolate depth, bold dry-processed body, and rustic berry finish that fills the cup with heavy aroma.";
    brewingMethod = "French Press or Traditional Jebena";
    farmerHighlight = "Carefully sun-dried on raised African beds by local smallholders under the searing eastern sun.";
    flavorNotes = ["Blueberry Jam", "Dark Cacao", "Black Cardamom"];
  } else if (fruity > 3 && adventurous > 3) {
    region = "Guji";
    percentageMatch = 97;
    reason = "Guji natural coffees match your adventurous soul. They showcase explosive strawberry syrup, dense nectarine flavors, and beautiful wild honey notes.";
    brewingMethod = "AeroPress or Chemex";
    farmerHighlight = "Harvested from wild-growing trees inside protected ancient forest canopies by native Guji clans.";
    flavorNotes = ["Wild Strawberry", "Honey Nectar", "Red Wine"];
  } else if (fruity > 3) {
    region = "Sidama";
    percentageMatch = 94;
    reason = "Sidama's complex blueberry profiles and balanced honeyed sweetness offer an exceptionally juicy cup that honors your fruit-forward palate.";
    brewingMethod = "Syphon or Pour Over";
    farmerHighlight = "Co-operatively processed by Demeke Alamu's collective, uniting 120 small-plot family estates.";
    flavorNotes = ["Blueberry", "Nectarine", "Honey Cream"];
  }

  res.json({ region, percentageMatch, reason, brewingMethod, farmerHighlight, flavorNotes, isFallback: true });
});


// 7. Vite Integration & Static Assets
const initServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

initServer();
