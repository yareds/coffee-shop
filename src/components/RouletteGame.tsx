import React, { useState } from "react";
import { Sparkles, Play, HelpCircle, Gift, Check, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoyaltyProfile } from "../types";

export default function RouletteGame({ loyalty, onBeanRolled }: { 
  loyalty: LoyaltyProfile; 
  onBeanRolled: (updatedLoyalty: LoyaltyProfile, prizeMsg: string) => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<any | null>(null);

  const [cracking, setCracking] = useState(false);
  const [crackedPrize, setCrackedPrize] = useState<any | null>(null);

  // 1. Coffee Roulette spinning
  const handleSpinRoulette = () => {
    setSpinning(true);
    setRouletteResult(null);

    setTimeout(() => {
      const combos = [
        { drink: "Traditional Jebena (Abol)", extra: "Lentil Sambusa pocket", discount: "15% off combo", code: "ROULETTE15" },
        { drink: "Yirgacheffe Pour Over", extra: "Honey Baklava slice", discount: "Free Baklava!", code: "SWEETBUNA" },
        { drink: "Spiced Cardamom Macchiato", extra: "Cardamom Scone", discount: "10% off combo", code: "CARDAMOM10" },
        { drink: "Sidama Cold Brew", extra: "Double Choc cookie", discount: "20% off!", code: "NITROCOOL" }
      ];

      const rolled = combos[Math.floor(Math.random() * combos.length)];
      setRouletteResult(rolled);
      setSpinning(false);
    }, 1500); // spin for 1.5s
  };

  // 2. Lucky Bean opening
  const handleCrackBean = async () => {
    if (loyalty.beansCount <= 0) return;

    setCracking(true);
    setCrackedPrize(null);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    try {
      const response = await fetch("/api/loyalty/lucky-bean", { 
        method: "POST",
        headers: { "X-Device-ID": devId }
      });
      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          setCrackedPrize(data.prize);
          onBeanRolled(data.loyalty, `Cracked bean: ${data.prize.title}!`);
          setCracking(false);
        }, 1200); // crack animation 1.2s
      } else {
        alert(data.error);
        setCracking(false);
      }
    } catch (e) {
      console.error(e);
      setCracking(false);
    }
  };

  return (
    <div id="gamified-lounge" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* SECTION A: COFFEE ROULETTE (Feeling Lucky) */}
      <div className="lg:col-span-6 bg-[#102418] p-6 rounded-2xl border border-[#1d432d] flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/30 flex items-center gap-1">
              <Gift size={10} /> GAMIFICATION
            </span>
            <span className="text-xs text-stone-500 font-mono">Taste Discovery</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Interactive Coffee Roulette</h3>
          <p className="text-xs text-stone-400 mt-0.5">Indecisive? Let our culinary roulette wheel choose today's brew and pastry combo, and claim a mystery coupon!</p>
        </div>

        {/* Visual spinning stage */}
        <div className="my-6 flex flex-col items-center justify-center relative min-h-[140px]">
          <AnimatePresence mode="wait">
            {spinning ? (
              <motion.div
                key="spinning"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                className="text-5xl select-none"
              >
                ☕🌀🥐🍵
              </motion.div>
            ) : rouletteResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center bg-[#0a1810] p-4 rounded-xl border border-[#22683e]/30 max-w-sm w-full"
              >
                <span className="text-xs font-mono text-[#38a15b] uppercase">Your Lucky Pairing</span>
                <p className="text-sm font-bold text-white mt-1">{rouletteResult.drink}</p>
                <p className="text-xs text-stone-400 mt-0.5">+ {rouletteResult.extra}</p>
                
                <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#1d432d] text-xs">
                  <p className="text-[#82ca9d] font-bold">🎁 Reward: {rouletteResult.discount}</p>
                  <p className="text-[10px] text-stone-400 mt-1 font-mono uppercase bg-[#12281b] px-2.5 py-1 rounded inline-block">
                    PROMO CODE: {rouletteResult.code}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-6 text-stone-500 text-xs italic">
                Press "I'm Feeling Lucky" to launch the carousel.
              </div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSpinRoulette}
          disabled={spinning}
          className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Play size={12} className="fill-current" />
          {spinning ? "Spinning Wheel..." : "🎯 I'm Feeling Lucky"}
        </button>
      </div>

      {/* SECTION B: LUCKY BEAN CRACKER GAME */}
      <div className="lg:col-span-6 bg-[#102418] p-6 rounded-2xl border border-[#1d432d] flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/30 flex items-center gap-1">
              <Sparkles size={10} /> REWARDS
            </span>
            <span className="text-xs text-stone-500 font-mono">Bean Cracker</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">The Lucky Bean Game</h3>
          <p className="text-xs text-stone-400 mt-0.5">Each purchase earns you one virtual coffee bean. Split open a bean to reveal double points, free espresso, or the rare Golden Bean jackpot!</p>
        </div>

        {/* Bean cracking stage */}
        <div className="my-6 flex flex-col items-center justify-center relative min-h-[140px]">
          <AnimatePresence mode="wait">
            {cracking ? (
              <motion.div
                key="cracking"
                animate={{ scale: [1, 1.15, 0.9, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-6xl select-none"
              >
                🫘💥
              </motion.div>
            ) : crackedPrize ? (
              <motion.div
                key="cracked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-[#0a1810] p-4 rounded-xl border border-emerald-900/30 max-w-sm w-full"
              >
                <span className="text-[10px] font-mono text-[#82ca9d] uppercase bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
                  CRACKED BEAN PRIZE!
                </span>
                <p className="text-lg font-black text-white mt-3">{crackedPrize.title}</p>
                <p className="text-[10px] text-stone-400 mt-1 font-mono uppercase bg-[#12281b] px-2.5 py-1 rounded inline-block">
                  USE CODE: {crackedPrize.code}
                </p>
                <p className="text-[10px] text-stone-400 mt-2">Points have been added automatically to your card.</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-5xl animate-bounce select-none">🫘</span>
                <p className="text-xs font-mono text-stone-300 font-bold">
                  You have <span className="text-[#38a15b] text-sm">{loyalty.beansCount}</span> Virtual Coffee Bean{loyalty.beansCount !== 1 && "s"}
                </p>
                <p className="text-[10px] text-stone-500 max-w-xs">Beans are earned by ordering coffees or completing community tasks.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleCrackBean}
          disabled={loyalty.beansCount <= 0 || cracking}
          className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
        >
          <span>🔨 Crack Open Virtual Bean</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/25 text-white">
            {loyalty.beansCount} Left
          </span>
        </button>
      </div>

    </div>
  );
}
