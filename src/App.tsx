import React, { useState, useEffect } from "react";
import { 
  Coffee, MapPin, Compass, Sparkles, Award, Users, ShieldAlert,
  Clock, Flame, RefreshCw, Star, Info, Bell, MessageSquare, Check, HelpCircle,
  User, ShieldCheck, LogIn, LogOut, Key, ChevronDown, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import DrinkBuilder from "./components/DrinkBuilder";
import EthiopianMap from "./components/EthiopianMap";
import RaffleWheel from "./components/RaffleWheel";
import BrewTimer from "./components/BrewTimer";
import AromaExplorer from "./components/AromaExplorer";
import CommunityWall from "./components/CommunityWall";
import RouletteGame from "./components/RouletteGame";
import CustomerLoyalty from "./components/CustomerLoyalty";
import CoffeeCupSVG from "./components/CoffeeCupSVG";
import LoginModal from "./components/LoginModal";
import OwnerDashboard from "./components/OwnerDashboard";
import { AnimatedCounter } from "./components/AnimatedCounter";
import BunaLogo from "./components/BunaLogo";
import { LoyaltyProfile, AuthUser } from "./types";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";

// Helper to get or generate client-side unique device ID
const getDeviceId = () => {
  let id = localStorage.getItem("buna_device_id");
  if (!id) {
    id = "buna_device_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("buna_device_id", id);
  }
  return id;
};

interface NavMenuItem {
  id: string;
  icon: string;
  label: string;
  shortLabel: string;
  desc: string;
  badge?: string;
  adminOnly?: boolean;
}

const ALL_MENU_CONFIG: NavMenuItem[] = [
  {
    id: "builder",
    icon: "☕",
    label: "Cup Builder",
    shortLabel: "Builder",
    desc: "Custom Buna roasts, spices & brewing styles",
  },
  {
    id: "map",
    icon: "🗺",
    label: "Interactive Origin Map",
    shortLabel: "Origin Map",
    desc: "Explore Ethiopian coffee terroirs & regions",
  },
  {
    id: "raffle",
    icon: "🎰",
    label: "Lucky Raffle",
    shortLabel: "Raffle",
    desc: "Daily spins for beans, discounts & prizes",
  },
  {
    id: "sensory",
    icon: "🎯",
    label: "Aroma & Brew Guide",
    shortLabel: "Brew Guide",
    desc: "Sensory tasting wheels, ratios & brew timers",
  },
  {
    id: "loyalty",
    icon: "📜",
    label: "Loyalty & Passport",
    shortLabel: "Passport",
    desc: "Digital stamps, beans & origin badges",
  },
  {
    id: "wall",
    icon: "✍",
    label: "Community Wall",
    shortLabel: "Wall",
    desc: "Stories, recipes & community feedback",
  },
  {
    id: "owner",
    icon: "👑",
    label: "Admin Operations",
    shortLabel: "Admin",
    desc: "Store controls, inventory & dashboard",
    badge: "Staff",
    adminOnly: true,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Auth & Login State: Default to Guest (Do NOT automatically sign in admin user!)
  const [authUser, setAuthUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem("buna_auth_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && (parsed.role === 'user' || parsed.role === 'admin')) return parsed;
      } catch (e) {}
    }
    return { role: 'guest', name: 'Guest Explorer' };
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load user loyalty profile and promo banner items
  const loadProfileAndPromos = (currentUser?: AuthUser) => {
    const user = currentUser !== undefined ? currentUser : authUser;
    const devId = getDeviceId();
    const headers: Record<string, string> = { "X-Device-ID": devId };
    if (user && user.role !== 'guest' && user.email) {
      headers["X-User-Email"] = user.email;
    }

    fetch("/api/loyalty", { headers })
      .then(res => res.json())
      .then(data => {
        setLoyalty(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });

    fetch("/api/promotions")
      .then(res => res.json())
      .then(data => {
        if (data && data.promotions) {
          setPromotions(data.promotions);
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    loadProfileAndPromos(authUser);
  }, [authUser?.email, authUser?.role]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const email = (fbUser.email || "").toLowerCase().trim();
        const isAdmin = email === "yared.abegaz@gmail.com";
        const targetUsername = isAdmin ? "yared.abegaz@gmail.com" : (fbUser.displayName || email.split("@")[0] || "Coffee Explorer");

        if (isAdmin) {
          try {
            const adminRes = await fetch("/api/owner/google-auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: "yared.abegaz@gmail.com", name: "yared.abegaz@gmail.com" })
            });
            const adminData = await adminRes.json();
            if (adminData?.token) {
              localStorage.setItem("buna_admin_token", adminData.token);
            }
          } catch (e) {
            console.warn("Admin token sync error:", e);
          }
        }

        const u: AuthUser = {
          role: isAdmin ? 'admin' : 'user',
          name: targetUsername,
          email: fbUser.email || targetUsername
        };
        setAuthUser(u);
        localStorage.setItem("buna_auth_user", JSON.stringify(u));
      } else {
        // Not authenticated via Firebase: remain as Guest Explorer
        const guest: AuthUser = { role: 'guest', name: 'Guest Explorer' };
        setAuthUser(guest);
        localStorage.removeItem("buna_auth_user");
        localStorage.removeItem("buna_admin_token");
      }
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // Callback to reward points and show beautiful animation toast
  const handleRewardPoints = async (pointsAdded: number, reason: string) => {
    try {
      const response = await fetch("/api/loyalty/add-points", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-ID": getDeviceId()
        },
        body: JSON.stringify({ points: pointsAdded, reason })
      });
      const data = await response.json();
      if (data.success) {
        setLoyalty(data.loyalty);
        triggerToast(`🎉 +${pointsAdded} Points: ${reason}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Called when drink ordered successfully
  const handleDrinkOrdered = (points: number, customMessage?: string) => {
    loadProfileAndPromos();
    triggerToast(customMessage || `☕ Order Placed! Earned +${points} points & 1 Virtual Bean!`);
  };

  // Called when profile saved or coupon claimed
  const handleLoyaltySync = (updatedLoyalty: LoyaltyProfile, message: string) => {
    setLoyalty(updatedLoyalty);
    triggerToast(message);
  };

  const handleStampPassport = async (regionName: string) => {
    try {
      const response = await fetch("/api/passport/stamp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-ID": getDeviceId()
        },
        body: JSON.stringify({ regionName })
      });
      const data = await response.json();
      if (data.success) {
        setLoyalty(data.loyalty);
        triggerToast(`🇪🇹 Passport stamped for ${regionName}! (+50 points)`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectRegionOnMap = (regionName: string) => {
    setActiveTab("map");
    // The map component has internal scrolling anchors or hooks
    setTimeout(() => {
      const mapEl = document.getElementById("interactive-origin-map");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleLoginSuccess = (user: AuthUser, messageMsg: string, updatedLoyalty?: LoyaltyProfile) => {
    setAuthUser(user);
    localStorage.setItem("buna_auth_user", JSON.stringify(user));
    if (updatedLoyalty) {
      setLoyalty(updatedLoyalty);
    } else {
      loadProfileAndPromos(user);
    }
    triggerToast(messageMsg);
  };

  const handleLogout = () => {
    fbSignOut(auth).catch(() => {});
    const guest: AuthUser = { role: 'guest', name: 'Guest Explorer' };
    setAuthUser(guest);
    localStorage.removeItem("buna_auth_user");
    localStorage.removeItem("buna_admin_token");
    if (activeTab === "owner") {
      setActiveTab("builder");
    }
    loadProfileAndPromos(guest);
    triggerToast("Signed out successfully. Now browsing as Guest.");
  };

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    setTimeout(() => {
      const el = document.getElementById(`tab-${tabKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 40);
  };

  const availableMenuItems = ALL_MENU_CONFIG.filter(
    (item) => !item.adminOnly || authUser.role === 'admin'
  );
  const currentMenuItem =
    availableMenuItems.find((item) => item.id === activeTab) || availableMenuItems[0];
  const TAB_KEYS = availableMenuItems.map((item) => item.id);

  const handleNavKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = TAB_KEYS.indexOf(activeTab);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (e.key === "ArrowRight") {
      newIndex = (currentIndex + 1) % TAB_KEYS.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = TAB_KEYS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = TAB_KEYS[newIndex];
    handleTabClick(nextTab);
    setTimeout(() => {
      const el = document.getElementById(`tab-${nextTab}`);
      if (el) el.focus();
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#122b1c] text-white font-sans selection:bg-[#2d824d] selection:text-white">
      
      {/* 1. TOP BRAND HEADER */}
      <header className="sticky top-0 z-50 bg-[#1a3e29]/95 backdrop-blur-xl border-b border-[#295a3d] px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Heritage Slogan */}
          <BunaLogo onClick={() => setActiveTab("builder")} />

          {/* AUTHENTICATION CONTROLS & GOOGLE SIGN IN */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile "All Menus" trigger button right in header */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-200 text-xs font-medium transition-all shadow-sm cursor-pointer shrink-0"
              aria-label="Open all menus"
            >
              <Menu size={13} className="text-[#42bd6c]" />
              <span className="text-[11px] font-semibold">Menus</span>
            </button>

            {authUser.role === 'admin' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-600/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 sm:gap-2 shadow-sm max-w-[130px] sm:max-w-xs">
                  <span className="text-xs sm:text-sm shrink-0">👑</span>
                  <span className="hidden md:inline text-stone-400 font-normal">Admin:</span>
                  <span className="text-white font-semibold font-mono text-[11px] sm:text-xs truncate">{authUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : authUser.role === 'user' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#122b1c] border border-[#295a3d] text-stone-200 text-xs font-medium flex items-center gap-1.5 sm:gap-2 shadow-sm max-w-[130px] sm:max-w-xs">
                  <div className="w-2 h-2 rounded-full bg-[#42bd6c] shrink-0" />
                  <span className="text-white font-semibold font-mono text-[11px] sm:text-xs truncate">{authUser.name || authUser.email || "Explorer"}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="header-google-signin"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition-all flex items-center gap-1.5 sm:gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden font-semibold">Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN NAVIGATION TAB BAR (Horizontal swipeable on mobile, full bar on md+) */}
      <nav aria-label="Main Application Navigation" className="sticky top-[49px] sm:top-[57px] z-40 bg-[#122b1c]/95 border-b border-[#295a3d] backdrop-blur-xl py-2 px-2 sm:py-2.5 sm:px-4 relative">
        {/* Mobile scroll indicator fade gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#122b1c] to-transparent lg:hidden z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#122b1c] to-transparent lg:hidden z-10" />
        
        <div 
          role="tablist" 
          aria-label="Navigation Tabs"
          onKeyDown={handleNavKeyDown}
          className="max-w-7xl mx-auto flex flex-nowrap lg:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none justify-start items-center scroll-smooth touch-pan-x px-1"
        >
          {availableMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            const isAdminItem = item.id === 'owner';
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-[#42bd6c] cursor-pointer ${
                  isActive 
                    ? (isAdminItem
                        ? "bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30" 
                        : "bg-gradient-to-r from-[#2d824d] to-[#42bd6c] text-white font-bold shadow-md shadow-[#2d824d]/30")
                    : (isAdminItem
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-600/30"
                        : "bg-[#1a3e29] text-stone-300 hover:text-white hover:bg-[#224e38] border border-[#295a3d]")
                }`}
              >
                <span>{item.icon}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] rounded-full bg-amber-400 text-stone-950 font-extrabold uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2c. MOBILE EXPANDABLE SHEET / BOTTOM DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="absolute inset-0" 
              onClick={() => setIsMobileMenuOpen(false)} 
              aria-hidden="true"
            />
            
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg bg-[#122b1c] border-t sm:border border-[#295a3d] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl text-stone-100 max-h-[85vh] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu Sheet"
            >
              {/* Sheet Drag Indicator */}
              <div className="w-12 h-1.5 bg-[#295a3d] rounded-full mx-auto mb-3 sm:hidden" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#295a3d] mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1a3e29] border border-[#295a3d] flex items-center justify-center text-[#42bd6c]">
                    <Compass size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">All Experience Menus</h3>
                    <p className="text-[11px] text-stone-400">All {availableMenuItems.length} sections are available</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#1a3e29] hover:bg-[#224e38] border border-[#295a3d] flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close menu sheet"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Menu Items List */}
              <div className="overflow-y-auto space-y-2 py-1 pr-1 overscroll-contain">
                {availableMenuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const isAdminItem = item.id === 'owner';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabClick(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                        isActive
                          ? isAdminItem
                            ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 text-white"
                            : "bg-[#1a3e29] border-[#42bd6c] shadow-md shadow-[#42bd6c]/10 text-white"
                          : "bg-[#163523]/70 hover:bg-[#1a3e29] border-[#295a3d] text-stone-300"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                        isActive 
                          ? isAdminItem
                            ? "bg-amber-500 text-stone-950 border-amber-400 font-bold"
                            : "bg-[#2d824d] text-white border-[#42bd6c]"
                          : "bg-[#1a3e29] border-[#295a3d]"
                      }`}>
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-stone-200"}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 leading-tight truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      {isActive ? (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border ${
                          isAdminItem
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "bg-[#42bd6c]/20 border-[#42bd6c]/40 text-[#42bd6c]"
                        }`}>
                          <Check size={12} />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="text-stone-500 shrink-0">
                          <ChevronDown size={16} className="-rotate-90" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sheet Footer */}
              <div className="mt-3 pt-3 border-t border-[#295a3d] flex items-center justify-between text-[11px] text-stone-400">
                <span>Traditional Ethiopian Ceremonial Roast</span>
                <span className="font-mono text-[#42bd6c]">100% Arabica</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. DYNAMIC FLOATING NOTIFICATION TOAST */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-28 inset-x-0 mx-auto max-w-md bg-[#1a3e29] border border-[#295a3d] text-[#42bd6c] rounded-2xl px-5 py-3.5 shadow-2xl z-50 flex items-center justify-between gap-3 text-xs font-mono font-bold"
          >
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-[#42bd6c] hover:text-white shrink-0">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. REDESIGNED HERO SECTION (HERITAGE CRAFT & HIGH-FIDELITY LAYOUT - SHOWN ONLY ON HOME / CUP BUILDER PAGE) */}
      {activeTab === "builder" && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1a3e29] via-[#122b1c] to-[#122b1c] border-b border-[#295a3d] py-12 lg:py-16 px-4 md:px-8">
          
          {/* Subtle Warm Spotlight Effects */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-[#2d824d]/20 blur-[120px]" />
            <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full bg-[#42bd6c]/10 blur-[140px]" />
          </div>

          <div className="relative max-w-7xl mx-auto z-10">
            
            {/* Main 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* LEFT COLUMN: HERO TYPOGRAPHY & BRANDING */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                
                {/* Heritage Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#224e38] border border-[#2d824d]/40 shadow-sm mb-6">
                  <span className="text-sm">🇪🇹</span>
                  <span className="text-[11px] font-mono text-[#42bd6c] uppercase tracking-widest font-semibold">
                    Celebrating 1,000+ Years of Coffee Culture
                  </span>
                </div>

                {/* Main Titles */}
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif-heritage font-black tracking-tight text-white mb-2 leading-none">
                  BUNA
                </h1>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-display italic font-medium text-[#42bd6c] mb-6 tracking-wide">
                  Discover Your Perfect Origin
                </h2>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-sans font-light tracking-wide max-w-2xl mb-8">
                  Buna is an interactive sensory experience platform. Travel across historical Ethiopian coffee terroirs, master the traditional ceremony, customize your cup with real-time health analytics, and collect digital stamps as you explore.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => handleTabClick("builder")}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#2d824d] via-[#42bd6c] to-[#2d824d] hover:from-[#226a3f] hover:to-[#226a3f] text-white font-bold text-sm transition-all shadow-lg shadow-[#2d824d]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5"
                  >
                    <Coffee size={18} />
                    <span>Start Customizing Cup</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("map")}
                    className="px-6 py-3.5 rounded-2xl bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span>🗺</span>
                    <span>Explore Terroir Map</span>
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: HIGH-FIDELITY COFFEE CUP GRAPHIC (NO TEXT BLEED) */}
              <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
                {/* Ken Burns-style Slow Zoom/Pan Atmospheric Background Layer */}
                <motion.div
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: [1, 1.15, 1.05, 1], rotate: [0, 3, -3, 0], x: [0, 8, -8, 0] }}
                  transition={{ duration: 25, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-tr from-[#2d824d]/30 via-emerald-800/20 to-transparent blur-3xl rounded-full scale-95 pointer-events-none"
                />
                
                {/* Cup Graphic Container */}
                <div className="relative w-full max-w-[380px] sm:max-w-[440px] aspect-square flex items-center justify-center">
                  <CoffeeCupSVG />
                </div>
              </div>

            </div>

            {/* UNIFIED HERO STATS CARDS DASHBOARD (MOBILE-FIRST RESPONSIVE GRID) */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mt-12 pt-8 border-t border-[#295a3d]">
              
              {/* Stat Card 1: Points */}
              <div className="bg-[#1a3e29] border border-[#295a3d] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-300 uppercase tracking-wider font-medium">Loyalty Points</span>
                  <div className="h-8 w-8 rounded-xl bg-[#2d824d]/20 border border-[#2d824d]/40 flex items-center justify-center text-[#42bd6c]">
                    <Award size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                    <AnimatedCounter value={loyalty ? loyalty.points : 240} />
                  </span>
                  <span className="text-[10px] font-mono text-[#42bd6c] font-semibold">Pts</span>
                </div>
                <p className="text-[10px] text-stone-300 font-sans mt-2">Level 2 Ethiopian Explorer</p>
              </div>

              {/* Stat Card 2: Digital Stamps */}
              <div className="bg-[#1a3e29] border border-[#295a3d] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-300 uppercase tracking-wider font-medium">Digital Stamps</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Award size={16} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                      <AnimatedCounter value={loyalty ? loyalty.stampsCount : 7} />/10
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {Math.min(100, Math.round(((loyalty?.stampsCount || 7) / 10) * 100))}%
                    </span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#122b1c] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#2d824d] to-[#42bd6c] rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((loyalty?.stampsCount || 7) / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat Card 3: Virtual Beans */}
              <div className="bg-[#1a3e29] border border-[#295a3d] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-300 uppercase tracking-wider font-medium">Virtual Beans</span>
                  <div className="h-8 w-8 rounded-xl bg-[#2d824d]/20 border border-[#2d824d]/40 flex items-center justify-center text-[#42bd6c]">
                    <Coffee size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-[#42bd6c] flex items-center gap-1.5">
                    <span>🫘</span> <AnimatedCounter value={loyalty ? loyalty.beansCount : 3} />
                  </span>
                </div>
                <p className="text-[10px] text-stone-300 font-sans mt-2">Ready to redeem reward</p>
              </div>

              {/* Stat Card 4: Daily Streak */}
              <div className="bg-[#1a3e29] border border-[#295a3d] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-300 uppercase tracking-wider font-medium">Daily Streak</span>
                  <div className="h-8 w-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Flame size={16} className="animate-pulse" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center gap-1">
                    <AnimatedCounter value={loyalty ? loyalty.streak : 5} />
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Days 🔥</span>
                </div>
                <p className="text-[10px] text-red-300 font-sans mt-2 font-medium">2x Loyalty Multiplier Active</p>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* 5. INTERACTIVE CONTENTS CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          
          {/* TAB: DRINK BUILDER */}
          {activeTab === "builder" && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col gap-1.5 max-w-3xl">
                <h3 className="text-2xl font-bold font-display text-white">Build Your Dream Coffee</h3>
                <p className="text-xs text-stone-400">Design your perfect coffee combination with local Ethiopian cardamoms, milks, and toppings. Calories, caffeine, and price update dynamically in real time.</p>
              </div>
              <DrinkBuilder onOrderSuccess={handleDrinkOrdered} />
            </motion.div>
          )}

          {/* TAB: INTERACTIVE MAP */}
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
              id="interactive-origin-map"
            >
              <div className="flex flex-col gap-1.5 max-w-3xl">
                <h3 className="text-2xl font-bold font-display text-white">Ethiopian Coffee Region Map</h3>
                <p className="text-xs text-stone-400">Click on historical microclimates and estates to explore elevation parameters, tasting notes, and farmer heritage. Stamp your passport by sampling their beans!</p>
              </div>
              <EthiopianMap onStampPassport={handleStampPassport} stampedRegions={loyalty?.passportStamps || []} />
            </motion.div>
          )}

          {/* TAB: LUCKY RAFFLE WHEEL */}
          {activeTab === "raffle" && loyalty && (
            <motion.div
              key="raffle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <RaffleWheel 
                loyalty={loyalty} 
                authUser={authUser}
                onOpenLogin={() => {
                  setIsLoginModalOpen(true);
                }}
                onSignupSuccess={(updatedLoyalty) => {
                  setLoyalty(updatedLoyalty);
                  triggerToast("🎉 Account Created! Welcome raffle unlocked for your account!");
                }}
                onSpinSuccess={(updatedLoyalty, prize) => {
                  setLoyalty(updatedLoyalty);
                  triggerToast(`🎯 Spin Complete! Congratulations, you won a Free: ${prize}!`);
                }}
              />
            </motion.div>
          )}

          {/* TAB: AROMA & BREW GUIDE */}
          {activeTab === "sensory" && (
            <motion.div
              key="sensory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] mb-1">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Aromatic & Brew Exploration</h3>
                <p className="text-xs text-stone-300">
                  Explore traditional aromas of the finest Ethiopian specialty coffees and master perfect brewing times.
                </p>
              </div>
              <AromaExplorer onSelectRegion={selectRegionOnMap} />
              <BrewTimer />
            </motion.div>
          )}

          {/* TAB: LOYALTY & PASSPORT */}
          {activeTab === "loyalty" && loyalty && (
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <CustomerLoyalty loyalty={loyalty} onRedeemReward={handleLoyaltySync} />
              <RouletteGame loyalty={loyalty} onBeanRolled={handleLoyaltySync} />
            </motion.div>
          )}

          {/* TAB: COMMUNITY WALL */}
          {activeTab === "wall" && (
            <motion.div
              key="wall"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <CommunityWall onPostAdded={handleRewardPoints} />
            </motion.div>
          )}

          {/* TAB: OWNER DASHBOARD (ADMIN ONLY) */}
          {activeTab === "owner" && authUser.role === 'admin' && (
            <motion.div
              key="owner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <OwnerDashboard />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 6. IMMERSIVE CULTURAL FOOTER */}
      <footer className="bg-[#0e2217] border-t border-[#295a3d] py-12 px-4 text-center mt-12 text-xs text-stone-300">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <BunaLogo size="md" onClick={() => setActiveTab("builder")} />
          <p className="font-sans italic text-[#42bd6c] font-light tracking-wide mt-1">"Buna dabo naw" — Coffee is our bread.</p>
          <p className="max-w-md mx-auto leading-relaxed text-stone-300">
            Buna celebrates the ancient coffee heritage of Ethiopia. Inspired by the highlands of Kaffa, Sidamo, and Yirgacheffe.
          </p>
          <div className="flex justify-center gap-4 text-[10px] font-mono uppercase tracking-widest mt-2 text-[#42bd6c]">
            <span>Server-side API Connection: Active</span>
            <span>•</span>
            <span>Loyalty Version 2.5</span>
            <span>•</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </footer>

      {/* GOOGLE SIGN IN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        deviceId={getDeviceId()}
      />

    </div>
  );
}
