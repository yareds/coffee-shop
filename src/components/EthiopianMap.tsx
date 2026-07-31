import React, { useState, useEffect } from "react";
import { MapPin, Info, ArrowRight, User, BookOpen, Coffee, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PassportRegion } from "../types";

export default function EthiopianMap({ onStampPassport, stampedRegions }: { 
  onStampPassport: (region: string) => void;
  stampedRegions: string[];
}) {
  const [regions, setRegions] = useState<PassportRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<PassportRegion | null>(null);
  const [loading, setLoading] = useState(true);

  // Load regions from the server
  useEffect(() => {
    fetch("/api/ethiopia/regions")
      .then((res) => res.json())
      .then((data) => {
        setRegions(data);
        if (data.length > 0) setSelectedRegion(data[0]); // default
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading regions:", err);
        setLoading(false);
      });
  }, []);

  // Approximate relative coordinates of regions within Ethiopia for the map visualization
  const regionPositions: { [key: string]: { x: number; y: number; color: string } } = {
    Yirgacheffe: { x: 50, y: 75, color: "#e28743" },
    Sidama: { x: 52, y: 68, color: "#c89d7c" },
    Guji: { x: 62, y: 78, color: "#a87c5c" },
    Harrar: { x: 75, y: 40, color: "#d95f02" },
    Limu: { x: 38, y: 60, color: "#7570b3" },
    Jimma: { x: 34, y: 66, color: "#1b9e77" }
  };

  const handleStamp = (regionName: string) => {
    onStampPassport(regionName);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#c89d7c]"></div>
      </div>
    );
  }

  return (
    <div id="ethiopian-map" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#1a1513] p-6 rounded-2xl border border-[#2c221e]">
      {/* Map column */}
      <div className="lg:col-span-7 flex flex-col justify-between relative bg-[#120f0e] rounded-xl p-4 border border-[#251e1b] overflow-hidden min-h-[380px] md:min-h-[460px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20">GEOGRAPHY</span>
            <span className="text-xs text-stone-500 font-mono">100% Arabica Birthplace</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[#f7f4f2] mb-1">Interactive Ethiopian Terroir</h3>
          <p className="text-xs text-stone-400 max-w-md">Click a regional pin to discover high-elevation soils, farmer profiles, and heritage flavor notes.</p>
        </div>

        {/* Scaled Stylized SVG Map of Ethiopia */}
        <div className="flex-1 flex items-center justify-center relative my-4">
          <svg viewBox="0 0 400 320" className="w-full max-w-[420px] h-auto text-[#1e1917] stroke-[#2c221e] stroke-width-1.5 fill-current">
            {/* Outline of Ethiopia */}
            <path d="M 120,40 C 150,35 180,30 200,30 C 230,30 250,50 280,60 C 310,70 340,70 360,90 C 370,100 365,115 375,130 C 385,145 395,160 390,175 C 385,190 350,210 330,225 C 310,240 280,265 260,285 C 240,300 210,295 190,290 C 170,285 140,270 120,265 C 100,260 80,250 70,230 C 60,210 40,190 30,170 C 20,150 10,130 15,115 C 20,100 45,95 60,90 C 75,85 85,75 100,65 Z" className="fill-[#141110] stroke-[#2d231f] stroke-width-2 transition-all duration-500 hover:fill-[#181413]" />
            
            {/* Background grid indicators */}
            <line x1="200" y1="0" x2="200" y2="320" stroke="#251d1a" strokeDasharray="3,3" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#251d1a" strokeDasharray="3,3" />

            {/* Render Map pins */}
            {regions.map((region) => {
              const pos = regionPositions[region.name] || { x: 50, y: 50, color: "#c89d7c" };
              const isSelected = selectedRegion?.id === region.id;
              const isStamped = stampedRegions.includes(region.name);

              return (
                <g key={region.id} className="cursor-pointer" onClick={() => setSelectedRegion(region)}>
                  {/* Pin Pulse effect */}
                  {isSelected && (
                    <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="12" fill={pos.color} className="opacity-20 animate-ping" />
                  )}
                  {/* Outer circle indicator */}
                  <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r={isSelected ? "7" : "5"} fill={isStamped ? "#82ca9d" : pos.color} className="stroke-[#120f0e] stroke-width-1.5 transition-all duration-300" />
                  {/* Text label */}
                  <text x={`${pos.x}%`} y={`${pos.y - 4}%`} textAnchor="middle" className="text-[9px] font-mono font-bold fill-stone-300 pointer-events-none select-none bg-black/50 px-1 rounded">
                    {region.name}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Compass Rose accent */}
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-stone-600 flex flex-col items-center">
            <span className="border-b border-stone-800 pb-0.5">N</span>
            <span className="text-xs">☩</span>
          </div>
        </div>

        {/* Region selector bar */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#1f1a18]">
          {regions.map((r) => {
            const isSelected = selectedRegion?.id === r.id;
            const isStamped = stampedRegions.includes(r.name);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-300 ${
                  isSelected
                    ? "bg-[#c89d7c] text-[#120f0e] font-bold"
                    : isStamped
                    ? "bg-[#82ca9d]/10 text-[#82ca9d] border border-[#82ca9d]/20"
                    : "bg-[#181412] text-stone-400 hover:text-stone-200 hover:bg-[#201b19]"
                }`}
              >
                {r.name} {isStamped && "✓"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Region Metadata Sidebar */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {selectedRegion && (
            <motion.div
              key={selectedRegion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 h-full justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-[#2c221e] pb-3">
                  <div>
                    <h4 className="text-2xl font-bold font-display text-white">{selectedRegion.name}</h4>
                    <span className="text-xs font-mono text-[#c89d7c]">{selectedRegion.elevation} Elevation</span>
                  </div>
                  <span className="text-xs font-mono bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20 px-2 py-1 rounded">
                    {selectedRegion.process}
                  </span>
                </div>

                {/* Terroir & notes */}
                <div className="my-4">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedRegion.notes.map((note, i) => (
                      <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#251e1b] text-stone-300 border border-[#2c221e]">
                        ✿ {note}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">{selectedRegion.history}</p>
                </div>

                {/* Farmer Highlight Card */}
                <div className="bg-[#141110] rounded-lg p-3.5 border border-[#231b18] mb-4">
                  <div className="flex items-center gap-2 mb-1.5 text-[#c89d7c]">
                    <User size={14} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Farmer Spotlight</span>
                  </div>
                  <p className="text-xs text-stone-400 italic">"{selectedRegion.farmer}"</p>
                </div>

                {/* Recommended Drinks */}
                <div>
                  <h5 className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Coffee size={12} /> Regional Signature Beverages
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {selectedRegion.drinks.map((drink, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-stone-300 bg-[#161211] px-3 py-2 rounded border border-[#221c19]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c89d7c]"></span>
                        {drink}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stamp Actions */}
              <div className="pt-6 border-t border-[#2c221e] mt-6">
                {stampedRegions.includes(selectedRegion.name) ? (
                  <div className="flex items-center justify-between bg-[#1e2a22] border border-[#2e4c35] rounded-xl px-4 py-3 text-[#82ca9d]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎖️</span>
                      <div>
                        <p className="text-xs font-bold leading-none">Passport Stamped</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Unlocked "{selectedRegion.badgeName}" Badge</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-[#82ca9d]/10 px-2 py-0.5 rounded border border-[#82ca9d]/20">STAMPED</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStamp(selectedRegion.name)}
                    className="w-full flex items-center justify-center gap-2 bg-[#c89d7c] hover:bg-[#b08766] text-[#120f0e] font-bold py-3 px-4 rounded-xl text-xs transition-all duration-300 shadow-md shadow-amber-950/20"
                  >
                    <span>☕ Try regional roast to Stamp Passport</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
