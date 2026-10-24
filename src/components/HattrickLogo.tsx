import React, { useState } from "react";

interface HattrickLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  theme?: "dark" | "light" | "auto";
  showAmharic?: boolean;
  showLocation?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: "horizontal" | "vertical" | "icon-only";
}

export const HattrickLogo: React.FC<HattrickLogoProps> = ({
  size = "md",
  theme = "dark",
  showAmharic = true,
  showLocation = true,
  className = "",
  onClick,
  variant = "horizontal",
}) => {
  const [imageError, setImageError] = useState(false);

  // Exact sizing mappings preserving the 1:1.24 aspect ratio of the official emblem (326x406)
  const iconSizeClass = {
    xs: "w-6 h-7.5",
    sm: "w-8 h-10",
    md: "w-10 h-12.5 sm:w-11 sm:h-14",
    lg: "w-16 h-20 sm:w-20 sm:h-25",
    xl: "w-24 h-30 sm:w-32 sm:h-40",
    hero: "w-36 h-45 sm:w-48 sm:h-60"
  }[size];

  const titleSizeClass = {
    xs: "text-xs tracking-[0.04em]",
    sm: "text-sm sm:text-base tracking-[0.04em]",
    md: "text-base sm:text-lg lg:text-xl tracking-[0.05em]",
    lg: "text-xl sm:text-2xl lg:text-3xl tracking-[0.05em]",
    xl: "text-2xl sm:text-4xl lg:text-5xl tracking-[0.05em]",
    hero: "text-3xl sm:text-5xl lg:text-6xl tracking-[0.05em]"
  }[size];

  const amharicSizeClass = {
    xs: "text-xs sm:text-sm font-extrabold",
    sm: "text-sm sm:text-lg font-extrabold",
    md: "text-lg sm:text-2xl lg:text-3xl font-black",
    lg: "text-2xl sm:text-3xl lg:text-4xl font-black",
    xl: "text-3xl sm:text-5xl lg:text-6xl font-black",
    hero: "text-4xl sm:text-6xl lg:text-7xl font-black"
  }[size];

  const locationSizeClass = {
    xs: "text-[7px] tracking-[0.12em]",
    sm: "text-[8px] sm:text-[9px] tracking-[0.14em]",
    md: "text-[9px] sm:text-[10px] tracking-[0.16em]",
    lg: "text-xs sm:text-sm tracking-[0.18em]",
    xl: "text-sm sm:text-base tracking-[0.2em]",
    hero: "text-base sm:text-lg tracking-[0.22em]"
  }[size];

  // Exact Emblem Artwork from attached image
  const BeanIcon = (
    <div className={`relative ${iconSizeClass} shrink-0 select-none group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
      {!imageError ? (
        <img
          src="/assets/aistudio/hattrick_emblem_cropped.png"
          alt="Hattrick Coffee & Ball Emblem"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
        />
      ) : (
        /* High-fidelity Vector Fallback in case image asset is blocked */
        <img
          src="/assets/aistudio/logo_714966a9.jpg"
          alt="Hattrick Coffee & Ball Emblem"
          className="w-full h-full object-contain rounded-full filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
        />
      )}
    </div>
  );

  if (variant === "icon-only") {
    return (
      <div onClick={onClick} className={`cursor-pointer inline-flex items-center justify-center ${className}`}>
        {BeanIcon}
      </div>
    );
  }

  // Text color mapping
  const textColorTitle = theme === "light" ? "text-[#2C170E]" : "text-white";
  const textColorAmharic = theme === "light" ? "text-[#2C170E]" : "text-[#E5BE57]";
  const textColorLocation = theme === "light" ? "text-[#3D2214]" : "text-stone-300";

  if (variant === "vertical") {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center group cursor-pointer select-none ${className}`}
      >
        {BeanIcon}

        {/* Row 1: English Title */}
        <h1 className={`font-black font-sans uppercase mt-3 transition-colors group-hover:text-amber-400 leading-tight ${titleSizeClass} ${textColorTitle}`}>
          HATTRICK COFFEE
        </h1>

        {/* Row 2: Amharic + Location */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-1">
          {showAmharic && (
            <span className={`font-black font-serif tracking-normal leading-none ${amharicSizeClass} ${textColorAmharic}`}>
              ሃትሪክ ቡና
            </span>
          )}

          {showLocation && (
            <span className={`font-bold font-sans uppercase leading-none ${locationSizeClass} ${textColorLocation}`}>
              HAWASSA, ETHIOPIA
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Format Lockup matching the reference:
  // [ EMBLEM ]  HATTRICK COFFEE
  //             ሃትሪክ ቡና  HAWASSA, ETHIOPIA
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 sm:gap-4 group cursor-pointer select-none shrink-0 ${className}`}
    >
      {BeanIcon}

      <div className="flex flex-col justify-center">
        {/* ROW 1: English Title */}
        <h1 className={`font-black font-sans uppercase transition-colors group-hover:text-amber-400 leading-tight ${titleSizeClass} ${textColorTitle}`}>
          HATTRICK COFFEE
        </h1>

        {/* ROW 2: Amharic Script + Hawassa Location Side by Side */}
        <div className="flex items-center gap-2 sm:gap-3.5 mt-0.5 sm:mt-1">
          {showAmharic && (
            <span className={`font-black font-serif tracking-normal leading-none ${amharicSizeClass} ${textColorAmharic}`}>
              ሃትሪክ ቡና
            </span>
          )}

          {showLocation && (
            <span className={`font-bold font-sans uppercase leading-none ${locationSizeClass} ${textColorLocation}`}>
              HAWASSA, ETHIOPIA
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HattrickLogo;
