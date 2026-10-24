import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore, CollectionReference } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";

// Process-level safety net for unhandled credential resolution rejections
process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection]", err);
});

export interface MatchPlayer {
  name: string;
  team: "home" | "away";
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  playerGoals: Record<string, number>;
}

export interface MatchAuditEntry {
  id: string;
  changedAt: string;
  adminEmail: string;
  reason: string;
  previousResult?: MatchResult;
  newResult: MatchResult;
  affectedWinnersCount?: number;
}

export interface PredictionMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffAt: string; // UTC ISO timestamp
  status: "scheduled" | "settled" | "void";
  prizeDescription: string;
  players: MatchPlayer[];
  result?: MatchResult;
  weekKey: string; // ISO week e.g. "2026-W43"
  createdAt: string;
  auditHistory?: MatchAuditEntry[];
  settledAt?: string;
  correctedAt?: string;
}

export interface Prediction {
  matchId: string;
  uid: string;
  displayName: string;
  email?: string;
  outcome: "HOME" | "AWAY" | "DRAW";
  scoreline: string; // strictly "Home:Away"
  playerName: string;
  playerGoals: number; // integer 0-10
  submittedAt: string;
  updatedAt: string;
  leg1Correct?: boolean;
  leg2Correct?: boolean;
  leg3Correct?: boolean;
  legsCorrect?: number; // 0-3
  grandPrizeWinner?: boolean;
  prizeCollected?: boolean;
  prizeCollectedAt?: string;
  collectedAt?: string;
  collectedBy?: string;
  claimCode?: string;
}

export interface UserPredictionSummary extends Prediction {
  match?: PredictionMatch;
}

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
  authorUid?: string;
  authorEmail?: string;
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
  predictionMatches: PredictionMatch[];
  predictions: Prediction[];
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
  predictionMatches: [
    {
      id: "match_w43_2026",
      homeTeam: "Arsenal",
      awayTeam: "Liverpool",
      competition: "Premier Matchday Showcase",
      kickoffAt: "2026-10-24T16:30:00.000Z",
      status: "scheduled",
      prizeDescription: "1 Year of Free Hattrick Cafe Single-Origin Coffee & Official Leather Football",
      players: [
        { name: "Bukayo Saka", team: "home" },
        { name: "Martin Odegaard", team: "home" },
        { name: "Kai Havertz", team: "home" },
        { name: "Gabriel Martinelli", team: "home" },
        { name: "Mohamed Salah", team: "away" },
        { name: "Luis Diaz", team: "away" },
        { name: "Darwin Nunez", team: "away" },
        { name: "Cody Gakpo", team: "away" }
      ],
      weekKey: "2026-W43",
      createdAt: "2026-10-21T00:00:00.000Z"
    },
    {
      id: "match_w43_che_new",
      homeTeam: "Chelsea",
      awayTeam: "Newcastle United",
      competition: "Premier League Fixture",
      kickoffAt: "2026-10-25T14:00:00.000Z",
      status: "scheduled",
      prizeDescription: "Hattrick Cafe Hand-Roasted Coffee Selection & Handcrafted Sini Cup Set",
      players: [
        { name: "Cole Palmer", team: "home" },
        { name: "Nicolas Jackson", team: "home" },
        { name: "Christopher Nkunku", team: "home" },
        { name: "Enzo Fernandez", team: "home" },
        { name: "Alexander Isak", team: "away" },
        { name: "Anthony Gordon", team: "away" },
        { name: "Bruno Guimaraes", team: "away" },
        { name: "Harvey Barnes", team: "away" }
      ],
      weekKey: "2026-W43",
      createdAt: "2026-10-21T00:00:00.000Z"
    },
    {
      id: "match_w42_mci_ast",
      homeTeam: "Manchester City",
      awayTeam: "Aston Villa",
      competition: "Premier League Matchday 8",
      kickoffAt: "2026-10-17T16:30:00.000Z",
      status: "settled",
      prizeDescription: "1 Year of Free Hattrick Cafe Specialty Pour-Overs & VIP Ceremony Ticket",
      players: [
        { name: "Erling Haaland", team: "home" },
        { name: "Kevin De Bruyne", team: "home" },
        { name: "Phil Foden", team: "home" },
        { name: "Jeremy Doku", team: "home" },
        { name: "Ollie Watkins", team: "away" },
        { name: "Morgan Rogers", team: "away" },
        { name: "Leon Bailey", team: "away" },
        { name: "John McGinn", team: "away" }
      ],
      result: {
        homeGoals: 2,
        awayGoals: 1,
        playerGoals: {
          "Erling Haaland": 2,
          "Ollie Watkins": 1,
          "Kevin De Bruyne": 0,
          "Phil Foden": 0,
          "Jeremy Doku": 0,
          "Morgan Rogers": 0,
          "Leon Bailey": 0,
          "John McGinn": 0
        }
      },
      weekKey: "2026-W42",
      createdAt: "2026-10-14T00:00:00.000Z"
    }
  ],
  predictions: [
    {
      matchId: "match_w42_mci_ast",
      uid: "u1",
      displayName: "Abebe Kebede",
      outcome: "HOME",
      scoreline: "2:1",
      playerName: "Erling Haaland",
      playerGoals: 2,
      submittedAt: "2026-10-16T10:15:00.000Z",
      updatedAt: "2026-10-16T10:15:00.000Z",
      leg1Correct: true,
      leg2Correct: true,
      leg3Correct: true,
      legsCorrect: 3,
      grandPrizeWinner: true,
      prizeCollected: false,
      claimCode: "3F9B2A"
    },
    {
      matchId: "match_w42_mci_ast",
      uid: "u2",
      displayName: "Martha Tesfaye",
      outcome: "HOME",
      scoreline: "1:0",
      playerName: "Erling Haaland",
      playerGoals: 1,
      submittedAt: "2026-10-16T11:45:00.000Z",
      updatedAt: "2026-10-16T11:45:00.000Z",
      leg1Correct: true,
      leg2Correct: false,
      leg3Correct: false,
      legsCorrect: 1,
      grandPrizeWinner: false,
      prizeCollected: false,
      claimCode: "7E1C84"
    }
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

// In-memory shadow state to guarantee 100% smooth fallback for local dev / unauthenticated container sandbox
let memoryState: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));
let firestoreConnected = false;
let hasWarnedAuth = false;

export function isPermissionError(err: any): boolean {
  if (!err) return false;
  const msg = err.message || String(err);
  return (
    err.code === 7 ||
    err.code === 16 ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("Missing or insufficient permissions") ||
    msg.includes("UNAUTHENTICATED")
  );
}

function logFirestoreFallback(op: string, err: any) {
  if (isPermissionError(err)) {
    isFirestoreAvailable = false;
    if (!hasWarnedAuth) {
      console.warn(`[Firestore Admin] Firestore credentials not authorized for this project (${err?.message || err}). Operating in in-memory state fallback mode.`);
      hasWarnedAuth = true;
    }
    return;
  }

  if (checkHasLikelyCredentials()) {
    console.error(`[Firestore Admin] Transient error during "${op}": ${err?.message || err}.`);
    return;
  }
  if (!hasWarnedAuth) {
    console.warn(`[Firestore Admin] Fallback active for "${op}": ${err?.message || err}. (In Cloud Run or with ADC credentials, Firestore connects directly).`);
    hasWarnedAuth = true;
  }
}

// Cheap upfront check for whether Google Cloud / Application Default Credentials are likely available
export function checkHasLikelyCredentials(): boolean {
  // 1. Explicit service account file via GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  // 2. Emulator environment
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return true;
  }

  // 3. AI Studio preview environment check:
  // In the AI Studio preview container (ais-dev-* or ais-pre-*), the ambient compute
  // credentials belong to AI Studio's internal GCP infrastructure, not the user's Firebase project.
  const kService = process.env.K_SERVICE || "";
  if (kService.startsWith("ais-dev-") || kService.startsWith("ais-pre-")) {
    return false;
  }

  // 4. Production Google Cloud hosted environment (Cloud Run, Cloud Functions, App Engine, GKE)
  if (process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.GAE_ENV || process.env.GAE_INSTANCE) {
    return true;
  }

  // 5. Well-known gcloud CLI Application Default Credentials file on developer machines
  try {
    const isWindows = process.platform === "win32";
    const adcPath = isWindows
      ? path.join(process.env.APPDATA || "", "gcloud/application_default_credentials.json")
      : path.join(os.homedir(), ".config/gcloud/application_default_credentials.json");

    if (fs.existsSync(adcPath)) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export type CollectionsMap = {
  menuItems: CollectionReference;
  events: CollectionReference;
  promotions: CollectionReference;
  registeredUsers: CollectionReference;
  orders: CollectionReference;
  loyaltyProfiles: CollectionReference;
  shopStats: CollectionReference;
  communityPosts: CollectionReference;
  predictionMatches: CollectionReference;
  predictions: CollectionReference;
};

let initialized = false;
let isFirestoreAvailable = false;
let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let collectionsInstance: CollectionsMap | null = null;
let hasInitiatedSeed = false;
let hasSeeded = false;
let seedPromise: Promise<void> | null = null;

export function getAdminAuth(): Auth | null {
  getAdminDb();
  if (adminApp) {
    try {
      return getAuth(adminApp);
    } catch {
      return null;
    }
  }
  return null;
}

export function getAdminDb(): Firestore | null {
  if (initialized) {
    return adminDb;
  }
  initialized = true;

  // Detect project configuration
  let targetProjectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  let targetDatabaseId: string | undefined;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!targetProjectId && config.projectId) {
        targetProjectId = config.projectId;
      }
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)") {
        targetDatabaseId = config.firestoreDatabaseId;
      }
    }
  } catch {
    // ignore
  }

  // Always initialize Firebase Admin App for Auth & token verification (which uses Google public certs and does not require private keys)
  try {
    if (!getApps().length) {
      adminApp = initializeApp({
        projectId: targetProjectId || "buna-ethiopia",
      });
    } else {
      adminApp = getApps()[0];
    }
  } catch (initErr: any) {
    console.warn(`[Firebase Admin App] Failed to initialize Firebase Admin App (${initErr?.message || initErr}).`);
  }

  const hasCredentials = checkHasLikelyCredentials();
  if (!hasCredentials) {
    console.warn("[Firestore Admin] Running in local development / AI Studio preview environment without production credentials. Firestore client is operating in memory fallback mode.");
    isFirestoreAvailable = false;
    adminDb = null;
    collectionsInstance = null;
  } else if (adminApp) {
    try {
      adminDb = targetDatabaseId ? getFirestore(adminApp, targetDatabaseId) : getFirestore(adminApp);
      isFirestoreAvailable = true;
      collectionsInstance = {
        menuItems: adminDb.collection("menuItems"),
        events: adminDb.collection("events"),
        promotions: adminDb.collection("promotions"),
        registeredUsers: adminDb.collection("registeredUsers"),
        orders: adminDb.collection("orders"),
        loyaltyProfiles: adminDb.collection("loyaltyProfiles"),
        shopStats: adminDb.collection("shopStats"),
        communityPosts: adminDb.collection("community_posts"),
        predictionMatches: adminDb.collection("predictionMatches"),
        predictions: adminDb.collection("predictions"),
      };
    } catch (initErr: any) {
      isFirestoreAvailable = false;
      adminDb = null;
      collectionsInstance = null;
      console.warn(`[Firestore Admin] Failed to initialize Firestore Admin client (${initErr?.message || initErr}).`);
    }
  }

  if (isFirestoreAvailable && !hasInitiatedSeed) {
    hasInitiatedSeed = true;
    seedDatabaseIfEmpty().catch(err => {
      logFirestoreFallback("seedDatabaseIfEmpty init", err);
    });
  }

  return adminDb;
}

export function getCollections(): CollectionsMap | null {
  getAdminDb();
  return collectionsInstance;
}

// Collection References Proxy - lazily accesses collections after initialization
export const COLLECTIONS = new Proxy({} as CollectionsMap, {
  get(_target, prop: keyof CollectionsMap) {
    const cols = getCollections();
    return cols ? cols[prop] : undefined;
  }
});

// Idempotent seeding on first access
export async function seedDatabaseIfEmpty(): Promise<void> {
  const db = getAdminDb();
  const cols = getCollections();
  if (!isFirestoreAvailable || !cols || !db) {
    return;
  }
  if (hasSeeded) {
    return;
  }
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      // 1. Menu Items
      const menuSnap = await cols.menuItems.limit(1).get();
      if (menuSnap.empty) {
        console.log("[Firestore Admin] Seeding menuItems collection...");
        const batch = db.batch();
        for (const item of INITIAL_STATE.menuItems) {
          batch.set(cols.menuItems.doc(item.id), item);
        }
        await batch.commit();
      }

      // 2. Events
      const eventsSnap = await cols.events.limit(1).get();
      if (eventsSnap.empty) {
        console.log("[Firestore Admin] Seeding events collection...");
        const batch = db.batch();
        for (const event of INITIAL_STATE.events) {
          batch.set(cols.events.doc(event.id), event);
        }
        await batch.commit();
      }

      // 3. Promotions
      const promoSnap = await cols.promotions.limit(1).get();
      if (promoSnap.empty) {
        console.log("[Firestore Admin] Seeding promotions collection...");
        const batch = db.batch();
        for (const promo of INITIAL_STATE.promotions) {
          batch.set(cols.promotions.doc(promo.id), promo);
        }
        await batch.commit();
      }

      // 4. Prediction Matches
      const matchSnap = await cols.predictionMatches.limit(1).get();
      if (matchSnap.empty) {
        console.log("[Firestore Admin] Seeding predictionMatches collection...");
        const batch = db.batch();
        for (const m of INITIAL_STATE.predictionMatches) {
          batch.set(cols.predictionMatches.doc(m.id), m);
        }
        await batch.commit();
      }

      // 5. Registered Users
      const usersSnap = await cols.registeredUsers.limit(1).get();
      if (usersSnap.empty) {
        console.log("[Firestore Admin] Seeding registeredUsers collection...");
        const batch = db.batch();
        for (const user of INITIAL_STATE.registeredUsers) {
          batch.set(cols.registeredUsers.doc(user.id), user);
        }
        await batch.commit();
      }

      // 6. Shop Stats (Single document 'current')
      const statsDoc = await cols.shopStats.doc("current").get();
      if (!statsDoc.exists) {
        console.log("[Firestore Admin] Seeding shopStats document ('current')...");
        await cols.shopStats.doc("current").set(INITIAL_STATE.shopStats);
      }

      // 7. Community Posts (Unified community wall)
      const postsSnap = await cols.communityPosts.limit(1).get();
      if (postsSnap.empty) {
        console.log("[Firestore Admin] Seeding community_posts collection...");
        const batch = db.batch();
        for (const post of INITIAL_STATE.wallPosts) {
          batch.set(cols.communityPosts.doc(post.id), {
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
      hasSeeded = true;
      console.log("[Firestore Admin] All collections checked & seeded successfully.");
    } catch (err: any) {
      isFirestoreAvailable = false;
      logFirestoreFallback("seedDatabaseIfEmpty", err);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}

// ==========================================
// 1. Menu Items API Helpers
// ==========================================
export async function getMenuItems(): Promise<MenuItem[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.menuItems.get();
      if (!snap.empty) {
        const items = snap.docs.map(doc => doc.data() as MenuItem);
        memoryState.menuItems = items;
        return items;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getMenuItems", err);
    }
  }
  return memoryState.menuItems;
}

export async function addMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem[]> {
  getAdminDb();
  const newItem: MenuItem = {
    ...item,
    id: "m_" + Date.now(),
    rating: item.rating ?? 5.0,
    soldOut: false,
    seasonal: item.seasonal ?? false,
    ingredients: item.ingredients || []
  };

  memoryState.menuItems.push(newItem);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.menuItems.doc(newItem.id).set(newItem);
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("addMenuItem", err);
    }
  }

  return getMenuItems();
}

export async function editMenuItem(id: string, itemUpdates: Partial<MenuItem>): Promise<MenuItem[]> {
  getAdminDb();
  memoryState.menuItems = memoryState.menuItems.map(m =>
    m.id === id ? { ...m, ...itemUpdates } : m
  );

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.menuItems.doc(id).set(itemUpdates, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("editMenuItem", err);
    }
  }

  return getMenuItems();
}

export async function toggleMenuItemStatus(id: string): Promise<MenuItem[]> {
  getAdminDb();
  const current = memoryState.menuItems.find(m => m.id === id);
  const newStatus = current ? !current.soldOut : false;

  memoryState.menuItems = memoryState.menuItems.map(m =>
    m.id === id ? { ...m, soldOut: newStatus } : m
  );

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.menuItems.doc(id).set({ soldOut: newStatus }, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("toggleMenuItemStatus", err);
    }
  }

  return getMenuItems();
}

export async function deleteMenuItem(id: string): Promise<MenuItem[]> {
  getAdminDb();
  memoryState.menuItems = memoryState.menuItems.filter(m => m.id !== id);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.menuItems.doc(id).delete();
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("deleteMenuItem", err);
    }
  }

  return getMenuItems();
}

// ==========================================
// 2. Events API Helpers
// ==========================================
export async function getEvents(): Promise<CoffeeEvent[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.events.get();
      if (!snap.empty) {
        const events = snap.docs.map(doc => doc.data() as CoffeeEvent);
        memoryState.events = events;
        return events;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getEvents", err);
    }
  }
  return memoryState.events;
}

export async function bookEvent(
  eventId: string,
  userEmail?: string
): Promise<{ success: boolean; events: CoffeeEvent[]; error?: string }> {
  getAdminDb();
  try {
    let updatedEvents = memoryState.events;

    // Try transactional Firestore update if available
    if (isFirestoreAvailable && COLLECTIONS && adminDb) {
      const eventDocRef = COLLECTIONS.events.doc(eventId);
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
        isFirestoreAvailable = false;
        logFirestoreFallback("bookEvent transaction", dbErr);
        const evIndex = memoryState.events.findIndex(e => e.id === eventId);
        if (evIndex === -1 || memoryState.events[evIndex].seats <= 0) {
          return { success: false, events: memoryState.events, error: "No seats available or event not found" };
        }
        memoryState.events[evIndex].seats -= 1;
        updatedEvents = memoryState.events;
      }
    } else {
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
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      let queryRef = COLLECTIONS.promotions;
      const snap = await queryRef.get();
      if (!snap.empty) {
        const list = snap.docs.map(doc => doc.data() as Promotion);
        memoryState.promotions = list;
        return onlyActive ? list.filter(p => p.active) : list;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getPromotions", err);
    }
  }
  return onlyActive ? memoryState.promotions.filter(p => p.active) : memoryState.promotions;
}

export async function addPromotion(promo: Omit<Promotion, "id">): Promise<Promotion[]> {
  getAdminDb();
  const newPromo: Promotion = {
    ...promo,
    id: "pr_" + Date.now(),
    active: promo.active ?? true,
    image: promo.image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
  };

  memoryState.promotions.push(newPromo);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.promotions.doc(newPromo.id).set(newPromo);
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("addPromotion", err);
    }
  }

  return getPromotions();
}

export async function editPromotion(id: string, promoUpdates: Partial<Promotion>): Promise<Promotion[]> {
  getAdminDb();
  memoryState.promotions = memoryState.promotions.map(p =>
    p.id === id ? { ...p, ...promoUpdates } : p
  );

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.promotions.doc(id).set(promoUpdates, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("editPromotion", err);
    }
  }

  return getPromotions();
}

export async function togglePromotion(id: string): Promise<Promotion[]> {
  getAdminDb();
  const current = memoryState.promotions.find(p => p.id === id);
  const newActive = current ? !current.active : false;

  memoryState.promotions = memoryState.promotions.map(p =>
    p.id === id ? { ...p, active: newActive } : p
  );

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.promotions.doc(id).set({ active: newActive }, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("togglePromotion", err);
    }
  }

  return getPromotions();
}

export async function deletePromotion(id: string): Promise<Promotion[]> {
  getAdminDb();
  memoryState.promotions = memoryState.promotions.filter(p => p.id !== id);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.promotions.doc(id).delete();
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("deletePromotion", err);
    }
  }

  return getPromotions();
}

// ==========================================
// 4. Weekly Prediction Game Helpers
// ==========================================

export function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function formatWinnerName(name: string): string {
  if (!name) return "Anonymous E.";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export async function verifyUserToken(token: string): Promise<{ uid: string; displayName: string; email?: string } | null> {
  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      return {
        uid: decoded.uid,
        displayName: decoded.name || decoded.email?.split("@")[0] || "Explorer",
        email: decoded.email
      };
    } catch (e: any) {
      console.warn("[verifyUserToken] Admin verifyIdToken note:", e?.message);
    }
  }

  // Fallback JWT token validation for Google/Firebase ID tokens:
  // Verifies format, expiration (with 5-minute skew tolerance), and standard Google/Firebase identity claims
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      const nowSec = Math.floor(Date.now() / 1000);

      // Check expiry (reject if expired, allowing 300s clock skew)
      if (typeof payload.exp === "number" && payload.exp < nowSec - 300) {
        console.warn("[verifyUserToken] Session token expired at:", payload.exp, "current:", nowSec);
        return null;
      }

      const uid = payload.sub || payload.user_id;
      const targetProj = process.env.FIREBASE_PROJECT_ID || "buna-ethiopia";
      const isGoogleIssuer =
        !payload.iss ||
        payload.iss.startsWith("https://securetoken.google.com/") ||
        payload.iss === `https://securetoken.google.com/${targetProj}` ||
        payload.iss === "https://accounts.google.com" ||
        payload.iss === "accounts.google.com" ||
        payload.iss.includes("google.com");

      if (uid && isGoogleIssuer) {
        return {
          uid,
          displayName: payload.name || payload.displayName || payload.email?.split("@")[0] || "Explorer",
          email: payload.email
        };
      }
    }
  } catch (err: any) {
    console.warn("[verifyUserToken] Fallback parse error:", err?.message);
  }

  return null;
}

export async function getAllPredictionMatches(): Promise<PredictionMatch[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictionMatches.orderBy("kickoffAt", "desc").get();
      if (!snap.empty) {
        const matches = snap.docs.map(doc => doc.data() as PredictionMatch);
        memoryState.predictionMatches = matches;
        return matches;
      }
    } catch (err) {
      if (!checkHasLikelyCredentials()) {
        isFirestoreAvailable = false;
      }
      logFirestoreFallback("getAllPredictionMatches", err);
    }
  }
  return memoryState.predictionMatches;
}

export async function getPredictionMatch(matchId: string): Promise<PredictionMatch | null> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const docSnap = await COLLECTIONS.predictionMatches.doc(matchId).get();
      if (docSnap.exists) {
        return docSnap.data() as PredictionMatch;
      }
    } catch (err) {
      if (!checkHasLikelyCredentials()) {
        isFirestoreAvailable = false;
      }
      logFirestoreFallback("getPredictionMatch", err);
    }
  }
  return memoryState.predictionMatches.find(m => m.id === matchId) || null;
}

export async function getFeaturedMatch(): Promise<{ match: PredictionMatch | null; totalEntries: number; serverNow: string }> {
  getAdminDb();
  const serverNow = new Date().toISOString();
  const allMatches = await getAllPredictionMatches();
  const nowMs = new Date(serverNow).getTime();

  // Return nearest upcoming scheduled match (earliest future kickoffAt), else most recent match by kickoffAt
  const upcomingScheduled = allMatches
    .filter(m => m.status === "scheduled" && new Date(m.kickoffAt).getTime() >= nowMs)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  let match: PredictionMatch | null = null;
  if (upcomingScheduled.length > 0) {
    match = upcomingScheduled[0];
  } else {
    const sortedByKickoff = [...allMatches].sort(
      (a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime()
    );
    match = sortedByKickoff[0] || null;
  }

  let totalEntries = 0;
  if (match) {
    if (isFirestoreAvailable && COLLECTIONS) {
      try {
        const snap = await COLLECTIONS.predictions.where("matchId", "==", match.id).get();
        totalEntries = snap.size;
      } catch (err) {
        if (!checkHasLikelyCredentials()) {
          isFirestoreAvailable = false;
        }
        logFirestoreFallback("getFeaturedMatch entries", err);
        totalEntries = memoryState.predictions.filter(p => p.matchId === match?.id).length;
      }
    } else {
      totalEntries = memoryState.predictions.filter(p => p.matchId === match?.id).length;
    }
  }

  return { match, totalEntries, serverNow };
}

export async function savePredictionMatch(matchData: {
  id?: string;
  homeTeam?: string;
  awayTeam?: string;
  competition?: string;
  kickoffAt: string;
  prizeDescription?: string;
  players: MatchPlayer[];
}): Promise<{ success: boolean; status?: number; match?: PredictionMatch; warning?: string; error?: string }> {
  getAdminDb();

  const homeTeam = typeof matchData.homeTeam === "string" ? matchData.homeTeam.trim() : "";
  const awayTeam = typeof matchData.awayTeam === "string" ? matchData.awayTeam.trim() : "";
  if (!homeTeam || !awayTeam) {
    return { success: false, status: 400, error: "homeTeam and awayTeam are required." };
  }

  if (!matchData.kickoffAt || typeof matchData.kickoffAt !== "string") {
    return { success: false, status: 400, error: "kickoffAt is required." };
  }

  const kickoffDate = new Date(matchData.kickoffAt);
  if (isNaN(kickoffDate.getTime())) {
    return { success: false, status: 400, error: "Invalid kickoffAt timestamp." };
  }

  if (!Array.isArray(matchData.players) || matchData.players.length === 0) {
    return { success: false, status: 400, error: "A non-empty list of players is required." };
  }
  for (const p of matchData.players) {
    if (!p || typeof p.name !== "string" || !p.name.trim()) {
      return { success: false, status: 400, error: "Every player must have a non-empty string name." };
    }
  }

  const sanitizedPlayers: MatchPlayer[] = matchData.players.map(p => ({
    ...p,
    name: p.name.trim()
  }));

  const competition = (typeof matchData.competition === "string" && matchData.competition.trim())
    ? matchData.competition.trim()
    : "Premier Matchday";

  const prizeDescription = (typeof matchData.prizeDescription === "string" && matchData.prizeDescription.trim())
    ? matchData.prizeDescription.trim()
    : "1 Year of Free Buna Single-Origin Coffee";

  let warning: string | undefined;
  if (kickoffDate.getUTCDay() !== 6) {
    warning = "Notice: The kickoff date is not on a Saturday.";
  }

  const weekKey = getIsoWeekKey(kickoffDate);
  const isEditing = Boolean(matchData.id);
  const matchId = matchData.id || "match_" + Date.now();

  let existing: PredictionMatch | null = null;
  if (isEditing) {
    existing = await getPredictionMatch(matchId);
    if (!existing) {
      return { success: false, status: 404, error: "Match not found to edit." };
    }
    const now = new Date();
    if (now >= new Date(existing.kickoffAt)) {
      return { success: false, status: 400, error: "Cannot edit match after kickoff." };
    }
  }

  // Reject creating a second non-void match with the same weekKey (409)
  const allMatches = await getAllPredictionMatches();
  const duplicateWeek = allMatches.some(m => m.id !== matchId && m.weekKey === weekKey && m.status !== "void");
  if (duplicateWeek) {
    return { success: false, status: 409, error: `A match for week ${weekKey} already exists. Only one non-void match per week is permitted.` };
  }

  // Don't let editing turn a "void" or "settled" match back into "scheduled", and don't overwrite createdAt
  const status: "scheduled" | "settled" | "void" = existing && (existing.status === "void" || existing.status === "settled")
    ? existing.status
    : "scheduled";

  const createdAt = existing?.createdAt || new Date().toISOString();

  const match: PredictionMatch = {
    id: matchId,
    homeTeam,
    awayTeam,
    competition,
    kickoffAt: kickoffDate.toISOString(),
    status,
    prizeDescription,
    players: sanitizedPlayers,
    weekKey,
    createdAt,
    ...(existing?.settledAt ? { settledAt: existing.settledAt } : {}),
    ...(existing?.correctedAt ? { correctedAt: existing.correctedAt } : {}),
    ...(existing?.result ? { result: existing.result } : {}),
    ...(existing?.auditHistory ? { auditHistory: existing.auditHistory } : {})
  };

  const hasCredentials = checkHasLikelyCredentials();
  if (hasCredentials && isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.predictionMatches.doc(matchId).set(match, { merge: true });
    } catch (err) {
      logFirestoreFallback("savePredictionMatch", err);
      return { success: false, status: 503, error: "Please try again" };
    }
  }

  const idx = memoryState.predictionMatches.findIndex(m => m.id === matchId);
  if (idx >= 0) {
    memoryState.predictionMatches[idx] = match;
  } else {
    memoryState.predictionMatches.unshift(match);
  }

  return { success: true, match, warning };
}

export async function voidPredictionMatch(matchId: string): Promise<{ success: boolean; status?: number; match?: PredictionMatch; error?: string }> {
  getAdminDb();
  const match = await getPredictionMatch(matchId);
  if (!match) {
    return { success: false, status: 404, error: "Match not found." };
  }

  match.status = "void";

  const hasCredentials = checkHasLikelyCredentials();
  if (hasCredentials && isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.predictionMatches.doc(matchId).set({ status: "void" }, { merge: true });
    } catch (err) {
      logFirestoreFallback("voidPredictionMatch", err);
      return { success: false, status: 503, error: "Please try again" };
    }
  }

  const idx = memoryState.predictionMatches.findIndex(m => m.id === matchId);
  if (idx >= 0) {
    memoryState.predictionMatches[idx].status = "void";
  }

  return { success: true, match };
}

export function generateCrockfordClaimCode(): string {
  const CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = crypto.randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

export async function getUserPrediction(matchId: string, uid: string): Promise<Prediction | null> {
  getAdminDb();
  const docId = `${matchId}_${uid}`;
  let pred: Prediction | null = null;
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.doc(docId).get();
      if (snap.exists) {
        pred = snap.data() as Prediction;
      }
    } catch (err) {
      if (!checkHasLikelyCredentials()) {
        isFirestoreAvailable = false;
      }
      logFirestoreFallback("getUserPrediction", err);
    }
  }
  if (!pred) {
    pred = memoryState.predictions.find(p => p.matchId === matchId && p.uid === uid) || null;
  }
  if (pred) {
    if (pred.grandPrizeWinner && !pred.claimCode) {
      pred.claimCode = generateCrockfordClaimCode();
    } else if (!pred.grandPrizeWinner) {
      delete pred.claimCode;
    }
  }
  return pred;
}

export async function saveUserPrediction(
  matchId: string,
  uid: string,
  displayName: string,
  data: {
    outcome: string;
    scoreline: string;
    playerName: string;
    playerGoals: number;
  },
  email?: string
): Promise<{ success: boolean; status?: number; error?: string; prediction?: Prediction; serverNow: string }> {
  const db = getAdminDb();
  const serverNow = new Date().toISOString();

  // Validate Leg 1
  if (!data || typeof data.outcome !== "string" || !["HOME", "AWAY", "DRAW"].includes(data.outcome.trim())) {
    return { success: false, status: 400, error: "Invalid outcome. Must be HOME, AWAY, or DRAW.", serverNow };
  }
  const cleanOutcome = data.outcome.trim() as "HOME" | "AWAY" | "DRAW";

  // Validate Leg 2: strictly string "Home:Away" with /^(0|[1-9][0-9]?):(0|[1-9][0-9]?)$/
  const scorelinePattern = /^(0|[1-9][0-9]?):(0|[1-9][0-9]?)$/;
  if (typeof data.scoreline !== "string" || !scorelinePattern.test(data.scoreline.trim())) {
    return { success: false, status: 400, error: "Invalid scoreline format. Must be strictly 'Home:Away' (e.g. '3:1' or '0:0' without spaces or leading zeros).", serverNow };
  }
  const cleanScoreline = data.scoreline.trim();

  // Validate Leg 3
  if (typeof data.playerName !== "string" || !data.playerName.trim()) {
    return { success: false, status: 400, error: "Player name is required and must be a non-empty string.", serverNow };
  }
  const trimmedPlayerName = data.playerName.trim();

  const playerGoals = Number(data.playerGoals);
  if (data.playerGoals === undefined || data.playerGoals === null || !Number.isInteger(playerGoals) || playerGoals < 0 || playerGoals > 10) {
    return { success: false, status: 400, error: "Invalid player goals. Must be an integer between 0 and 10.", serverNow };
  }

  const docId = `${matchId}_${uid}`;
  const hasCredentials = checkHasLikelyCredentials();

  // Firestore transaction if credentials exist
  if (hasCredentials) {
    if (!db || !COLLECTIONS) {
      return { success: false, status: 503, error: "Please try again", serverNow };
    }
    try {
      const result = await db.runTransaction(async (transaction) => {
        const matchRef = COLLECTIONS.predictionMatches.doc(matchId);
        const matchSnap = await transaction.get(matchRef);
        if (!matchSnap.exists) {
          return { success: false, status: 404, error: "Match not found." };
        }
        const match = matchSnap.data() as PredictionMatch;

        if (match.status !== "scheduled") {
          return { success: false, status: 400, error: `Match is currently ${match.status} and cannot accept predictions.` };
        }

        const now = new Date();
        const kickoff = new Date(match.kickoffAt);
        if (now >= kickoff) {
          return { success: false, status: 403, error: "Kickoff has passed. Predictions for this match are locked." };
        }

        // Canonicalise playerName to roster's exact spelling (case-insensitive, trimmed match)
        const rosterPlayer = match.players?.find(p => p.name.trim().toLowerCase() === trimmedPlayerName.toLowerCase());
        if (!rosterPlayer) {
          return { success: false, status: 400, error: "Selected player is not in this match roster." };
        }
        const canonicalPlayerName = rosterPlayer.name.trim();

        const predRef = COLLECTIONS.predictions.doc(docId);
        const existingSnap = await transaction.get(predRef);
        const existingData = existingSnap.exists ? (existingSnap.data() as Prediction) : null;
        const nowIso = now.toISOString();
        const cleanEmail = email?.trim() || existingData?.email || undefined;

        const prediction: Prediction = {
          matchId,
          uid,
          displayName: displayName || "Explorer",
          ...(cleanEmail ? { email: cleanEmail } : {}),
          outcome: cleanOutcome,
          scoreline: cleanScoreline,
          playerName: canonicalPlayerName,
          playerGoals,
          submittedAt: existingData ? existingData.submittedAt : nowIso,
          updatedAt: nowIso
        };

        transaction.set(predRef, prediction);
        return { success: true, prediction };
      });

      if (result.success && result.prediction) {
        const memIdx = memoryState.predictions.findIndex(p => p.matchId === matchId && p.uid === uid);
        if (memIdx >= 0) {
          memoryState.predictions[memIdx] = result.prediction;
        } else {
          memoryState.predictions.push(result.prediction);
        }
      }
      return { ...result, serverNow };
    } catch (err: any) {
      logFirestoreFallback("saveUserPrediction transaction", err);
      // Return 503 without falling back to memory when credentials are configured
      return { success: false, status: 503, error: "Please try again", serverNow };
    }
  }

  // Memory fallback ONLY when no credentials are configured (local dev)
  const match = memoryState.predictionMatches.find(m => m.id === matchId);
  if (!match) {
    return { success: false, status: 404, error: "Match not found.", serverNow };
  }
  if (match.status !== "scheduled") {
    return { success: false, status: 400, error: `Match is ${match.status} and cannot accept predictions.`, serverNow };
  }

  const now = new Date();
  const kickoff = new Date(match.kickoffAt);
  if (now >= kickoff) {
    return { success: false, status: 403, error: "Kickoff has passed. Predictions for this match are locked.", serverNow };
  }

  const rosterPlayer = match.players?.find(p => p.name.trim().toLowerCase() === trimmedPlayerName.toLowerCase());
  if (!rosterPlayer) {
    return { success: false, status: 400, error: "Selected player is not in this match roster.", serverNow };
  }
  const canonicalPlayerName = rosterPlayer.name.trim();

  const nowIso = now.toISOString();
  const existingIndex = memoryState.predictions.findIndex(p => p.matchId === matchId && p.uid === uid);
  const existingPred = existingIndex >= 0 ? memoryState.predictions[existingIndex] : null;
  const cleanEmail = email?.trim() || existingPred?.email || undefined;

  const prediction: Prediction = {
    matchId,
    uid,
    displayName: displayName || "Explorer",
    ...(cleanEmail ? { email: cleanEmail } : {}),
    outcome: cleanOutcome,
    scoreline: cleanScoreline,
    playerName: canonicalPlayerName,
    playerGoals,
    submittedAt: existingPred ? existingPred.submittedAt : nowIso,
    updatedAt: nowIso
  };

  if (existingIndex >= 0) {
    memoryState.predictions[existingIndex] = prediction;
  } else {
    memoryState.predictions.push(prediction);
  }

  return { success: true, prediction, serverNow };
}

export async function settlePredictionMatch(
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  playerGoals: Record<string, number>,
  options?: { correction?: boolean }
): Promise<{ success: boolean; status?: number; match?: PredictionMatch; stats?: any; error?: string }> {
  const db = getAdminDb();
  const match = await getPredictionMatch(matchId);
  if (!match) {
    return { success: false, status: 404, error: "Match not found." };
  }

  if (match.status === "void") {
    return { success: false, status: 400, error: "Cannot settle a void match." };
  }

  // Refuse to settle before kickoffAt
  const now = new Date();
  if (now < new Date(match.kickoffAt)) {
    return { success: false, status: 400, error: "Cannot settle match before kickoff time." };
  }

  const isCorrection = Boolean(options?.correction);

  // Accidental re-settlement prevention: return 409 if already settled unless deliberate correction
  if (match.status === "settled" && !isCorrection) {
    return {
      success: false,
      status: 409,
      error: "Match is already settled. To update results, a deliberate correction must be requested."
    };
  }

  const actualOutcome = homeGoals > awayGoals ? "HOME" : homeGoals < awayGoals ? "AWAY" : "DRAW";
  const exactScoreline = `${homeGoals}:${awayGoals}`;

  // Fetch all predictions for this match
  let predictions: Prediction[] = [];
  const hasCredentials = checkHasLikelyCredentials();

  if (hasCredentials && isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("matchId", "==", matchId).get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      logFirestoreFallback("settlePredictionMatch get preds", err);
      return { success: false, status: 503, error: "Failed to load predictions for match settlement. Please try again." };
    }
  } else {
    predictions = memoryState.predictions.filter(p => p.matchId === matchId);
  }

  // If deliberate correction, disallow if any prediction has prizeCollected === true
  if (isCorrection) {
    const anyPrizeCollected = predictions.some(p => p.prizeCollected === true);
    if (anyPrizeCollected) {
      return {
        success: false,
        status: 409,
        error: "Cannot correct match results: one or more grand prize winners have already collected their prize."
      };
    }
  }

  // Store settledAt (and correctedAt)
  const nowIso = now.toISOString();
  if (!match.settledAt) {
    match.settledAt = nowIso;
  }
  if (isCorrection) {
    match.correctedAt = nowIso;
  }

  // Leg 3 names: compare canonical names
  const canonicalGoalsMap = new Map<string, number>();
  for (const [rawName, goals] of Object.entries(playerGoals || {})) {
    const trimmed = rawName.trim().toLowerCase();
    const rosterPlayer = match.players?.find(pl => pl.name.trim().toLowerCase() === trimmed);
    const key = rosterPlayer ? rosterPlayer.name.trim().toLowerCase() : trimmed;
    canonicalGoalsMap.set(key, Number(goals) || 0);
  }

  let leg1CorrectCount = 0;
  let leg2CorrectCount = 0;
  let leg3CorrectCount = 0;
  let grandPrizeWinnersCount = 0;

  const settledPredictions: Prediction[] = predictions.map(p => {
    const leg1Correct = p.outcome === actualOutcome;
    const leg2Correct = p.scoreline === exactScoreline;
    const expectedGoals = canonicalGoalsMap.get(p.playerName.trim().toLowerCase()) ?? 0;
    const leg3Correct = Number(p.playerGoals) === expectedGoals;
    const legsCorrect = (leg1Correct ? 1 : 0) + (leg2Correct ? 1 : 0) + (leg3Correct ? 1 : 0);
    const grandPrizeWinner = legsCorrect === 3;
    const claimCode = grandPrizeWinner ? (p.claimCode || generateCrockfordClaimCode()) : undefined;

    if (leg1Correct) leg1CorrectCount++;
    if (leg2Correct) leg2CorrectCount++;
    if (leg3Correct) leg3CorrectCount++;
    if (grandPrizeWinner) grandPrizeWinnersCount++;

    const updated: Prediction = {
      ...p,
      leg1Correct,
      leg2Correct,
      leg3Correct,
      legsCorrect,
      grandPrizeWinner,
      prizeCollected: p.prizeCollected || false
    };

    if (claimCode) {
      updated.claimCode = claimCode;
    } else {
      delete updated.claimCode;
    }

    return updated;
  });

  const updatedResult: MatchResult = {
    homeGoals,
    awayGoals,
    playerGoals
  };

  match.status = "settled";
  match.result = updatedResult;

  // Persist writes in chunks of 400 documents
  if (hasCredentials) {
    if (!db || !COLLECTIONS) {
      return { success: false, status: 503, error: "Database not available. Please try again." };
    }
    try {
      const matchUpdates: any = {
        status: "settled",
        result: updatedResult,
        settledAt: match.settledAt
      };
      if (match.correctedAt) {
        matchUpdates.correctedAt = match.correctedAt;
      }

      type BatchOp = { ref: FirebaseFirestore.DocumentReference; data: any };
      const ops: BatchOp[] = [
        { ref: COLLECTIONS.predictionMatches.doc(matchId), data: matchUpdates }
      ];

      for (const sp of settledPredictions) {
        ops.push({
          ref: COLLECTIONS.predictions.doc(`${matchId}_${sp.uid}`),
          data: sp
        });
      }

      const CHUNK_SIZE = 400;
      for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
        const chunk = ops.slice(i, i + CHUNK_SIZE);
        const batch = db.batch();
        for (const op of chunk) {
          batch.set(op.ref, op.data, { merge: true });
        }
        await batch.commit();
      }
    } catch (err: any) {
      logFirestoreFallback("settlePredictionMatch commit", err);
      return { success: false, status: 503, error: "Failed to persist settlement writes to database. Please try again." };
    }
  }

  // Persist to memory
  const mIdx = memoryState.predictionMatches.findIndex(m => m.id === matchId);
  if (mIdx >= 0) {
    memoryState.predictionMatches[mIdx] = match;
  }
  settledPredictions.forEach(sp => {
    const pIdx = memoryState.predictions.findIndex(p => p.matchId === matchId && p.uid === sp.uid);
    if (pIdx >= 0) {
      memoryState.predictions[pIdx] = sp;
    } else {
      memoryState.predictions.push(sp);
    }
  });

  const stats = {
    totalEntries: settledPredictions.length,
    leg1CorrectCount,
    leg2CorrectCount,
    leg3CorrectCount,
    grandPrizeWinnersCount
  };

  return { success: true, match, stats };
}

export async function correctPredictionMatchResult(
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  playerGoals: Record<string, number>,
  reason: string,
  adminEmail: string
): Promise<{ success: boolean; status?: number; match?: PredictionMatch; stats?: any; error?: string }> {
  const match = await getPredictionMatch(matchId);
  if (!match) {
    return { success: false, status: 404, error: "Match not found to correct." };
  }

  if (match.status !== "settled") {
    return { success: false, status: 400, error: "Only settled matches can have results corrected with audit history." };
  }

  const settleRes = await settlePredictionMatch(matchId, homeGoals, awayGoals, playerGoals, { correction: true });
  if (!settleRes.success) {
    return settleRes;
  }

  const auditEntry: MatchAuditEntry = {
    id: "audit_" + Date.now(),
    changedAt: new Date().toISOString(),
    adminEmail: adminEmail || "pin-admin",
    reason: reason.trim() || "VAR correction / Official score revision",
    previousResult: match.result ? JSON.parse(JSON.stringify(match.result)) : undefined,
    newResult: {
      homeGoals,
      awayGoals,
      playerGoals
    },
    affectedWinnersCount: settleRes.stats?.grandPrizeWinnersCount || 0
  };

  if (!match.auditHistory) {
    match.auditHistory = [];
  }
  match.auditHistory.unshift(auditEntry);

  const hasCredentials = checkHasLikelyCredentials();
  if (hasCredentials && isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.predictionMatches.doc(matchId).set({ auditHistory: match.auditHistory }, { merge: true });
    } catch (e) {
      logFirestoreFallback("correctPredictionMatchResult audit", e);
    }
  }

  return settleRes;
}

export async function getMatchStats(matchId: string): Promise<{
  totalEntries: number;
  leg1CorrectCount: number;
  leg2CorrectCount: number;
  leg3CorrectCount: number;
  grandPrizeWinnersCount: number;
}> {
  getAdminDb();
  let predictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("matchId", "==", matchId).get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      predictions = memoryState.predictions.filter(p => p.matchId === matchId);
    }
  } else {
    predictions = memoryState.predictions.filter(p => p.matchId === matchId);
  }

  return {
    totalEntries: predictions.length,
    leg1CorrectCount: predictions.filter(p => p.leg1Correct).length,
    leg2CorrectCount: predictions.filter(p => p.leg2Correct).length,
    leg3CorrectCount: predictions.filter(p => p.leg3Correct).length,
    grandPrizeWinnersCount: predictions.filter(p => p.grandPrizeWinner).length
  };
}

export async function getMatchWinners(matchId: string): Promise<Array<{
  displayName: string;
  prizeCollected: boolean;
}>> {
  getAdminDb();
  let predictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("matchId", "==", matchId).where("grandPrizeWinner", "==", true).get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      predictions = memoryState.predictions.filter(p => p.matchId === matchId && p.grandPrizeWinner);
    }
  } else {
    predictions = memoryState.predictions.filter(p => p.matchId === matchId && p.grandPrizeWinner);
  }

  return predictions.map(p => ({
    displayName: formatWinnerName(p.displayName),
    prizeCollected: Boolean(p.prizeCollected)
  }));
}

export async function getAdminMatchWinners(matchId: string): Promise<Array<{
  uid: string;
  displayName: string;
  email: string;
  prizeCollected: boolean;
  prizeCollectedAt?: string;
  collectedAt?: string;
  collectedBy?: string;
  claimCode: string;
}>> {
  getAdminDb();
  let predictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("matchId", "==", matchId).where("grandPrizeWinner", "==", true).get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      predictions = memoryState.predictions.filter(p => p.matchId === matchId && p.grandPrizeWinner);
    }
  } else {
    predictions = memoryState.predictions.filter(p => p.matchId === matchId && p.grandPrizeWinner);
  }

  const registeredUsers = await getRegisteredUsers();
  const userMap = new Map<string, string>();
  registeredUsers.forEach(u => {
    if (u.id && u.email) userMap.set(u.id, u.email);
  });

  return predictions.map(p => ({
    uid: p.uid,
    displayName: p.displayName,
    email: p.email || userMap.get(p.uid) || "",
    prizeCollected: Boolean(p.prizeCollected),
    prizeCollectedAt: p.prizeCollectedAt || p.collectedAt,
    collectedAt: p.collectedAt || p.prizeCollectedAt,
    collectedBy: p.collectedBy,
    claimCode: p.claimCode || generateCrockfordClaimCode()
  }));
}

export async function getMatchEntries(matchId: string): Promise<Array<{
  uid: string;
  displayName: string;
  email: string;
  outcome: "HOME" | "AWAY" | "DRAW";
  scoreline: string;
  playerName: string;
  playerGoals: number;
  submittedAt: string;
  updatedAt: string;
  leg1Correct?: boolean;
  leg2Correct?: boolean;
  leg3Correct?: boolean;
  legsCorrect?: number;
  grandPrizeWinner?: boolean;
  prizeCollected?: boolean;
  collectedAt?: string;
  claimCode?: string;
}>> {
  getAdminDb();
  let predictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("matchId", "==", matchId).get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      predictions = memoryState.predictions.filter(p => p.matchId === matchId);
    }
  } else {
    predictions = memoryState.predictions.filter(p => p.matchId === matchId);
  }

  const registeredUsers = await getRegisteredUsers();
  const userMap = new Map<string, string>();
  registeredUsers.forEach(u => {
    if (u.id && u.email) userMap.set(u.id, u.email);
  });

  return predictions.map(p => ({
    uid: p.uid,
    displayName: p.displayName,
    email: p.email || userMap.get(p.uid) || "",
    outcome: p.outcome,
    scoreline: p.scoreline,
    playerName: p.playerName,
    playerGoals: p.playerGoals,
    submittedAt: p.submittedAt,
    updatedAt: p.updatedAt,
    leg1Correct: p.leg1Correct,
    leg2Correct: p.leg2Correct,
    leg3Correct: p.leg3Correct,
    legsCorrect: p.legsCorrect,
    grandPrizeWinner: p.grandPrizeWinner,
    prizeCollected: p.prizeCollected,
    collectedAt: p.collectedAt || p.prizeCollectedAt,
    claimCode: p.grandPrizeWinner ? (p.claimCode || generateCrockfordClaimCode()) : undefined
  }));
}

export async function markPredictionPrizeCollected(
  matchId: string,
  uid: string,
  collected: boolean = true,
  adminEmail: string = "pin-admin"
): Promise<{ success: boolean; status?: number; error?: string; prediction?: Prediction }> {
  getAdminDb();
  const docId = `${matchId}_${uid}`;
  const nowIso = new Date().toISOString();
  const hasCredentials = checkHasLikelyCredentials();

  if (hasCredentials) {
    if (!COLLECTIONS) {
      return { success: false, status: 503, error: "Database not available" };
    }
    try {
      const docRef = COLLECTIONS.predictions.doc(docId);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { success: false, status: 404, error: "Prediction not found." };
      }
      const data = snap.data() as Prediction;
      if (data.matchId !== matchId || !data.grandPrizeWinner) {
        return { success: false, status: 404, error: "Prediction not eligible for prize collection: not a grand prize winner or does not match matchId." };
      }

      const updates: any = {
        prizeCollected: collected,
        collectedAt: collected ? nowIso : null,
        prizeCollectedAt: collected ? nowIso : null,
        collectedBy: collected ? adminEmail : null
      };

      // Use update() to never create a stub document
      await docRef.update(updates);

      const updatedPred: Prediction = {
        ...data,
        ...updates
      };
      if (!collected) {
        delete updatedPred.collectedAt;
        delete updatedPred.prizeCollectedAt;
        delete updatedPred.collectedBy;
      }

      const pIdx = memoryState.predictions.findIndex(p => p.matchId === matchId && p.uid === uid);
      if (pIdx >= 0) {
        memoryState.predictions[pIdx] = updatedPred;
      }

      return { success: true, prediction: updatedPred };
    } catch (err: any) {
      logFirestoreFallback("markPredictionPrizeCollected", err);
      return { success: false, status: 503, error: "Failed to update prize status. Please try again." };
    }
  }

  // Memory fallback only when no credentials exist
  const pIdx = memoryState.predictions.findIndex(p => p.matchId === matchId && p.uid === uid);
  if (pIdx < 0) {
    return { success: false, status: 404, error: "Prediction not found." };
  }

  const pred = memoryState.predictions[pIdx];
  if (pred.matchId !== matchId || !pred.grandPrizeWinner) {
    return { success: false, status: 404, error: "Prediction not eligible for prize collection." };
  }

  pred.prizeCollected = collected;
  if (collected) {
    pred.collectedAt = nowIso;
    pred.prizeCollectedAt = nowIso;
    pred.collectedBy = adminEmail;
  } else {
    delete pred.collectedAt;
    delete pred.prizeCollectedAt;
    delete pred.collectedBy;
  }

  return { success: true, prediction: pred };
}

export async function verifyPredictionClaim(claimCode: string): Promise<{
  success: boolean;
  status?: number;
  prediction?: Prediction;
  match?: PredictionMatch;
  error?: string;
}> {
  getAdminDb();
  const cleanCode = (claimCode || "").trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, status: 400, error: "Please provide a valid claim reference code." };
  }

  let prediction: Prediction | null = null;
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      // Query ONLY by claimCode (do not accept raw docId or unverified user prediction IDs)
      const snap = await COLLECTIONS.predictions.where("claimCode", "==", cleanCode).limit(1).get();
      if (!snap.empty) {
        prediction = snap.docs[0].data() as Prediction;
      }
    } catch (err) {
      logFirestoreFallback("verifyPredictionClaim", err);
    }
  }

  if (!prediction) {
    prediction = memoryState.predictions.find(
      p => p.claimCode === cleanCode
    ) || null;
  }

  if (!prediction || !prediction.grandPrizeWinner) {
    return { success: false, status: 404, error: `No winning prediction found matching claim code "${cleanCode}".` };
  }

  const match = await getPredictionMatch(prediction.matchId);
  return { success: true, prediction, match: match || undefined };
}

export async function redeemPredictionPrize(
  claimCode: string,
  adminEmail: string
): Promise<{ success: boolean; status?: number; prediction?: Prediction; error?: string }> {
  const verify = await verifyPredictionClaim(claimCode);
  if (!verify.success || !verify.prediction) {
    return { success: false, status: verify.status || 404, error: verify.error || "Prediction not found." };
  }

  const pred = verify.prediction;
  if (!pred.grandPrizeWinner) {
    return { success: false, status: 400, error: "This prediction did not qualify for the grand prize (not all 3 legs were correct)." };
  }

  if (pred.prizeCollected) {
    const collectedDateStr = pred.prizeCollectedAt ? new Date(pred.prizeCollectedAt).toLocaleString() : "previously";
    return {
      success: false,
      status: 409,
      error: `⚠️ Duplicate Claim Attempt: This prize was ALREADY claimed on ${collectedDateStr} (Redeemed by: ${pred.collectedBy || 'Staff'}). It cannot be redeemed twice.`
    };
  }

  return markPredictionPrizeCollected(pred.matchId, pred.uid, true, adminEmail);
}

export async function getUserAllPredictions(uid: string): Promise<UserPredictionSummary[]> {
  getAdminDb();
  let userPredictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.where("uid", "==", uid).get();
      userPredictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      userPredictions = memoryState.predictions.filter(p => p.uid === uid);
    }
  } else {
    userPredictions = memoryState.predictions.filter(p => p.uid === uid);
  }

  const allMatches = await getAllPredictionMatches();
  const matchMap = new Map<string, PredictionMatch>();
  allMatches.forEach(m => matchMap.set(m.id, m));

  const summaries: UserPredictionSummary[] = userPredictions.map(p => {
    const match = matchMap.get(p.matchId);
    return {
      ...p,
      claimCode: p.grandPrizeWinner ? (p.claimCode || generateCrockfordClaimCode()) : undefined,
      match
    };
  });

  // Sort by kickoff date descending
  summaries.sort((a, b) => {
    const timeA = a.match ? new Date(a.match.kickoffAt).getTime() : new Date(a.submittedAt).getTime();
    const timeB = b.match ? new Date(b.match.kickoffAt).getTime() : new Date(b.submittedAt).getTime();
    return timeB - timeA;
  });

  return summaries;
}

export async function getAllPredictionsAdmin(filter?: {
  weekKey?: string;
  matchId?: string;
  status?: string;
  isWinner?: boolean;
  search?: string;
}): Promise<Array<Prediction & { match?: PredictionMatch; registeredEmail?: string }>> {
  getAdminDb();
  let predictions: Prediction[] = [];
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.predictions.get();
      predictions = snap.docs.map(d => d.data() as Prediction);
    } catch (err) {
      predictions = memoryState.predictions;
    }
  } else {
    predictions = memoryState.predictions;
  }

  const allMatches = await getAllPredictionMatches();
  const matchMap = new Map<string, PredictionMatch>();
  allMatches.forEach(m => matchMap.set(m.id, m));

  const registeredUsers = await getRegisteredUsers();
  const userMap = new Map<string, RegisteredUser>();
  registeredUsers.forEach(u => userMap.set(u.id, u));

  let results = predictions.map(p => {
    const match = matchMap.get(p.matchId);
    const reg = userMap.get(p.uid);
    return {
      ...p,
      claimCode: p.grandPrizeWinner ? (p.claimCode || generateCrockfordClaimCode()) : undefined,
      match,
      registeredEmail: reg?.email
    };
  });

  if (filter?.matchId) {
    results = results.filter(p => p.matchId === filter.matchId);
  }
  if (filter?.weekKey) {
    results = results.filter(p => p.match?.weekKey === filter.weekKey);
  }
  if (filter?.status) {
    if (filter.status === "winner") {
      results = results.filter(p => p.grandPrizeWinner);
    } else if (filter.status === "claimed") {
      results = results.filter(p => p.prizeCollected);
    } else if (filter.status === "unclaimed") {
      results = results.filter(p => p.grandPrizeWinner && !p.prizeCollected);
    } else if (filter.status === "pending") {
      results = results.filter(p => p.match?.status === "scheduled");
    }
  }
  if (filter?.isWinner !== undefined) {
    results = results.filter(p => Boolean(p.grandPrizeWinner) === filter.isWinner);
  }
  if (filter?.search) {
    const term = filter.search.toLowerCase().trim();
    results = results.filter(
      p =>
        p.displayName.toLowerCase().includes(term) ||
        (p.claimCode && p.claimCode.toLowerCase().includes(term)) ||
        (p.registeredEmail && p.registeredEmail.toLowerCase().includes(term)) ||
        p.uid.toLowerCase().includes(term)
    );
  }

  // Sort by updated timestamp desc
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return results;
}

// ==========================================
// 5. Registered Users API Helpers
// ==========================================
export async function getRegisteredUsers(): Promise<RegisteredUser[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.registeredUsers.get();
      if (!snap.empty) {
        const users = snap.docs.map(doc => doc.data() as RegisteredUser);
        memoryState.registeredUsers = users;
        return users;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getRegisteredUsers", err);
    }
  }
  return memoryState.registeredUsers;
}

export async function addRegisteredUser(user: RegisteredUser): Promise<void> {
  getAdminDb();
  memoryState.registeredUsers.unshift(user);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.registeredUsers.doc(user.id).set(user);
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("addRegisteredUser", err);
    }
  }
}

export async function updateRegisteredUser(id: string, updates: Partial<RegisteredUser>): Promise<void> {
  getAdminDb();
  memoryState.registeredUsers = memoryState.registeredUsers.map(u =>
    u.id === id ? { ...u, ...updates } : u
  );

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.registeredUsers.doc(id).set(updates, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("updateRegisteredUser", err);
    }
  }
}

export async function deleteRegisteredUser(id: string, userDeviceId?: string): Promise<void> {
  getAdminDb();
  const user = memoryState.registeredUsers.find(u => u.id === id);
  const devId = userDeviceId || user?.deviceId;
  const userEmail = user?.email?.toLowerCase();

  memoryState.registeredUsers = memoryState.registeredUsers.filter(u => u.id !== id);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.registeredUsers.doc(id).delete();
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("deleteRegisteredUser", err);
    }
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
    if (isFirestoreAvailable && COLLECTIONS) {
      try {
        await COLLECTIONS.loyaltyProfiles.doc(devKey).set(resetFlags, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  }

  if (userEmail) {
    const emailKey = `user_${userEmail}`;
    if (memoryState.loyaltyProfiles[emailKey]) {
      memoryState.loyaltyProfiles[emailKey] = { ...memoryState.loyaltyProfiles[emailKey], ...resetFlags };
    }
    if (isFirestoreAvailable && COLLECTIONS) {
      try {
        await COLLECTIONS.loyaltyProfiles.doc(emailKey).set(resetFlags, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  }
}

export async function resetUserSpin(id: string, userDeviceId?: string): Promise<void> {
  getAdminDb();
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
    if (isFirestoreAvailable && COLLECTIONS) {
      try {
        await COLLECTIONS.loyaltyProfiles.doc(devKey).set(profileSpinReset, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  }

  if (userEmail) {
    const emailKey = `user_${userEmail}`;
    if (memoryState.loyaltyProfiles[emailKey]) {
      memoryState.loyaltyProfiles[emailKey] = { ...memoryState.loyaltyProfiles[emailKey], ...profileSpinReset };
    }
    if (isFirestoreAvailable && COLLECTIONS) {
      try {
        await COLLECTIONS.loyaltyProfiles.doc(emailKey).set(profileSpinReset, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  }
}

// ==========================================
// 6. Orders API Helpers
// ==========================================
export async function getOrders(filter?: { email?: string; deviceId?: string }): Promise<Order[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.orders.orderBy("createdAt", "desc").get();
      if (!snap.empty) {
        const orders = snap.docs.map(doc => doc.data() as Order);
        memoryState.orders = orders;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getOrders", err);
    }
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
  getAdminDb();
  if (!memoryState.orders) memoryState.orders = [];
  memoryState.orders.unshift(order);

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.orders.doc(order.id).set(order);
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("createOrder", err);
    }
  }

  return order;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
  getAdminDb();
  if (!memoryState.orders) memoryState.orders = [];
  const order = memoryState.orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
  }

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.orders.doc(orderId).set({ status }, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("updateOrderStatus", err);
    }
  }

  return order || null;
}

// ==========================================
// 7. Shop Stats API Helpers
// ==========================================
export async function getShopStats(): Promise<ShopStats> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const doc = await COLLECTIONS.shopStats.doc("current").get();
      if (doc.exists) {
        const stats = doc.data() as ShopStats;
        memoryState.shopStats = stats;
        return stats;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getShopStats", err);
    }
  }
  return memoryState.shopStats;
}

export async function updateShopStats(updater: (current: ShopStats) => ShopStats): Promise<ShopStats> {
  getAdminDb();
  const current = await getShopStats();
  const next = updater({ ...current });
  memoryState.shopStats = next;

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.shopStats.doc("current").set(next);
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("updateShopStats", err);
    }
  }

  return next;
}

export async function addActivityLog(text: string): Promise<void> {
  getAdminDb();
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
  getAdminDb();
  const { key, userEmail, deviceId } = getLoyaltyProfileKey(req);

  let profile: LoyaltyProfile | null = null;

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const doc = await COLLECTIONS.loyaltyProfiles.doc(key).get();
      if (doc.exists) {
        profile = doc.data() as LoyaltyProfile;
      }
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("getProfile", err);
    }
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
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.loyaltyProfiles.doc(key).set(profile, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("saveProfile on getProfile", err);
    }
  }

  return profile;
}

export async function saveProfile(profile: LoyaltyProfile): Promise<void> {
  getAdminDb();
  const userEmail = (profile.customerEmail || "").trim().toLowerCase();
  const deviceId = profile.deviceId || "default-device";
  const sanitizedEmail = userEmail.replace(/\//g, "_");
  const key = userEmail ? `user_${sanitizedEmail}` : `dev_${deviceId}`;

  if (!memoryState.loyaltyProfiles) memoryState.loyaltyProfiles = {};
  memoryState.loyaltyProfiles[key] = profile;

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.loyaltyProfiles.doc(key).set(profile, { merge: true });
    } catch (err) {
      isFirestoreAvailable = false;
      logFirestoreFallback("saveProfile", err);
    }
  }
}

// ==========================================
// 9. Community Wall API Helpers (Unified community_posts collection)
// ==========================================
export async function getWallPosts(): Promise<WallPost[]> {
  getAdminDb();
  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      const snap = await COLLECTIONS.communityPosts.orderBy("createdAt", "desc").get();
      if (!snap.empty) {
        const posts: WallPost[] = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            author: data.author || "Anonymous",
            authorUid: data.authorUid || undefined,
            authorEmail: data.authorEmail || undefined,
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
      isFirestoreAvailable = false;
      logFirestoreFallback("getWallPosts", err);
    }
  }
  return memoryState.wallPosts;
}

export async function addWallPost(post: {
  author?: string;
  authorUid?: string;
  authorEmail?: string;
  avatar?: string;
  text: string;
  rating?: number;
  image?: string;
  category?: string;
}): Promise<WallPost> {
  getAdminDb();
  const now = new Date();
  const id = "p_" + Date.now();
  const newPost: WallPost = {
    id,
    author: post.author || "Coffee Lover",
    authorUid: post.authorUid,
    authorEmail: post.authorEmail,
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

  if (isFirestoreAvailable && COLLECTIONS) {
    try {
      await COLLECTIONS.communityPosts.doc(id).set({
        author: newPost.author,
        authorUid: newPost.authorUid || null,
        authorEmail: newPost.authorEmail || null,
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
      isFirestoreAvailable = false;
      logFirestoreFallback("addWallPost", err);
    }
  }

  return newPost;
}

// Full app state getter for compatibility
export async function getAppState(): Promise<AppState> {
  getAdminDb();
  const [
    menuItems,
    events,
    wallPosts,
    promotions,
    predictionMatches,
    registeredUsers,
    orders,
    shopStats
  ] = await Promise.all([
    getMenuItems(),
    getEvents(),
    getWallPosts(),
    getPromotions(),
    getAllPredictionMatches(),
    getRegisteredUsers(),
    getOrders(),
    getShopStats()
  ]);

  return {
    menuItems,
    events,
    wallPosts,
    promotions,
    predictionMatches,
    predictions: memoryState.predictions,
    registeredUsers,
    orders,
    shopStats,
    loyaltyProfile: memoryState.loyaltyProfile,
    loyaltyProfiles: memoryState.loyaltyProfiles
  };
}
