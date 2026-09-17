import fs from "fs";
import path from "path";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

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
  createdAt?: string;
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

// Detect project configuration
let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
if (!projectId) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.projectId) {
        projectId = config.projectId;
      }
    }
  } catch (e) {
    // ignore
  }
}

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    projectId: projectId || "buna-ethiopia",
  });
} else {
  adminApp = getApps()[0];
}

export const adminDb: Firestore = getFirestore(adminApp);

// Collection References
export const COLLECTIONS = {
  menuItems: adminDb.collection("menuItems"),
  events: adminDb.collection("events"),
  promotions: adminDb.collection("promotions"),
  rafflePrizes: adminDb.collection("rafflePrizes"),
  registeredUsers: adminDb.collection("registeredUsers"),
  orders: adminDb.collection("orders"),
  loyaltyProfiles: adminDb.collection("loyaltyProfiles"),
  shopStats: adminDb.collection("shopStats"),
  communityPosts: adminDb.collection("community_posts"),
};

// In-memory shadow state to guarantee 100% smooth fallback for local dev / unauthenticated container sandbox
let memoryState: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));
let firestoreConnected = false;
let hasWarnedAuth = false;

function logFirestoreFallback(op: string, err: any) {
  if (!hasWarnedAuth) {
    console.warn(`[Firestore Admin] Fallback active for "${op}": ${err?.message || err}. (In Cloud Run or with ADC credentials, Firestore connects directly).`);
    hasWarnedAuth = true;
  }
}

// Idempotent seeding on server startup
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Menu Items
    const menuSnap = await COLLECTIONS.menuItems.limit(1).get();
    if (menuSnap.empty) {
      console.log("[Firestore Admin] Seeding menuItems collection...");
      const batch = adminDb.batch();
      for (const item of INITIAL_STATE.menuItems) {
        batch.set(COLLECTIONS.menuItems.doc(item.id), item);
      }
      await batch.commit();
    }

    // 2. Events
    const eventsSnap = await COLLECTIONS.events.limit(1).get();
    if (eventsSnap.empty) {
      console.log("[Firestore Admin] Seeding events collection...");
      const batch = adminDb.batch();
      for (const event of INITIAL_STATE.events) {
        batch.set(COLLECTIONS.events.doc(event.id), event);
      }
      await batch.commit();
    }

    // 3. Promotions
    const promoSnap = await COLLECTIONS.promotions.limit(1).get();
    if (promoSnap.empty) {
      console.log("[Firestore Admin] Seeding promotions collection...");
      const batch = adminDb.batch();
      for (const promo of INITIAL_STATE.promotions) {
        batch.set(COLLECTIONS.promotions.doc(promo.id), promo);
      }
      await batch.commit();
    }

    // 4. Raffle Prizes
    const raffleSnap = await COLLECTIONS.rafflePrizes.limit(1).get();
    if (raffleSnap.empty) {
      console.log("[Firestore Admin] Seeding rafflePrizes collection...");
      const batch = adminDb.batch();
      for (const prize of INITIAL_STATE.rafflePrizes) {
        batch.set(COLLECTIONS.rafflePrizes.doc(prize.id), prize);
      }
      await batch.commit();
    }

    // 5. Registered Users
    const usersSnap = await COLLECTIONS.registeredUsers.limit(1).get();
    if (usersSnap.empty) {
      console.log("[Firestore Admin] Seeding registeredUsers collection...");
      const batch = adminDb.batch();
      for (const user of INITIAL_STATE.registeredUsers) {
        batch.set(COLLECTIONS.registeredUsers.doc(user.id), user);
      }
      await batch.commit();
    }

    // 6. Shop Stats (Single document 'current')
    const statsDoc = await COLLECTIONS.shopStats.doc("current").get();
    if (!statsDoc.exists) {
      console.log("[Firestore Admin] Seeding shopStats document ('current')...");
      await COLLECTIONS.shopStats.doc("current").set(INITIAL_STATE.shopStats);
    }

    // 7. Community Posts (Unified community wall)
    const postsSnap = await COLLECTIONS.communityPosts.limit(1).get();
    if (postsSnap.empty) {
      console.log("[Firestore Admin] Seeding community_posts collection...");
      const batch = adminDb.batch();
      for (const post of INITIAL_STATE.wallPosts) {
        batch.set(COLLECTIONS.communityPosts.doc(post.id), {
          author: post.author,
          avatar: post.avatar,
          text: post.text,
          rating: post.rating,
          image: post.image || null,
          category: post.category,
          likes: post.likes || 0,
          date: post.date,
          createdAt: new Date(post.date).toISOString()
        });
      }
      await batch.commit();
    }

    firestoreConnected = true;
    console.log("[Firestore Admin] All collections checked & seeded successfully.");
  } catch (err: any) {
    logFirestoreFallback("seedDatabaseIfEmpty", err);
  }
}

// Run initial seed non-blockingly
seedDatabaseIfEmpty().catch(err => {
  logFirestoreFallback("seedDatabaseIfEmpty init", err);
});

// ==========================================
// 1. Menu Items API Helpers
// ==========================================
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const snap = await COLLECTIONS.menuItems.get();
    if (!snap.empty) {
      const items = snap.docs.map(doc => doc.data() as MenuItem);
      memoryState.menuItems = items;
      return items;
    }
  } catch (err) {
    logFirestoreFallback("getMenuItems", err);
  }
  return memoryState.menuItems;
}

export async function addMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem[]> {
  const newItem: MenuItem = {
    ...item,
    id: "m_" + Date.now(),
    rating: item.rating ?? 5.0,
    soldOut: false,
    seasonal: item.seasonal ?? false,
    ingredients: item.ingredients || []
  };

  memoryState.menuItems.push(newItem);

  try {
    await COLLECTIONS.menuItems.doc(newItem.id).set(newItem);
  } catch (err) {
    logFirestoreFallback("addMenuItem", err);
  }

  return getMenuItems();
}

export async function editMenuItem(id: string, itemUpdates: Partial<MenuItem>): Promise<MenuItem[]> {
  memoryState.menuItems = memoryState.menuItems.map(m =>
    m.id === id ? { ...m, ...itemUpdates } : m
  );

  try {
    await COLLECTIONS.menuItems.doc(id).set(itemUpdates, { merge: true });
  } catch (err) {
    logFirestoreFallback("editMenuItem", err);
  }

  return getMenuItems();
}

export async function toggleMenuItemStatus(id: string): Promise<MenuItem[]> {
  const current = memoryState.menuItems.find(m => m.id === id);
  const newStatus = current ? !current.soldOut : false;

  memoryState.menuItems = memoryState.menuItems.map(m =>
    m.id === id ? { ...m, soldOut: newStatus } : m
  );

  try {
    await COLLECTIONS.menuItems.doc(id).set({ soldOut: newStatus }, { merge: true });
  } catch (err) {
    logFirestoreFallback("toggleMenuItemStatus", err);
  }

  return getMenuItems();
}

export async function deleteMenuItem(id: string): Promise<MenuItem[]> {
  memoryState.menuItems = memoryState.menuItems.filter(m => m.id !== id);

  try {
    await COLLECTIONS.menuItems.doc(id).delete();
  } catch (err) {
    logFirestoreFallback("deleteMenuItem", err);
  }

  return getMenuItems();
}

// ==========================================
// 2. Events API Helpers
// ==========================================
export async function getEvents(): Promise<CoffeeEvent[]> {
  try {
    const snap = await COLLECTIONS.events.get();
    if (!snap.empty) {
      const events = snap.docs.map(doc => doc.data() as CoffeeEvent);
      memoryState.events = events;
      return events;
    }
  } catch (err) {
    logFirestoreFallback("getEvents", err);
  }
  return memoryState.events;
}

export async function bookEvent(
  eventId: string,
  userEmail?: string
): Promise<{ success: boolean; events: CoffeeEvent[]; error?: string }> {
  try {
    const eventDocRef = COLLECTIONS.events.doc(eventId);
    let updatedEvents = memoryState.events;

    // Try transactional Firestore update
    try {
      await adminDb.runTransaction(async (t) => {
        const doc = await t.get(eventDocRef);
        if (!doc.exists) throw new Error("Event not found");
        const ev = doc.data() as CoffeeEvent;
        if (ev.seats <= 0) throw new Error("No seats available");

        t.update(eventDocRef, { seats: ev.seats - 1 });
      });
      updatedEvents = await getEvents();
    } catch (dbErr: any) {
      logFirestoreFallback("bookEvent transaction", dbErr);
      const evIndex = memoryState.events.findIndex(e => e.id === eventId);
      if (evIndex === -1 || memoryState.events[evIndex].seats <= 0) {
        return { success: false, events: memoryState.events, error: "No seats available or event not found" };
      }
      memoryState.events[evIndex].seats -= 1;
      updatedEvents = memoryState.events;
    }

    const event = updatedEvents.find(e => e.id === eventId);
    if (event) {
      await updateShopStats(stats => ({
        ...stats,
        orders: stats.orders + 1,
        revenue: stats.revenue + event.price,
        activityLog: [
          {
            id: "act_" + Date.now(),
            text: `${userEmail || "Someone"} booked '${event.title}'`,
            time: "Just now"
          },
          ...(stats.activityLog || [])
        ]
      }));
    }

    return { success: true, events: updatedEvents };
  } catch (err: any) {
    return { success: false, events: memoryState.events, error: err.message || "Failed to book event" };
  }
}

// ==========================================
// 3. Promotions API Helpers
// ==========================================
export async function getPromotions(onlyActive?: boolean): Promise<Promotion[]> {
  try {
    let queryRef = COLLECTIONS.promotions;
    const snap = await queryRef.get();
    if (!snap.empty) {
      const list = snap.docs.map(doc => doc.data() as Promotion);
      memoryState.promotions = list;
      return onlyActive ? list.filter(p => p.active) : list;
    }
  } catch (err) {
    logFirestoreFallback("getPromotions", err);
  }
  return onlyActive ? memoryState.promotions.filter(p => p.active) : memoryState.promotions;
}

export async function addPromotion(promo: Omit<Promotion, "id">): Promise<Promotion[]> {
  const newPromo: Promotion = {
    ...promo,
    id: "pr_" + Date.now(),
    active: promo.active ?? true,
    image: promo.image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
  };

  memoryState.promotions.push(newPromo);

  try {
    await COLLECTIONS.promotions.doc(newPromo.id).set(newPromo);
  } catch (err) {
    logFirestoreFallback("addPromotion", err);
  }

  return getPromotions();
}

export async function editPromotion(id: string, promoUpdates: Partial<Promotion>): Promise<Promotion[]> {
  memoryState.promotions = memoryState.promotions.map(p =>
    p.id === id ? { ...p, ...promoUpdates } : p
  );

  try {
    await COLLECTIONS.promotions.doc(id).set(promoUpdates, { merge: true });
  } catch (err) {
    logFirestoreFallback("editPromotion", err);
  }

  return getPromotions();
}

export async function togglePromotion(id: string): Promise<Promotion[]> {
  const current = memoryState.promotions.find(p => p.id === id);
  const newActive = current ? !current.active : false;

  memoryState.promotions = memoryState.promotions.map(p =>
    p.id === id ? { ...p, active: newActive } : p
  );

  try {
    await COLLECTIONS.promotions.doc(id).set({ active: newActive }, { merge: true });
  } catch (err) {
    logFirestoreFallback("togglePromotion", err);
  }

  return getPromotions();
}

export async function deletePromotion(id: string): Promise<Promotion[]> {
  memoryState.promotions = memoryState.promotions.filter(p => p.id !== id);

  try {
    await COLLECTIONS.promotions.doc(id).delete();
  } catch (err) {
    logFirestoreFallback("deletePromotion", err);
  }

  return getPromotions();
}

// ==========================================
// 4. Raffle Prizes API Helpers
// ==========================================
export async function getRafflePrizes(): Promise<RafflePrize[]> {
  try {
    const snap = await COLLECTIONS.rafflePrizes.get();
    if (!snap.empty) {
      const prizes = snap.docs.map(doc => doc.data() as RafflePrize);
      memoryState.rafflePrizes = prizes;
      return prizes;
    }
  } catch (err) {
    logFirestoreFallback("getRafflePrizes", err);
  }
  return memoryState.rafflePrizes;
}

export async function addRafflePrize(prize: Omit<RafflePrize, "id">): Promise<RafflePrize[]> {
  const newPrize: RafflePrize = {
    ...prize,
    id: "rp_" + Date.now(),
    active: true,
    color: prize.color || (memoryState.rafflePrizes.length % 2 === 0 ? "bg-[#c89d7c] text-black" : "bg-[#2c221e] text-white border border-[#c89d7c]/30")
  };

  memoryState.rafflePrizes.push(newPrize);

  try {
    await COLLECTIONS.rafflePrizes.doc(newPrize.id).set(newPrize);
  } catch (err) {
    logFirestoreFallback("addRafflePrize", err);
  }

  return getRafflePrizes();
}

export async function editRafflePrize(id: string, updates: Partial<RafflePrize>): Promise<RafflePrize[]> {
  memoryState.rafflePrizes = memoryState.rafflePrizes.map(p =>
    p.id === id ? { ...p, ...updates } : p
  );

  try {
    await COLLECTIONS.rafflePrizes.doc(id).set(updates, { merge: true });
  } catch (err) {
    logFirestoreFallback("editRafflePrize", err);
  }

  return getRafflePrizes();
}

export async function toggleRafflePrize(id: string): Promise<RafflePrize[]> {
  const current = memoryState.rafflePrizes.find(p => p.id === id);
  const newActive = current ? !current.active : false;

  memoryState.rafflePrizes = memoryState.rafflePrizes.map(p =>
    p.id === id ? { ...p, active: newActive } : p
  );

  try {
    await COLLECTIONS.rafflePrizes.doc(id).set({ active: newActive }, { merge: true });
  } catch (err) {
    logFirestoreFallback("toggleRafflePrize", err);
  }

  return getRafflePrizes();
}

export async function deleteRafflePrize(id: string): Promise<RafflePrize[]> {
  memoryState.rafflePrizes = memoryState.rafflePrizes.filter(p => p.id !== id);

  try {
    await COLLECTIONS.rafflePrizes.doc(id).delete();
  } catch (err) {
    logFirestoreFallback("deleteRafflePrize", err);
  }

  return getRafflePrizes();
}

// ==========================================
// 5. Registered Users API Helpers
// ==========================================
export async function getRegisteredUsers(): Promise<RegisteredUser[]> {
  try {
    const snap = await COLLECTIONS.registeredUsers.get();
    if (!snap.empty) {
      const users = snap.docs.map(doc => doc.data() as RegisteredUser);
      memoryState.registeredUsers = users;
      return users;
    }
  } catch (err) {
    logFirestoreFallback("getRegisteredUsers", err);
  }
  return memoryState.registeredUsers;
}

export async function addRegisteredUser(user: RegisteredUser): Promise<void> {
  memoryState.registeredUsers.unshift(user);

  try {
    await COLLECTIONS.registeredUsers.doc(user.id).set(user);
  } catch (err) {
    logFirestoreFallback("addRegisteredUser", err);
  }
}

export async function updateRegisteredUser(id: string, updates: Partial<RegisteredUser>): Promise<void> {
  memoryState.registeredUsers = memoryState.registeredUsers.map(u =>
    u.id === id ? { ...u, ...updates } : u
  );

  try {
    await COLLECTIONS.registeredUsers.doc(id).set(updates, { merge: true });
  } catch (err) {
    logFirestoreFallback("updateRegisteredUser", err);
  }
}

export async function deleteRegisteredUser(id: string, userDeviceId?: string): Promise<void> {
  const user = memoryState.registeredUsers.find(u => u.id === id);
  const devId = userDeviceId || user?.deviceId;
  const userEmail = user?.email?.toLowerCase();

  memoryState.registeredUsers = memoryState.registeredUsers.filter(u => u.id !== id);

  try {
    await COLLECTIONS.registeredUsers.doc(id).delete();
  } catch (err) {
    logFirestoreFallback("deleteRegisteredUser", err);
  }

  // Clear loyalty profile flags for this user / device
  const resetFlags = {
    signedUp: false,
    hasSpunWheel: false,
    hasCollectedPrize: false,
    customerName: "",
    customerEmail: "",
    rafflePrize: ""
  };

  if (devId) {
    const devKey = `dev_${devId}`;
    if (memoryState.loyaltyProfiles[devKey]) {
      memoryState.loyaltyProfiles[devKey] = { ...memoryState.loyaltyProfiles[devKey], ...resetFlags };
    }
    try {
      await COLLECTIONS.loyaltyProfiles.doc(devKey).set(resetFlags, { merge: true });
    } catch (e) {
      // ignore
    }
  }

  if (userEmail) {
    const emailKey = `user_${userEmail}`;
    if (memoryState.loyaltyProfiles[emailKey]) {
      memoryState.loyaltyProfiles[emailKey] = { ...memoryState.loyaltyProfiles[emailKey], ...resetFlags };
    }
    try {
      await COLLECTIONS.loyaltyProfiles.doc(emailKey).set(resetFlags, { merge: true });
    } catch (e) {
      // ignore
    }
  }
}

export async function resetUserSpin(id: string, userDeviceId?: string): Promise<void> {
  const user = memoryState.registeredUsers.find(u => u.id === id);
  const devId = userDeviceId || user?.deviceId;
  const userEmail = user?.email?.toLowerCase();

  const resetFields = {
    hasSpun: false,
    hasCollected: false,
    prize: ""
  };

  await updateRegisteredUser(id, resetFields);

  const profileSpinReset = {
    hasSpunWheel: false,
    rafflePrize: "",
    hasCollectedPrize: false
  };

  if (devId) {
    const devKey = `dev_${devId}`;
    if (memoryState.loyaltyProfiles[devKey]) {
      memoryState.loyaltyProfiles[devKey] = { ...memoryState.loyaltyProfiles[devKey], ...profileSpinReset };
    }
    try {
      await COLLECTIONS.loyaltyProfiles.doc(devKey).set(profileSpinReset, { merge: true });
    } catch (e) {
      // ignore
    }
  }

  if (userEmail) {
    const emailKey = `user_${userEmail}`;
    if (memoryState.loyaltyProfiles[emailKey]) {
      memoryState.loyaltyProfiles[emailKey] = { ...memoryState.loyaltyProfiles[emailKey], ...profileSpinReset };
    }
    try {
      await COLLECTIONS.loyaltyProfiles.doc(emailKey).set(profileSpinReset, { merge: true });
    } catch (e) {
      // ignore
    }
  }
}

// ==========================================
// 6. Orders API Helpers
// ==========================================
export async function getOrders(filter?: { email?: string; deviceId?: string }): Promise<Order[]> {
  try {
    const snap = await COLLECTIONS.orders.orderBy("createdAt", "desc").get();
    if (!snap.empty) {
      const orders = snap.docs.map(doc => doc.data() as Order);
      memoryState.orders = orders;
    }
  } catch (err) {
    logFirestoreFallback("getOrders", err);
  }

  let list = memoryState.orders || [];
  if (filter?.email) {
    const em = filter.email.toLowerCase();
    list = list.filter(o => (o.customerEmail && o.customerEmail.toLowerCase() === em) || (filter.deviceId && o.deviceId === filter.deviceId));
  } else if (filter?.deviceId) {
    list = list.filter(o => o.deviceId === filter.deviceId);
  }

  return list;
}

export async function createOrder(order: Order): Promise<Order> {
  if (!memoryState.orders) memoryState.orders = [];
  memoryState.orders.unshift(order);

  try {
    await COLLECTIONS.orders.doc(order.id).set(order);
  } catch (err) {
    logFirestoreFallback("createOrder", err);
  }

  return order;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
  if (!memoryState.orders) memoryState.orders = [];
  const order = memoryState.orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
  }

  try {
    await COLLECTIONS.orders.doc(orderId).set({ status }, { merge: true });
  } catch (err) {
    logFirestoreFallback("updateOrderStatus", err);
  }

  return order || null;
}

// ==========================================
// 7. Shop Stats API Helpers
// ==========================================
export async function getShopStats(): Promise<ShopStats> {
  try {
    const doc = await COLLECTIONS.shopStats.doc("current").get();
    if (doc.exists) {
      const stats = doc.data() as ShopStats;
      memoryState.shopStats = stats;
      return stats;
    }
  } catch (err) {
    logFirestoreFallback("getShopStats", err);
  }
  return memoryState.shopStats;
}

export async function updateShopStats(updater: (current: ShopStats) => ShopStats): Promise<ShopStats> {
  const current = await getShopStats();
  const next = updater({ ...current });
  memoryState.shopStats = next;

  try {
    await COLLECTIONS.shopStats.doc("current").set(next);
  } catch (err) {
    logFirestoreFallback("updateShopStats", err);
  }

  return next;
}

export async function addActivityLog(text: string): Promise<void> {
  await updateShopStats(stats => ({
    ...stats,
    activityLog: [
      { id: "act_" + Date.now(), text, time: "Just now" },
      ...(stats.activityLog || []).slice(0, 50)
    ]
  }));
}

// ==========================================
// 8. Loyalty Profiles API Helpers
// ==========================================
export function getLoyaltyProfileKey(req: any): { key: string; userEmail: string; deviceId: string } {
  const deviceId = (req.query?.deviceId || req.headers?.["x-device-id"] || req.body?.deviceId || "default-device") as string;
  const rawEmail = (req.headers?.["x-user-email"] || req.query?.userEmail || req.body?.userEmail || req.body?.email || "") as string;
  const userEmail = rawEmail.trim().toLowerCase();
  const sanitizedEmail = userEmail.replace(/\//g, "_");

  const key = userEmail ? `user_${sanitizedEmail}` : `dev_${deviceId}`;
  return { key, userEmail, deviceId };
}

export async function getProfile(req: any): Promise<LoyaltyProfile> {
  const { key, userEmail, deviceId } = getLoyaltyProfileKey(req);

  let profile: LoyaltyProfile | null = null;

  try {
    const doc = await COLLECTIONS.loyaltyProfiles.doc(key).get();
    if (doc.exists) {
      profile = doc.data() as LoyaltyProfile;
    }
  } catch (err) {
    logFirestoreFallback("getProfile", err);
  }

  if (!profile) {
    profile = memoryState.loyaltyProfiles?.[key] || null;
  }

  // If still not created, initialize default profile
  if (!profile) {
    profile = {
      ...INITIAL_STATE.loyaltyProfile,
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
    const users = await getRegisteredUsers();
    const regUser = users.find(u => u.email && u.email.toLowerCase() === userEmail);
    if (regUser) {
      profile.signedUp = true;
      if (regUser.name) profile.customerName = regUser.name;
      if (regUser.email) profile.customerEmail = regUser.email;
      if (regUser.phone) profile.customerPhone = regUser.phone;
      profile.hasSpunWheel = regUser.hasSpun || false;
      profile.rafflePrize = regUser.prize || profile.rafflePrize || "";
      profile.hasCollectedPrize = regUser.hasCollected || false;
    }
  }

  // Cache in memory
  if (!memoryState.loyaltyProfiles) memoryState.loyaltyProfiles = {};
  memoryState.loyaltyProfiles[key] = profile;

  // Persist to Firestore
  try {
    await COLLECTIONS.loyaltyProfiles.doc(key).set(profile, { merge: true });
  } catch (err) {
    logFirestoreFallback("saveProfile on getProfile", err);
  }

  return profile;
}

export async function saveProfile(profile: LoyaltyProfile): Promise<void> {
  const userEmail = (profile.customerEmail || "").trim().toLowerCase();
  const deviceId = profile.deviceId || "default-device";
  const sanitizedEmail = userEmail.replace(/\//g, "_");
  const key = userEmail ? `user_${sanitizedEmail}` : `dev_${deviceId}`;

  if (!memoryState.loyaltyProfiles) memoryState.loyaltyProfiles = {};
  memoryState.loyaltyProfiles[key] = profile;

  try {
    await COLLECTIONS.loyaltyProfiles.doc(key).set(profile, { merge: true });
  } catch (err) {
    logFirestoreFallback("saveProfile", err);
  }
}

// ==========================================
// 9. Community Wall API Helpers (Unified community_posts collection)
// ==========================================
export async function getWallPosts(): Promise<WallPost[]> {
  try {
    const snap = await COLLECTIONS.communityPosts.orderBy("createdAt", "desc").get();
    if (!snap.empty) {
      const posts: WallPost[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          author: data.author || "Anonymous",
          avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          text: data.text || "",
          rating: Number(data.rating) || 5,
          image: data.image || undefined,
          date: data.date || (data.createdAt ? data.createdAt.split("T")[0] : "Just now"),
          likes: Number(data.likes) || 0,
          category: data.category || "review",
          createdAt: data.createdAt
        };
      });
      memoryState.wallPosts = posts;
      return posts;
    }
  } catch (err) {
    logFirestoreFallback("getWallPosts", err);
  }
  return memoryState.wallPosts;
}

export async function addWallPost(post: {
  author?: string;
  avatar?: string;
  text: string;
  rating?: number;
  image?: string;
  category?: string;
}): Promise<WallPost> {
  const now = new Date();
  const id = "p_" + Date.now();
  const newPost: WallPost = {
    id,
    author: post.author || "Coffee Lover",
    avatar: post.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    text: post.text,
    rating: post.rating ?? 5,
    image: post.image || undefined,
    date: now.toISOString().split("T")[0],
    likes: 0,
    category: post.category || "review",
    createdAt: now.toISOString()
  };

  memoryState.wallPosts.unshift(newPost);

  try {
    await COLLECTIONS.communityPosts.doc(id).set({
      author: newPost.author,
      avatar: newPost.avatar,
      text: newPost.text,
      rating: newPost.rating,
      image: newPost.image || null,
      date: newPost.date,
      likes: 0,
      category: newPost.category,
      createdAt: newPost.createdAt
    });
  } catch (err) {
    logFirestoreFallback("addWallPost", err);
  }

  return newPost;
}

// Full app state getter for compatibility
export async function getAppState(): Promise<AppState> {
  const [
    menuItems,
    events,
    wallPosts,
    promotions,
    rafflePrizes,
    registeredUsers,
    orders,
    shopStats
  ] = await Promise.all([
    getMenuItems(),
    getEvents(),
    getWallPosts(),
    getPromotions(),
    getRafflePrizes(),
    getRegisteredUsers(),
    getOrders(),
    getShopStats()
  ]);

  return {
    menuItems,
    events,
    wallPosts,
    promotions,
    rafflePrizes,
    registeredUsers,
    orders,
    shopStats,
    loyaltyProfile: memoryState.loyaltyProfile,
    loyaltyProfiles: memoryState.loyaltyProfiles
  };
}
