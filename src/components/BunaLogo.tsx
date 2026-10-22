import React from "react";
import HattrickLogo from "./HattrickLogo";

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
  return (
    <HattrickLogo
      size={size}
      theme="dark"
      showAmharic={true}
      showLocation={showTagline}
      className={className}
      onClick={onClick}
    />
  );
};

export default BunaLogo;
