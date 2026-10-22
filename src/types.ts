export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: 'coffee' | 'traditional' | 'pastry' | 'merchandise';
  price: number;
  rating: number;
  ingredients: string[];
  calories: number;
  caffeine: number;
  image: string;
  soldOut: boolean;
  seasonal?: boolean;
}

export interface WallPost {
  id: string;
  author: string;
  authorUid?: string;
  authorEmail?: string;
  avatar: string;
  text: string;
  rating?: number;
  image?: string;
  date: string;
  likes: number;
  category: 'review' | 'photo' | 'latte-art' | 'story';
  createdAt?: string;
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
  category: 'class' | 'tasting' | 'music' | 'workshop';
}

export interface PassportRegion {
  id: string;
  name: string;
  elevation: string;
  process: string;
  notes: string[];
  farmer: string;
  history: string;
  drinks: string[];
  badgeName: string;
  image?: string;
}

export interface LoyaltyProfile {
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  streak: number;
  beansCount: number;
  stampsCount: number;
  passportStamps: string[];
  unlockedBadges: string[];
  referralCode: string;
  referralsCount: number;
  signedUp?: boolean;
  hasSpunWheel?: boolean;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  rafflePrize?: string;
  hasCollectedPrize?: boolean;
}

export interface AuthUser {
  role: 'guest' | 'user' | 'admin';
  name: string;
  email?: string;
  phone?: string;
}

export interface CartItem {
  id: string;
  menuItem?: MenuItem;
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
  items: CartItem[];
  totalPrice: number;
  status: 'Received' | 'Brewing' | 'Ready' | 'Completed';
  createdAt: string;
  isCustomBrew?: boolean;
}

export interface MatchPlayer {
  name: string;
  team: "home" | "away";
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  playerGoals: Record<string, number>;
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
}

export interface Prediction {
  matchId: string;
  uid: string;
  displayName: string;
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
}

export interface PredictionStats {
  totalEntries: number;
  leg1CorrectCount: number;
  leg2CorrectCount: number;
  leg3CorrectCount: number;
  grandPrizeWinnersCount: number;
}


