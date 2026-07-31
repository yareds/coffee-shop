import React, { useState } from "react";
import { User, ShieldCheck, Lock, X, KeyRound, Check, Sparkles, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthUser } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  initialMode?: 'user' | 'admin';
  onClose: () => void;
  onLoginSuccess: (user: AuthUser, toastMessage: string, updatedLoyalty?: any) => void;
  deviceId: string;
}

export default function LoginModal({
  isOpen,
  initialMode = 'user',
  onClose,
  onLoginSuccess,
  deviceId
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(initialMode);

  // User form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Admin form state
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Sync initialMode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setUserError(null);
      setAdminError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setUserError("Please provide both your name and email address.");
      return;
    }

    setUserLoading(true);
    setUserError(null);

    try {
      // Optional call to loyalty signup endpoint
      const res = await fetch("/api/loyalty/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": deviceId
        },
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim(),
          deviceId
        })
      });

      const data = await res.json();
      // Even if already registered on device, allow signing in as this user locally
      const authUser: AuthUser = {
        role: 'user',
        name: userName.trim(),
        email: userEmail.trim()
      };

      onLoginSuccess(
        authUser,
        `Welcome back, ${userName.trim()}! You are now logged in.`,
        data?.loyalty
      );
      onClose();
    } catch (err: any) {
      // Fallback local signin
      const authUser: AuthUser = {
        role: 'user',
        name: userName.trim(),
        email: userEmail.trim()
      };
      onLoginSuccess(
        authUser,
        `Signed in as ${userName.trim()}`
      );
      onClose();
    } finally {
      setUserLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

    // Accept 1234, admin, or admin888 as valid admin PINs
    const validPins = ["1234", "admin", "admin888"];
    if (!validPins.includes(adminPin.trim().toLowerCase())) {
      setAdminError("Invalid Admin PIN. (Default PIN is 1234)");
      setAdminLoading(false);
      return;
    }

    const adminUser: AuthUser = {
      role: 'admin',
      name: 'Buna Store Admin',
      email: 'admin@bunacoffee.eth'
    };

    onLoginSuccess(
      adminUser,
      "👑 Admin authentication successful! Full Owner Portal unlocked."
    );
    setAdminLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#14100e] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-[#f7f4f2] overflow-hidden"
          style={{
            fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Segoe UI", Roboto, sans-serif`
          }}
        >
          {/* Subtle Ambient Background Flare */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#c89d7c]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#c89d7c]/20 to-[#2c1a11] border border-[#c89d7c]/30 flex items-center justify-center text-xl shadow-inner text-[#c89d7c]">
              {activeTab === 'user' ? <User size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">
                {activeTab === 'user' ? "Customer Sign In" : "Admin Authentication"}
              </h3>
              <p className="text-xs text-stone-400 font-normal">
                {activeTab === 'user' 
                  ? "Access your Buna loyalty, passport, & beans" 
                  : "Owner portal & shop management controls"}
              </p>
            </div>
          </div>

          {/* Tab Switcher (Apple Style Segmented Control) */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setUserError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'user'
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <User size={14} />
              Customer Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setAdminError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? "bg-[#c89d7c] text-black font-semibold shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              Admin Portal
            </button>
          </div>

          {/* CUSTOMER LOGIN FORM */}
          {activeTab === 'user' && (
            <form onSubmit={handleUserLogin} className="flex flex-col gap-4">
              {userError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {userError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-300 font-medium tracking-wide">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Bikila"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#c89d7c] transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-300 font-medium tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#c89d7c] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={userLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#c89d7c] hover:bg-[#d8ad8c] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c89d7c]/10"
              >
                {userLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In as Customer</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-500 text-center mt-1">
                New guests are automatically enrolled in the Buna Loyalty Program.
              </p>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {adminError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#c89d7c]/10 border border-[#c89d7c]/20 text-[#c89d7c] text-xs flex items-center gap-2.5">
                <KeyRound size={16} className="shrink-0" />
                <span>
                  Default Admin PIN: <strong className="font-mono text-white">1234</strong>
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-300 font-medium tracking-wide">
                  Enter Admin Passcode / PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter PIN (1234)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#c89d7c] transition-all font-mono"
                    required
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-stone-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c89d7c] to-[#a87d5c] hover:from-[#d8ad8c] hover:to-[#b88d6c] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c89d7c]/15"
              >
                {adminLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Authenticate Admin Access</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-500 text-center mt-1">
                Grants real-time revenue stats, menu editor, and raffle prize controls.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
