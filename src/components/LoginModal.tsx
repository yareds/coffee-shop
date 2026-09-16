import React, { useState } from "react";
import { User, X, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthUser } from "../types";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
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
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setUserLoading(true);
    setUserError(null);
    setIsUnauthorizedDomain(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || "").toLowerCase().trim();
      const isAdmin = email === "yared.abegaz@gmail.com";
      const targetUsername = isAdmin ? "yared.abegaz@gmail.com" : (fbUser.displayName || email.split("@")[0] || "Coffee Explorer");

      // Check admin status with backend
      if (isAdmin) {
        try {
          const adminRes = await fetch("/api/owner/google-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "yared.abegaz@gmail.com", name: "yared.abegaz@gmail.com" })
          });
          const adminData = await adminRes.json();
          if (adminData?.token) {
            localStorage.setItem("buna_admin_token", adminData.token);
          }
        } catch (e) {
          console.warn("Admin token fetch error:", e);
        }
      }

      // Sync user profile to Firestore
      const userRef = doc(db, "users", fbUser.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: fbUser.uid,
            name: targetUsername,
            email,
            role: isAdmin ? 'admin' : 'user',
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
        role: isAdmin ? 'admin' : 'user',
        name: targetUsername,
        email
      };

      onLoginSuccess(
        authUser,
        isAdmin
          ? `Welcome Admin (${targetUsername})! Authenticated with Google.`
          : `Welcome, ${targetUsername}! Signed in with Google.`
      );
      onClose();
    } catch (err: any) {
      console.error("Google auth error:", err);
      const isUnauth =
        err?.code === "auth/unauthorized-domain" ||
        (typeof err?.message === "string" && err.message.includes("auth/unauthorized-domain"));
      
      if (isUnauth) {
        setIsUnauthorizedDomain(true);
        setUserError(
          `This domain (${currentHost}) is not authorized yet in your Firebase Project ("buna-ethiopia").`
        );
      } else {
        setUserError(err.message || "Failed to sign in with Google.");
      }
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
          className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-[#122b1c] border border-[#295a3d] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl text-stone-100 overflow-hidden max-h-[92vh] overflow-y-auto"
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

          {/* Header Title */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#1a3e29] border border-[#295a3d] flex items-center justify-center shadow-inner text-[#42bd6c] shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Google Sign In
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-300 font-normal leading-normal mt-0.5">
                Sign in with your Google account to access your Buna loyalty rewards and passport
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 sm:gap-4">
            {userError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{userError}</div>
                </div>

                {isUnauthorizedDomain && (
                  <div className="mt-1 p-2.5 rounded-lg bg-[#0d1e14] border border-[#295a3d] text-stone-300 text-[11px] flex flex-col gap-2">
                    <p className="font-semibold text-white">How to fix in 10 seconds:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-stone-300">
                      <li>Go to your Firebase Console: <span className="text-amber-300 font-mono">Authentication &gt; Settings &gt; Authorized domains</span></li>
                      <li>Click <strong className="text-white">Add domain</strong> and paste the domain below:</li>
                    </ol>

                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-[#1a3e29] border border-[#2d664a] px-2 py-1 rounded text-emerald-300 font-mono text-[10px] sm:text-[11px] truncate select-all">
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

            {/* Google Sign In via Firebase Auth */}
            <button
              type="button"
              id="google-signin-button"
              onClick={handleGoogleSignIn}
              disabled={userLoading}
              className="w-full min-h-[46px] py-3 sm:py-3.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 sm:gap-3 shadow-md border border-stone-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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
              <span className="truncate">{userLoading ? "Authenticating with Google..." : "Sign in with Google"}</span>
            </button>

            <p className="text-[10px] sm:text-[11px] text-stone-400 text-center leading-relaxed mt-0.5">
              Google Sign-In enables digital loyalty stamps, origin passport badges, and admin store operations.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
