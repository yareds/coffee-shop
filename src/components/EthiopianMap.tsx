import React, { useState, useEffect } from "react";
import { MapPin, Info, ArrowRight, User, BookOpen, Coffee, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PassportRegion } from "../types";

const DEFAULT_REGIONS: PassportRegion[] = [
  {
    id: "r1",
    name: "Yirgacheffe",
    elevation: "1,900m - 2,200m",
    process: "Washed / Natural",
    notes: ["Jasmine", "Citrus", "Bergamot", "Lemon Tea", "Peach"],
    farmer: "Abebech & family, Yirgacheffe Specialty Highlands",
    history: "Nestled in the Gedeo zone, Yirgacheffe is globally renowned for producing pristine, floral, and tea-like coffees. It is considered the birthplace of washed coffee processes in Ethiopia.",
    drinks: ["Yirgacheffe Pour Over", "Iced Citrus Brew"],
    badgeName: "Yirgacheffe Lover",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r2",
    name: "Sidama",
    elevation: "1,500m - 2,200m",
    process: "Natural / Washed",
    notes: ["Blueberry", "Citrus", "Floral", "Red Honey"],
    farmer: "Demeke Alamu, Sidama Highland Co-operative",
    history: "Sidama coffees are grown in expansive highland valleys. They are celebrated for their fruit-forward profile, deep sweetness, crisp citric acidity, and rich texture.",
    drinks: ["Sidama Natural Hand-Brew", "Sidama Espresso"],
    badgeName: "Sidama Explorer",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r3",
    name: "Guji",
    elevation: "1,800m - 2,100m",
    process: "Natural / Honey",
    notes: ["Wild Strawberry", "Peach", "Chocolate", "Honey Cream"],
    farmer: "Zenabu Tsegaye, Guji Forest Canopy Growers",
    history: "Guji's unique microclimate and dense forest soil yield remarkably sweet, complex cup profiles. Once grouped under Sidamo, it is now celebrated as a standalone premier origin.",
    drinks: ["Guji Nitro Cold Brew", "Guji AeroPress Cup"],
    badgeName: "Guji Adventurer",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r4",
    name: "Harrar",
    elevation: "1,500m - 2,100m",
    process: "Dry-Processed (Natural)",
    notes: ["Blueberry", "Wine-like Acid", "Dark Chocolate", "Blackberry"],
    farmer: "Tadesse Kebede, Eastern Harrar Hills",
    history: "One of the oldest coffee-growing regions in the world, Harrar yields highly distinctive, wild, winy, and complex dry-processed beans with rich chocolate undertones.",
    drinks: ["Traditional Jebena Brew (Abol)", "Harrar Double Shot"],
    badgeName: "Harrar Expert",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r5",
    name: "Limu",
    elevation: "1,400m - 1,900m",
    process: "Washed",
    notes: ["Black Tea", "Orange Peel", "Sweet Caramel", "Jasmine"],
    farmer: "Mulatu Chala, Limu Organic Growers Association",
    history: "Limu coffees are grown in southwest highlands. They are well-balanced with a round body, delicate floral notes, and clean citrus notes.",
    drinks: ["Limu Pour Over", "Limu French Press"],
    badgeName: "Limu Enthusiast",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r6",
    name: "Jimma",
    elevation: "1,400m - 2,000m",
    process: "Natural / Washed",
    notes: ["Caramel Cream", "Toasted Almond", "Milk Chocolate", "Low Acid"],
    farmer: "Fikru Hailu, Kossa Geshe Estates",
    history: "Historically famous for bulk natural coffees, Jimma now boasts incredible specialty farms producing rich, chocolatey, low-acid beans ideal for rich espressos.",
    drinks: ["Jimma Macchiato", "Traditional Jebena Brew (Tona)"],
    badgeName: "Jimma Pioneer",
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=60"
  }
];

export default function EthiopianMap({ onStampPassport, stampedRegions }: { 
  onStampPassport: (region: string) => void;
  stampedRegions: string[];
}) {
  const [regions, setRegions] = useState<PassportRegion[]>(DEFAULT_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<PassportRegion | null>(DEFAULT_REGIONS[0]);
  const [loading, setLoading] = useState(false);

  // Load regions from the server
  useEffect(() => {
    fetch("/api/ethiopia/regions")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRegions(data);
          setSelectedRegion(data[0]);
        }
      })
      .catch((err) => {
        // Quietly fallback to DEFAULT_REGIONS
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
    <div id="ethiopian-map" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#102418] p-6 rounded-2xl border border-[#1d432d]">
      {/* Map column */}
      <div className="lg:col-span-7 flex flex-col justify-between relative bg-[#0a1810] rounded-xl p-4 border border-[#1d432d] overflow-hidden min-h-[380px] md:min-h-[460px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/40">GEOGRAPHY</span>
            <span className="text-xs text-stone-400 font-mono">100% Arabica Birthplace</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-1">Interactive Ethiopian Terroir</h3>
          <p className="text-xs text-stone-300 max-w-md">Click a regional pin to discover high-elevation soils, farmer profiles, and heritage flavor notes.</p>
        </div>

        {/* Scaled Stylized SVG Map of Ethiopia */}
        <div className="flex-1 flex items-center justify-center relative my-4">
          <svg viewBox="0 0 400 320" className="w-full max-w-[420px] h-auto text-[#07120c] stroke-[#1d432d] stroke-width-1.5 fill-current">
            {/* Outline of Ethiopia */}
            <path d="M 120,40 C 150,35 180,30 200,30 C 230,30 250,50 280,60 C 310,70 340,70 360,90 C 370,100 365,115 375,130 C 385,145 395,160 390,175 C 385,190 350,210 330,225 C 310,240 280,265 260,285 C 240,300 210,295 190,290 C 170,285 140,270 120,265 C 100,260 80,250 70,230 C 60,210 40,190 30,170 C 20,150 10,130 15,115 C 20,100 45,95 60,90 C 75,85 85,75 100,65 Z" className="fill-[#081a10] stroke-[#1d432d] stroke-width-2 transition-all duration-500 hover:fill-[#0c2216]" />
            
            {/* Background grid indicators */}
            <line x1="200" y1="0" x2="200" y2="320" stroke="#1d432d" strokeDasharray="3,3" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#1d432d" strokeDasharray="3,3" />

            {/* Render Map pins */}
            {regions.map((region) => {
              const pos = regionPositions[region.name] || { x: 50, y: 50, color: "#38a15b" };
              const isSelected = selectedRegion?.id === region.id;
              const isStamped = stampedRegions.includes(region.name);

              return (
                <g key={region.id} className="cursor-pointer" onClick={() => setSelectedRegion(region)}>
                  {/* Pin Pulse effect */}
                  {isSelected && (
                    <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="12" fill={pos.color} className="opacity-20 animate-ping" />
                  )}
                  {/* Outer circle indicator */}
                  <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r={isSelected ? "7" : "5"} fill={isStamped ? "#38a15b" : pos.color} className="stroke-[#0a1810] stroke-width-1.5 transition-all duration-300" />
                  {/* Text label */}
                  <text x={`${pos.x}%`} y={`${pos.y - 4}%`} textAnchor="middle" className="text-[9px] font-mono font-bold fill-stone-200 pointer-events-none select-none bg-black/60 px-1 rounded">
                    {region.name}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Compass Rose accent */}
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-stone-500 flex flex-col items-center">
            <span className="border-b border-[#1d432d] pb-0.5">N</span>
            <span className="text-xs">☩</span>
          </div>
        </div>

        {/* Region selector bar */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#1d432d]">
          {regions.map((r) => {
            const isSelected = selectedRegion?.id === r.id;
            const isStamped = stampedRegions.includes(r.name);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-300 ${
                  isSelected
                    ? "bg-[#22683e] text-white font-bold"
                    : isStamped
                    ? "bg-[#38a15b]/20 text-[#38a15b] border border-[#38a15b]/40"
                    : "bg-[#12281b] text-stone-300 hover:text-white border border-[#1d432d]"
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
                <div className="flex justify-between items-start border-b border-[#1d432d] pb-3">
                  <div>
                    <h4 className="text-2xl font-bold font-display text-white">{selectedRegion.name}</h4>
                    <span className="text-xs font-mono text-[#38a15b]">{selectedRegion.elevation} Elevation</span>
                  </div>
                  <span className="text-xs font-mono bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/40 px-2 py-1 rounded">
                    {selectedRegion.process}
                  </span>
                </div>

                {/* Terroir & notes */}
                <div className="my-4">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedRegion.notes.map((note, i) => (
                      <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0a1810] text-stone-200 border border-[#1d432d]">
                        ✿ {note}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">{selectedRegion.history}</p>
                </div>

                {/* Farmer Highlight Card */}
                <div className="bg-[#0a1810] rounded-lg p-3.5 border border-[#1d432d] mb-4">
                  <div className="flex items-center gap-2 mb-1.5 text-[#38a15b]">
                    <User size={14} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Farmer Spotlight</span>
                  </div>
                  <p className="text-xs text-stone-300 italic">"{selectedRegion.farmer}"</p>
                </div>

                {/* Recommended Drinks */}
                <div>
                  <h5 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Coffee size={12} /> Regional Signature Beverages
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {selectedRegion.drinks.map((drink, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-stone-200 bg-[#122b1c] px-3 py-2 rounded border border-[#295a3d]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#42bd6c]"></span>
                        {drink}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stamp Actions */}
              <div className="pt-6 border-t border-[#295a3d] mt-6">
                {stampedRegions.includes(selectedRegion.name) ? (
                  <div className="flex items-center justify-between bg-[#224e38] border border-[#295a3d] rounded-xl px-4 py-3 text-[#42bd6c]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎖️</span>
                      <div>
                        <p className="text-xs font-bold leading-none">Passport Stamped</p>
                        <p className="text-[10px] text-stone-300 mt-0.5">Unlocked "{selectedRegion.badgeName}" Badge</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-[#42bd6c]/20 px-2 py-0.5 rounded border border-[#42bd6c]/40">STAMPED</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStamp(selectedRegion.name)}
                    className="w-full flex items-center justify-center gap-2 bg-[#2d824d] hover:bg-[#226a3f] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all duration-300 shadow-md shadow-emerald-950/20"
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
