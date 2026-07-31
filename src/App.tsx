import React, { useState, useEffect } from "react";
import { 
  Coffee, MapPin, Compass, Sparkles, Award, Users, ShieldAlert,
  Clock, Flame, RefreshCw, Star, Info, Bell, MessageSquare, Check, HelpCircle,
  User, ShieldCheck, LogIn, LogOut, Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import DrinkBuilder from "./components/DrinkBuilder";
import EthiopianMap from "./components/EthiopianMap";
import RaffleWheel from "./components/RaffleWheel";
import BrewTimer from "./components/BrewTimer";
import AromaExplorer from "./components/AromaExplorer";
import OwnerDashboard from "./components/OwnerDashboard";
import CommunityWall from "./components/CommunityWall";
import RouletteGame from "./components/RouletteGame";
import CustomerLoyalty from "./components/CustomerLoyalty";
import CoffeeCupSVG from "./components/CoffeeCupSVG";
import LoginModal from "./components/LoginModal";
import { LoyaltyProfile, AuthUser } from "./types";

// Helper to get or generate client-side unique device ID
const getDeviceId = () => {
  let id = localStorage.getItem("buna_device_id");
  if (!id) {
    id = "buna_device_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("buna_device_id", id);
  }
  return id;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Auth & Login State
  const [authUser, setAuthUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem("buna_auth_user");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { role: 'guest', name: 'Guest Explorer' };
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialMode, setLoginInitialMode] = useState<'user' | 'admin'>('user');

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

    fetch("/api/owner/stats", { headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.promotions) {
          setPromotions(data.promotions.filter((p: any) => p.active));
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    loadProfileAndPromos(authUser);
  }, [authUser?.email, authUser?.role]);

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
    if (user.role === 'admin') {
      setActiveTab("owner");
    }
  };

  const handleLogout = () => {
    const guest: AuthUser = { role: 'guest', name: 'Guest Explorer' };
    setAuthUser(guest);
    localStorage.removeItem("buna_auth_user");
    loadProfileAndPromos(guest);
    triggerToast("Logged out successfully.");
    if (activeTab === "owner") {
      setActiveTab("builder");
    }
  };

  const handleTabClick = (tabKey: string) => {
    if (tabKey === "owner" && authUser.role !== 'admin') {
      setLoginInitialMode('admin');
      setIsLoginModalOpen(true);
      triggerToast("🔒 Admin PIN required to access the Owner Portal.");
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <div className="min-h-screen bg-coffee-dark text-[#f7f4f2] font-sans selection:bg-[#c89d7c] selection:text-[#090808]">
      
      {/* 1. TOP BRAND HEADER */}
      <header className="sticky top-0 z-50 bg-[#0c0a09]/95 backdrop-blur-xl border-b border-[#231a15] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Heritage Slogan */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#c89d7c]/25 to-[#2a1b12] border border-[#c89d7c]/40 flex items-center justify-center text-lg shadow-lg shadow-[#c89d7c]/10 text-[#c89d7c]">
              ☕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif-heritage font-extrabold tracking-wider text-white">BUNA</h1>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#c89d7c] text-black font-extrabold uppercase tracking-widest">
                  ETHIOPIA
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">Artisanal Heritage & Sensory Experience</p>
            </div>
          </div>

          {/* AUTHENTICATION CONTROLS & USER STATUS */}
          <div className="flex items-center gap-3">
            {authUser.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-[#c89d7c]/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 shadow-sm">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <span className="hidden sm:inline text-stone-300 font-normal">Admin:</span>
                  <span className="text-white font-semibold">{authUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out Admin"
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-stone-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : authUser.role === 'user' ? (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 text-xs font-medium flex items-center gap-2">
                  <User size={14} className="text-[#c89d7c]" />
                  <span className="text-white font-semibold">{authUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Switch Account or Logout"
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-stone-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLoginInitialMode('user');
                  setIsLoginModalOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#c89d7c] to-[#b38563] hover:from-[#d8ad8c] hover:to-[#c49673] text-black font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#c89d7c]/15 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN NAVIGATION TAB BAR */}
      <nav className="sticky top-[57px] z-40 bg-[#080605]/95 border-b border-[#231a15] backdrop-blur-xl py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-nowrap lg:flex-wrap gap-2 overflow-x-auto scrollbar-none justify-start items-center">
          
          <button
            onClick={() => handleTabClick("builder")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "builder" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>☕</span> Cup Builder
          </button>

          <button
            onClick={() => handleTabClick("map")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "map" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>🗺</span> Interactive Origin Map
          </button>

          <button
            onClick={() => handleTabClick("raffle")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "raffle" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>🎰</span> Lucky Raffle
          </button>

          <button
            onClick={() => handleTabClick("sensory")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "sensory" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>🎯</span> Aroma & Brew Guide
          </button>

          <button
            onClick={() => handleTabClick("loyalty")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "loyalty" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>📜</span> Loyalty & Passport
          </button>

          <button
            onClick={() => handleTabClick("wall")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "wall" 
                ? "bg-gradient-to-r from-[#c89d7c] to-[#e0b899] text-black font-bold shadow-lg shadow-[#c89d7c]/25 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>✍</span> Community Wall
          </button>

          <button
            onClick={() => handleTabClick("owner")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "owner" 
                ? "bg-[#c89d7c] text-black font-bold shadow-md" 
                : authUser.role === 'admin'
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
                  : "bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20"
            }`}
            style={{ letterSpacing: "-0.01em" }}
          >
            <span>{authUser.role === 'admin' ? "👑" : "🔒"}</span> Owner Portal
          </button>

        </div>
      </nav>

      {/* 3. DYNAMIC FLOATING NOTIFICATION TOAST */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-28 inset-x-0 mx-auto max-w-md bg-[#1d3023] border border-[#2d4d38] text-[#8ce0aa] rounded-2xl px-5 py-3.5 shadow-2xl z-50 flex items-center justify-between gap-3 text-xs font-mono font-bold"
          >
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-[#8ce0aa] hover:text-white shrink-0">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. REDESIGNED HERO SECTION (HERITAGE CRAFT & HIGH-FIDELITY LAYOUT - SHOWN ONLY ON HOME / CUP BUILDER PAGE) */}
      {activeTab === "builder" && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#120d0a] via-[#0c0a09] to-[#090706] border-b border-[#231a15] py-12 lg:py-16 px-4 md:px-8">
          
          {/* Subtle Warm Spotlight Effects */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-[#c89d7c]/10 blur-[140px]" />
            <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full bg-amber-900/15 blur-[160px]" />
          </div>

          <div className="relative max-w-7xl mx-auto z-10">
            
            {/* Main 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* LEFT COLUMN: HERO TYPOGRAPHY & BRANDING */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                
                {/* Heritage Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#c89d7c]/30 backdrop-blur-md mb-6">
                  <span className="text-sm">🇪🇹</span>
                  <span className="text-[11px] font-mono text-[#c89d7c] uppercase tracking-widest font-semibold">
                    Celebrating 1,000+ Years of Coffee Culture
                  </span>
                </div>

                {/* Main Titles */}
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif-heritage font-black tracking-tight text-white mb-2 leading-none">
                  BUNA
                </h1>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-display italic font-medium text-[#c89d7c] mb-6 tracking-wide">
                  Discover Your Perfect Origin
                </h2>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-sans font-light tracking-wide max-w-2xl mb-8">
                  Buna is an interactive sensory experience platform. Travel across historical Ethiopian coffee terroirs, master the traditional ceremony, customize your cup with real-time health analytics, and collect digital stamps as you explore.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => handleTabClick("builder")}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#c89d7c] via-[#dcb18f] to-[#c89d7c] hover:from-[#d8ad8c] hover:to-[#d8ad8c] text-black font-bold text-sm transition-all shadow-xl shadow-[#c89d7c]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5"
                  >
                    <Coffee size={18} />
                    <span>Start Customizing Cup</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("map")}
                    className="px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
                  >
                    <span>🗺</span>
                    <span>Explore Terroir Map</span>
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: HIGH-FIDELITY COFFEE CUP GRAPHIC (NO TEXT BLEED) */}
              <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
                {/* Soft Radial Ambient Spotlight Behind Cup */}
                <div className="absolute inset-0 bg-radial from-[#c89d7c]/20 via-transparent to-transparent blur-2xl rounded-full scale-90 pointer-events-none" />
                
                {/* Cup Graphic Container */}
                <div className="relative w-full max-w-[380px] sm:max-w-[440px] aspect-square flex items-center justify-center">
                  <CoffeeCupSVG />
                </div>
              </div>

            </div>

            {/* UNIFIED HERO STATS CARDS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
              
              {/* Stat Card 1: Points */}
              <div className="bg-coffee-card bg-coffee-card-hover rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-medium">Loyalty Points</span>
                  <div className="h-8 w-8 rounded-xl bg-[#c89d7c]/10 border border-[#c89d7c]/20 flex items-center justify-center text-[#c89d7c]">
                    <Award size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                    {loyalty ? loyalty.points : 240}
                  </span>
                  <span className="text-[10px] font-mono text-[#c89d7c]">Pts</span>
                </div>
                <p className="text-[10px] text-stone-400 font-sans mt-2">Level 2 Ethiopian Explorer</p>
              </div>

              {/* Stat Card 2: Digital Stamps */}
              <div className="bg-coffee-card bg-coffee-card-hover rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-medium">Digital Stamps</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Award size={16} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                      {loyalty ? `${loyalty.stampsCount}/10` : '7/10'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-semibold">70%</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c89d7c] to-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((loyalty?.stampsCount || 7) / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat Card 3: Virtual Beans */}
              <div className="bg-coffee-card bg-coffee-card-hover rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-medium">Virtual Beans</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-900/20 border border-amber-800/30 flex items-center justify-center text-amber-500">
                    <Coffee size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <span>🫘</span> {loyalty ? loyalty.beansCount : 3}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-sans mt-2">Ready to redeem reward</p>
              </div>

              {/* Stat Card 4: Daily Streak */}
              <div className="bg-coffee-card bg-coffee-card-hover rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-medium">Daily Streak</span>
                  <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <Flame size={16} className="animate-pulse" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center gap-1">
                    {loyalty ? loyalty.streak : 5}
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Days 🔥</span>
                </div>
                <p className="text-[10px] text-red-400/90 font-sans mt-2 font-medium">2x Loyalty Multiplier Active</p>
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
                  setLoginInitialMode('user');
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
              <div className="bg-[#1a1513] p-6 rounded-2xl border border-[#2c221e] mb-1">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Aromatic & Brew Exploration</h3>
                <p className="text-xs text-stone-400">
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

          {/* TAB: OWNER DASHBOARD */}
          {activeTab === "owner" && (
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
      <footer className="bg-[#161211] border-t border-[#241c19] py-12 px-4 text-center mt-12 text-xs text-stone-500">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <p className="font-sans italic text-stone-400 font-light tracking-wide">"Buna dabo naw" — Coffee is our bread.</p>
          <p className="max-w-md mx-auto leading-relaxed">
            Buna celebrates the ancient coffee heritage of Ethiopia. Inspired by the highlands of Kaffa, Sidamo, and Yirgacheffe.
          </p>
          <div className="flex justify-center gap-4 text-[10px] font-mono uppercase tracking-widest mt-2">
            <span>Server-side API Connection: Active</span>
            <span>•</span>
            <span>Loyalty Version 2.5</span>
            <span>•</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialMode={loginInitialMode}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        deviceId={getDeviceId()}
      />

    </div>
  );
}
