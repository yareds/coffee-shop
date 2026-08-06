import fs from "fs";
import path from "path";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: "traditional" | "coffee" | "pastry" | "merchandise" | string;
  price: number;
  rating: number;
  ingredients: string[];
  calories: number;
  caffeine: number;
  image: string;
  soldOut: boolean;
  seasonal: boolean;
}

export interface CoffeeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  maxSeats: number;
  category: string;
}

export interface WallPost {
  id: string;
  author: string;
  avatar: string;
  text: string;
  rating: number;
  image?: string;
  date: string;
  likes: number;
  category: string;
}

export interface Promotion {
  id: string;
  name: string;
  discount: number;
  active: boolean;
  desc: string;
  image: string;
}

export interface RafflePrize {
  id: string;
  name: string;
  desc: string;
  active: boolean;
  color: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasSpun: boolean;
  hasCollected: boolean;
  prize: string;
  date: string;
  deviceId: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  deviceId: string;
  items: OrderItem[];
  totalPrice: number;
  status: "Received" | "Brewing" | "Ready" | "Completed";
  createdAt: string;
  isCustomBrew?: boolean;
}

export interface LoyaltyProfile {
  points: number;
  level: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master";
  streak: number;
  beansCount: number;
  stampsCount: number;
  passportStamps: string[];
  unlockedBadges: string[];
  referralCode: string;
  referralsCount: number;
  signedUp: boolean;
  hasSpunWheel: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  rafflePrize: string;
  hasCollectedPrize?: boolean;
  deviceId?: string;
}

export interface ShopStats {
  revenue: number;
  orders: number;
  returningRate: number;
  peakHour: string;
  averageTicket: number;
  activityLog: Array<{ id: string; text: string; time: string }>;
  beanInventory: Array<{ name: string; current: number; max: number; unit: string }>;
}

export interface AppState {
  menuItems: MenuItem[];
  events: CoffeeEvent[];
  wallPosts: WallPost[];
  promotions: Promotion[];
  loyaltyProfile: LoyaltyProfile;
  loyaltyProfiles: Record<string, LoyaltyProfile>;
  rafflePrizes: RafflePrize[];
  registeredUsers: RegisteredUser[];
  orders: Order[];
  shopStats: ShopStats;
}

export const INITIAL_STATE: AppState = {
  menuItems: [
    {
      id: "m1",
      name: "Traditional Jebena Brew (Abol)",
      description: "First and strongest round of traditional Ethiopian coffee, slow-brewed in a clay jebena. Rich, full-bodied, and served with cardamom.",
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
    }
  ],
  events: [
    {
      id: "ev1",
      title: "Traditional Coffee Ceremony & Tasting",
      description: "Experience the complete traditional Ethiopian coffee ceremony. Wash, roast, grind, and brew beans over charcoal with local honey and popcorn.",
      date: "2026-08-10",
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
      date: "2026-08-15",
      time: "18:00 - 19:30",
      price: 2250,
      seats: 5,
      maxSeats: 8,
      category: "class",
    },
    {
      id: "ev3",
      title: "Ethio-Jazz Live Session & Cold Brew Tasting",
      description: "Enjoy live performances of classic Ethio-Jazz while sipping on custom-infused cold brew blends.",
      date: "2026-08-20",
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
      date: "2026-07-28",
      likes: 18,
      category: "story",
    },
    {
      id: "p2",
      author: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      text: "Look at this gorgeous latte art poured in the traditional Sini cup! Tastes incredible, super bright and fruity.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
      date: "2026-07-29",
      likes: 24,
      category: "latte-art",
    },
    {
      id: "p3",
      author: "Marcus Brown",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
      text: "Tried the Yirgacheffe pour-over today. Highly recommended for anyone who loves light roasts. Very floral, tea-like body.",
      rating: 4,
      date: "2026-07-30",
      likes: 11,
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
    referralCode: "BUNA-EXPLORER",
    referralsCount: 2,
    signedUp: false,
    hasSpunWheel: false,
    customerName: "",
    customerEmail: "",
    rafflePrize: "",
  },
  loyaltyProfiles: {},
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
    { id: "u2", name: "Martha Tesfaye", email: "martha@buna.com", phone: "+15550199222", hasSpun: true, hasCollected: true, prize: "Yirgacheffe Pour Over", date: "2026-07-20 10:15 AM", deviceId: "device_2" }
  ],
  orders: [],
  shopStats: {
    revenue: 85000,
    orders: 98,
    returningRate: 68,
    peakHour: "9:00 AM",
    averageTicket: 450.00,
    activityLog: [
      { id: "act1", text: "Abebe booked 'Traditional Coffee Ceremony'", time: "Just now" },
      { id: "act2", text: "Yared earned the 'Yirgacheffe Lover' badge!", time: "5m ago" },
      { id: "act3", text: "Martha stamped her coffee passport for Sidama!", time: "12m ago" }
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

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

let state: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));

export const loadDb = (): AppState => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      state = { ...INITIAL_STATE, ...parsed };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Error loading DB file, fallback to in-memory state:", err);
  }
  return state;
};

export const saveDb = (): void => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing DB file:", err);
  }
};

export const getState = (): AppState => state;

export const getProfile = (req: any): LoyaltyProfile => {
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

// Initialize DB on module load
loadDb();
