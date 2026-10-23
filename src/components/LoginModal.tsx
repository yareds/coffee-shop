import React, { useState } from "react";
import { User, X, Copy, Check, ExternalLink, AlertTriangle, Mail, Lock, Sparkles, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthUser } from "../types";
import { auth, googleProvider, db } from "../lib/firebase";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser, toastMessage: string, updatedLoyalty?: any) => void;
  deviceId: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  deviceId
}: LoginModalProps) {
  const [authMode, setAuthMode] = useState<"google" | "email_login" | "email_signup" | "pin_login">("google");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Email/password & PIN form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPin, setAdminPin] = useState("2026");

  React.useEffect(() => {
    if (isOpen) {
      setUserError(null);
      setIsUnauthorizedDomain(false);
      setCopiedDomain(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";

  const handleCopyHost = () => {
    if (navigator?.clipboard && currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleSuccessfulAuth = async (fbUser: any, displayNameOverride?: string) => {
    const userEmail = (fbUser.email || "").toLowerCase().trim();
    let isAdmin = false;

    // Verify admin token securely via Firebase ID token
    try {
      const idToken = await fbUser.getIdToken();
      const adminRes = await fetch("/api/owner/google-auth", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData?.isAdmin && adminData?.token) {
          isAdmin = true;
          localStorage.setItem("buna_admin_token", adminData.token);
        } else {
          localStorage.removeItem("buna_admin_token");
        }
      } else {
        localStorage.removeItem("buna_admin_token");
      }
    } catch (e) {
      console.warn("Admin token verification error:", e);
    }

    const targetUsername = displayNameOverride || fbUser.displayName || (userEmail ? userEmail.split("@")[0] : "Coffee Explorer");

    // Sync user profile to Firestore
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          name: targetUsername,
          email: userEmail,
          role: isAdmin ? "admin" : "user",
          points: 240,
          stampsCount: 7,
          beansCount: 3,
          stampedRegions: []
        });
      }
    } catch (err) {
      console.warn("Firestore user sync warning:", err);
    }

    const authUser: AuthUser = {
      role: isAdmin ? "admin" : "user",
      name: targetUsername,
      email: userEmail
    };

    onLoginSuccess(
      authUser,
      isAdmin
        ? `Welcome Admin (${targetUsername})!`
        : `Welcome, ${targetUsername}! Your account is ready.`
    );
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setUserLoading(true);
    setUserError(null);
    setIsUnauthorizedDomain(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccessfulAuth(result.user);
    } catch (err: any) {
      console.error("Google auth error:", err);
      const isUnauth =
        err?.code === "auth/unauthorized-domain" ||
        (typeof err?.message === "string" && err.message.includes("auth/unauthorized-domain"));

      if (isUnauth) {
        setIsUnauthorizedDomain(true);
        setUserError(
          `This domain (${currentHost}) is not authorized yet in your Firebase Project ("buna-ethiopia"). You can also register or sign in using Email & Password below.`
        );
      } else {
        setUserError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setUserError("Please provide both email and password.");
      return;
    }

    setUserLoading(true);
    setUserError(null);

    try {
      if (authMode === "email_signup") {
        if (!name.trim()) {
          setUserError("Please enter your name to register.");
          setUserLoading(false);
          return;
        }
        if (password.length < 6) {
          setUserError("Password must be at least 6 characters.");
          setUserLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await updateProfile(cred.user, { displayName: name.trim() });
        } catch (e) {
          // ignore
        }
        await handleSuccessfulAuth(cred.user, name.trim());
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await handleSuccessfulAuth(cred.user);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setUserError("Invalid email or password. Please verify your credentials or create a new account.");
      } else if (err.code === "auth/email-already-in-use") {
        setUserError("An account with this email already exists. Please switch to Sign In.");
      } else if (err.code === "auth/operation-not-allowed") {
        setUserError("Email/Password is disabled in Firebase console. Please use Google Sign In.");
      } else {
        setUserError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) return;
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await fetch("/api/owner/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPin: adminPin.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("buna_admin_token", data.token);
        localStorage.setItem("buna_admin_pin", adminPin.trim());
        const adminUser: AuthUser = {
          role: "admin",
          name: data.adminUser?.name || "Buna Store Admin",
          email: data.adminUser?.email || "pin-admin"
        };
        onLoginSuccess(adminUser, "👑 Staff Admin authenticated! Admin operations unlocked.");
        onClose();
      } else {
        setUserError(data.error || "Invalid Admin PIN.");
      }
    } catch (err: any) {
      setUserError("Error verifying PIN.");
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-[#122b1c] border border-[#295a3d] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-100 overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Subtle Ambient Background Flare */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#42bd6c]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-[#2d824d]/10 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 h-8 w-8 rounded-full bg-[#1a3e29] border border-[#295a3d] flex items-center justify-center text-stone-400 hover:text-white hover:bg-[#224e38] transition-all cursor-pointer z-10"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pr-8">
            <div className="h-11 w-11 rounded-2xl bg-[#1a3e29] border border-[#295a3d] flex items-center justify-center shadow-inner text-[#42bd6c] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white leading-tight font-serif-display">
                {authMode === "email_signup" ? "Create Account" : "Welcome to Buna"}
              </h3>
              {/* Removed requested text */}
            </div>
          </div>

          {/* Auth Mode Toggle Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#1a3e29] p-1 rounded-xl border border-[#295a3d] mb-4 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setAuthMode("google"); setUserError(null); }}
              className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                authMode === "google"
                  ? "bg-[#2d824d] text-white shadow-sm font-bold"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("email_login"); setUserError(null); }}
              className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                authMode === "email_login"
                  ? "bg-[#2d824d] text-white shadow-sm"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("email_signup"); setUserError(null); }}
              className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                authMode === "email_signup"
                  ? "bg-[#2d824d] text-white shadow-sm"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {userError && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{userError}</div>
                </div>

                {isUnauthorizedDomain && (
                  <div className="mt-1 p-2.5 rounded-lg bg-[#0d1e14] border border-[#295a3d] text-stone-300 text-[11px] flex flex-col gap-2">
                    <p className="font-semibold text-white">How to authorize domain in Firebase:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-stone-300">
                      <li>Go to Firebase Console: <span className="text-amber-300 font-mono">Authentication &gt; Settings &gt; Authorized domains</span></li>
                      <li>Click <strong className="text-white">Add domain</strong> and paste:</li>
                    </ol>

                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-[#1a3e29] border border-[#2d664a] px-2 py-1 rounded text-emerald-300 font-mono text-[10px] truncate select-all">
                        {currentHost}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyHost}
                        className="px-2.5 py-1 rounded bg-[#224e38] hover:bg-[#2d664a] border border-[#387a59] text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        {copiedDomain ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedDomain ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 1: Google Sign In */}
            {authMode === "google" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  id="google-signin-button"
                  onClick={handleGoogleSignIn}
                  disabled={userLoading}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-3 shadow-md border border-stone-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="truncate">
                    {userLoading ? "Authenticating..." : "Sign in with Google"}
                  </span>
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="h-px bg-[#295a3d] flex-1" />
                  <span className="text-[10px] font-mono text-stone-400 uppercase">Or use email</span>
                  <div className="h-px bg-[#295a3d] flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode("email_login")}
                    className="py-2.5 px-3 rounded-xl bg-[#1a3e29] hover:bg-[#224e38] border border-[#295a3d] text-stone-200 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogIn size={14} />
                    <span>Existing User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("email_signup")}
                    className="py-2.5 px-3 rounded-xl bg-[#224e38] hover:bg-[#2d824d] border border-[#387a59] text-white font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2 & 3: Email Sign In / Sign Up Form */}
            {(authMode === "email_login" || authMode === "email_signup") && (
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                {authMode === "email_signup" && (
                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Dawit Tadesse"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2d824d] to-[#42bd6c] hover:from-[#226a3f] hover:to-[#226a3f] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
                >
                  {userLoading ? (
                    <span>Processing...</span>
                  ) : authMode === "email_signup" ? (
                    <>
                      <UserPlus size={15} />
                      <span>Complete Free Registration</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      <span>Sign In to Account</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  {authMode === "email_signup" ? (
                    <button
                      type="button"
                      onClick={() => setAuthMode("email_login")}
                      className="text-[#42bd6c] hover:underline cursor-pointer"
                    >
                      Already have an account? Sign In
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAuthMode("email_signup")}
                      className="text-[#42bd6c] hover:underline cursor-pointer"
                    >
                      New to Buna? Register for free
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAuthMode("google")}
                    className="text-stone-400 hover:text-white cursor-pointer"
                  >
                    Use Google Instead
                  </button>
                </div>
              </form>
            )}

            <p className="text-[10px] text-stone-400 text-center leading-relaxed mt-1">
              Your personal Buna account stores weekly predictions, grand prize claims, and coffee loyalty stamps.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
