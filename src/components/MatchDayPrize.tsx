import React, { useState, useEffect } from "react";
import { 
  Trophy, Clock, AlertTriangle, CheckCircle2, XCircle, Shield, 
  Sparkles, Check, Lock, User, RefreshCw, ChevronRight, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PredictionMatch, Prediction, AuthUser } from "../types";
import { auth } from "../lib/firebase";

interface MatchDayPrizeProps {
  authUser: AuthUser;
  onOpenLogin: () => void;
  onRewardPoints?: (points: number, reason: string) => void;
}

// Helper to generate simple colored initial badges for teams (no copyrighted crests)
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

  // Initials: 2-3 uppercase letters
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
  const [match, setMatch] = useState<PredictionMatch | null>(null);
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [stats, setStats] = useState<any | null>(null);
  const [winners, setWinners] = useState<Array<{ displayName: string; prizeCollected: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  const loadFeaturedMatch = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        } catch (e) {
          console.warn("Could not retrieve token:", e);
        }
      }

      const res = await fetch("/api/predictions/featured", { headers });
      const data = await res.json();

      if (data.match) {
        setMatch(data.match);
        setTotalEntries(data.totalEntries || 0);
        if (data.stats) setStats(data.stats);
        if (data.winners) setWinners(data.winners);

        // Compute clock difference between server and client
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
        } else if (data.match.players && data.match.players.length > 0) {
          setSelectedPlayer(data.match.players[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading featured match:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedMatch();
  }, [authUser?.email, authUser?.role]);

  // Server-based Live Countdown Timer
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
          text: "✓ Saved — you can change this until kickoff!",
          type: "success"
        });
        setTotalEntries(prev => (userPrediction ? prev : prev + 1));
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

  const isLocked = timeLeft.isPast || match?.status !== "scheduled";
  const isSettled = match?.status === "settled";

  if (loading) {
    return (
      <div className="bg-[#1a3e29] p-8 rounded-2xl border border-[#295a3d] flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw size={28} className="animate-spin text-[#42bd6c] mb-3" />
        <p className="text-xs text-stone-300 font-mono">Loading Match Day Challenge...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="bg-[#1a3e29] p-8 rounded-2xl border border-[#295a3d] text-center">
        <Trophy size={36} className="text-stone-400 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-white">No Match Scheduled</h3>
        <p className="text-xs text-stone-400 mt-1">Check back soon for the next weekend coffee x football prediction game!</p>
      </div>
    );
  }

  const homeBadge = getTeamBadge(match.homeTeam);
  const awayBadge = getTeamBadge(match.awayTeam);
  const kickoffLocal = new Date(match.kickoffAt);

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. MATCH DAY BANNER & FREE-TO-ENTER NOTICE */}
      <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] relative overflow-hidden">
        {/* Pitch Lines Accent Motif */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-2 border-[#42bd6c]/15 pointer-events-none" />
        <div className="absolute right-12 -top-6 w-24 h-24 rounded-full border border-[#42bd6c]/10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#2d824d]/30 text-[#42bd6c] border border-[#2d824d]/50 text-[10px] font-mono font-bold uppercase tracking-wider">
                WEEKLY 3-LEG PREDICTION
              </span>
              <span className="text-[11px] font-mono text-stone-300">
                {match.competition}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-white tracking-tight">
              Match Day Prize Challenge
            </h2>
            <p className="text-xs text-stone-300 max-w-xl mt-1 leading-relaxed">
              Predict the outcome, exact scoreline, and player goals. Grand prize winner gets <strong>{match.prizeDescription}</strong>!
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>100% Free Entry • No Order Required</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {totalEntries} verified {totalEntries === 1 ? "entry" : "entries"} this week
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH FIXTURE CARD & LIVE SERVER-BASED COUNTDOWN */}
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
              <span className="text-stone-400">Kickoff (Your Local Time):</span>
              <strong className="text-white">
                {kickoffLocal.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {kickoffLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>

            {isLocked ? (
              <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
                <Lock size={12} />
                <span>Predictions Locked ({match.status})</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                <Clock size={12} />
                <span>Submissions Open</span>
              </span>
            )}
          </div>

          {/* Teams Faceoff Layout with Clean Initial Badges */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            
            {/* Home Team */}
            <div className="md:col-span-5 flex items-center gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${homeBadge.color.bg} ${homeBadge.color.text} ${homeBadge.color.border} border-2 flex items-center justify-center font-bold text-lg sm:text-xl font-mono shadow-lg shrink-0`}>
                {homeBadge.initials}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-[#42bd6c] font-bold tracking-wider">Home</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{match.homeTeam}</h3>
                <span className="text-xs text-stone-400">Host Venue</span>
              </div>
            </div>

            {/* VS & Live Server Countdown / Official Score */}
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
              {isSettled && match.result ? (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">Final Score</span>
                  <div className="px-4 py-1.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-2xl font-mono font-black text-white tracking-widest shadow-inner">
                    {match.result.homeGoals} - {match.result.awayGoals}
                  </div>
                </div>
              ) : isLocked ? (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-stone-400 uppercase mb-1">Status</span>
                  <div className="text-lg font-bold text-amber-300 font-mono">In Play / Locked</div>
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
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${awayBadge.color.bg} ${awayBadge.color.text} ${awayBadge.color.border} border-2 flex items-center justify-center font-bold text-lg sm:text-xl font-mono shadow-lg shrink-0`}>
                {awayBadge.initials}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Away</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{match.awayTeam}</h3>
                <span className="text-xs text-stone-400">Challenger</span>
              </div>
            </div>

          </div>

          {/* Grand Prize Card Banner */}
          <div className="bg-[#1a3e29] p-3.5 rounded-xl border border-[#295a3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-600/30">
                <Trophy size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Featured Grand Prize</span>
                <p className="text-white font-semibold">{match.prizeDescription}</p>
              </div>
            </div>
            <span className="text-[11px] text-[#42bd6c] font-mono font-semibold self-start sm:self-auto">
              3/3 Correct Legs Wins
            </span>
          </div>

        </div>
      </div>

      {/* 3. SETTLED RESULT BANNER (If settled) */}
      {isSettled && (
        <div className="p-5 rounded-2xl bg-[#143320] border-2 border-emerald-500/60 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <h4 className="text-base font-bold text-white">Official Matchday Settlement</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
              Settled
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

          {/* User's performance evaluation if user made a prediction */}
          {userPrediction && (
            <div className={`p-4 rounded-xl border ${
              userPrediction.grandPrizeWinner 
                ? "bg-amber-500/15 border-amber-500/80 shadow-lg"
                : "bg-[#122b1c] border-[#295a3d]"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Your 3-Leg Prediction Results
                </span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                  userPrediction.grandPrizeWinner 
                    ? "bg-amber-400 text-stone-950" 
                    : "bg-[#224e38] text-stone-200"
                }`}>
                  {userPrediction.legsCorrect}/3 Legs Correct
                </span>
              </div>

              {userPrediction.grandPrizeWinner && (
                <div className="p-3 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs mb-3 flex items-center gap-2 shadow-md">
                  <Trophy size={18} />
                  <span>🎉 CONGRATULATIONS! You got all 3 legs correct and won the Grand Prize: {match.prizeDescription}!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Leg 1 Result */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  userPrediction.leg1Correct ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-stone-300"
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block">Leg 1: Outcome</span>
                    <strong className="text-white">{userPrediction.outcome}</strong>
                  </div>
                  {userPrediction.leg1Correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                </div>

                {/* Leg 2 Result */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  userPrediction.leg2Correct ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-stone-300"
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block">Leg 2: Scoreline</span>
                    <strong className="text-white font-mono">{userPrediction.scoreline}</strong>
                  </div>
                  {userPrediction.leg2Correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                </div>

                {/* Leg 3 Result */}
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

          {/* Winners List */}
          {winners && winners.length > 0 && (
            <div className="pt-2 border-t border-emerald-800/40">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider block mb-2">
                🏆 Grand Prize Winners ({winners.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {winners.map((w, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#122b1c] border border-amber-500/40 text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>👑 {w.displayName}</span>
                    {w.prizeCollected && <span className="text-[9px] text-emerald-400 font-mono">(Claimed)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PREDICTION FORM / LOCKED SLIP */}
      <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
        
        {/* Header of Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#295a3d]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Your Match Day 3-Leg Slip</span>
              {isLocked ? (
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 text-[10px] font-mono">
                  Locked
                </span>
              ) : userPrediction ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                  ✓ Submitted
                </span>
              ) : null}
            </h3>
            <p className="text-xs text-stone-300 mt-0.5">
              {isLocked 
                ? "Kickoff has passed. Predictions are locked for official settlement."
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
              <span>Sign in with Google to predict</span>
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
          
          {/* ======================================================== */}
          {/* LEG 1: MATCH OUTCOME (HOME, AWAY, DRAW) */}
          {/* ======================================================== */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2d824d] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Leg 1: Match Outcome</span>
              </label>
              <span className="text-[10px] text-stone-400 font-mono">Win, Draw, or Win</span>
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

          {/* ======================================================== */}
          {/* LEG 2: EXACT SCORELINE ("Home:Away") */}
          {/* ======================================================== */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2d824d] text-white flex items-center justify-center text-[10px]">2</span>
                <span>Leg 2: Exact Scoreline</span>
              </label>
              <span className="text-[10px] text-stone-400 font-mono">Strict format: Home:Away (e.g. 3:1)</span>
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
                <span className="text-[10px] font-mono text-stone-400 block">Chosen Scoreline</span>
                <span className="text-xl font-mono font-bold text-[#42bd6c]">{homeGoals}:{awayGoals}</span>
              </div>
            </div>

            {/* Clear Contradiction Warning */}
            {hasContradiction && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-amber-300 font-semibold block">⚠️ Prediction Contradiction Warning:</strong>
                  You selected <strong>{outcome === "HOME" ? `${match.homeTeam} Win` : outcome === "AWAY" ? `${match.awayTeam} Win` : "Draw"}</strong> in Leg 1, but entered a scoreline of <strong>{homeGoals}:{awayGoals}</strong>. Because the exact scoreline results in a {scorelineOutcome}, this combination cannot win all 3 legs for the grand prize. You can still submit, but we recommend aligning your outcome and scoreline picks.
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* LEG 3: PLAYER GOALCOUNT */}
          {/* ======================================================== */}
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

                {/* Goals Count Selector */}
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
                      <CheckCircle2 size={13} /> Saved — you can change your picks until kickoff
                    </span>
                  ) : (
                    <span>Ready to submit your free 3-leg prediction</span>
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
                      <span>Saving Prediction...</span>
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
                  <h4 className="text-xs font-bold text-white">Sign In to Save Your 3-Leg Prediction</h4>
                  <p className="text-[11px] text-stone-400">Sign in with Google to enter for free and qualify for the grand prize.</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <User size={14} />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d] flex items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5 text-stone-300">
                <Lock size={14} className="text-amber-400" />
                <span>Predictions are locked. Good luck to all participants!</span>
              </span>
              <span className="font-mono text-emerald-400">Full Time Settlement Awaited</span>
            </div>
          )}

        </form>

      </div>

    </div>
  );
}
