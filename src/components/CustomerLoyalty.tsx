import React, { useState } from "react";
import { Award, Compass, Heart, BookOpen, Gift, MapPin, Zap, Flame, Calendar, Sparkles, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoyaltyProfile, PassportRegion } from "../types";

export default function CustomerLoyalty({ 
  loyalty, 
  onRedeemReward 
}: { 
  loyalty: LoyaltyProfile; 
  onRedeemReward: (updatedLoyalty: LoyaltyProfile, msg: string) => void;
}) {
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeemFreeDrink = async () => {
    if (loyalty.stampsCount < 10) return;
    setRedeeming(true);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    try {
      const response = await fetch("/api/loyalty/redeem-free-drink", { 
        method: "POST",
        headers: { "X-Device-ID": devId }
      });
      const data = await response.json();
      if (data.success) {
        onRedeemReward(data.loyalty, "Redeemed 10 Stamps for a FREE Signature Specialty Coffee!");
      }
      setRedeeming(false);
    } catch (e) {
      console.error(e);
      setRedeeming(false);
    }
  };

  const handleExchangePoints = async (pointsCost: number, prizeTitle: string) => {
    if (loyalty.points < pointsCost) return;
    setRedeeming(true);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    try {
      const response = await fetch("/api/loyalty/exchange-points", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-ID": devId
        },
        body: JSON.stringify({ pointsCost, prizeTitle })
      });
      const data = await response.json();
      if (data.success) {
        onRedeemReward(data.loyalty, `Exchanged ${pointsCost} points for ${prizeTitle}! Check your email for details.`);
      }
      setRedeeming(false);
    } catch (e) {
      console.error(e);
      setRedeeming(false);
    }
  };

  // Determine current tier
  const getTierDetails = (points: number) => {
    if (points >= 1000) return { name: "Platinum King/Queen 👑", color: "from-teal-400 to-cyan-500", desc: "Free delivery & unlimited syrup upgrades." };
    if (points >= 500) return { name: "Gold Ambassador 🎖", color: "from-amber-400 to-amber-600", desc: "Access to private cupping events and VIP pre-orders." };
    if (points >= 200) return { name: "Silver Explorer 🧭", color: "from-stone-300 to-stone-500", desc: "Double-point Mondays and free birthday pastries." };
    return { name: "Bronze Connoisseur 🌱", color: "from-orange-600 to-orange-800", desc: "Earn points on every purchase and custom brew." };
  };

  const tier = getTierDetails(loyalty.points);

  // Digital card 10-stamps array
  const stampsArray = Array.from({ length: 10 }).map((_, i) => i < loyalty.stampsCount);

  return (
    <div id="loyalty-passport-center" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* 1. DIGITAL STAMP CARD (10 Cups Grid) */}
      <div className="lg:col-span-6 bg-[#102418] p-6 rounded-2xl border border-[#1d432d] flex flex-col justify-between min-h-[400px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20 flex items-center gap-1">
              <Award size={10} /> DIGITAL CARD
            </span>
            <span className="text-xs text-stone-500 font-mono">Buy 9, Get 10th Free</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Interactive Loyalty Card</h3>
          <p className="text-xs text-stone-400 mt-0.5">Collect a digital stamp with every custom brew or ceremony order. Once fully stamped, claim your free beverage.</p>
        </div>

        {/* 10 Stamps Grid */}
        <div className="grid grid-cols-5 gap-3 my-6">
          {stampsArray.map((isStamped, idx) => (
            <div 
              key={idx} 
              className={`h-14 rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300 ${
                isStamped 
                  ? "bg-[#22683e]/30 border-[#38a15b] text-white shadow-lg shadow-emerald-950/20 scale-102" 
                  : "bg-[#0a1810] border-[#1d432d] text-stone-700"
              }`}
            >
              <Coffee size={20} className={isStamped ? "text-[#38a15b] animate-pulse" : "text-stone-800"} />
              <span className="text-[9px] font-mono mt-1 font-bold">{idx + 1}</span>
              {isStamped && (
                <span className="absolute top-1 right-1 text-[8px] bg-[#22683e] text-white font-black rounded-full h-3 w-3 flex items-center justify-center">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Redeem free drink action */}
        <button
          onClick={handleRedeemFreeDrink}
          disabled={loyalty.stampsCount < 10 || redeeming}
          className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/25 cursor-pointer"
        >
          {loyalty.stampsCount >= 10 ? "✨ Claim Your Free Specialty Coffee!" : `Collect ${10 - loyalty.stampsCount} More Stamp${10 - loyalty.stampsCount !== 1 ? "s" : ""} to Unlock`}
        </button>
      </div>

      {/* 2. SAVED COFFEE PASSPORT STAMPS */}
      <div className="lg:col-span-6 bg-[#102418] p-6 rounded-2xl border border-[#1d432d] flex flex-col justify-between min-h-[400px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/30 flex items-center gap-1">
              <Compass size={10} /> PASSPORT
            </span>
            <span className="text-xs text-stone-500 font-mono">Buna Origin Trail</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">My Coffee Passport</h3>
          <p className="text-xs text-stone-400 mt-0.5">Explore coffees from Ethiopia's five historical regions. Complete your passport stamps to earn the **Ambassador Badge** & double reward points!</p>
        </div>

        {/* 5 passport regional stickers */}
        <div className="flex flex-wrap gap-3.5 my-6 justify-center">
          {['Harrar', 'Yirgacheffe', 'Sidama', 'Jimma', 'Guji'].map((regionName) => {
            const hasStamp = loyalty.passportStamps?.includes(regionName);
            return (
              <div 
                key={regionName}
                className={`flex flex-col items-center justify-center p-3 rounded-full h-20 w-20 border text-center transition-all ${
                  hasStamp
                    ? "bg-[#12281b] border-[#22683e] rotate-3 shadow-lg shadow-emerald-950/40 scale-105"
                    : "bg-[#0a1810]/50 border-[#1d432d] opacity-40"
                }`}
              >
                <span className="text-lg">{hasStamp ? "Stamp" : "Sticker"}</span>
                <span className="text-[9px] font-mono font-bold text-white tracking-tight truncate w-16">{regionName}</span>
                {hasStamp ? (
                  <span className="text-[8px] font-mono text-[#38a15b] mt-0.5 font-bold">STAMPED ✓</span>
                ) : (
                  <span className="text-[8px] font-mono text-stone-600 mt-0.5">Locked</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Passport completion reward info */}
        <div className="bg-[#0a1810] p-3 rounded-xl border border-[#1d432d] text-center text-xs">
          {loyalty.passportStamps?.length === 5 ? (
            <span className="text-[#82ca9d] font-bold font-mono">🎉 Unlocked Ethiopian Coffee Ambassador Title! 🌟</span>
          ) : (
            <span className="text-stone-400">Stamps collected: <span className="text-white font-mono font-bold">{loyalty.passportStamps?.length || 0} / 5</span> regions.</span>
          )}
        </div>
      </div>

      {/* 3. POINTS EXCHANGE AND REWARDS VAULT */}
      <div className="lg:col-span-12 bg-[#0a1810] rounded-2xl p-6 border border-[#1d432d] mt-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight font-display">Points Exchange & Rewards Vault</h4>
            <p className="text-xs text-stone-500 mt-0.5">You have <span className="font-bold text-white font-mono">{loyalty.points}</span> loyalty points. Exchange your balance for valuable premium items.</p>
          </div>
          
          {/* Active Level Card */}
          <div className={`p-3.5 rounded-xl bg-gradient-to-r ${tier.color} text-black font-semibold text-xs flex flex-col justify-between shadow-xl`}>
            <div>
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-black/60">LOYALTY LEVEL TIER</span>
              <p className="text-sm font-black tracking-tight">{tier.name}</p>
            </div>
            <p className="text-[10px] text-black/80 leading-normal mt-1 max-w-xs">{tier.desc}</p>
          </div>
        </div>

        {/* Exchange options list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-[#102418] p-4 rounded-xl border border-[#1d432d] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 border border-[#22683e]/30 px-2 py-0.5 rounded">VOUCHER</span>
              <h5 className="text-sm font-bold text-white mt-2">Free Cardamom Pastry</h5>
              <p className="text-xs text-stone-400 mt-1">Get a freshly baked pastry of your choice to pair with your morning cup.</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#1d432d]">
              <span className="font-mono text-xs text-stone-500">Cost: 50 points</span>
              <button
                onClick={() => handleExchangePoints(50, "Free Cardamom Pastry Coupon")}
                disabled={loyalty.points < 50 || redeeming}
                className="px-3 py-1.5 rounded-lg bg-[#22683e]/30 border border-[#22683e] hover:bg-[#22683e] hover:text-white text-xs text-[#38a15b] hover:text-white font-bold transition-all"
              >
                Exchange
              </button>
            </div>
          </div>

          <div className="bg-[#102418] p-4 rounded-xl border border-[#1d432d] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 border border-[#22683e]/30 px-2 py-0.5 rounded">SPECIALTY upgrade</span>
              <h5 className="text-sm font-bold text-white mt-2">Free Double Espresso Upgrade</h5>
              <p className="text-xs text-stone-400 mt-1">Add a double shot of rare single-origin Harrar espresso to any custom beverage order.</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#1d432d]">
              <span className="font-mono text-xs text-stone-500">Cost: 80 points</span>
              <button
                onClick={() => handleExchangePoints(80, "Free Double Shot Upgrade")}
                disabled={loyalty.points < 80 || redeeming}
                className="px-3 py-1.5 rounded-lg bg-[#22683e]/30 border border-[#22683e] hover:bg-[#22683e] hover:text-white text-xs text-[#38a15b] hover:text-white font-bold transition-all"
              >
                Exchange
              </button>
            </div>
          </div>

          <div className="bg-[#102418] p-4 rounded-xl border border-[#1d432d] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 border border-[#22683e]/30 px-2 py-0.5 rounded">EXCLUSIVE PACKAGE</span>
              <h5 className="text-sm font-bold text-white mt-2">Whole Bean Cupping Kit (250g)</h5>
              <p className="text-xs text-stone-400 mt-1">Receive a physical retail bag of medium-roasted washed Yirgacheffe coffee beans delivered to your address.</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#1d432d]">
              <span className="font-mono text-xs text-stone-500">Cost: 200 points</span>
              <button
                onClick={() => handleExchangePoints(200, "Whole Bean Cupping Bag (250g)")}
                disabled={loyalty.points < 200 || redeeming}
                className="px-3 py-1.5 rounded-lg bg-[#22683e]/30 border border-[#22683e] hover:bg-[#22683e] hover:text-white text-xs text-[#38a15b] hover:text-white font-bold transition-all"
              >
                Exchange
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
