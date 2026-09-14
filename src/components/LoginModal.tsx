import React, { useState } from "react";
import { User, ShieldCheck, Lock, X, KeyRound, Check, Sparkles, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthUser } from "../types";
import { auth, googleProvider, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

  const handleGoogleSignIn = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const name = fbUser.displayName || fbUser.email?.split('@')[0] || "Coffee Lover";
      const email = fbUser.email || "";

      // Sync user profile to Firestore
      const userRef = doc(db, "users", fbUser.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: fbUser.uid,
            name,
            email,
            role: 'user',
            points: 240,
            stampsCount: 7,
            beansCount: 3,
            stampedRegions: []
          });
        }
      } catch (err) {
        console.warn("Firestore sync warning:", err);
      }

      const authUser: AuthUser = {
        role: 'user',
        name,
        email
      };

      onLoginSuccess(
        authUser,
        `Welcome, ${name}! Signed in with Google (Firebase).`
      );
      onClose();
    } catch (err: any) {
      console.error("Google auth error:", err);
      setUserError(err.message || "Failed to sign in with Google.");
    } finally {
      setUserLoading(false);
    }
  };

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setAdminError("Please enter the Admin PIN.");
      return;
    }

    setAdminLoading(true);
    setAdminError(null);

    try {
      const res = await fetch("/api/owner/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPin: adminPin.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminError(data.error || "Invalid Admin PIN. (Default PIN is 2026)");
        setAdminLoading(false);
        return;
      }

      // Store Token & PIN for authenticated requests
      if (data.token) {
        localStorage.setItem("buna_admin_token", data.token);
      }
      localStorage.setItem("buna_admin_pin", adminPin.trim());

      const adminUser: AuthUser = data.adminUser || {
        role: 'admin',
        name: 'Buna Store Admin',
        email: 'admin@bunacoffee.eth'
      };

      onLoginSuccess(
        adminUser,
        "👑 Admin authentication successful! Full Owner Portal unlocked."
      );
      onClose();
    } catch (err: any) {
      setAdminError("Server error verifying Admin PIN. Please check connection.");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#102418] border border-[#1d432d] rounded-3xl p-6 md:p-8 shadow-2xl text-stone-100 overflow-hidden"
          style={{
            fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Segoe UI", Roboto, sans-serif`
          }}
        >
          {/* Subtle Ambient Background Flare */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#38a15b]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-[#22683e]/10 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-[#0a1810] border border-[#1d432d] flex items-center justify-center text-stone-400 hover:text-white hover:bg-[#12281b] transition-all"
          >
            <X size={16} />
          </button>

          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-2xl bg-[#0a1810] border border-[#1d432d] flex items-center justify-center text-xl shadow-inner text-[#38a15b]">
              {activeTab === 'user' ? <User size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">
                {activeTab === 'user' ? "Customer Sign In" : "Admin Authentication"}
              </h3>
              <p className="text-xs text-stone-300 font-normal">
                {activeTab === 'user' 
                  ? "Access your Buna loyalty, passport, & beans" 
                  : "Owner portal & shop management controls"}
              </p>
            </div>
          </div>

          {/* Tab Switcher (Apple Style Segmented Control) */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-[#0a1810] border border-[#1d432d] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setUserError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'user'
                  ? "bg-[#22683e] text-white font-semibold shadow-sm"
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
                  ? "bg-[#22683e] text-white font-semibold shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              Admin Portal
            </button>
          </div>

          {/* CUSTOMER LOGIN FORM */}
          {activeTab === 'user' && (
            <div className="flex flex-col gap-4">
              {userError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {userError}
                </div>
              )}

              {/* Google Sign In via Firebase Auth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={userLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-md border border-stone-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#295a3d]" />
                <span className="text-[11px] font-mono text-stone-400 uppercase">or custom name</span>
                <div className="flex-1 h-px bg-[#295a3d]" />
              </div>

              <form onSubmit={handleUserLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-300 font-medium tracking-wide">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abebe Bikila"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#122b1c] border border-[#295a3d] text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#42bd6c] transition-all"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#122b1c] border border-[#295a3d] text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#42bd6c] transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#2d824d] hover:bg-[#226a3f] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
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
              </form>

              <p className="text-[11px] text-stone-300 text-center mt-1">
                New guests are automatically enrolled in the Buna Loyalty Program.
              </p>
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {adminError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#22683e]/20 border border-[#22683e]/40 text-[#38a15b] text-xs flex items-center gap-2.5">
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
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#0a1810] border border-[#1d432d] text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#38a15b] transition-all font-mono"
                    required
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-stone-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#22683e] hover:bg-[#1a5230] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
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

              <p className="text-[11px] text-stone-400 text-center mt-1">
                Grants real-time revenue stats, menu editor, and raffle prize controls.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
