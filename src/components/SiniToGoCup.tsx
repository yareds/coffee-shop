import React from "react";

interface SiniToGoCupProps {
  size?: "sm" | "md" | "lg" | "banner";
  className?: string;
  showBadge?: boolean;
  showOpenLidLabel?: boolean;
}

/**
 * SiniToGoCup:
 * - Uses the attached cafe image (wooden cafe counter, espresso machine background, kraft lid & sleeve with handle)
 * - Transformed with the authentic dark-green ceramic Ethiopian sini cup color and traditional white wheat & floral motifs
 * - Animated aromatic steam wafting from the to-go sipping lid
 */
export default function SiniToGoCup({
  size = "banner",
  className = "",
  showBadge = true,
  showOpenLidLabel
}: SiniToGoCupProps) {
  const displayBadge = showOpenLidLabel !== undefined ? showOpenLidLabel : showBadge;
  const dimensions = {
    sm: "w-28 h-28 sm:w-32 sm:h-32",
    md: "w-44 h-44 sm:w-48 sm:h-48",
    lg: "w-60 h-60 sm:w-64 sm:h-64",
    banner: "w-64 h-64 min-[380px]:w-72 min-[380px]:h-72 min-[440px]:w-80 min-[440px]:h-80 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 max-w-[92vw] aspect-square"
  }[size];

  return (
    <div
      className={`relative group shrink-0 ${dimensions} ${className}`}
      title="Authentic Ethiopian Sini To-Go Cup - BUNA TO-GO"
    >
      {/* Outer ambient glow matching highland green and cafe warmth */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#122b1c] via-[#2d824d]/40 to-[#c2884a]/30 blur-lg pointer-events-none transition-all duration-300 group-hover:scale-105" />

      {/* Main Container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#07170e] via-[#0b2114] to-[#1a100a] border-2 border-[#42bd6c]/60 shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5">
        
        {/* Master Realistic Photo: Sini To-Go Cup in Cafe Setting */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          <img
            src="/assets/aistudio/image_53abfb06.png"
            alt="Ethiopian Sini Coffee Cup - BUNA TO-GO on Cafe Counter"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-2xl filter brightness-105 contrast-105 drop-shadow-xl"
          />
          {/* 
            SVG Overlay for Sini To-Go Cup:
            - Aromatic rising steam from sipping slot of the to-go lid
          */}
          <svg
            viewBox="0 0 1024 765"
            className="absolute inset-0 w-full h-full pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="cafeSteamGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <style>
              {`
                @keyframes steamBillowCenter {
                  0% { opacity: 0.25; transform: translateY(3px) scaleX(0.97); }
                  50% { opacity: 0.85; transform: translateY(-4px) scaleX(1.03); }
                  100% { opacity: 0.25; transform: translateY(3px) scaleX(0.97); }
                }
                @keyframes steamBillowSide {
                  0% { opacity: 0.2; transform: translateY(2px) scaleX(1.04); }
                  50% { opacity: 0.75; transform: translateY(-6px) scaleX(0.96); }
                  100% { opacity: 0.2; transform: translateY(2px) scaleX(1.04); }
                }
                .steam-top-center {
                  animation: steamBillowCenter 3.2s ease-in-out infinite;
                  transform-origin: 496px 184px;
                }
                .steam-top-left {
                  animation: steamBillowSide 3.7s ease-in-out infinite 0.5s;
                  transform-origin: 484px 187px;
                }
                .steam-top-right {
                  animation: steamBillowSide 4.1s ease-in-out infinite 1.1s;
                  transform-origin: 508px 187px;
                }
              `}
            </style>

            {/* Top Middle Sipping Opening Ambient Warmth on Cup Lid */}
            <g>
              <ellipse cx="496" cy="184" rx="15" ry="4" fill="#ffb84d" opacity="0.4" filter="url(#cafeSteamGlow)" />
            </g>

            {/* Rising Hot Aromatic Steam directly from the Top Middle of the Sini Cup */}
            <g filter="url(#cafeSteamGlow)">
              {/* Primary central steam plume originating at (496, 184) */}
              <path
                d="M 496 184 Q 484 135 506 85 Q 520 45 494 10"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                className="steam-top-center"
              />
              {/* Left steam wisp from top middle rim */}
              <path
                d="M 484 187 Q 460 140 480 95 Q 496 55 470 20"
                stroke="rgba(255, 255, 255, 0.48)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                className="steam-top-left"
              />
              {/* Right steam wisp from top middle rim */}
              <path
                d="M 508 187 Q 530 140 514 95 Q 500 55 524 15"
                stroke="rgba(255, 255, 255, 0.52)"
                strokeWidth="6.5"
                strokeLinecap="round"
                fill="none"
                className="steam-top-right"
              />
              {/* Fine swirling vapor thread */}
              <path
                d="M 496 178 Q 510 130 490 80 Q 478 45 500 8"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                className="steam-top-center"
              />
            </g>
          </svg>

          {/* Floating "ሃትሪክ ቡና • SINI TO-GO" Micro Badge */}
          {displayBadge && (
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-[#42bd6c]/80 text-[10px] sm:text-xs font-mono font-black text-amber-300 tracking-wider shadow-xl pointer-events-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#42bd6c] animate-ping" />
              <span className="text-white font-bold">ሃትሪክ ቡና</span>
              <span className="text-amber-400">•</span>
              <span>SINI TO-GO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
