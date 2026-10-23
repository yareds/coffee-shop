import React, { useState, useEffect } from "react";
import { 
  Trophy, Clock, AlertTriangle, CheckCircle2, XCircle, Shield, 
  Sparkles, Check, Lock, User, RefreshCw, ChevronRight, Award,
  Copy, Calendar, ArrowRight, BarChart3, HelpCircle, Gift, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PredictionMatch, Prediction, AuthUser, UserPredictionSummary } from "../types";
import { auth } from "../lib/firebase";
import HattrickLogo from "./HattrickLogo";

interface MatchDayPrizeProps {
  authUser: AuthUser;
  onOpenLogin: () => void;
  onRewardPoints?: (points: number, reason: string) => void;
}

// Colored initial badges for football teams (no copyrighted logos)
const TEAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  arsenal: { bg: "bg-red-700", text: "text-white", border: "border-red-500" },
  liverpool: { bg: "bg-rose-900", text: "text-white", border: "border-rose-600" },
  chelsea: { bg: "bg-blue-700", text: "text-white", border: "border-blue-500" },
  "manchester city": { bg: "bg-sky-600", text: "text-white", border: "border-sky-400" },
  "man city": { bg: "bg-sky-600", text: "text-white", border: "border-sky-400" },
  "manchester united": { bg: "bg-red-800", text: "text-white", border: "border-red-600" },
  "man utd": { bg: "bg-red-800", text: "text-white", border: "border-red-600" },
  tottenham: { bg: "bg-slate-900", text: "text-white", border: "border-slate-500" },
  spurs: { bg: "bg-slate-900", text: "text-white", border: "border-slate-500" },
  newcastle: { bg: "bg-neutral-900", text: "text-white", border: "border-neutral-400" },
  aston: { bg: "bg-amber-900", text: "text-amber-200", border: "border-amber-600" }
};

function getTeamBadge(teamName: string) {
  const clean = (teamName || "").trim();
  const lower = clean.toLowerCase();
  
  let color = { bg: "bg-emerald-900", text: "text-emerald-100", border: "border-emerald-600" };
  for (const [key, val] of Object.entries(TEAM_COLORS)) {
    if (lower.includes(key)) {
      color = val;
      break;
    }
  }

  const parts = clean.split(/\s+/);
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    initials = clean.slice(0, 3).toUpperCase();
  }

  return { initials, color };
}

export default function MatchDayPrize({ authUser, onOpenLogin }: MatchDayPrizeProps) {
  // Navigation tabs within Match Day section
  const [activeTab, setActiveTab] = useState<"predict" | "my_predictions" | "all_fixtures">("predict");

  // Matches list & selected match
  const [allMatches, setAllMatches] = useState<PredictionMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [match, setMatch] = useState<PredictionMatch | null>(null);

  // Predictions state
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [myPredictions, setMyPredictions] = useState<UserPredictionSummary[]>([]);
  const [loadingMyPreds, setLoadingMyPreds] = useState(false);

  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [stats, setStats] = useState<any | null>(null);
  const [winners, setWinners] = useState<Array<{ displayName: string; prizeCollected: boolean; claimCode?: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form selections for 3 legs
  const [outcome, setOutcome] = useState<"HOME" | "AWAY" | "DRAW">("HOME");
  const [homeGoals, setHomeGoals] = useState<number>(2);
  const [awayGoals, setAwayGoals] = useState<number>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerGoals, setPlayerGoals] = useState<number>(1);

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Load all matches
  const loadMatches = async (targetMatchId?: string) => {
    try {
      setLoading(true);
      const matchesRes = await fetch("/api/predictions/matches");
      const matchesData = await matchesRes.json();
      const list: PredictionMatch[] = matchesData.matches || [];
      setAllMatches(list);

      const targetId = targetMatchId || selectedMatchId || (list.find(m => m.status === "scheduled")?.id) || list[0]?.id;
      if (targetId) {
        setSelectedMatchId(targetId);
        await loadMatchDetails(targetId);
      }
    } catch (err) {
      console.error("Error loading matches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load details for the current featured match
  const loadFeaturedMatch = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch("/api/predictions/featured", { headers });
      const data = await res.json();

      if (data.match) {
        setMatch(data.match);
        setSelectedMatchId(data.match.id);
        setTotalEntries(data.totalEntries || 0);
        setStats(data.stats || null);
        setWinners(data.winners || []);

        if (data.serverNow) {
          const serverMs = new Date(data.serverNow).getTime();
          setServerTimeOffset(serverMs - Date.now());
        }

        if (data.userPrediction) {
          setUserPrediction(data.userPrediction);
          setOutcome(data.userPrediction.outcome);
          const parts = (data.userPrediction.scoreline || "2:1").split(":");
          setHomeGoals(parseInt(parts[0], 10) || 0);
          setAwayGoals(parseInt(parts[1], 10) || 0);
          setSelectedPlayer(data.userPrediction.playerName || "");
          setPlayerGoals(data.userPrediction.playerGoals ?? 1);
        } else {
          // Clear userPrediction and form fields when server returns none
          setUserPrediction(null);
          setOutcome("HOME");
          setHomeGoals(2);
          setAwayGoals(1);
          if (data.match.players && data.match.players.length > 0) {
            setSelectedPlayer(data.match.players[0].name);
          }
          setPlayerGoals(1);
        }
      } else {
        setUserPrediction(null);
      }
    } catch (err) {
      console.error("Error loading featured match:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load details for a specific match
  const loadMatchDetails = async (mId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch(`/api/predictions/match/${mId}`, { headers });
      const data = await res.json();

      if (data.match) {
        setMatch(data.match);
        setTotalEntries(data.stats?.totalEntries || 0);
        setStats(data.stats || null);
        setWinners(data.winners || []);

        if (data.serverNow) {
          const serverMs = new Date(data.serverNow).getTime();
          setServerTimeOffset(serverMs - Date.now());
        }

        if (data.userPrediction) {
          setUserPrediction(data.userPrediction);
          setOutcome(data.userPrediction.outcome);
          const parts = (data.userPrediction.scoreline || "2:1").split(":");
          setHomeGoals(parseInt(parts[0], 10) || 0);
          setAwayGoals(parseInt(parts[1], 10) || 0);
          setSelectedPlayer(data.userPrediction.playerName || "");
          setPlayerGoals(data.userPrediction.playerGoals ?? 1);
        } else {
          // Clear userPrediction and form fields when server returns none
          setUserPrediction(null);
          setOutcome("HOME");
          setHomeGoals(2);
          setAwayGoals(1);
          if (data.match.players && data.match.players.length > 0) {
            setSelectedPlayer(data.match.players[0].name);
          }
          setPlayerGoals(1);
        }
      } else {
        setUserPrediction(null);
      }
    } catch (err) {
      console.error("Error loading match details:", err);
    }
  };

  // Load user's prediction history across all matches (joined with match details)
  const loadMyPredictions = async () => {
    if (!auth.currentUser) {
      setMyPredictions([]);
      return;
    }
    try {
      setLoadingMyPreds(true);
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/predictions/mine", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.predictions) {
        setMyPredictions(data.predictions);
      }
    } catch (err) {
      console.error("Error loading user predictions:", err);
    } finally {
      setLoadingMyPreds(false);
    }
  };

  // Reset all prediction state whenever signed-in uid changes or on sign-out
  useEffect(() => {
    setUserPrediction(null);
    setMyPredictions([]);
    setOutcome("HOME");
    setHomeGoals(2);
    setAwayGoals(1);
    setSelectedPlayer("");
    setPlayerGoals(1);
    setSubmitMsg(null);

    loadMatches();
    if (authUser?.uid) {
      loadMyPredictions();
    }
  }, [authUser?.uid]);

  useEffect(() => {
    if (activeTab === "my_predictions") {
      loadMyPredictions();
    }
  }, [activeTab, authUser?.uid]);

  const handleSelectMatch = (mId: string) => {
    setSelectedMatchId(mId);
    setSubmitMsg(null);
    loadMatchDetails(mId);
  };

  // Live countdown timer synchronized with server clock
  useEffect(() => {
    if (!match) return;

    const updateCountdown = () => {
      const nowServerMs = Date.now() + serverTimeOffset;
      const kickoffMs = new Date(match.kickoffAt).getTime();
      const diff = kickoffMs - nowServerMs;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [match?.kickoffAt, serverTimeOffset]);

  // Contradiction detection between Leg 1 (Outcome) and Leg 2 (Scoreline)
  const scorelineOutcome: "HOME" | "AWAY" | "DRAW" = 
    homeGoals > awayGoals ? "HOME" : homeGoals < awayGoals ? "AWAY" : "DRAW";
  const hasContradiction = outcome !== scorelineOutcome;

  const handleSubmitPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    if (!auth.currentUser) {
      onOpenLogin();
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);

    try {
      const token = await auth.currentUser.getIdToken();
      const scoreline = `${homeGoals}:${awayGoals}`;

      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId: match.id,
          outcome,
          scoreline,
          playerName: selectedPlayer,
          playerGoals
        })
      });

      const data = await res.json();
      if (data.success && data.prediction) {
        setUserPrediction(data.prediction);
        setSubmitMsg({
          text: "✓ Saved — your 3-leg prediction is active! You can modify picks anytime before kickoff.",
          type: "success"
        });
        setTotalEntries(prev => (userPrediction ? prev : prev + 1));
        loadMyPredictions();
      } else {
        setSubmitMsg({
          text: data.error || "Failed to submit prediction.",
          type: "error"
        });
      }
    } catch (err: any) {
      setSubmitMsg({
        text: err?.message || "Network error submitting prediction.",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 3000);
    }
  };

  const isLocked = timeLeft.isPast || match?.status !== "scheduled";
  const isSettled = match?.status === "settled";

  if (loading && !match) {
    return (
      <div className="bg-[#1a3e29] p-8 rounded-2xl border border-[#295a3d] flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw size={28} className="animate-spin text-[#42bd6c] mb-3" />
        <p className="text-xs text-stone-300 font-mono">Loading Match Day Challenge & Fixtures...</p>
      </div>
    );
  }

  const homeBadge = match ? getTeamBadge(match.homeTeam) : null;
  const awayBadge = match ? getTeamBadge(match.awayTeam) : null;
  const kickoffLocal = match ? new Date(match.kickoffAt) : new Date();

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. HERO BANNER: ETHIOPIAN COFFEE X MATCHDAY PREDICTION */}
      <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] relative overflow-hidden">
        {/* Pitch Lines Motif Accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-2 border-[#42bd6c]/15 pointer-events-none" />
        <div className="absolute right-12 -top-6 w-24 h-24 rounded-full border border-[#42bd6c]/10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <HattrickLogo size="lg" theme="dark" showLocation={false} className="shrink-0" />
            <div className="border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-3 sm:pt-0 sm:pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  WEEKLY PREDICTION SYSTEM
                </span>
                <span className="text-[11px] font-mono text-stone-300">
                  Hawassa, Ethiopia
                </span>
              </div>
              <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
                Predict outcome, exact scoreline, and goalscorer. All 3 correct wins the featured Sidama & Yirgacheffe coffee reward at our sports lounge!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>100% Free Entry • No Order Required</span>
            </div>
            {auth.currentUser ? (
              <span className="text-xs text-stone-300 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Signed in as <strong>{auth.currentUser.displayName || auth.currentUser.email}</strong></span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User size={13} />
                <span>Register / Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#295a3d]/60 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("predict")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "predict"
                ? "bg-[#2d824d] text-white shadow-sm"
                : "bg-[#122b1c] text-stone-300 hover:text-white border border-[#295a3d]"
            }`}
          >
            <Trophy size={13} />
            <span>Active Prediction Slip</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my_predictions")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "my_predictions"
                ? "bg-[#2d824d] text-white shadow-sm"
                : "bg-[#122b1c] text-stone-300 hover:text-white border border-[#295a3d]"
            }`}
          >
            <BarChart3 size={13} />
            <span>My Predictions Summary</span>
            {myPredictions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black">
                {myPredictions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all_fixtures")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "all_fixtures"
                ? "bg-[#2d824d] text-white shadow-sm"
                : "bg-[#122b1c] text-stone-300 hover:text-white border border-[#295a3d]"
            }`}
          >
            <Calendar size={13} />
            <span>Fixtures & Results ({allMatches.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PREDICT ON ACTIVE / SELECTED FIXTURE */}
      {/* ======================================================== */}
      {activeTab === "predict" && match && (
        <div className="flex flex-col gap-6">

          {/* Fixture Selector Chips Carousel */}
          {allMatches.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] font-mono text-stone-400 shrink-0 mr-1 uppercase font-bold">Select Fixture:</span>
              {allMatches.map((m) => {
                const isCurrent = m.id === selectedMatchId;
                const isMatchSettled = m.status === "settled";
                const isMatchScheduled = m.status === "scheduled";
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMatch(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isCurrent
                        ? "bg-[#2d824d] text-white border border-[#42bd6c] shadow-md"
                        : "bg-[#122b1c] text-stone-300 border border-[#295a3d] hover:border-stone-500"
                    }`}
                  >
                    <span>{m.homeTeam} vs {m.awayTeam}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isMatchSettled
                        ? "bg-amber-400/20 text-amber-300"
                        : isMatchScheduled
                        ? "bg-emerald-400/20 text-emerald-300"
                        : "bg-red-400/20 text-red-300"
                    }`}>
                      {m.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Match Fixture Card */}
          <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-6 shadow-xl relative overflow-hidden">
            {/* Subtle pitch center circle motif */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <div className="w-80 h-80 rounded-full border-4 border-white" />
              <div className="absolute w-full h-0.5 bg-white" />
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              
              {/* Header Row: Competition & Kickoff Local Time */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#295a3d] pb-3 text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Official Kickoff (Local Time):</span>
                  <strong className="text-white">
                    {kickoffLocal.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {kickoffLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>

                {isLocked ? (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Lock size={12} />
                    <span>Locked ({match.status})</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Clock size={12} />
                    <span>Submissions Open</span>
                  </span>
                )}
              </div>

              {/* Teams Faceoff Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
                
                {/* Home Team */}
                <div className="md:col-span-5 flex items-center gap-4">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${homeBadge?.color.bg} ${homeBadge?.color.text} ${homeBadge?.color.border} border-2 flex items-center justify-center font-bold text-lg sm:text-xl font-mono shadow-lg shrink-0`}>
                    {homeBadge?.initials}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-[#42bd6c] font-bold tracking-wider">Home</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{match.homeTeam}</h3>
                    <span className="text-xs text-stone-400">Host Team</span>
                  </div>
                </div>

                {/* VS / Countdown / Result */}
                <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
                  {isSettled && match.result ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">Official Result</span>
                      <div className="px-4 py-1.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-2xl font-mono font-black text-white tracking-widest shadow-inner">
                        {match.result.homeGoals} - {match.result.awayGoals}
                      </div>
                    </div>
                  ) : isLocked ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-stone-400 uppercase mb-1">Match Status</span>
                      <div className="text-base font-bold text-amber-300 font-mono">In Play / Locked</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1.5">Kickoff In</span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        {timeLeft.days > 0 && (
                          <div className="px-2 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-center min-w-[32px]">
                            <span className="text-white font-bold">{timeLeft.days}</span>
                            <span className="text-[8px] block text-stone-400">d</span>
                          </div>
                        )}
                        <div className="px-2 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-center min-w-[32px]">
                          <span className="text-white font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                          <span className="text-[8px] block text-stone-400">h</span>
                        </div>
                        <span className="text-stone-500 font-bold">:</span>
                        <div className="px-2 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-center min-w-[32px]">
                          <span className="text-white font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                          <span className="text-[8px] block text-stone-400">m</span>
                        </div>
                        <span className="text-stone-500 font-bold">:</span>
                        <div className="px-2 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-center min-w-[32px]">
                          <span className="text-[#42bd6c] font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                          <span className="text-[8px] block text-stone-400">s</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="md:col-span-5 flex items-center md:flex-row-reverse gap-4 text-left md:text-right">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${awayBadge?.color.bg} ${awayBadge?.color.text} ${awayBadge?.color.border} border-2 flex items-center justify-center font-bold text-lg sm:text-xl font-mono shadow-lg shrink-0`}>
                    {awayBadge?.initials}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Away</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{match.awayTeam}</h3>
                    <span className="text-xs text-stone-400">Challenger</span>
                  </div>
                </div>

              </div>

              {/* Featured Grand Prize Banner */}
              <div className="bg-[#1a3e29] p-3.5 rounded-xl border border-[#295a3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-600/30">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Featured Matchday Reward</span>
                    <p className="text-white font-semibold">{match.prizeDescription}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#42bd6c] font-mono font-semibold self-start sm:self-auto">
                  3/3 Correct Legs Wins
                </span>
              </div>

            </div>
          </div>

          {/* Settled Result Card & Breakdown */}
          {isSettled && (
            <div className="p-5 rounded-2xl bg-[#143320] border-2 border-emerald-500/60 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-amber-400" />
                  <h4 className="text-base font-bold text-white">Official Matchday Settlement</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                  Settled ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                  <span className="text-stone-400 font-mono text-[10px]">Official Outcome</span>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {match.result ? (
                      match.result.homeGoals > match.result.awayGoals 
                        ? `${match.homeTeam} Win (HOME)` 
                        : match.result.homeGoals < match.result.awayGoals 
                        ? `${match.awayTeam} Win (AWAY)` 
                        : "Draw (DRAW)"
                    ) : "Pending"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                  <span className="text-stone-400 font-mono text-[10px]">Official Scoreline</span>
                  <p className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
                    {match.result?.homeGoals} : {match.result?.awayGoals}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                  <span className="text-stone-400 font-mono text-[10px]">Roster Goalscorers</span>
                  <p className="text-white text-xs mt-0.5 truncate">
                    {match.result?.playerGoals && Object.entries(match.result.playerGoals).filter(([_, g]) => (g as number) > 0).map(([p, g]) => `${p} (${g})`).join(", ") || "No roster goals"}
                  </p>
                </div>
              </div>

              {/* User evaluation if made prediction */}
              {userPrediction && (
                <div className={`p-4 rounded-xl border ${
                  userPrediction.grandPrizeWinner 
                    ? "bg-amber-500/15 border-amber-500/80 shadow-lg"
                    : "bg-[#122b1c] border-[#295a3d]"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Your 3-Leg Prediction Breakdown
                    </span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      userPrediction.grandPrizeWinner 
                        ? "bg-amber-400 text-stone-950 font-black" 
                        : "bg-[#224e38] text-stone-200"
                    }`}>
                      {userPrediction.legsCorrect}/3 Legs Correct
                    </span>
                  </div>

                  {userPrediction.grandPrizeWinner && (
                    <div className={`p-4 rounded-xl mb-4 border shadow-lg ${
                      userPrediction.prizeCollected
                        ? "bg-emerald-950/40 border-emerald-500/50 text-white"
                        : "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 border-amber-300"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <Trophy size={22} className={userPrediction.prizeCollected ? "text-emerald-400 shrink-0" : "text-stone-950 shrink-0"} />
                          <div>
                            <span className={`font-black text-sm block ${userPrediction.prizeCollected ? "text-white" : "text-stone-950"}`}>
                              {userPrediction.prizeCollected
                                ? `Prize collected on ${new Date(userPrediction.collectedAt || userPrediction.prizeCollectedAt || "").toLocaleDateString()}`
                                : "You won! Show this screen to the shop owner to collect your prize"}
                            </span>
                            <span className={`text-xs block ${userPrediction.prizeCollected ? "text-stone-300" : "text-stone-900 font-medium"}`}>
                              {match.prizeDescription}
                            </span>
                          </div>
                        </div>

                        {userPrediction.claimCode && (
                          <div className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-2 self-start sm:self-auto ${
                            userPrediction.prizeCollected
                              ? "bg-stone-900 border border-emerald-500/40 text-emerald-300"
                              : "bg-stone-950 text-amber-300"
                          }`}>
                            <span className="font-bold">Claim Code: {userPrediction.claimCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(userPrediction.claimCode!)}
                              className="text-white hover:text-amber-200 cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === userPrediction.claimCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t text-xs font-mono ${
                        userPrediction.prizeCollected ? "border-emerald-800/40 text-stone-300" : "border-amber-600/30 text-stone-900"
                      }`}>
                        <div>
                          <span className="text-[10px] block opacity-80">Entrant</span>
                          <strong className="block truncate">{userPrediction.displayName || authUser?.name || "Participant"}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] block opacity-80">Email</span>
                          <strong className="block truncate">{userPrediction.email || authUser?.email || "Signed In User"}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] block opacity-80">Match Fixture</span>
                          <strong className="block truncate">{match.homeTeam} vs {match.awayTeam}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      userPrediction.leg1Correct ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-stone-300"
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">Leg 1: Outcome</span>
                        <strong className="text-white">{userPrediction.outcome}</strong>
                      </div>
                      {userPrediction.leg1Correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      userPrediction.leg2Correct ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-stone-300"
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">Leg 2: Scoreline</span>
                        <strong className="text-white font-mono">{userPrediction.scoreline}</strong>
                      </div>
                      {userPrediction.leg2Correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      userPrediction.leg3Correct ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-stone-300"
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">Leg 3: Player Goals</span>
                        <strong className="text-white truncate block">{userPrediction.playerName} ({userPrediction.playerGoals})</strong>
                      </div>
                      {userPrediction.leg3Correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Winners list */}
              {winners && winners.length > 0 && (
                <div className="pt-2 border-t border-emerald-800/40">
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider block mb-2">
                    🏆 Grand Prize Winners ({winners.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {winners.map((w, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#122b1c] border border-amber-500/40 text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>👑 {w.displayName}</span>
                        {w.prizeCollected ? (
                          <span className="text-[9px] text-emerald-400 font-mono">(Claimed)</span>
                        ) : (
                          <span className="text-[9px] text-amber-300 font-mono">(Voucher Active)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prediction Slip Form */}
          <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#295a3d]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Your 3-Leg Prediction Slip</span>
                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 text-[10px] font-mono">
                      Locked at Kickoff
                    </span>
                  ) : userPrediction ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                      ✓ Saved & Editable
                    </span>
                  ) : null}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {isLocked
                    ? "Official kickoff has passed. Picks are locked in Firestore for official settlement."
                    : "Free entry. You can update your picks anytime until kickoff."}
                </p>
              </div>

              {!auth.currentUser && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <User size={14} />
                  <span>Sign in to save predictions</span>
                </button>
              )}
            </div>

            {submitMsg && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                submitMsg.type === "success" 
                  ? "bg-[#2d824d]/20 border-[#2d824d]/40 text-emerald-300" 
                  : "bg-red-500/20 border-red-500/40 text-red-300"
              }`}>
                {submitMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{submitMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPrediction} className="flex flex-col gap-6">
              
              {/* LEG 1: OUTCOME */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#2d824d] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Leg 1: Match Outcome</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Home Win, Draw, or Away Win</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "HOME", label: `${match.homeTeam} Win`, sub: "Home Win" },
                    { id: "DRAW", label: "Draw", sub: "Level score" },
                    { id: "AWAY", label: `${match.awayTeam} Win`, sub: "Away Win" }
                  ].map((opt) => {
                    const isSelected = outcome === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setOutcome(opt.id as any)}
                        className={`p-3 sm:p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-[#2d824d] border-[#42bd6c] text-white shadow-lg shadow-[#2d824d]/30 font-bold scale-[1.02]"
                            : "bg-[#122b1c] border-[#295a3d] text-stone-300 hover:border-stone-500 hover:text-white"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold truncate max-w-full">{opt.label}</span>
                        <span className="text-[10px] font-mono text-stone-400">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LEG 2: EXACT SCORELINE */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#2d824d] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Leg 2: Exact Scoreline</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Strict format: Home:Away</span>
                </div>

                <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    
                    {/* Home Goals Counter */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold text-stone-300 truncate max-w-[120px]">{match.homeTeam}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked || homeGoals <= 0}
                          onClick={() => setHomeGoals(g => Math.max(0, g - 1))}
                          className="w-8 h-8 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white font-bold text-base hover:bg-[#224e38] disabled:opacity-40 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono text-2xl font-black text-white">{homeGoals}</span>
                        <button
                          type="button"
                          disabled={isLocked || homeGoals >= 15}
                          onClick={() => setHomeGoals(g => Math.min(15, g + 1))}
                          className="w-8 h-8 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white font-bold text-base hover:bg-[#226a3f] disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="text-2xl font-bold font-mono text-stone-600">:</span>

                    {/* Away Goals Counter */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold text-stone-300 truncate max-w-[120px]">{match.awayTeam}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked || awayGoals <= 0}
                          onClick={() => setAwayGoals(g => Math.max(0, g - 1))}
                          className="w-8 h-8 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white font-bold text-base hover:bg-[#224e38] disabled:opacity-40 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono text-2xl font-black text-white">{awayGoals}</span>
                        <button
                          type="button"
                          disabled={isLocked || awayGoals >= 15}
                          onClick={() => setAwayGoals(g => Math.min(15, g + 1))}
                          className="w-8 h-8 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white font-bold text-base hover:bg-[#226a3f] disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-mono text-stone-400 block">Selected Scoreline</span>
                    <span className="text-xl font-mono font-bold text-[#42bd6c]">{homeGoals}:{awayGoals}</span>
                  </div>
                </div>

                {/* Contradiction Warning */}
                {hasContradiction && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="text-amber-300 font-semibold block">⚠️ Prediction Contradiction Warning:</strong>
                      You picked <strong>{outcome === "HOME" ? `${match.homeTeam} Win` : outcome === "AWAY" ? `${match.awayTeam} Win` : "Draw"}</strong> in Leg 1, but entered scoreline <strong>{homeGoals}:{awayGoals}</strong> ({scorelineOutcome}). This combination cannot win all 3 legs for the grand prize. We recommend aligning your picks before kickoff.
                    </div>
                  </div>
                )}
              </div>

              {/* LEG 3: PLAYER GOALCOUNT */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#2d824d] text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Leg 3: Player Goal Count</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Pick 1 player and their exact goals (0-10)</span>
                </div>

                <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Player Selector */}
                    <div>
                      <label className="text-[11px] text-stone-300 font-medium block mb-1">
                        Select Player
                      </label>
                      <select
                        disabled={isLocked}
                        value={selectedPlayer}
                        onChange={e => setSelectedPlayer(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c] disabled:opacity-60"
                      >
                        {match.players.map((p, idx) => (
                          <option key={idx} value={p.name}>
                            {p.name} ({p.team === "home" ? match.homeTeam : match.awayTeam})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Goals Selector */}
                    <div>
                      <label className="text-[11px] text-stone-300 font-medium block mb-1">
                        Exact Goals to Score (0 to 10)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[0, 1, 2, 3, 4].map(g => (
                          <button
                            key={g}
                            type="button"
                            disabled={isLocked}
                            onClick={() => setPlayerGoals(g)}
                            className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
                              playerGoals === g
                                ? "bg-[#2d824d] text-white border border-[#42bd6c] shadow-md"
                                : "bg-[#1a3e29] text-stone-300 border border-[#295a3d] hover:border-stone-500"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-[10px] text-stone-400 font-mono">Custom:</span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            disabled={isLocked}
                            value={playerGoals}
                            onChange={e => setPlayerGoals(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                            className="w-12 px-2 py-1.5 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs font-mono font-bold text-center text-white"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-[11px] text-stone-400 pt-1">
                    Selected: <strong className="text-white">{selectedPlayer || "None"}</strong> to score exactly <strong className="text-[#42bd6c]">{playerGoals}</strong> {playerGoals === 1 ? "goal" : "goals"} (own goals do not count).
                  </div>
                </div>
              </div>

              {/* Submit Action Row */}
              {!isLocked ? (
                auth.currentUser ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#295a3d]">
                    <div className="text-xs text-stone-400">
                      {userPrediction ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active entry saved — you can modify anytime before kickoff
                        </span>
                      ) : (
                        <span>Ready to lock in your free 3-leg prediction</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#2d824d] via-[#42bd6c] to-[#2d824d] hover:from-[#226a3f] hover:to-[#226a3f] text-white font-bold text-xs transition-all shadow-lg shadow-[#2d824d]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving to Firestore...</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          <span>{userPrediction ? "Update Prediction" : "Submit Free Prediction"}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">Sign In to Save Your Prediction</h4>
                      <p className="text-[11px] text-stone-400">Register or sign in to qualify for the coffee reward.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <User size={14} />
                      <span>Register or Sign In</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d] flex items-center justify-between text-xs text-stone-400">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <Lock size={14} className="text-amber-400" />
                    <span>Kickoff passed. Predictions are locked for official settlement.</span>
                  </span>
                  <span className="font-mono text-emerald-400">Good luck!</span>
                </div>
              )}

            </form>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY PREDICTIONS SUMMARY & WINNER CLAIM VOUCHERS */}
      {/* ======================================================== */}
      {activeTab === "my_predictions" && (
        <div className="flex flex-col gap-6">
          
          {/* Summary Overview Stats */}
          <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#295a3d]">
              <div>
                <h3 className="text-xl font-bold font-serif-display text-white">
                  My Weekly Predictions Account
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  View all your active slips, settlement results, and verified claim vouchers.
                </p>
              </div>

              {!auth.currentUser && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <User size={14} />
                  <span>Sign in to view your slips</span>
                </button>
              )}
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                <span className="text-[10px] font-mono text-stone-400 block">Total Submitted</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {myPredictions.length}
                </span>
                <span className="text-[10px] text-stone-400">fixtures predicted</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                <span className="text-[10px] font-mono text-stone-400 block">Grand Prizes Won</span>
                <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
                  {myPredictions.filter(p => p.grandPrizeWinner).length}
                </span>
                <span className="text-[10px] text-stone-400">3/3 leg clean sweeps</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                <span className="text-[10px] font-mono text-stone-400 block">Active Claims</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                  {myPredictions.filter(p => p.grandPrizeWinner && !p.prizeCollected).length}
                </span>
                <span className="text-[10px] text-stone-400">ready to redeem</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                <span className="text-[10px] font-mono text-stone-400 block">Prizes Collected</span>
                <span className="text-2xl font-black font-mono text-stone-300 mt-1 block">
                  {myPredictions.filter(p => p.prizeCollected).length}
                </span>
                <span className="text-[10px] text-stone-400">redeemed at counter</span>
              </div>
            </div>
          </div>

          {/* Winning Claim Vouchers Section */}
          {myPredictions.some(p => p.grandPrizeWinner) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h4 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Official Buna Prize Vouchers
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPredictions.filter(p => p.grandPrizeWinner).map(p => {
                  const m = p.match;
                  const isClaimed = p.prizeCollected;
                  return (
                    <div
                      key={p.matchId}
                      className={`rounded-2xl p-5 border-2 relative overflow-hidden flex flex-col justify-between gap-4 ${
                        isClaimed
                          ? "bg-[#102418] border-[#295a3d] opacity-80"
                          : "bg-gradient-to-br from-[#1b3d27] via-[#153420] to-[#0f2416] border-amber-400/80 shadow-2xl shadow-amber-950/30"
                      }`}
                    >
                      {/* Top Ribbon */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#295a3d] pb-3">
                        <div className="flex items-center gap-2">
                          <Award size={18} className={isClaimed ? "text-stone-400" : "text-amber-400"} />
                          <div>
                            <span className="text-[10px] font-mono text-amber-300 uppercase font-black tracking-widest block">
                              BUNA COFFEE × MATCHDAY WINNER
                            </span>
                            <h5 className="text-sm font-bold text-white">
                              {m ? `${m.homeTeam} vs ${m.awayTeam}` : "Premier Matchday"}
                            </h5>
                          </div>
                        </div>

                        {isClaimed ? (
                          <span className="px-2.5 py-1 rounded-full bg-stone-800 text-stone-400 border border-stone-700 font-mono text-[10px] font-bold">
                            ✓ Redeemed on {p.prizeCollectedAt ? new Date(p.prizeCollectedAt).toLocaleDateString() : "Record"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 font-mono text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                            Ready to Claim
                          </span>
                        )}
                      </div>

                      {/* Prize Details & Picks Breakdown */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-stone-400 uppercase">Prize Entitlement</span>
                          <p className="text-white font-bold text-sm leading-snug">
                            {m?.prizeDescription || "1 Year of Free Buna Single-Origin Coffee"}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#0e2115] border border-[#224e38] grid grid-cols-3 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-stone-400 text-[9px] block">Outcome</span>
                            <span className="text-emerald-400 font-bold">{p.outcome} ✓</span>
                          </div>
                          <div>
                            <span className="text-stone-400 text-[9px] block">Scoreline</span>
                            <span className="text-emerald-400 font-bold">{p.scoreline} ✓</span>
                          </div>
                          <div>
                            <span className="text-stone-400 text-[9px] block">Player Goals</span>
                            <span className="text-emerald-400 font-bold">{p.playerName} ({p.playerGoals}) ✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Unique Winner Verification Reference */}
                      <div className="p-3.5 rounded-xl bg-stone-950/80 border border-amber-500/40 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            Official Counter Reference Code:
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">Verified Matchday ID</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <code className="text-base sm:text-lg font-black font-mono text-amber-300 tracking-wider select-all">
                            {p.claimCode || `BUNA-WIN-${p.matchId.slice(-4).toUpperCase()}-${p.uid.slice(0, 4).toUpperCase()}`}
                          </code>

                          <button
                            type="button"
                            onClick={() => handleCopyCode(p.claimCode || "")}
                            className="px-3 py-1.5 rounded-lg bg-[#224e38] hover:bg-[#2d664a] border border-[#387a59] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiedCode === p.claimCode ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-[10px] text-stone-400 leading-tight">
                          Show this screen or quote your code to your Buna barista at the counter to claim your reward.
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of All Predictions */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              All Submitted Prediction Slips ({myPredictions.length})
            </h4>

            {loadingMyPreds ? (
              <div className="p-6 rounded-2xl bg-[#1a3e29] border border-[#295a3d] text-center text-xs text-stone-300 font-mono">
                Loading your submissions...
              </div>
            ) : myPredictions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {myPredictions.map((pred) => {
                  const m = pred.match;
                  const isMatchSettled = m?.status === "settled";
                  const kickoffDate = m ? new Date(m.kickoffAt) : new Date(pred.submittedAt);
                  const isPastKickoff = new Date() >= kickoffDate;

                  return (
                    <div
                      key={pred.matchId}
                      className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#295a3d] pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {m ? `${m.homeTeam} vs ${m.awayTeam}` : pred.matchId}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {m?.competition || "Weekly Match"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {isMatchSettled ? (
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              pred.grandPrizeWinner
                                ? "bg-amber-400 text-stone-950 font-black"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            }`}>
                              {pred.grandPrizeWinner ? "🏆 3/3 Winner!" : `Result: ${pred.legsCorrect || 0}/3 Legs`}
                            </span>
                          ) : isPastKickoff ? (
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
                              Locked (In Play)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Upcoming • Editable
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMatchId(pred.matchId);
                              setActiveTab("predict");
                              loadMatchDetails(pred.matchId);
                            }}
                            className="text-[#42bd6c] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Slip</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Winner Card if Grand Prize Winner */}
                      {pred.grandPrizeWinner && (
                        <div className={`p-3.5 rounded-xl border ${
                          pred.prizeCollected
                            ? "bg-emerald-950/40 border-emerald-500/50 text-white"
                            : "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-md border-amber-300"
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Trophy size={18} className={pred.prizeCollected ? "text-emerald-400 shrink-0" : "text-stone-950 shrink-0"} />
                              <div>
                                <span className={`font-black text-xs block ${pred.prizeCollected ? "text-white" : "text-stone-950"}`}>
                                  {pred.prizeCollected
                                    ? `Prize collected on ${new Date(pred.collectedAt || pred.prizeCollectedAt || "").toLocaleDateString()}`
                                    : "You won! Show this screen to the shop owner to collect your prize"}
                                </span>
                                <span className={`text-[11px] block ${pred.prizeCollected ? "text-stone-300" : "text-stone-900 font-medium"}`}>
                                  {m?.prizeDescription || "Free Buna Single-Origin Coffee"}
                                </span>
                              </div>
                            </div>

                            {pred.claimCode && (
                              <div className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold flex items-center gap-2 self-start sm:self-auto ${
                                pred.prizeCollected
                                  ? "bg-stone-900 text-emerald-300 border border-emerald-500/40"
                                  : "bg-stone-950 text-amber-300"
                              }`}>
                                <span>Claim Code: {pred.claimCode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(pred.claimCode!)}
                                  className="text-white hover:text-amber-200 cursor-pointer"
                                  title="Copy code"
                                >
                                  {copiedCode === pred.claimCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 border-t text-[11px] font-mono ${
                            pred.prizeCollected ? "border-emerald-800/40 text-stone-300" : "border-amber-600/30 text-stone-900"
                          }`}>
                            <div>
                              <span className="text-[9px] block opacity-80">Entrant</span>
                              <strong className="block truncate">{pred.displayName || authUser?.name || "Participant"}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] block opacity-80">Email</span>
                              <strong className="block truncate">{pred.email || authUser?.email || "Signed In User"}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] block opacity-80">Match</span>
                              <strong className="block truncate">{m ? `${m.homeTeam} vs ${m.awayTeam}` : pred.matchId}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Picks Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-stone-400 block">Pick 1: Outcome</span>
                            <span className="text-white font-bold">{pred.outcome}</span>
                          </div>
                          {isMatchSettled && (
                            pred.leg1Correct ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />
                          )}
                        </div>

                        <div className="p-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-stone-400 block">Pick 2: Scoreline</span>
                            <span className="text-white font-bold">{pred.scoreline}</span>
                          </div>
                          {isMatchSettled && (
                            pred.leg2Correct ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />
                          )}
                        </div>

                        <div className="p-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between">
                          <div className="truncate">
                            <span className="text-[9px] text-stone-400 block">Pick 3: Player Goals</span>
                            <span className="text-white font-bold truncate block">{pred.playerName} ({pred.playerGoals})</span>
                          </div>
                          {isMatchSettled && (
                            pred.leg3Correct ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-1">
                        <span>Submitted: {new Date(pred.submittedAt).toLocaleString()}</span>
                        {pred.claimCode && (
                          <span className="text-amber-300">Ref: {pred.claimCode}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#1a3e29] border border-[#295a3d] text-center">
                <Trophy size={32} className="text-stone-500 mx-auto mb-2" />
                <h5 className="text-sm font-bold text-white">No Submitted Predictions Yet</h5>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  Select any upcoming Premier League fixture from the active slip tab to submit your free 3-leg prediction!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("predict")}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Predict Upcoming Fixture
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ALL FIXTURES & PAST RESULTS */}
      {/* ======================================================== */}
      {activeTab === "all_fixtures" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-serif-display">
              Weekly Soccer Fixtures Schedule & Results
            </h3>
            <span className="text-xs font-mono text-stone-400">{allMatches.length} Fixtures Loaded</span>
          </div>

          <div className="flex flex-col gap-3">
            {allMatches.map((m) => {
              const kickoffDate = new Date(m.kickoffAt);
              const isMatchSettled = m.status === "settled";
              const isMatchScheduled = m.status === "scheduled";
              const isPastKickoff = new Date() >= kickoffDate;

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-[#122b1c] border border-[#295a3d] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">
                        {m.competition}
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="text-[11px] font-mono text-stone-300">
                        {kickoffDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at {kickoffDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">
                      {m.homeTeam} <span className="text-stone-400 text-sm">vs</span> {m.awayTeam}
                    </h4>

                    <p className="text-xs text-stone-400">
                      Prize: <strong className="text-stone-200">{m.prizeDescription}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                    {isMatchSettled && m.result ? (
                      <div className="text-center px-4 py-1.5 rounded-xl bg-[#1a3e29] border border-[#295a3d]">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase block font-bold">Final Score</span>
                        <span className="text-lg font-mono font-black text-white">{m.result.homeGoals} - {m.result.awayGoals}</span>
                      </div>
                    ) : isPastKickoff ? (
                      <span className="px-3 py-1 rounded-full bg-stone-800 text-amber-300 border border-stone-700 text-xs font-mono">
                        Locked / In Play
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
                        Open for Predictions
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatchId(m.id);
                        setActiveTab("predict");
                        loadMatchDetails(m.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isMatchSettled ? "View Results" : "Predict Match"}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
