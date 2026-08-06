import React, { useState, useEffect } from "react";
import { Compass, Sparkles, Filter, Coffee, Info } from "lucide-react";
import { PassportRegion } from "../types";

const AROMAS = [
  { name: "Blueberry", icon: "🫐", color: "from-[#4c1d95]/30 to-[#6d28d9]/10" },
  { name: "Jasmine", icon: "✿", color: "from-stone-900/40 to-stone-800/20" },
  { name: "Citrus", icon: "🍋", color: "from-[#854d0e]/30 to-[#a16207]/10" },
  { name: "Bergamot", icon: "🍊", color: "from-[#7c2d12]/30 to-[#9a3412]/10" },
  { name: "Peach", icon: "🍑", color: "from-[#9a3412]/30 to-[#b45309]/10" },
  { name: "Chocolate", icon: "🍫", color: "from-[#451a03]/30 to-[#78350f]/10" },
  { name: "Honey", icon: "🍯", color: "from-[#713f12]/30 to-[#854d0e]/10" },
  { name: "Caramel", icon: "🍮", color: "from-[#3b2314]/30 to-[#50301a]/10" },
  { name: "Wine-like", icon: "🍷", color: "from-[#701a75]/30 to-[#86198f]/10" },
  { name: "Tea-like", icon: "🍵", color: "from-[#064e3b]/30 to-[#065f46]/10" }
];

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

export default function AromaExplorer({ onSelectRegion }: { onSelectRegion: (regionName: string) => void }) {
  const [selectedAroma, setSelectedAroma] = useState<string>("Blueberry");
  const [regions, setRegions] = useState<PassportRegion[]>(DEFAULT_REGIONS);

  useEffect(() => {
    fetch("/api/ethiopia/regions")
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRegions(data);
        }
      })
      .catch(e => {
        // Quietly fallback to DEFAULT_REGIONS
      });
  }, []);

  // Filter regions that have the selected aroma note
  const matchedRegions = regions.filter(region =>
    region.notes.some(note => note.toLowerCase().includes(selectedAroma.toLowerCase()))
  );

  return (
    <div id="aroma-explorer" className="bg-[#102418] p-6 rounded-2xl border border-[#1d432d]">
      
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/40">SENSORY TOOL</span>
          <span className="text-xs text-stone-400 font-mono">Cupping Aromatics</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">Ethiopian Coffee Aroma Explorer</h3>
        <p className="text-xs text-stone-300 mt-0.5">Explore coffees by their core flavor compound notes. Click any aroma note to spotlight matching geographic estates.</p>
      </div>

      {/* Interactive Aroma Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
        {AROMAS.map((aroma) => {
          const isSelected = selectedAroma === aroma.name;
          return (
            <button
              key={aroma.name}
              onClick={() => setSelectedAroma(aroma.name)}
              className={`relative p-3 rounded-xl text-xs text-left transition-all duration-300 border flex flex-col justify-between overflow-hidden group ${
                isSelected
                  ? "bg-[#22683e]/30 border-[#38a15b] text-white font-bold ring-1 ring-[#38a15b]/40"
                  : "bg-[#0a1810] border-[#1d432d] text-stone-300 hover:text-white hover:bg-[#12281b]"
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-xl group-hover:scale-110 transition-all">{aroma.icon}</span>
                {isSelected && <span className="text-[9px] font-mono text-[#38a15b] uppercase">ACTIVE</span>}
              </div>
              <span className="mt-3.5 block font-medium tracking-tight text-stone-200 font-sans">{aroma.name}</span>
            </button>
          );
        })}
      </div>

      {/* Matched Terroirs Result list */}
      <div className="bg-[#0a1810] rounded-xl p-5 border border-[#1d432d]">
        <div className="flex items-center justify-between border-b border-[#1d432d] pb-3 mb-4">
          <h4 className="text-xs font-mono text-[#38a15b] uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={12} /> Matching Estates for "{selectedAroma}"
          </h4>
          <span className="text-[10px] font-mono text-stone-400">
            {matchedRegions.length} origin{matchedRegions.length !== 1 && "s"} found
          </span>
        </div>

        {matchedRegions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedRegions.map((r) => (
              <div
                key={r.id}
                className="bg-[#12281b] p-4 rounded-xl border border-[#1d432d] hover:border-[#38a15b]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-bold text-white">{r.name} Region</h5>
                    <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 px-2 py-0.5 rounded border border-[#22683e]/40">
                      {r.elevation}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed my-2.5 line-clamp-2">
                    {r.history}
                  </p>

                  {/* Flavor tag markers */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.notes.map((note, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          note.toLowerCase().includes(selectedAroma.toLowerCase())
                            ? "bg-[#22683e] text-white font-semibold"
                            : "bg-[#0a1810] text-stone-300 border border-[#1d432d]"
                        }`}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Explorer Action CTA */}
                <button
                  onClick={() => onSelectRegion(r.name)}
                  className="w-full mt-3 text-center bg-[#22683e] hover:bg-[#1a5230] text-white font-semibold text-xs py-2 px-3 rounded-lg border border-[#38a15b]/20 transition-all"
                >
                  🗺 View Estate details on Map
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400 italic">
            No specific regional profiles list "{selectedAroma}" as a prominent note today. Try choosing Jasmine, Chocolate, or Fruit.
          </div>
        )}
      </div>

    </div>
  );
}
