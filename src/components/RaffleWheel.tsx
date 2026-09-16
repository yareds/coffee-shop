import React, { useState, useEffect } from "react";
import { Gift, Mail, User, Phone, ShieldCheck, Sparkles, Check, HelpCircle, Trophy, RefreshCw, Lock, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoyaltyProfile, AuthUser } from "../types";

interface RaffleWheelProps {
  loyalty: LoyaltyProfile;
  authUser?: AuthUser;
  onOpenLogin?: () => void;
  onSignupSuccess: (updatedLoyalty: LoyaltyProfile) => void;
  onSpinSuccess: (updatedLoyalty: LoyaltyProfile, prize: string) => void;
}

const DEFAULT_PRIZES = [
  { name: "Traditional Jebena Brew (Abol)", desc: "Rich and spiced ceremonial pour", color: "bg-[#22683e] text-white" },
  { name: "Yirgacheffe Pour Over", desc: "Floral, bright jasmine & citrus cup", color: "bg-[#2c221e] text-white border border-[#22683e]/30" },
  { name: "Spiced Cardamom Macchiato", desc: "Creamy espresso with house-infused cardamom", color: "bg-[#22683e] text-white" },
  { name: "Sidama Natural Hand-Brew", desc: "Blueberry jam acidity and heavy body", color: "bg-[#2c221e] text-white border border-[#22683e]/30" },
  { name: "Guji Honey Cold Brew", desc: "Sweet, refreshing forest canopy beans", color: "bg-[#22683e] text-white" },
  { name: "Harrar Double Espresso", desc: "Deep chocolate and wild berry undertones", color: "bg-[#2c221e] text-white border border-[#22683e]/30" }
];

export default function RaffleWheel({ loyalty, authUser, onOpenLogin, onSignupSuccess, onSpinSuccess }: RaffleWheelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sentOtp, setSentOtp] = useState(false);
  const [demoSmsCode, setDemoSmsCode] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prizes, setPrizes] = useState<any[]>(DEFAULT_PRIZES);
  const activePrizes = prizes.filter(p => p.active !== false);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [collecting, setCollecting] = useState(false);

  const isLoggedIn = authUser && authUser.role !== 'guest';

  const getHeaders = () => {
    const devId = localStorage.getItem("buna_device_id") || "default-device";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Device-ID": devId
    };
    if (authUser?.email) {
      headers["X-User-Email"] = authUser.email;
    }
    return headers;
  };

  useEffect(() => {
    if (authUser && authUser.role !== 'guest') {
      if (authUser.name) setName(authUser.name);
      if (authUser.email) setEmail(authUser.email);
    }
    if (!loyalty.hasSpunWheel) {
      setWinningIndex(null);
      setRotation(0);
      setSpinning(false);
    } else if (loyalty.rafflePrize && winningIndex === null) {
      const idx = activePrizes.findIndex(p => p.name === loyalty.rafflePrize);
      if (idx !== -1) setWinningIndex(idx);
    }
  }, [authUser?.email, loyalty?.hasSpunWheel, loyalty?.customerEmail]);

  useEffect(() => {
    fetch("/api/raffle/prizes")
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPrizes(data);
        }
      })
      .catch(e => {
        // Quietly fallback to DEFAULT_PRIZES
      });
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and mobile phone number.");
      return;
    }
    setError(null);
    setSendingOtp(true);
    setDemoSmsCode(null);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    try {
      const response = await fetch("/api/loyalty/send-otp", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          deviceId: devId
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSentOtp(true);
        if (data.demoCode) {
          setDemoSmsCode(data.demoCode);
        }
      } else {
        setError(data.error || "Failed to dispatch verification code.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection failure. Try again shortly.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit verification code sent to your mobile phone.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    try {
      const response = await fetch("/api/loyalty/verify-otp-signup", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          code: otpCode.trim(),
          deviceId: devId
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onSignupSuccess(data.loyalty);
      } else {
        setError(data.error || "Verification failed. Please check your passcode.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection timed out. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpinWheel = async () => {
    const prizesToUse = activePrizes.length > 0 ? activePrizes : DEFAULT_PRIZES;
    if (spinning || loyalty.hasSpunWheel) return;
    setSpinning(true);
    setError(null);

    const devId = localStorage.getItem("buna_device_id") || "default-device";

    // Select winning index randomly from dynamic active prizes
    const prizeIdx = Math.floor(Math.random() * prizesToUse.length);
    const chosenPrize = prizesToUse[prizeIdx].name;

    // Spin animation
    const segmentDeg = 360 / prizesToUse.length;
    const extraRot = 360 - (prizeIdx * segmentDeg);
    const newRot = rotation + (360 * 5) + extraRot;
    
    setRotation(newRot);

    // Wait for spin to complete (3.2 seconds)
    setTimeout(async () => {
      try {
        const response = await fetch("/api/loyalty/spin-raffle", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ prize: chosenPrize, deviceId: devId })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setWinningIndex(prizeIdx);
          onSpinSuccess(data.loyalty, chosenPrize);
        } else {
          setError(data.error || "Failed to record spin on server.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error recording spin. Please refresh.");
      } finally {
        setSpinning(false);
      }
    }, 3200);
  };

  const handleCollectFreeCoffee = async () => {
    setCollecting(true);
    setError(null);
    const devId = localStorage.getItem("buna_device_id") || "default-device";
    try {
      const response = await fetch("/api/loyalty/collect-raffle", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ deviceId: devId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onSignupSuccess(data.loyalty); // update parent state
      } else {
        setError(data.error || "Failed to collect voucher.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error claiming reward. Try again shortly.");
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="bg-[#102418] border border-[#1d432d] rounded-3xl p-5 md:p-8 max-w-4xl mx-auto shadow-2xl">
      
      {/* Dynamic Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/30 uppercase tracking-widest inline-flex items-center gap-1.5 font-bold mb-3">
          <Gift size={11} className="animate-pulse" /> Welcome Celebrations
        </span>
        <h3 className="text-3xl font-black text-white font-display tracking-tight">
          Heritage Coffee Raffle Wheel
        </h3>
        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
          Unlock your complimentary cup of raw, single-origin highland coffee. Sign up once to spin the authentic pottery-themed wheel. Free delivery or quick local bar pickup included!
        </p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 0: NOT LOGGED IN */}
        {!isLoggedIn ? (
          <motion.div
            key="guest-login-required"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-xl mx-auto bg-[#0a1810] p-8 rounded-2xl border border-[#22683e]/30 shadow-2xl text-center flex flex-col items-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-[#22683e]/20 border border-[#22683e]/30 flex items-center justify-center text-[#38a15b] mb-4">
              <Lock size={28} />
            </div>
            
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#22683e]/20 text-[#38a15b] border border-[#22683e]/30 uppercase tracking-widest font-bold mb-2">
              Logged-In Members Only
            </span>

            <h4 className="text-xl font-bold text-white tracking-tight mb-2">
              Sign In to Access the Coffee Raffle Wheel
            </h4>
            
            <p className="text-xs text-stone-300 leading-relaxed max-w-md mb-6">
              The Coffee Raffle Wheel is available exclusively for <strong>first-time logged-in users</strong> (1 spin per registered account). Sign in or register as a customer to unlock your welcome spin!
            </p>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="truncate">Sign In with Google to Spin 🎯</span>
            </button>
          </motion.div>
        ) : !loyalty.signedUp ? (
          /* PHASE 1: LOGGED IN BUT NOT VERIFIED/REGISTERED FOR RAFFLE */
          <motion.div
            key="signup-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto bg-[#0a1810] p-6 rounded-2xl border border-[#1d432d] shadow-xl"
          >
            <div className="text-center mb-5">
              <span className="text-lg">🇪🇹</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-1">
                {!sentOtp ? "Verify Phone to Spin Wheel" : "Enter Verification Code"}
              </h4>
              <p className="text-[11px] text-stone-500 mt-1">
                {!sentOtp 
                  ? "We verify unique mobile phone numbers via standard carrier-grade SMS OTP to enforce absolute fairness and strictly limit 1 free coffee per person."
                  : `A 6-digit one-time passcode has been sent to your mobile number to complete authentication.`
                }
              </p>
            </div>

            {!sentOtp ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <User size={10} /> Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Kebede"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#132c1e] border border-[#1d432d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#38a15b] transition-all"
                    />
                    <User size={12} className="absolute left-3 top-3.5 text-stone-600" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail size={10} /> Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. abebe@buna.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#132c1e] border border-[#1d432d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#38a15b] transition-all"
                    />
                    <Mail size={12} className="absolute left-3 top-3.5 text-stone-600" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone size={10} /> Verified Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-019-9123"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#132c1e] border border-[#1d432d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#38a15b] transition-all"
                    />
                    <Phone size={12} className="absolute left-3 top-3.5 text-stone-600" />
                  </div>
                  <span className="text-[9px] text-stone-500 italic">Primary identifier. Changing name or browser profile will not bypass verified phone locks.</span>
                </div>

                {error && (
                  <p className="text-[11px] text-red-400 font-mono text-center bg-red-950/10 border border-red-900/20 p-2 rounded-lg">
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Dispatched SMS request...
                    </>
                  ) : (
                    "Send SMS OTP Passcode 📲"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndSignup} className="flex flex-col gap-4">
                
                {/* Simulated SMS carrier box */}
                {demoSmsCode && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-center shadow-inner"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                      <ShieldCheck size={14} className="text-emerald-400 animate-pulse" /> Simulated SMS Gateway
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Standard sandbox carrier simulation. Code sent to <span className="text-white font-mono font-semibold">{phone}</span>:
                    </p>
                    <p className="text-xl font-mono font-black text-emerald-400 tracking-widest mt-1.5 bg-[#0e1c14] py-1 px-3 inline-block rounded-lg border border-emerald-900/30">
                      {demoSmsCode}
                    </p>
                    <p className="text-[9px] text-stone-500 mt-1 italic">
                      Copy and enter the code above to pass the verification check.
                    </p>
                  </motion.div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={10} /> Enter 6-Digit Passcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#132c1e] border border-[#1d432d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white text-center font-mono tracking-widest text-lg focus:outline-none focus:border-[#38a15b] transition-all"
                    />
                    <ShieldCheck size={14} className="absolute left-3 top-3.5 text-stone-600" />
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] text-red-400 font-mono text-center bg-red-950/10 border border-red-900/20 p-2 rounded-lg">
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all mt-1 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Authenticating OTP...
                    </>
                  ) : (
                    "Verify Code & Spin Wheel 🎯"
                  )}
                </button>

                <div className="text-center mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSentOtp(false);
                      setDemoSmsCode(null);
                      setOtpCode("");
                    }}
                    className="text-[10px] text-stone-500 hover:text-[#c89d7c] underline transition-all bg-transparent border-none cursor-pointer"
                  >
                    ← Edit phone number or details
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          /* PHASE 2: SIGNED UP (Wheel Interface) */
          <motion.div
            key="wheel-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            
            {/* The Physical Wheel Visual */}
            <div className="md:col-span-7 flex flex-col items-center justify-center py-6">
              
              {/* Wheel Container with Needle at Top */}
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border-4 border-[#1d432d] bg-[#0a1810] shadow-2xl p-1 flex items-center justify-center">
                
                {/* Needle Indicator */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 filter drop-shadow-lg">
                  <div className="absolute -top-[23px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white"></div>
                </div>

                {/* Rotating Wheel Dial */}
                <motion.div
                  style={{ transformOrigin: "center center" }}
                  animate={{ rotate: rotation }}
                  transition={{
                    duration: spinning ? 3.2 : 0,
                    ease: [0.1, 0.8, 0.3, 1]
                  }}
                  className="w-full h-full rounded-full overflow-hidden relative border border-[#c89d7c]/20"
                >
                  {(() => {
                    const prizesToUse = activePrizes.length > 0 ? activePrizes : DEFAULT_PRIZES;
                    return prizesToUse.map((prize, idx) => {
                      const angle = 360 / prizesToUse.length;
                      const rotationDeg = idx * angle;
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 left-0 w-full h-full"
                          style={{
                            transform: `rotate(${rotationDeg}deg)`,
                            clipPath: prizesToUse.length === 6 
                              ? "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)" 
                              : prizesToUse.length === 8 
                                ? "polygon(50% 50%, 50% 0, 100% 0, 100% 25%)"
                                : "polygon(50% 50%, 50% 0, 100% 0, 100% 100%)" // generic fallback
                          }}
                        >
                          {/* Colorful sector slice */}
                          <div
                            className={`absolute inset-0 origin-center ${
                              idx % 2 === 0 ? "bg-[#22683e]" : "bg-[#102418]"
                            }`}
                            style={{
                              transform: `rotate(${angle}deg)`,
                            }}
                          />
                          
                          {/* Text Inside Segment */}
                          <div
                            className={`absolute top-[15%] left-[60%] origin-center -translate-x-1/2 text-left select-none text-[8px] md:text-[9px] leading-tight font-black font-mono w-28 ${
                              idx % 2 === 0 ? "text-white" : "text-stone-300"
                            }`}
                            style={{
                              transform: `rotate(${angle / 2}deg)`,
                            }}
                          >
                            <span className="block border-b border-white/20 pb-0.5 mb-0.5 truncate">
                              {prize.name.split(" ")[0]}
                            </span>
                            <span className="opacity-70 text-[7px] font-normal block font-sans truncate">
                              {prize.name}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Aesthetic Inner Wheel Circle */}
                  <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-[#0a1810] border-2 border-[#22683e] flex flex-col items-center justify-center shadow-lg z-10 text-center">
                    <span className="text-base select-none">🇪🇹</span>
                    <span className="text-[7px] font-mono font-bold tracking-widest text-stone-400">BUNA</span>
                  </div>
                </motion.div>
              </div>

              {/* Spin Button or Locked Indicator */}
              <div className="mt-6 w-full max-w-xs">
                {!loyalty.hasSpunWheel ? (
                  <button
                    onClick={handleSpinWheel}
                    disabled={spinning}
                    className="w-full bg-[#22683e] hover:bg-[#1a5230] disabled:bg-stone-800 disabled:text-stone-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl animate-pulse"
                  >
                    <RefreshCw size={12} className={spinning ? "animate-spin" : ""} />
                    {spinning ? "Spinning..." : "🔮 Spin Your Wheel!"}
                  </button>
                ) : (
                  <div className="text-center py-2.5 px-4 rounded-xl bg-[#0a1810] border border-[#22683e]/30 text-xs font-mono text-stone-400 flex items-center justify-center gap-1.5">
                    <Lock size={12} className="text-[#38a15b]" />
                    <span>First-Time Spin Used (1 max per account)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Side Status Panel */}
            <div className="md:col-span-5 bg-[#0a1810] p-6 rounded-2xl border border-[#1d432d] self-stretch flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block mb-1">
                  Active Logged-In Account
                </span>
                <p className="text-sm font-bold text-[#38a15b]">{authUser?.name || loyalty.customerName || "Member"}</p>
                <p className="text-xs text-stone-400 font-mono mt-0.5">{authUser?.email || loyalty.customerEmail}</p>

                <div className="border-t border-[#1d432d] my-4 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Raffle Status</h4>
                  
                  {!loyalty.hasSpunWheel ? (
                    <div className="flex items-start gap-2.5 text-stone-400 text-xs">
                      <div className="bg-[#22683e]/20 text-[#38a15b] h-5 w-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">1</div>
                      <p className="leading-snug">Click <strong>Spin Your Wheel!</strong> on the left to determine which authentic premium specialty cup is yours for free.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      
                      {/* Sub-State: Spun, but has NOT collected prize yet */}
                      {!loyalty.hasCollectedPrize ? (
                        <div className="flex flex-col gap-3">
                          <div className="bg-[#22683e]/20 border border-[#22683e]/40 text-[#38a15b] px-3.5 py-3 rounded-xl text-xs flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#38a15b] block">🎯 Spin Result</span>
                            <p className="font-sans italic font-bold text-white text-sm">
                              "{loyalty.rafflePrize}"
                            </p>
                            <p className="text-[10px] leading-relaxed text-stone-400">
                              Congratulations, you won a free welcome coffee! Click the button below to officially claim and collect your voucher.
                            </p>
                          </div>

                          {error && (
                            <p className="text-[11px] text-red-400 font-mono text-center">
                              ⚠️ {error}
                            </p>
                          )}

                          <button
                            onClick={handleCollectFreeCoffee}
                            disabled={collecting}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl animate-bounce"
                          >
                            <Gift size={12} />
                            {collecting ? "Claiming..." : "🎁 Claim & Collect Free Coffee!"}
                          </button>
                        </div>
                      ) : (
                        /* Sub-State: Spun AND collected prize */
                        <div className="flex flex-col gap-3">
                          <div className="bg-[#243c2c] border border-emerald-900/30 text-emerald-400 px-3.5 py-3 rounded-xl text-xs flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-500 block">✓ Winning Prize Claimed</span>
                            <p className="font-sans italic font-bold text-white text-sm">
                              "{loyalty.rafflePrize}"
                            </p>
                            <p className="text-[10px] leading-relaxed text-stone-400">
                              We've dispatched a digital welcome coupon to <strong>{loyalty.customerEmail}</strong>. Present the code below at our coffee counter to fulfill your reward!
                            </p>
                          </div>

                          <div className="bg-[#12281b] p-3 rounded-xl border border-[#1d432d] text-center">
                            <span className="text-[9px] font-mono text-stone-400 block uppercase">Your Welcome Coupon Code</span>
                            <span className="text-sm font-mono font-black text-[#38a15b] tracking-widest mt-0.5 inline-block uppercase bg-black/40 px-3 py-1 rounded">
                              BUNA-WELCOME-{loyalty.customerName?.split(" ")[0].toUpperCase() || "SPIN"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-stone-500 leading-relaxed pt-4 border-t border-[#1d432d] mt-4 font-mono">
                ℹ️ To respect fair-use terms, our server permits exactly one (1) registration and spin per physical client node. Thank you for joining Buna!
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
