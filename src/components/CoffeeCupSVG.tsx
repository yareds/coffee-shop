import React from "react";

export default function CoffeeCupSVG() {
  return (
    <div className="relative w-[440px] h-[550px] md:w-[550px] md:h-[680px] mx-auto flex items-center justify-center opacity-55 mix-blend-screen select-none pointer-events-none transition-all duration-700">
      <svg
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_60px_rgba(200,157,124,0.22)]"
      >
        {/* Definitions for Gradients */}
        <defs>
          {/* Ambient background glow */}
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c89d7c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Cup body gradient - cardboard feel */}
          <linearGradient id="cupBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8c6c54" />
            <stop offset="15%" stopColor="#b59074" />
            <stop offset="50%" stopColor="#c89d7c" />
            <stop offset="85%" stopColor="#a37f63" />
            <stop offset="100%" stopColor="#7a5b44" />
          </linearGradient>

          {/* Cup rim shadow */}
          <linearGradient id="rimShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Liquid surface perspective gradient */}
          <radialGradient id="coffeeSurface" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e3cbbb" />
            <stop offset="25%" stopColor="#c59b7b" />
            <stop offset="60%" stopColor="#543725" />
            <stop offset="90%" stopColor="#2c1a11" />
            <stop offset="100%" stopColor="#120905" />
          </radialGradient>

          {/* Latte art cream gradient */}
          <linearGradient id="creamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f5e1d3" />
          </linearGradient>

          {/* Inner shadow for the top opening */}
          <radialGradient id="innerShadow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* 1. Ambient Background Glow */}
        <circle cx="200" cy="250" r="220" fill="url(#bgGlow)" />

        {/* 2. Steam & Smoke Layers (Cinematically Animated) */}
        <g opacity="0.45">
          {/* Broad, soft smoke path 1 */}
          <path
            d="M 180,105 C 165,80 215,50 185,25 C 170,12 185,2 195,-5"
            stroke="#ffeacf"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            opacity="0.15"
            className="animate-smoke-gentle"
          />

          {/* Broad, soft smoke path 2 */}
          <path
            d="M 215,108 C 235,82 175,55 210,30 C 225,18 210,5 200,-10"
            stroke="#c89d7c"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.12"
            className="animate-smoke-drift"
          />

          {/* Fine steam paths */}
          <path
            d="M170,100 Q160,70 175,40 T160,10"
            stroke="#c89d7c"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-slow"
          />
          <path
            d="M200,95 Q210,65 195,35 T205,5"
            stroke="#ffeacf"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-medium"
          />
          <path
            d="M230,105 Q220,75 235,45 T220,15"
            stroke="#c89d7c"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-fast"
          />

          {/* Additional secondary fine steam for density */}
          <path
            d="M185,98 Q195,73 180,48 T195,18"
            stroke="#ffeacf"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            className="animate-steam-slow"
          />
          <path
            d="M215,96 Q200,71 220,46 T205,16"
            stroke="#c89d7c"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            className="animate-steam-medium"
          />
        </g>

        {/* 3. Shadow Under the Cup */}
        <ellipse cx="200" cy="465" rx="90" ry="15" fill="#000" opacity="0.8" />
        <ellipse cx="200" cy="465" rx="120" ry="25" fill="#c89d7c" opacity="0.08" />

        {/* 4. Cup Body (Tapered Quad) */}
        {/* Top center at Y=125, Width=230 (115 to 285) */}
        {/* Bottom center at Y=450, Width=160 (120 to 280) */}
        <path
          d="M 85,125 
             L 120,450 
             Q 200,470 280,450 
             L 315,125 
             Z"
          fill="url(#cupBodyGrad)"
        />

        {/* 5. Printed Emblem & Sleeve Design on Cup (Clean Seal Motif, NO ghosted text) */}
        <g opacity="0.9">
          {/* Subtle Outer Craft Circle Seal */}
          <circle cx="200" cy="270" r="55" fill="#20130c" stroke="#5c402e" strokeWidth="2" opacity="0.85" />
          <circle cx="200" cy="270" r="49" stroke="#8c6246" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7" />

          {/* Center Heritage Coffee Branch & Bean Icon */}
          <g transform="translate(182, 238) scale(0.9)">
            {/* Main stem */}
            <path
              d="M20,55 C20,35 30,20 20,5"
              stroke="#c89d7c"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Leaves */}
            <path d="M20,5 C32,15 28,28 15,25 C8,22 10,12 20,5 Z" fill="#c89d7c" />
            <path d="M18,20 C5,18 2,30 18,32 C24,32 21,22 18,20 Z" fill="#9c7356" />
            <path d="M22,25 C35,23 38,35 22,37 C16,37 19,27 22,25 Z" fill="#c89d7c" />
            <path d="M17,38 C3,38 2,50 17,52 C23,52 20,40 17,38 Z" fill="#9c7356" />
            <path d="M21,42 C33,42 34,54 21,56 C15,56 18,44 21,42 Z" fill="#c89d7c" />
            
            {/* Coffee Beans near stem */}
            <ellipse cx="12" cy="18" rx="4" ry="2.5" fill="#e2b897" transform="rotate(-20 12 18)" />
            <ellipse cx="28" cy="28" rx="4" ry="2.5" fill="#e2b897" transform="rotate(25 28 28)" />
          </g>

          {/* Minimalist Geometry Band */}
          <line x1="100" y1="360" x2="300" y2="360" stroke="#3d2518" strokeWidth="1.5" opacity="0.6" />
          <line x1="120" y1="365" x2="280" y2="365" stroke="#3d2518" strokeWidth="0.8" opacity="0.4" />
        </g>

        {/* 6. Vertical 3D perspective folds / cup paper texture */}
        <path d="M 120,450 L 85,125" stroke="#ffffff" strokeWidth="1" opacity="0.08" />
        <path d="M 160,460 L 140,125" stroke="#ffffff" strokeWidth="15" opacity="0.04" />
        <path d="M 240,460 L 260,125" stroke="#000000" strokeWidth="20" opacity="0.12" />
        <path d="M 280,450 L 315,125" stroke="#000000" strokeWidth="1" opacity="0.1" />

        {/* Rim bottom shadow overlay */}
        <path
          d="M 85,125 
             Q 200,145 315,125
             L 310,135
             Q 200,155 90,135
             Z"
          fill="url(#rimShadowGrad)"
        />

        {/* 7. The Coffee Rim & Liquid (3D ellipse on top) */}
        {/* Exterior Rim (White paper thickness) */}
        <ellipse cx="200" cy="125" rx="116" ry="18" fill="#eadecf" stroke="#8c6c54" strokeWidth="1" />
        {/* Inner Liquid Boundary */}
        <ellipse cx="200" cy="125" rx="112" ry="15" fill="url(#coffeeSurface)" />
        <ellipse cx="200" cy="125" rx="112" ry="15" fill="url(#innerShadow)" />

        {/* 8. Elaborate Latte Art Heart Motif */}
        <g opacity="0.95" transform="translate(0, 0)">
          {/* Main big outer cream swirl */}
          <path
            d="M 200,132 
               C 175,124 135,122 135,116 
               C 135,110 170,112 200,124
               C 230,112 265,110 265,116
               C 265,122 225,124 200,132 Z"
            fill="url(#creamGrad)"
            opacity="0.8"
          />

          {/* Inner concentric heart tier 2 */}
          <path
            d="M 200,130 
               C 180,125 150,124 150,119 
               C 150,114 180,116 200,125
               C 220,116 250,114 250,119
               C 250,124 220,125 200,130 Z"
            fill="url(#creamGrad)"
            opacity="0.9"
          />

          {/* Center primary heart shape with stem trail */}
          <path
            d="M 200,128 
               C 188,124 165,124 165,120
               C 165,116 188,118 200,126
               C 212,118 235,116 235,120
               C 235,124 212,124 200,128 Z"
            fill="#ffffff"
          />

          {/* The Latte Art stem crossing through the center */}
          <path
            d="M 130,115 
               Q 200,132 270,115"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />

          {/* Cocoa Powder dusting spots */}
          <circle cx="125" cy="120" r="1.5" fill="#422515" opacity="0.6" />
          <circle cx="140" cy="126" r="2" fill="#422515" opacity="0.7" />
          <circle cx="150" cy="131" r="1" fill="#422515" opacity="0.5" />
          <circle cx="260" cy="125" r="2" fill="#422515" opacity="0.7" />
          <circle cx="275" cy="120" r="1.5" fill="#422515" opacity="0.6" />
          <circle cx="205" cy="134" r="1.5" fill="#422515" opacity="0.8" />
          <circle cx="195" cy="133" r="1" fill="#422515" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
