import React, { useState } from "react";
import { Coffee, RotateCcw, Flame, Sparkles, Check, Info, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BuilderOption {
  coffee: 'Espresso' | 'Jebena Brew' | 'Cold Brew' | 'Pour Over';
  shots: 0 | 1 | 2 | 3;
  milk: 'none' | 'whole' | 'oat' | 'almond' | 'cream';
  syrup: 'none' | 'cardamom' | 'cinnamon' | 'vanilla' | 'caramel';
  foam: 'none' | 'microfoam' | 'heavy' | 'coldfoam';
  temp: 'hot' | 'iced';
  ice: 'none' | 'light' | 'regular' | 'extra';
  toppings: 'none' | 'cocoa' | 'barley' | 'cinnamon-dust';
  size: 'Regular' | 'Large';
}

const MILK_LABELS = { none: "No Milk", whole: "Velvety Whole Milk", oat: "Organic Oat Milk", almond: "Nutty Almond Milk", cream: "Heavy Sweet Cream" };
const SYRUP_LABELS = { none: "No Syrup", cardamom: "Traditional Cardamom Syrup", cinnamon: "Spiced Cinnamon Syrup", vanilla: "Vanilla Bean Pod Syrup", caramel: "Burnt Caramel Drizzle" };
const FOAM_LABELS = { none: "No Foam", microfoam: "Velvety Microfoam", heavy: "Thick Cappuccino Foam", coldfoam: "Sweet Salted Cold Foam" };
const TOPPING_LABELS = { none: "No Toppings", cocoa: "Raw Organic Cocoa Dust", barley: "Roasted Barley Sprinkles (Kolo)", "cinnamon-dust": "Warm Cinnamon Dusting" };

export default function DrinkBuilder({ onOrderSuccess }: { onOrderSuccess: (points: number, stampMsg?: string) => void }) {
  const [drink, setDrink] = useState<BuilderOption>({
    coffee: "Jebena Brew",
    shots: 0,
    milk: "none",
    syrup: "none",
    foam: "none",
    temp: "hot",
    ice: "none",
    toppings: "none",
    size: "Regular"
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic state calculations
  const calculateStats = (d: BuilderOption) => {
    let price = 100.00;
    let calories = 5;
    let caffeine = 100;

    // Coffee base modifiers
    if (d.coffee === "Espresso") { price += 15.00; caffeine = 75; calories = 2; }
    else if (d.coffee === "Jebena Brew") { price += 20.00; caffeine = 140; calories = 5; }
    else if (d.coffee === "Cold Brew") { price += 30.00; caffeine = 150; calories = 3; }
    else if (d.coffee === "Pour Over") { price += 40.00; caffeine = 110; calories = 2; }

    // Size modifier
    if (d.size === "Large") {
      price *= 1.25;
      calories *= 1.3;
      caffeine *= 1.35;
    }

    // Shots modifier
    price += d.shots * 25.00;
    caffeine += d.shots * 65;
    calories += d.shots * 2;

    // Milk calories & price
    if (d.milk !== "none") {
      if (d.milk === "whole") { calories += 80; price += 10.00; }
      else if (d.milk === "oat") { calories += 60; price += 20.00; }
      else if (d.milk === "almond") { calories += 45; price += 20.00; }
      else if (d.milk === "cream") { calories += 140; price += 25.00; }
    }

    // Syrup calories & price
    if (d.syrup !== "none") {
      price += 15.00;
      calories += 70;
    }

    // Foam calories & price
    if (d.foam !== "none") {
      price += 12.00;
      if (d.foam === "microfoam") calories += 30;
      else if (d.foam === "heavy") calories += 20;
      else if (d.foam === "coldfoam") calories += 90;
    }

    // Toppings
    if (d.toppings !== "none") {
      price += 10.00;
      calories += 10;
    }

    return {
      price: Number(price.toFixed(2)),
      calories: Math.round(calories),
      caffeine: Math.round(caffeine)
    };
  };

  const { price, calories, caffeine } = calculateStats(drink);

  const handleReset = () => {
    setDrink({
      coffee: "Jebena Brew",
      shots: 0,
      milk: "none",
      syrup: "none",
      foam: "none",
      temp: "hot",
      ice: "none",
      toppings: "none",
      size: "Regular"
    });
    setSuccessMsg(null);
  };

  const handleOrder = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      // Maps traditional coffee selection to regions for passport stamps!
      let simulatedRegion = "Guji";
      if (drink.coffee === "Jebena Brew") simulatedRegion = "Harrar";
      else if (drink.coffee === "Pour Over") simulatedRegion = "Yirgacheffe";
      else if (drink.milk === "cream") simulatedRegion = "Sidama";

      const devId = localStorage.getItem("buna_device_id") || "default-device";

      const response = await fetch("/api/order/custom", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-ID": devId
        },
        body: JSON.stringify({
          region: simulatedRegion,
          roast: drink.temp === "hot" ? "Medium-Dark" : "Light-Medium",
          method: drink.coffee,
          sugar: drink.syrup !== "none" ? "Sweet" : "None",
          milk: dmlLabel(drink.milk),
          spices: drink.syrup === "cardamom" ? "Cardamom" : "None",
          size: drink.size,
          price,
          calories,
          caffeine
        }),
      });

      const resData = await response.json();
      setSuccessMsg(resData.message || "Custom Brew Completed!");
      onOrderSuccess(25, resData.message);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const dmlLabel = (val: string) => {
    return MILK_LABELS[val as keyof typeof MILK_LABELS] || "none";
  };

  // Determine layers heights and colors for real-time visual representation of cup
  const getCupLayers = () => {
    const layers = [];
    
    // 1. Base Syrup Layer if present
    if (drink.syrup !== "none") {
      let syrupColor = "#3d2212"; // caramel
      if (drink.syrup === "cardamom") syrupColor = "#4a4535";
      else if (drink.syrup === "cinnamon") syrupColor = "#522f1c";
      layers.push({ height: "12%", color: syrupColor, label: SYRUP_LABELS[drink.syrup] });
    }

    // 2. Main Coffee Layer (Darker if black, lighter if mixed with milk)
    let coffeeColor = "#1a0e08"; // super dark black coffee
    let coffeeLabel = `${drink.coffee} Base`;
    if (drink.shots > 0) coffeeLabel += ` (+ ${drink.shots} Shots)`;

    if (drink.milk !== "none") {
      if (drink.milk === "whole") coffeeColor = "#664939"; // creamy brown
      else if (drink.milk === "oat" || drink.milk === "almond") coffeeColor = "#7d5d4a"; // light taupe
      else if (drink.milk === "cream") coffeeColor = "#543729"; // rich warm milk
    }
    layers.push({ height: "65%", color: coffeeColor, label: coffeeLabel });

    // 3. Foam Layer
    if (drink.foam !== "none") {
      let foamColor = "#fefefe"; // crisp white
      if (drink.foam === "coldfoam") foamColor = "#fdf9f4"; // sweet offwhite
      layers.push({ height: "18%", color: foamColor, label: FOAM_LABELS[drink.foam] });
    }

    return layers;
  };

  const layers = getCupLayers();

  return (
    <div id="drink-builder" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#102418] p-6 rounded-2xl border border-[#1d432d]">
      
      {/* 1. Real-time Visual Cup Stage */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-[#0a1810] rounded-xl p-6 border border-[#1d432d] min-h-[380px] text-center overflow-hidden">
        <div>
          <span className="text-[10px] font-mono text-[#38a15b] bg-[#22683e]/20 border border-[#22683e]/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
            Real-time Cup Visualizer
          </span>
          <h4 className="text-lg font-bold text-white mt-1.5 font-display">{drink.size} Custom {drink.coffee}</h4>
          <p className="text-[11px] text-stone-400 font-mono mt-0.5">{drink.temp === "hot" ? "🔥 BREWING HOT" : "❄️ ICED SHAKE"}</p>
        </div>

        {/* The Graphic Coffee Glass */}
        <div className="flex-1 flex items-center justify-center relative my-6">
          <div className="relative w-44 h-56 border-x-4 border-b-4 border-[#1d432d]/80 rounded-b-[40px] rounded-t-[10px] overflow-hidden flex flex-col-reverse shadow-2xl bg-[#0a1810]">
            
            {/* Visual Glass Reflection Accent */}
            <div className="absolute inset-y-0 right-4 w-4 bg-white/5 skew-x-12 pointer-events-none z-20"></div>

            {/* Ice Cubes visualization */}
            {drink.temp === "iced" && (
              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8 z-10 opacity-75 pointer-events-none">
                <motion.div animate={{ rotate: [0, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="h-8 w-8 bg-blue-100/30 border border-white/20 rounded-lg flex items-center justify-center text-xs">🧊</motion.div>
                <motion.div animate={{ rotate: [0, -15, 15] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} className="h-7 w-7 bg-blue-100/30 border border-white/20 rounded-lg self-center flex items-center justify-center text-xs">🧊</motion.div>
                <motion.div animate={{ rotate: [0, 5, -5] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="h-8 w-8 bg-blue-100/30 border border-white/20 rounded-lg col-span-2 mx-auto flex items-center justify-center text-xs">🧊</motion.div>
              </div>
            )}

            {/* Dynamic Layers stacked bottom up */}
            {layers.map((layer, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0 }}
                animate={{ height: layer.height }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ backgroundColor: layer.color }}
                className="w-full relative flex items-center justify-center border-t border-black/10 text-[9px] font-mono font-bold text-white/50 truncate px-2 select-none"
                title={layer.label}
              >
                {layer.label}
              </motion.div>
            ))}

            {/* Topping representation layer at absolute top */}
            {drink.toppings !== "none" && (
              <div className="absolute top-0 inset-x-0 h-4 flex justify-center items-center gap-1 z-15 select-none pointer-events-none">
                {drink.toppings === "cocoa" && <span className="text-[9px] text-[#3d2c20]">🍫🍫🍫</span>}
                {drink.toppings === "barley" && <span className="text-[9px] text-[#38a15b]">🌾🌾🌾</span>}
                {drink.toppings === "cinnamon-dust" && <span className="text-[9px] text-[#8e4a23]">🍂🍂🍂</span>}
              </div>
            )}
          </div>

          {/* Steam animation if hot */}
          {drink.temp === "hot" && (
            <div className="absolute -top-4 inset-x-0 flex justify-center gap-4 text-xs select-none text-[#38a15b]/40 pointer-events-none">
              <motion.span animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>♨️</motion.span>
              <motion.span animate={{ y: [0, -18, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.4 }}>♨️</motion.span>
              <motion.span animate={{ y: [0, -13, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.8 }}>♨️</motion.span>
            </div>
          )}
        </div>

        {/* Stats and pricing dashboard */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1d432d]">
          <div className="bg-[#12281b] p-2 rounded-lg border border-[#1d432d]">
            <p className="text-[9px] font-mono text-stone-400 uppercase">Estimated Calories</p>
            <p className="text-sm font-bold font-mono text-white mt-0.5">{calories} kcal</p>
          </div>
          <div className="bg-[#12281b] p-2 rounded-lg border border-[#1d432d]">
            <p className="text-[9px] font-mono text-stone-400 uppercase">Estimated Caffeine</p>
            <p className="text-sm font-bold font-mono text-white mt-0.5">{caffeine} mg</p>
          </div>
          <div className="bg-[#12281b] p-2 rounded-lg border border-[#1d432d] text-right">
            <p className="text-[9px] font-mono text-[#38a15b] uppercase">Final Price</p>
            <p className="text-sm font-black font-mono text-[#38a15b] mt-0.5">{price.toFixed(2)} Birr</p>
          </div>
        </div>
      </div>

      {/* 2. Builder Selection Controls */}
      <div className="lg:col-span-7 flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Base Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Coffee Base Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['Espresso', 'Jebena Brew', 'Cold Brew', 'Pour Over'].map((base) => (
                <button
                  key={base}
                  onClick={() => setDrink(prev => ({ ...prev, coffee: base as any }))}
                  className={`px-3 py-2.5 rounded-xl text-xs text-left transition-all ${
                    drink.coffee === base
                      ? "bg-[#22683e]/30 border-[#38a15b] text-white font-bold border"
                      : "bg-[#0a1810] text-stone-300 hover:text-white border border-[#1d432d]"
                  }`}
                >
                  {base}
                </button>
              ))}
            </div>
          </div>

          {/* Size & Temp */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-stone-400 uppercase">Size</label>
              <div className="flex rounded-xl overflow-hidden border border-[#1d432d] p-1 bg-[#0a1810] h-[42px] items-center">
                {['Regular', 'Large'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setDrink(prev => ({ ...prev, size: s as any }))}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                      drink.size === s ? "bg-[#22683e] text-white" : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-stone-400 uppercase">Temperature</label>
              <div className="flex rounded-xl overflow-hidden border border-[#1d432d] p-1 bg-[#0a1810] h-[42px] items-center">
                {(['hot', 'iced'] as any[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDrink(prev => ({ ...prev, temp: t, ice: t === 'iced' ? 'regular' : 'none' }))}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all uppercase ${
                      drink.temp === t ? t === 'hot' ? "bg-amber-700 text-white" : "bg-emerald-700 text-white" : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Espresso Shots */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Extra Espresso Shots (+25.00 Birr/ea)</label>
            <div className="flex justify-between rounded-xl border border-[#1d432d] p-1 bg-[#0a1810]">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setDrink(prev => ({ ...prev, shots: num as any }))}
                  className={`h-8 w-10 text-xs font-bold rounded-lg transition-all ${
                    drink.shots === num ? "bg-[#22683e] text-white" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          {/* Milk Options */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Milk Choice</label>
            <select
              value={drink.milk}
              onChange={(e) => setDrink(prev => ({ ...prev, milk: e.target.value as any }))}
              className="bg-[#0a1810] border border-[#1d432d] rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#38a15b] w-full"
            >
              <option value="none">Black Coffee (No Milk)</option>
              <option value="whole">Velvety Whole Milk</option>
              <option value="oat">Organic Oat Milk (+20.00 Birr)</option>
              <option value="almond">Nutty Almond Milk (+20.00 Birr)</option>
              <option value="cream">Heavy Sweet Cream (+25.00 Birr)</option>
            </select>
          </div>

          {/* Syrups & Spices */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Traditional Syrups / Flavors</label>
            <select
              value={drink.syrup}
              onChange={(e) => setDrink(prev => ({ ...prev, syrup: e.target.value as any }))}
              className="bg-[#0a1810] border border-[#1d432d] rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#38a15b] w-full"
            >
              <option value="none">No Sweetener</option>
              <option value="cardamom">Cardamom Infused Syrup (+15.00 Birr)</option>
              <option value="cinnamon">Spiced Cinnamon Syrup (+15.00 Birr)</option>
              <option value="vanilla">Vanilla Bean Syrup (+15.00 Birr)</option>
              <option value="caramel">Burnt Caramel Drizzle (+15.00 Birr)</option>
            </select>
          </div>

          {/* Foam Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Foam Finish</label>
            <select
              value={drink.foam}
              onChange={(e) => setDrink(prev => ({ ...prev, foam: e.target.value as any }))}
              className="bg-[#0a1810] border border-[#1d432d] rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#38a15b] w-full"
            >
              <option value="none">No Foam layer</option>
              <option value="microfoam">Velvety Microfoam (+12.00 Birr)</option>
              <option value="heavy">Thick Cappuccino Foam (+12.00 Birr)</option>
              <option value="coldfoam">Sweet Salted Cold Foam (+12.00 Birr)</option>
            </select>
          </div>

          {/* Toppings Choice */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-stone-400 uppercase">Aromatic Toppings (+10.00 Birr)</label>
            <select
              value={drink.toppings}
              onChange={(e) => setDrink(prev => ({ ...prev, toppings: e.target.value as any }))}
              className="bg-[#0a1810] border border-[#1d432d] rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#38a15b] w-full"
            >
              <option value="none">No Toppings</option>
              <option value="cocoa">Raw Organic Cocoa Powder</option>
              <option value="barley">Roasted Barley Sprinkles (Kolo)</option>
              <option value="cinnamon-dust">Warm Cinnamon Dusting</option>
            </select>
          </div>

          {/* Ice Modifier */}
          {drink.temp === "iced" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-stone-400 uppercase">Ice Level</label>
              <div className="flex justify-between rounded-xl border border-[#1d432d] p-1 bg-[#0a1810] h-[42px] items-center">
                {['light', 'regular', 'extra'].map((iLevel) => (
                  <button
                    key={iLevel}
                    onClick={() => setDrink(prev => ({ ...prev, ice: iLevel as any }))}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all capitalize ${
                      drink.ice === iLevel ? "bg-[#22683e] text-white" : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {iLevel}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Trigger purchase section */}
        <div className="mt-6 pt-6 border-t border-[#1d432d] flex flex-col gap-3">
          
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#12281b] border border-[#1d432d] text-[#38a15b] text-xs font-mono p-3 rounded-xl flex items-center justify-between"
              >
                <span>🎉 {successMsg} (+1 Virtual Lucky Bean added)</span>
                <button onClick={() => setSuccessMsg(null)} className="text-stone-400 hover:text-white">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-3.5 rounded-xl bg-[#0a1810] hover:bg-[#12281b] border border-[#1d432d] text-stone-400 hover:text-stone-200 text-xs transition-all flex items-center gap-2 font-semibold"
            >
              <RotateCcw size={14} /> Clear Selection
            </button>
            <button
              onClick={handleOrder}
              disabled={loading}
              className="flex-1 bg-[#22683e] hover:bg-[#1a5230] text-white font-black text-xs py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
              ) : (
                <>
                  <span>☕ Purchase & Brew Custom Drink</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-white">{price.toFixed(2)} Birr</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
