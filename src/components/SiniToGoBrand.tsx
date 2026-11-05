import React from "react";
import SiniToGoCup from "./SiniToGoCup";
import { Coffee, Sparkles } from "lucide-react";

interface SiniToGoBrandProps {
  className?: string;
}

/**
 * SiniToGoBrand: Displays the prominent Ethiopian Sini Cup (with open to-go lid)
 * featuring BUNA TO-GO typography. Non-expandable as requested.
 */
export default function SiniToGoBrand({ className = "" }: SiniToGoBrandProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 shrink-0 ${className}`}>
      {/* 
        Prominent, larger, highly visible Ethiopian Sini Cup with Open To-Go Lid.
        Clean and non-expandable directly embedded in the banner.
      */}
      <div className="relative shrink-0 flex justify-center w-full sm:w-auto">
        <SiniToGoCup size="banner" showOpenLidLabel={true} />
      </div>

      {/* Brand Name & Typography */}
      <div className="flex flex-col text-center sm:text-left min-w-0">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white uppercase leading-tight drop-shadow-md">
            <span>BUNA TO-GO</span>
          </h2>
          <span className="text-xs sm:text-sm font-black font-serif px-2.5 py-0.5 rounded-lg bg-[#122b1c]/90 border border-amber-500/60 text-amber-300 shadow-sm">
            ሃትሪክ ቡና
          </span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
          <span className="text-[#42bd6c] font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#42bd6c]/15 border border-[#42bd6c]/40">
            የሲኒ ቡና To-Go
          </span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-stone-300 mt-1">
          <Coffee size={13} className="text-[#42bd6c] shrink-0" />
          <span className="font-medium text-stone-200">
            Ceremonial Ethiopian Sini • To-Go Cafe Edition
          </span>
        </div>
      </div>
    </div>
  );
}
