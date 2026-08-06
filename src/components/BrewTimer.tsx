import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flame, Compass, BookOpen, Coffee, Clock, Plus, Trash2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BrewMethod {
  name: string;
  ratio: string;
  grind: string;
  temp: string;
  totalTime: number; // in seconds
  steps: { seconds: number; text: string }[];
  tips: string[];
}

const BREW_METHODS: { [key: string]: BrewMethod } = {
  "Pour Over": {
    name: "Pour Over (V60 / Chemex)",
    ratio: "1:15 (15g coffee to 225g water)",
    grind: "Medium-Coarse (Sea Salt)",
    temp: "93°C / 200°F",
    totalTime: 180,
    steps: [
      { seconds: 0, text: "Wet filter, discard water. Add grounds and level them." },
      { seconds: 30, text: "Bloom: Pour 45g water to saturate grounds. Wait for bubbles." },
      { seconds: 90, text: "First Pour: Pour in circular motions up to 135g." },
      { seconds: 140, text: "Second Pour: Pour slowly in circles up to 225g." },
      { seconds: 180, text: "Let it drain fully. Enjoy your clean, bright brew!" }
    ],
    tips: ["Pour from high to generate turbulence.", "Keep flow rate thin and constant."]
  },
  "French Press": {
    name: "French Press (Plunger)",
    ratio: "1:16 (18g coffee to 290g water)",
    grind: "Coarse (Breadcrumbs)",
    temp: "95°C / 203°F",
    totalTime: 240,
    steps: [
      { seconds: 0, text: "Add coarse coffee grounds. Pour full 290g water gently." },
      { seconds: 60, text: "Let sit. A dark crust of grounds will form on top." },
      { seconds: 120, text: "Stir: Gently break the crust with a wooden spoon." },
      { seconds: 230, text: "Assemble lid. Prepare to plunge." },
      { seconds: 240, text: "Plunge slowly with even pressure. Pour out immediately!" }
    ],
    tips: ["Plunge slowly to avoid pushing fine sediment into the cup.", "Do not leave leftover brewed coffee inside the press."]
  },
  "Aeropress": {
    name: "AeroPress (Inverted)",
    ratio: "1:13 (16g coffee to 208g water)",
    grind: "Medium-Fine (Fine Sand)",
    temp: "88°C / 190°F",
    totalTime: 90,
    steps: [
      { seconds: 0, text: "Assemble inverted AeroPress. Add ground coffee and pour water." },
      { seconds: 10, text: "Stir vigorously 10 times to ensure even extraction." },
      { seconds: 40, text: "Place cap with wet paper filter. Let sit." },
      { seconds: 75, text: "Carefully flip onto your sturdy mug." },
      { seconds: 90, text: "Press down slowly until you hear a gentle hiss. Stop there!" }
    ],
    tips: ["Pressing too hard compacts the bed and creates bitter flavors.", "Stop pressing as soon as the 'hissing' sound begins."]
  },
  "Cold Brew": {
    name: "Cold Brew Concentrator",
    ratio: "1:8 (50g coffee to 400g cold water)",
    grind: "Extra-Coarse (Rocks)",
    temp: "Cold Tap Water",
    totalTime: 30, // simulated short timer for interactive purposes
    steps: [
      { seconds: 0, text: "Mix ground beans with cold tap water inside a glass jar." },
      { seconds: 10, text: "Stir thoroughly to saturate all dry pockets." },
      { seconds: 20, text: "Seal jar airtight. Steep in fridge for 14-18 hours." },
      { seconds: 30, text: "Filter through a fine sieve or paper filter. Dilute with ice/milk!" }
    ],
    tips: ["Steeping longer than 24 hours draws out bitter woody tastes.", "Dilute the concentrate 1:1 with filtered water or oat milk."]
  },
  "Espresso": {
    name: "Espresso (Portafilter Extraction)",
    ratio: "1:2 (18g coffee ground to 36g espresso)",
    grind: "Extra-Fine (Powder)",
    temp: "92°C / 198°F",
    totalTime: 28,
    steps: [
      { seconds: 0, text: "Wipe portafilter basket dry. Grind 18g coffee in." },
      { seconds: 8, text: "Distribute coffee evenly and tamp level with 30 lbs pressure." },
      { seconds: 12, text: "Lock portafilter into group head, place cup, start pump immediately." },
      { seconds: 28, text: "Stop extraction as honeyed liquid turns blonde (around 36g). Enjoy!" }
    ],
    tips: ["A perfect extraction should take between 25 and 30 seconds.", "Preheat your ceramic cups to retain microfoam texture."]
  }
};

export default function BrewTimer() {
  const [activeMethod, setActiveMethod] = useState<string>("Pour Over");
  const [timeLeft, setTimeLeft] = useState<number>(BREW_METHODS["Pour Over"].totalTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customRecipes, setCustomRecipes] = useState<any[]>([
    { id: "c1", name: "Yared's Early Morning V60", method: "Pour Over", ratio: "1:14 (16g to 224g)", notes: "Fast extraction, extra punch" }
  ]);
  const [newRecipeName, setNewRecipeName] = useState<string>("");

  const method = BREW_METHODS[activeMethod] || BREW_METHODS["Pour Over"];

  // Countdown clock effect
  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle brew method switch
  const handleMethodChange = (name: string) => {
    setActiveMethod(name);
    setTimeLeft(BREW_METHODS[name].totalTime);
    setIsRunning(false);
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(method.totalTime);
    setIsRunning(false);
  };

  // Find active step matching elapsed time
  const getActiveStep = () => {
    const elapsed = method.totalTime - timeLeft;
    let activeStep = method.steps[0];
    for (const step of method.steps) {
      if (elapsed >= step.seconds) {
        activeStep = step;
      }
    }
    return activeStep;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSaveRecipe = () => {
    if (newRecipeName.trim()) {
      setCustomRecipes([
        ...customRecipes,
        {
          id: "cr_" + Date.now(),
          name: newRecipeName,
          method: activeMethod,
          ratio: method.ratio,
          notes: "My custom temperature and timing tweak"
        }
      ]);
      setNewRecipeName("");
    }
  };

  const handleDeleteRecipe = (id: string) => {
    setCustomRecipes(customRecipes.filter(r => r.id !== id));
  };

  const activeStep = getActiveStep();
  const progressPercent = ((method.totalTime - timeLeft) / method.totalTime) * 100;

  return (
    <div id="brew-timer" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#102418] p-6 rounded-2xl border border-[#1d432d]">
      
      {/* 1. Timer Clock face and visual countdown */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-[#0a1810] rounded-xl p-6 border border-[#1d432d] min-h-[380px] text-center relative overflow-hidden">
        <div>
          <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 border border-[#22683e]/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
            BREW MASTER TIMER
          </span>
          <h4 className="text-xl font-bold text-white mt-1.5 font-display">{method.name}</h4>
        </div>

        {/* Big visual countdown wheel */}
        <div className="my-6 relative flex items-center justify-center">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle cx="96" cy="96" r="84" className="stroke-[#12281b] stroke-width-4 fill-none" />
            <motion.circle
              cx="96"
              cy="96"
              r="84"
              className="stroke-[#38a15b] stroke-width-6 fill-none"
              strokeDasharray={527}
              strokeDashoffset={527 - (527 * progressPercent) / 100}
              transition={{ ease: "linear" }}
            />
          </svg>

          {/* Core clock text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-mono text-white tracking-tight">{formatTime(timeLeft)}</span>
            <span className="text-[10px] font-mono text-[#38a15b] mt-1 uppercase tracking-widest animate-pulse">
              {isRunning ? "Steeping..." : timeLeft === 0 ? "BREAD IS READY! 🎉" : "Ready"}
            </span>
          </div>
        </div>

        {/* Control row */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-xl bg-[#0a1810] border border-[#1d432d] text-stone-300 hover:text-white hover:bg-[#12281b] text-xs font-mono transition-all flex-1"
          >
            Reset
          </button>
          <button
            onClick={handleStartPause}
            className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex-[2] ${
              isRunning ? "bg-amber-800 text-white" : "bg-[#22683e] hover:bg-[#1a5230] text-white shadow-lg shadow-emerald-950/20"
            }`}
          >
            {isRunning ? "Pause Timer" : "Start Pour"}
          </button>
        </div>
      </div>

      {/* 2. Step instructions & Recipe Builder */}
      <div className="lg:col-span-7 flex flex-col justify-between">
        <div>
          {/* Method Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-[#1d432d] pb-3">
            {Object.keys(BREW_METHODS).map((name) => (
              <button
                key={name}
                onClick={() => handleMethodChange(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeMethod === name
                    ? "bg-[#22683e] text-white font-bold"
                    : "bg-[#0a1810] text-stone-300 hover:text-white border border-[#1d432d]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Terroir specs */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 text-xs font-mono">
            <div className="bg-[#0a1810] p-2.5 rounded-lg border border-[#1d432d]">
              <span className="text-[9px] text-stone-400 uppercase block">Ratio</span>
              <span className="text-stone-200 font-bold">{method.ratio.split(" ")[0]}</span>
            </div>
            <div className="bg-[#0a1810] p-2.5 rounded-lg border border-[#1d432d]">
              <span className="text-[9px] text-stone-400 uppercase block">Grind</span>
              <span className="text-stone-200 font-bold truncate block" title={method.grind}>{method.grind}</span>
            </div>
            <div className="bg-[#0a1810] p-2.5 rounded-lg border border-[#1d432d]">
              <span className="text-[9px] text-stone-400 uppercase block">Temp</span>
              <span className="text-stone-200 font-bold">{method.temp}</span>
            </div>
          </div>

          {/* Active step guide instructions */}
          <div className="bg-[#0a1810] rounded-xl p-4 border border-[#1d432d] mb-6">
            <h5 className="text-xs font-mono text-[#38a15b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={12} /> Active Barista Instructions
            </h5>
            <div className="min-h-[50px] flex items-center">
              <p className="text-sm text-stone-100 font-semibold leading-relaxed">
                {activeStep.text}
              </p>
            </div>
          </div>

          {/* Barista tips */}
          <div className="flex flex-col gap-1.5 mb-6 bg-[#0a1810] p-4 rounded-xl border border-[#1d432d]">
            <span className="text-[10px] font-mono text-[#38a15b] uppercase tracking-wider font-bold">⭐ Pro-Barista Brewing Tips</span>
            {method.tips.map((tip, i) => (
              <p key={i} className="text-xs text-stone-300 leading-normal">• {tip}</p>
            ))}
          </div>
        </div>

        {/* Custom recipe vault persistence */}
        <div className="border-t border-[#1d432d] pt-6">
          <h5 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-3">Custom Recipe Vault</h5>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Give your custom recipe a name..."
              value={newRecipeName}
              onChange={(e) => setNewRecipeName(e.target.value)}
              className="flex-1 bg-[#0a1810] border border-[#1d432d] rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#38a15b]"
            />
            <button
              onClick={handleSaveRecipe}
              className="px-4 py-2 bg-[#22683e] hover:bg-[#1a5230] text-white border border-[#38a15b]/30 rounded-xl text-xs transition-all flex items-center gap-1 font-semibold"
            >
              <Plus size={14} /> Save
            </button>
          </div>

          {/* Render custom recipes list */}
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {customRecipes.map((r) => (
              <div key={r.id} className="flex justify-between items-center bg-[#0a1810] p-3 rounded-lg border border-[#1d432d] text-xs">
                <div>
                  <p className="font-bold text-stone-200">{r.name}</p>
                  <p className="text-[10px] text-[#38a15b] mt-0.5">{r.method} | {r.ratio}</p>
                </div>
                <button
                  onClick={() => handleDeleteRecipe(r.id)}
                  className="text-stone-400 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
