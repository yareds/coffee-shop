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

export default function AromaExplorer({ onSelectRegion }: { onSelectRegion: (regionName: string) => void }) {
  const [selectedAroma, setSelectedAroma] = useState<string>("Blueberry");
  const [regions, setRegions] = useState<PassportRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ethiopia/regions")
      .then(res => res.json())
      .then(data => {
        setRegions(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  // Filter regions that have the selected aroma note
  const matchedRegions = regions.filter(region =>
    region.notes.some(note => note.toLowerCase().includes(selectedAroma.toLowerCase()))
  );

  return (
    <div id="aroma-explorer" className="bg-[#1a1513] p-6 rounded-2xl border border-[#2c221e]">
      
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20">SENSORY TOOL</span>
          <span className="text-xs text-stone-500 font-mono">Cupping Aromatics</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-[#f7f4f2]">Ethiopian Coffee Aroma Explorer</h3>
        <p className="text-xs text-stone-400 mt-0.5">Explore coffees by their core flavor compound notes. Click any aroma note to spotlight matching geographic estates.</p>
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
                  ? "bg-gradient-to-br border-[#c89d7c] text-white font-bold ring-1 ring-[#c89d7c]/40"
                  : "bg-[#120f0e] border-[#251e1b] text-stone-400 hover:text-stone-200"
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-xl group-hover:scale-110 transition-all">{aroma.icon}</span>
                {isSelected && <span className="text-[9px] font-mono text-[#c89d7c] uppercase">ACTIVE</span>}
              </div>
              <span className="mt-3.5 block font-medium tracking-tight text-stone-300 font-sans">{aroma.name}</span>
            </button>
          );
        })}
      </div>

      {/* Matched Terroirs Result list */}
      <div className="bg-[#120f0e] rounded-xl p-5 border border-[#251e1b]">
        <div className="flex items-center justify-between border-b border-[#221a17] pb-3 mb-4">
          <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={12} /> Matching Estates for "{selectedAroma}"
          </h4>
          <span className="text-[10px] font-mono text-stone-500">
            {matchedRegions.length} origin{matchedRegions.length !== 1 && "s"} found
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#c89d7c]"></div>
          </div>
        ) : matchedRegions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedRegions.map((r) => (
              <div
                key={r.id}
                className="bg-[#181412] p-4 rounded-xl border border-[#241d1a] hover:border-stone-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-bold text-white">{r.name} Region</h5>
                    <span className="text-[10px] font-mono text-[#c89d7c] bg-[#c89d7c]/10 px-2 py-0.5 rounded border border-[#c89d7c]/20">
                      {r.elevation}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed my-2.5 line-clamp-2">
                    {r.history}
                  </p>

                  {/* Flavor tag markers */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.notes.map((note, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          note.toLowerCase().includes(selectedAroma.toLowerCase())
                            ? "bg-[#c89d7c] text-black font-semibold"
                            : "bg-[#201917] text-stone-400 border border-[#2b211d]"
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
                  className="w-full mt-3 text-center bg-[#211917] hover:bg-[#342622] text-[#c89d7c] font-semibold text-xs py-2 px-3 rounded-lg border border-[#c89d7c]/10 transition-all"
                >
                  🗺 View Estate details on Map
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-500 italic">
            No specific regional profiles list "{selectedAroma}" as a prominent note today. Try choosing Jasmine, Chocolate, or Fruit.
          </div>
        )}
      </div>

    </div>
  );
}
