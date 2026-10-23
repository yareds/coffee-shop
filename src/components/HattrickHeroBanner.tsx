import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Tv, Coffee, Sparkles, ChevronRight, Eye, Download, Maximize2 } from "lucide-react";

interface HattrickHeroBannerProps {
  isAdmin?: boolean;
  onPredictClick?: () => void;
  onExploreMapClick?: () => void;
  onOpenLogoModal?: () => void;
}

export const HattrickHeroBanner: React.FC<HattrickHeroBannerProps> = ({
  isAdmin = false,
  onPredictClick,
  onExploreMapClick,
  onOpenLogoModal,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-cyan-500/40 bg-[#050b14] shadow-[0_12px_60px_rgba(0,240,255,0.22)] select-none group">
      
      {/* ======================================================== */}
      {/* 1. CINEMATIC 16:9 HERO BANNER DISPLAY                   */}
      {/* ======================================================== */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] sm:min-h-[460px] md:min-h-[520px] lg:min-h-[580px] flex items-center justify-center overflow-hidden bg-black">
        
        {/* Master Realistic Graphic Asset */}
        <img
          src="/assets/aistudio/image_74f28168.png"
          alt="Hattrick Coffee - DSTV + COFFEE Hawassa Ethiopia"
          className="w-full h-full object-cover sm:object-contain object-center transition-transform duration-700 group-hover:scale-[1.01]"
        />

        {/* Ambient Subtle Edge Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Dynamic Electric Cyan Ambient Corner Pulses */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Top Header Badge Overlay */}
        <div className="absolute top-3 sm:top-5 inset-x-3 sm:inset-x-6 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-black/75 border border-cyan-500/50 backdrop-blur-md text-cyan-300 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase shadow-lg shadow-black/80">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <Tv size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">LIVE ON DSTV • SPECIALTY COFFEE LOUNGE</span>
            <span className="sm:hidden">DSTV MATCHDAY LOUNGE</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/90 border border-cyan-500/40 text-cyan-300 transition-all cursor-pointer shadow-md"
                title="Admin: Expand Full Resolution Graphic"
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Interactive Quick-Actions Floating Bar */}
        <div className="absolute bottom-3 sm:bottom-6 inset-x-3 sm:inset-x-8 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
          
          {/* Left: Origin & Heritage Subtext */}
          <div className="hidden md:flex items-center gap-2 text-stone-300 text-xs font-mono bg-black/70 px-3.5 py-1.5 rounded-full border border-stone-800 backdrop-blur-md">
            <span className="text-amber-400 font-bold">☕ HAWASSA</span>
            <span>•</span>
            <span className="text-cyan-300">🇪🇹 SIDAMA TERROIR</span>
            <span>•</span>
            <span className="text-stone-300">WEEKLY PREDICTION SYSTEM</span>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={onPredictClick}
              className="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-stone-950 font-black text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(0,240,255,0.45)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Trophy size={15} className="text-stone-950 shrink-0" />
              <span>Predict & Win</span>
              <ChevronRight size={15} className="shrink-0" />
            </button>

            {/* Logo & Assets button - ONLY VISIBLE TO ADMIN */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenLogoModal}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/80 hover:bg-stone-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 backdrop-blur-md"
              >
                <Sparkles size={14} className="text-cyan-400 shrink-0" />
                <span>Logo Asset</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. FULLSCREEN GRAPHIC LIGHTBOX MODAL (ADMIN ONLY)        */}
      {/* ======================================================== */}
      {isZoomed && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-lg">
          <div className="relative max-w-6xl w-full flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-sm tracking-wide">
                  HATTRICK COFFEE • Official 16:9 Hero Graphic (1376x768)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/assets/aistudio/image_74f28168.png"
                  download="hattrick-coffee-dstv-hero-banner.png"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Download PNG</span>
                </a>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black">
              <img
                src="/assets/aistudio/image_74f28168.png"
                alt="Hattrick Coffee Hero Full Graphic"
                className="w-full h-auto max-h-[80vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HattrickHeroBanner;
