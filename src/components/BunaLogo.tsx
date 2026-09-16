import React from "react";

interface BunaLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BunaLogo: React.FC<BunaLogoProps> = ({
  size = "md",
  showTagline = true,
  className = "",
  onClick
}) => {
  // Sizing mappings with mobile optimization
  const iconSizeClass = {
    sm: "h-7 w-7 sm:h-8 sm:w-8",
    md: "h-8 w-8 sm:h-10 sm:w-10",
    lg: "h-12 w-12 sm:h-14 sm:w-14"
  }[size];

  const titleSizeClass = {
    sm: "text-base sm:text-lg tracking-[0.18em]",
    md: "text-lg sm:text-2xl tracking-[0.18em] sm:tracking-[0.22em]",
    lg: "text-2xl sm:text-3xl tracking-[0.22em] sm:tracking-[0.25em]"
  }[size];

  const badgeSizeClass = {
    sm: "text-[7px] sm:text-[8px] px-1 py-0.2",
    md: "text-[8px] sm:text-[9px] px-1.5 py-0.5 sm:px-2",
    lg: "text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1"
  }[size];

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3.5 group cursor-pointer select-none shrink-0 ${className}`}
    >
      {/* Refined Geometric Emblem / Mark */}
      <div className={`relative ${iconSizeClass} shrink-0 flex items-center justify-center`}>
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#22683e]/30 via-[#22683e]/10 to-transparent blur-md group-hover:blur-lg transition-all duration-300 opacity-80" />
        
        {/* Vector SVG Mark */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Rich Coffee Green Gradient */}
            <linearGradient id="bunaGoldGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#48c774" />
              <stop offset="45%" stopColor="#22683e" />
              <stop offset="100%" stopColor="#144326" />
            </linearGradient>

            {/* Inner Surface Gradient matching Hero Background */}
            <linearGradient id="bunaInnerDark" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f3ece1" />
              <stop offset="100%" stopColor="#faf6f0" />
            </linearGradient>

            {/* Subtle Glow Filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Squircle Container with Gold Border */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="url(#bunaInnerDark)"
            stroke="url(#bunaGoldGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Subtle Inner Ring Accent */}
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="9"
            fill="none"
            stroke="url(#bunaGoldGrad)"
            strokeWidth="0.5"
            strokeOpacity="0.25"
            strokeDasharray="2 2"
          />

          {/* Artfully Crafted Vector Coffee Cup Mark */}
          <g filter="url(#goldGlow)">
            {/* Saucer Dish Base */}
            <path
              d="M 13 35.5 C 18 37.5 30 37.5 35 35.5"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cup Body Fill & Outline */}
            <path
              d="M 15 21 L 17.2 31.5 C 18.2 34.5 29.8 34.5 30.8 31.5 L 33 21 Z"
              fill="url(#bunaGoldGrad)"
              fillOpacity="0.25"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Cup Top Oval Rim (Liquid Surface) */}
            <ellipse
              cx="24"
              cy="21"
              rx="9"
              ry="2.8"
              fill="#1b4d2e"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.5"
            />

            {/* Liquid Coffee Reflection Ring */}
            <ellipse
              cx="24"
              cy="21"
              rx="6"
              ry="1.6"
              fill="url(#bunaGoldGrad)"
              fillOpacity="0.45"
            />

            {/* Elegant Cup Handle */}
            <path
              d="M 32.5 23 C 37.5 23.5 37.5 30.5 30.5 31"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rising Aromatic Steam Wisps */}
            <path
              d="M 20 17 C 19 14.5 21.5 12.5 20 10"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.85"
            />
            <path
              d="M 24 16 C 23 13 25.5 11 24 8.5"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.95"
            />
            <path
              d="M 28 17 C 27 14.5 29.5 12.5 28 10"
              stroke="url(#bunaGoldGrad)"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.85"
            />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <h1 className={`font-serif-display font-extrabold text-white transition-colors duration-200 group-hover:text-[#38a15b] ${titleSizeClass}`}>
            BUNA
          </h1>
          <span className={`font-mono rounded-full bg-gradient-to-r from-[#22683e] to-[#38a15b] text-white font-extrabold uppercase tracking-widest shadow-sm shadow-[#22683e]/20 ${badgeSizeClass}`}>
            ETHIOPIA
          </span>
        </div>
        {showTagline && (
          <p className="text-[10px] text-stone-400 font-mono tracking-[0.18em] uppercase hidden sm:block mt-0.5">
            Artisanal Terroirs & Heritage Ceremony
          </p>
        )}
      </div>
    </div>
  );
};

export default BunaLogo;
