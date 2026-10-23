import React, { useState, useEffect } from "react";
import { 
  Shield, Sparkles, RefreshCw, CheckCircle2, TrendingUp, Users, Tag, Award, 
  Plus, Trash2, Eye, EyeOff, Trophy, Calendar, AlertTriangle, Check, X, Clock,
  Filter, Search, QrCode, FileText, History, ArrowRight, Download, Layers, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MatchAuditEntry } from "../types";
import HattrickLogoModal from "./HattrickLogoModal";

interface MatchPlayer {
  name: string;
  team: "home" | "away";
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'promotions' | 'predictions' | 'users' | 'brand_assets'>('predictions');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  
  // Predictions sub-view: "matches" | "customer_predictions" | "verify_claim"
  const [predictionView, setPredictionView] = useState<'matches' | 'customer_predictions' | 'verify_claim'>('matches');

  // All Customer Predictions list state
  const [allPredictions, setAllPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predFilterMatch, setPredFilterMatch] = useState("");
  const [predFilterWeek, setPredFilterWeek] = useState("");
  const [predFilterStatus, setPredFilterStatus] = useState("all");
  const [predSearchTerm, setPredSearchTerm] = useState("");

  // Claim code verification state
  const [claimInput, setClaimInput] = useState("");
  const [verifyingClaim, setVerifyingClaim] = useState(false);
  const [claimResult, setClaimResult] = useState<any | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [redeemingClaim, setRedeemingClaim] = useState(false);

  // Promotions form state
  const [promoName, setPromoName] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  
  // Match form state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [competition, setCompetition] = useState("Premier Matchday");
  const [kickoffDateTime, setKickoffDateTime] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("1 Year of Free Buna Single-Origin Coffee & Match Ball");
  const [playersList, setPlayersList] = useState<MatchPlayer[]>([
    { name: "", team: "home" },
    { name: "", team: "away" }
  ]);
  const [saturdayWarning, setSaturdayWarning] = useState<string | null>(null);

  // Settlement & Correction state
  const [settlingMatch, setSettlingMatch] = useState<any | null>(null);
  const [settleHomeGoals, setSettleHomeGoals] = useState(0);
  const [settleAwayGoals, setSettleAwayGoals] = useState(0);
  const [settlePlayerGoals, setSettlePlayerGoals] = useState<Record<string, number>>({});
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  const [expandedAuditMatchId, setExpandedAuditMatchId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Entries table state per match
  const [expandedEntriesMatchId, setExpandedEntriesMatchId] = useState<string | null>(null);
  const [entriesCache, setEntriesCache] = useState<Record<string, any[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<Record<string, boolean>>({});
  const [entriesSearch, setEntriesSearch] = useState<Record<string, string>>({});
  const [entriesSortKey, setEntriesSortKey] = useState<string>("submittedAt");
  const [entriesSortDir, setEntriesSortDir] = useState<"asc" | "desc">("desc");

  const loadMatchEntries = async (matchId: string) => {
    setLoadingEntries(prev => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch(`/api/owner/predictions/entries?matchId=${matchId}`, {
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        setEntriesCache(prev => ({ ...prev, [matchId]: data.entries }));
      }
    } catch (e) {
      console.error("Failed to load match entries:", e);
    } finally {
      setLoadingEntries(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const toggleViewEntries = (matchId: string) => {
    if (expandedEntriesMatchId === matchId) {
      setExpandedEntriesMatchId(null);
    } else {
      setExpandedEntriesMatchId(matchId);
      if (!entriesCache[matchId]) {
        loadMatchEntries(matchId);
      }
    }
  };

  const downloadEntriesCsv = (m: any, entriesList: any[]) => {
    const headers = [
      "Customer Name",
      "Email",
      "Outcome (L1)",
      "Scoreline (L2)",
      "Player (L3)",
      "Player Goals",
      "Submitted At",
      "Leg 1 Correct",
      "Leg 2 Correct",
      "Leg 3 Correct",
      "Legs Correct",
      "Grand Prize Winner",
      "Prize Collected",
      "Collected At",
      "Claim Code"
    ];

    const rows = entriesList.map(e => [
      `"${(e.displayName || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      e.outcome || '',
      `"${e.scoreline || ''}"`,
      `"${(e.playerName || '').replace(/"/g, '""')}"`,
      e.playerGoals ?? '',
      e.submittedAt || '',
      e.leg1Correct !== undefined ? (e.leg1Correct ? "YES" : "NO") : "",
      e.leg2Correct !== undefined ? (e.leg2Correct ? "YES" : "NO") : "",
      e.leg3Correct !== undefined ? (e.leg3Correct ? "YES" : "NO") : "",
      e.legsCorrect ?? '',
      e.grandPrizeWinner !== undefined ? (e.grandPrizeWinner ? "YES" : "NO") : "",
      e.prizeCollected !== undefined ? (e.prizeCollected ? "YES" : "NO") : "",
      e.collectedAt ? `"${new Date(e.collectedAt).toLocaleString()}"` : '',
      e.claimCode || ''
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `entries_${m.homeTeam}_vs_${m.awayTeam}_${m.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAdminHeaders = () => {
    const token = localStorage.getItem("buna_admin_token") || "";
    const pin = localStorage.getItem("buna_admin_pin") || "";
    return {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
      "X-Admin-Pin": pin
    };
  };

  const loadDashboardData = () => {
    setLoading(true);
    const headers = getAdminHeaders();

    fetch("/api/owner/stats", { headers })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching admin stats:", e);
        setLoading(false);
      });

    fetch("/api/owner/users", { headers })
      .then(res => res.json())
      .then(data => {
        if (data?.registeredUsers) {
          setUsers(data.registeredUsers);
        }
      })
      .catch(e => console.error("Error fetching users:", e));

    fetch("/api/owner/predictions/matches", { headers })
      .then(res => res.json())
      .then(data => {
        if (data?.matches) {
          setMatches(data.matches);
        }
      })
      .catch(e => console.error("Error fetching matches:", e));
  };

  const loadAllPredictions = () => {
    setLoadingPredictions(true);
    const headers = getAdminHeaders();
    const query = new URLSearchParams();
    if (predFilterMatch) query.set("matchId", predFilterMatch);
    if (predFilterWeek) query.set("weekKey", predFilterWeek);
    if (predFilterStatus && predFilterStatus !== "all") query.set("status", predFilterStatus);
    if (predSearchTerm) query.set("search", predSearchTerm);

    fetch(`/api/owner/predictions/all?${query.toString()}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data?.predictions) {
          setAllPredictions(data.predictions);
        }
      })
      .catch(e => console.error("Error fetching all predictions:", e))
      .finally(() => setLoadingPredictions(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeSubTab === "predictions" && predictionView === "customer_predictions") {
      loadAllPredictions();
    }
  }, [activeSubTab, predictionView, predFilterMatch, predFilterWeek, predFilterStatus, predSearchTerm]);

  const showFeedback = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4500);
  };

  const handleKickoffChange = (val: string) => {
    setKickoffDateTime(val);
    if (!val) {
      setSaturdayWarning(null);
      return;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      if (d.getDay() !== 6) {
        setSaturdayWarning("Notice: The kickoff date is not on a Saturday. Entering is allowed, but Premier showcase games are typically Saturday.");
      } else {
        setSaturdayWarning(null);
      }
    }
  };

  const handleAddPlayer = () => {
    setPlayersList(prev => [...prev, { name: "", team: "home" }]);
  };

  const handleRemovePlayer = (idx: number) => {
    setPlayersList(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePlayerChange = (idx: number, field: "name" | "team", val: string) => {
    setPlayersList(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim() || !kickoffDateTime) {
      showFeedback("Please fill in home team, away team, and kickoff date/time.");
      return;
    }

    const filteredPlayers = playersList
      .map(p => ({ name: p.name.trim(), team: p.team }))
      .filter(p => p.name.length > 0);

    if (filteredPlayers.length === 0) {
      showFeedback("Please add at least one player to the roster.");
      return;
    }

    const kickoffUtc = new Date(kickoffDateTime).toISOString();

    fetch("/api/owner/predictions/matches", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        id: editingMatchId || undefined,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        competition: competition.trim(),
        kickoffAt: kickoffUtc,
        prizeDescription: prizeDesc.trim(),
        players: filteredPlayers
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback(data.message || "Match saved successfully!");
          setEditingMatchId(null);
          setHomeTeam("");
          setAwayTeam("");
          setKickoffDateTime("");
          setPlayersList([{ name: "", team: "home" }, { name: "", team: "away" }]);
          loadDashboardData();
        } else {
          showFeedback(data.error || "Failed to save match.");
        }
      })
      .catch(e => {
        console.error(e);
        showFeedback("Error saving match.");
      });
  };

  const handleStartEditMatch = (m: any) => {
    const isPast = new Date() >= new Date(m.kickoffAt);
    if (isPast) {
      showFeedback("Cannot edit match after kickoff has occurred.");
      return;
    }
    setEditingMatchId(m.id);
    setHomeTeam(m.homeTeam);
    setAwayTeam(m.awayTeam);
    setCompetition(m.competition || "Premier Matchday");
    try {
      const d = new Date(m.kickoffAt);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setKickoffDateTime(localIso);
    } catch {
      setKickoffDateTime("");
    }
    setPrizeDesc(m.prizeDescription || "");
    setPlayersList(m.players && m.players.length > 0 ? m.players : [{ name: "", team: "home" }]);
  };

  const handleVoidMatch = (matchId: string) => {
    if (!confirm("Are you sure you want to mark this match as void? All predictions will be cancelled.")) return;

    fetch("/api/owner/predictions/void", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ matchId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback("Match has been marked as void.");
          loadDashboardData();
        } else {
          showFeedback(data.error || "Failed to void match.");
        }
      })
      .catch(e => console.error(e));
  };

  const handleOpenSettle = (m: any, isCorrection: boolean = false) => {
    setSettlingMatch(m);
    setIsCorrectionMode(isCorrection);
    setCorrectionReason("");
    setSettleHomeGoals(m.result?.homeGoals ?? 0);
    setSettleAwayGoals(m.result?.awayGoals ?? 0);
    const initialPlayerGoals: Record<string, number> = {};
    (m.players || []).forEach((p: MatchPlayer) => {
      initialPlayerGoals[p.name] = m.result?.playerGoals?.[p.name] ?? 0;
    });
    setSettlePlayerGoals(initialPlayerGoals);
  };

  const handleExecuteSettle = () => {
    if (!settlingMatch) return;

    const endpoint = isCorrectionMode ? "/api/owner/predictions/correct-result" : "/api/owner/predictions/settle";
    const body: any = {
      matchId: settlingMatch.id,
      homeGoals: settleHomeGoals,
      awayGoals: settleAwayGoals,
      playerGoals: settlePlayerGoals
    };
    if (isCorrectionMode) {
      body.reason = correctionReason || "VAR revision / Score adjustment";
    }

    fetch(endpoint, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback(data.message || "Match settled successfully!");
          setSettlingMatch(null);
          loadDashboardData();
          if (predictionView === "customer_predictions") loadAllPredictions();
        } else {
          showFeedback(data.error || "Failed to settle match.");
        }
      })
      .catch(e => {
        console.error(e);
        showFeedback("Error executing settlement.");
      });
  };

  const handleTogglePrizeCollected = (matchId: string, uid: string, current: boolean, winnerName?: string, winnerEmail?: string) => {
    const actionText = !current ? "mark prize as collected" : "revert prize collected status";
    const userLabel = winnerName ? ` for ${winnerName}${winnerEmail ? ` (${winnerEmail})` : ""}` : "";
    if (!window.confirm(`Are you sure you want to ${actionText}${userLabel}?`)) {
      return;
    }
    fetch("/api/owner/predictions/collect-prize", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ matchId, uid, collected: !current })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback("Prize collected status updated.");
          loadDashboardData();
          if (predictionView === "customer_predictions") loadAllPredictions();
          loadMatchEntries(matchId);
        } else {
          showFeedback(data.error || "Failed to update prize status.");
        }
      })
      .catch(e => console.error(e));
  };

  // Verify Claim Code
  const handleVerifyClaimCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;
    setVerifyingClaim(true);
    setClaimError(null);
    setClaimResult(null);

    fetch("/api/owner/predictions/verify-claim", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ claimCode: claimInput.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClaimResult(data);
        } else {
          setClaimError(data.error || "No winning prediction found matching this code.");
        }
      })
      .catch(e => {
        console.error(e);
        setClaimError("Network error verifying claim code.");
      })
      .finally(() => setVerifyingClaim(false));
  };

  // Confirm Prize Redemption
  const handleConfirmRedemption = () => {
    if (!claimResult?.prediction?.claimCode) return;
    setRedeemingClaim(true);

    fetch("/api/owner/predictions/redeem-prize", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ claimCode: claimResult.prediction.claimCode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback("🎉 Prize marked as claimed! Redemption timestamp recorded.");
          setClaimResult((prev: any) => ({
            ...prev,
            prediction: {
              ...prev.prediction,
              prizeCollected: true,
              prizeCollectedAt: new Date().toISOString(),
              collectedBy: data.prediction?.collectedBy || "Staff"
            }
          }));
          loadDashboardData();
        } else {
          showFeedback(data.error || "Failed to redeem prize.");
        }
      })
      .catch(e => {
        console.error(e);
        showFeedback("Error redeeming prize.");
      })
      .finally(() => setRedeemingClaim(false));
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Dashboard Header */}
      <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold uppercase">
              ADMIN CONTROL PANEL
            </span>
            <span className="text-xs font-mono text-stone-300">Staff Operations</span>
          </div>
          <h2 className="text-2xl font-bold font-serif-display text-white tracking-tight">
            Buna Cafe & Matchday Management
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Manage Premier League prediction matches, customer entries, prize vouchers, and results settlement.
          </p>
        </div>

        {/* SubTab switcher */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveSubTab('predictions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'predictions'
                ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                : 'bg-[#122b1c] text-stone-200 border border-[#295a3d]'
            }`}
          >
            <Trophy size={14} />
            <span>Weekly Predictions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-[#2d824d] text-white shadow-md'
                : 'bg-[#122b1c] text-stone-200 border border-[#295a3d]'
            }`}
          >
            <Users size={14} />
            <span>Customer Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('brand_assets')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'brand_assets'
                ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                : 'bg-[#122b1c] text-amber-300 border border-amber-500/40'
            }`}
          >
            <Sparkles size={14} />
            <span>Brand & Logo Assets</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold flex items-center gap-2">
          <Sparkles size={15} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: WEEKLY PREDICTIONS & COUNTER VERIFICATION */}
      {/* ======================================================== */}
      {activeSubTab === 'predictions' && (
        <div className="flex flex-col gap-6">

          {/* Top Prediction Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#122b1c] p-2 rounded-xl border border-[#295a3d] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPredictionView('matches')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  predictionView === 'matches'
                    ? 'bg-[#2d824d] text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                1. Match Fixtures & Settlement
              </button>

              <button
                type="button"
                onClick={() => setPredictionView('customer_predictions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  predictionView === 'customer_predictions'
                    ? 'bg-[#2d824d] text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                2. Customer Submissions Browser
              </button>

              <button
                type="button"
                onClick={() => setPredictionView('verify_claim')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  predictionView === 'verify_claim'
                    ? 'bg-amber-400 text-stone-950 font-black'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <QrCode size={13} />
                <span>3. Verify & Redeem Prize Code</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadDashboardData}
              className="px-2.5 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-stone-300 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} />
              <span>Refresh</span>
            </button>
          </div>

          {/* ====================================================== */}
          {/* VIEW 1: MATCH FIXTURES, CREATION & SETTLEMENT */}
          {/* ====================================================== */}
          {predictionView === 'matches' && (
            <div className="flex flex-col gap-6">
              
              {/* Form: Create or Edit Match */}
              <form onSubmit={handleSaveMatch} className="bg-[#122b1c] p-5 rounded-2xl border border-[#295a3d] flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#295a3d] pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={15} className="text-[#42bd6c]" />
                    <span>{editingMatchId ? "Edit Match Fixture" : "Schedule New Weekly Prediction Match"}</span>
                  </h3>
                  {editingMatchId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMatchId(null);
                        setHomeTeam("");
                        setAwayTeam("");
                        setKickoffDateTime("");
                      }}
                      className="text-stone-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">Home Team</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arsenal"
                      value={homeTeam}
                      onChange={e => setHomeTeam(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">Away Team</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liverpool"
                      value={awayTeam}
                      onChange={e => setAwayTeam(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">Competition</label>
                    <input
                      type="text"
                      value={competition}
                      onChange={e => setCompetition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">Kickoff (Your Local Time)</label>
                    <input
                      type="datetime-local"
                      required
                      value={kickoffDateTime}
                      onChange={e => handleKickoffChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">Prize Description</label>
                    <input
                      type="text"
                      value={prizeDesc}
                      onChange={e => setPrizeDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white"
                    />
                  </div>
                </div>

                {saturdayWarning && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                    <span>{saturdayWarning}</span>
                  </div>
                )}

                {/* Player Roster for Leg 3 Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-stone-200">
                      Roster of Pickable Players (Leg 3 Goalscorer)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPlayer}
                      className="text-xs text-[#42bd6c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add Player</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {playersList.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-[#1a3e29] border border-[#295a3d] rounded-lg p-1.5">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={player.name}
                          onChange={e => handlePlayerChange(idx, "name", e.target.value)}
                          className="flex-1 px-2 py-1 bg-transparent text-xs text-white focus:outline-none"
                        />
                        <select
                          value={player.team}
                          onChange={e => handlePlayerChange(idx, "team", e.target.value as any)}
                          className="bg-[#122b1c] text-[10px] text-stone-300 rounded px-1.5 py-1 border border-[#295a3d]"
                        >
                          <option value="home">Home</option>
                          <option value="away">Away</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(idx)}
                          className="text-stone-400 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="self-start px-5 py-2.5 rounded-xl bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingMatchId ? "Update Match Fixture" : "Publish Match Fixture"}</span>
                </button>
              </form>

              {/* Settlement & Correction Modal Drawer */}
              {settlingMatch && (
                <div className="p-5 rounded-2xl bg-[#143320] border-2 border-emerald-500/80 shadow-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#295a3d]">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{isCorrectionMode ? "⚠️ Correct Settled Result (Audit History):" : "⚽ Settle Official Match Result:"}</span>
                        <span className="text-emerald-400">{settlingMatch.homeTeam} vs {settlingMatch.awayTeam}</span>
                      </h4>
                      <p className="text-xs text-stone-300 mt-0.5">
                        {isCorrectionMode
                          ? "Safely revise official scores with an audit log trail. Predictions will be re-scored automatically."
                          : "Enter full-time final scores. All predictions will be scored across outcome, scoreline, and player goals."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettlingMatch(null)}
                      className="text-stone-400 hover:text-white cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div>
                      <label className="text-xs text-stone-200 font-medium">{settlingMatch.homeTeam} Goals</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={settleHomeGoals}
                        onChange={e => setSettleHomeGoals(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#122b1c] border border-[#295a3d] text-base font-bold text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-stone-200 font-medium">{settlingMatch.awayTeam} Goals</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={settleAwayGoals}
                        onChange={e => setSettleAwayGoals(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#122b1c] border border-[#295a3d] text-base font-bold text-white font-mono"
                      />
                    </div>
                  </div>

                  {isCorrectionMode && (
                    <div>
                      <label className="text-xs text-amber-300 font-medium block mb-1">
                        Reason for Correction (Recorded in Audit History)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VAR decision overturned 92nd min goal after post-match review"
                        value={correctionReason}
                        onChange={e => setCorrectionReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#122b1c] border border-amber-500/50 text-xs text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-stone-300 font-medium block mb-2">
                      Roster Player Goals Scored
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {(settlingMatch.players || []).map((p: MatchPlayer, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#122b1c] border border-[#295a3d] flex items-center justify-between">
                          <div className="truncate mr-2">
                            <span className="text-xs text-white font-medium block truncate">{p.name}</span>
                            <span className="text-[9px] text-stone-400 uppercase font-mono">{p.team}</span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={settlePlayerGoals[p.name] ?? 0}
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setSettlePlayerGoals(prev => ({ ...prev, [p.name]: val }));
                            }}
                            className="w-12 px-2 py-1 rounded bg-[#1a3e29] border border-[#295a3d] text-xs font-mono font-bold text-center text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleExecuteSettle}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={15} />
                      <span>{isCorrectionMode ? "Apply Correction & Re-evaluate Predictions" : "Execute Settlement & Compute Winners"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettlingMatch(null)}
                      className="px-4 py-2.5 rounded-xl bg-[#1a3e29] text-stone-300 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Match Fixtures List */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono text-stone-400 font-bold uppercase tracking-wider">
                  Configured Weekly Matches ({matches.length})
                </span>

                {matches.map((m: any) => {
                  const kickoffDate = new Date(m.kickoffAt);
                  const isPastKickoff = new Date() >= kickoffDate;
                  const isAuditExpanded = expandedAuditMatchId === m.id;

                  return (
                    <div key={m.id} className="p-5 rounded-2xl bg-[#122b1c] border border-[#295a3d] flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#295a3d] pb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            {m.homeTeam} vs {m.awayTeam}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            m.status === "settled" ? "bg-amber-400/20 text-amber-300" :
                            m.status === "void" ? "bg-stone-700 text-stone-300" :
                            "bg-emerald-400/20 text-emerald-300"
                          }`}>
                            {m.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleViewEntries(m.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
                              expandedEntriesMatchId === m.id
                                ? "bg-emerald-500 text-stone-950 font-bold"
                                : "bg-[#224e38] hover:bg-[#295a3d] text-stone-200"
                            }`}
                          >
                            <Users size={13} />
                            <span>Entries ({m.stats?.totalEntries || 0})</span>
                          </button>

                          {m.status === "scheduled" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditMatch(m)}
                                disabled={isPastKickoff}
                                className="px-3 py-1 rounded-lg bg-[#224e38] hover:bg-[#295a3d] disabled:opacity-40 text-stone-200 text-xs font-medium cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSettle(m, false)}
                                className="px-3 py-1 rounded-lg bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold cursor-pointer"
                              >
                                Settle Result
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVoidMatch(m.id)}
                                className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium cursor-pointer"
                              >
                                Void
                              </button>
                            </>
                          )}
                          {m.status === "settled" && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettle(m, true)}
                              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer flex items-center gap-1"
                            >
                              <History size={13} />
                              <span>Correct Result</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Kickoff</span>
                          <span className="text-white mt-0.5 block">{kickoffDate.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Total Entries</span>
                          <span className="text-white font-bold text-sm mt-0.5 block">{m.stats?.totalEntries || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Leg Hits</span>
                          <span className="text-stone-300 mt-0.5 block">
                            L1: {m.stats?.leg1CorrectCount || 0} • L2: {m.stats?.leg2CorrectCount || 0} • L3: {m.stats?.leg3CorrectCount || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Grand Prize Winners</span>
                          <span className="text-amber-400 font-bold text-sm mt-0.5 block">
                            {m.stats?.grandPrizeWinnersCount || 0} Winner(s)
                          </span>
                        </div>
                      </div>

                      {m.result && (
                        <div className="p-2.5 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between text-xs">
                          <span className="text-stone-200">
                            Result: <strong>{m.homeTeam} {m.result.homeGoals} - {m.result.awayGoals} {m.awayTeam}</strong>
                          </span>
                          {m.auditHistory && m.auditHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedAuditMatchId(isAuditExpanded ? null : m.id)}
                              className="text-amber-300 text-[11px] font-mono hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Audit History ({m.auditHistory.length})</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Expandable Audit Log History */}
                      {isAuditExpanded && m.auditHistory && (
                        <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/30 text-xs font-mono flex flex-col gap-2">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            🛡️ Official Result Correction Audit Trail:
                          </span>
                          {m.auditHistory.map((entry: MatchAuditEntry) => (
                            <div key={entry.id} className="p-2 rounded bg-[#122b1c] border border-[#295a3d] flex flex-col gap-1 text-[11px]">
                              <div className="flex items-center justify-between text-stone-400">
                                <span>{new Date(entry.changedAt).toLocaleString()}</span>
                                <span className="text-stone-300">By: {entry.adminEmail}</span>
                              </div>
                              <p className="text-white">
                                Revised to: <strong>{entry.newResult.homeGoals} - {entry.newResult.awayGoals}</strong>
                              </p>
                              <p className="text-stone-300 italic">
                                Reason: "{entry.reason}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Winners List with Full Name + Email, 6-character Claim Code, Confirm Dialog, and Collected Date */}
                      {m.winners && m.winners.length > 0 && (
                        <div className="pt-2 border-t border-[#295a3d] flex flex-col gap-2">
                          <span className="text-[11px] font-bold text-amber-300 font-mono">🏆 Grand Prize Winners ({m.winners.length}):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.winners.map((w: any) => (
                              <div key={w.uid} className="p-3 rounded-xl bg-[#1a3e29] border border-[#295a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <span className="text-white font-bold block truncate">{w.displayName}</span>
                                  {w.email && (
                                    <span className="text-stone-300 text-[11px] font-mono block truncate">{w.email}</span>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {w.claimCode && (
                                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-950 text-amber-300 font-bold border border-amber-500/30">
                                        Claim Code: {w.claimCode}
                                      </span>
                                    )}
                                    {w.prizeCollected && (w.collectedAt || w.prizeCollectedAt) && (
                                      <span className="text-[10px] font-mono text-emerald-400">
                                        Collected on {new Date(w.collectedAt || w.prizeCollectedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePrizeCollected(m.id, w.uid, w.prizeCollected, w.displayName, w.email)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer shrink-0 transition-all ${
                                    w.prizeCollected
                                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                                      : "bg-amber-400 hover:bg-amber-300 text-stone-950 font-black shadow-sm"
                                  }`}
                                >
                                  {w.prizeCollected ? "✓ Collected" : "Mark Prize Collected"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expandable Entries Table */}
                      {expandedEntriesMatchId === m.id && (
                        <div className="pt-3 border-t border-[#295a3d] flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1a3e29] p-3 rounded-xl border border-[#295a3d]">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-emerald-400" />
                              <span className="text-xs font-bold font-mono text-white">
                                Entries Table ({(() => {
                                  const list = entriesCache[m.id] || [];
                                  const search = (entriesSearch[m.id] || "").toLowerCase().trim();
                                  const filtered = search
                                    ? list.filter(e => (e.displayName || "").toLowerCase().includes(search) || (e.email || "").toLowerCase().includes(search))
                                    : list;
                                  return `${filtered.length} of ${list.length}`;
                                })()})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-2 text-stone-400" />
                                <input
                                  type="text"
                                  placeholder="Search name or email..."
                                  value={entriesSearch[m.id] || ""}
                                  onChange={e => setEntriesSearch(prev => ({ ...prev, [m.id]: e.target.value }))}
                                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#122b1c] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 w-48"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => downloadEntriesCsv(m, entriesCache[m.id] || [])}
                                disabled={!entriesCache[m.id] || entriesCache[m.id].length === 0}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-stone-950 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                              >
                                <Download size={13} />
                                <span>Download CSV</span>
                              </button>
                            </div>
                          </div>

                          {loadingEntries[m.id] ? (
                            <div className="p-6 text-center text-xs font-mono text-stone-400">
                              Loading entries for this fixture...
                            </div>
                          ) : !entriesCache[m.id] || entriesCache[m.id].length === 0 ? (
                            <div className="p-4 text-center text-xs font-mono text-stone-400 bg-[#1a3e29] rounded-xl border border-[#295a3d]">
                              No predictions submitted for this match yet.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-[#295a3d] bg-[#143320]">
                              <table className="w-full text-left text-xs font-mono border-collapse">
                                <thead>
                                  <tr className="bg-[#1a3e29] text-stone-300 border-b border-[#295a3d]">
                                    <th
                                      className="p-2.5 cursor-pointer hover:text-white"
                                      onClick={() => {
                                        setEntriesSortKey("displayName");
                                        setEntriesSortDir(prev => (prev === "asc" ? "desc" : "asc"));
                                      }}
                                    >
                                      Entrant {entriesSortKey === "displayName" ? (entriesSortDir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    <th
                                      className="p-2.5 cursor-pointer hover:text-white"
                                      onClick={() => {
                                        setEntriesSortKey("email");
                                        setEntriesSortDir(prev => (prev === "asc" ? "desc" : "asc"));
                                      }}
                                    >
                                      Email {entriesSortKey === "email" ? (entriesSortDir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="p-2.5">Outcome (L1)</th>
                                    <th className="p-2.5">Score (L2)</th>
                                    <th className="p-2.5">Player (L3)</th>
                                    {m.status === "settled" && (
                                      <>
                                        <th className="p-2.5">Legs Result</th>
                                        <th
                                          className="p-2.5 cursor-pointer hover:text-white"
                                          onClick={() => {
                                            setEntriesSortKey("legsCorrect");
                                            setEntriesSortDir(prev => (prev === "asc" ? "desc" : "asc"));
                                          }}
                                        >
                                          Score {entriesSortKey === "legsCorrect" ? (entriesSortDir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                        <th className="p-2.5">Grand Prize</th>
                                      </>
                                    )}
                                    <th
                                      className="p-2.5 cursor-pointer hover:text-white"
                                      onClick={() => {
                                        setEntriesSortKey("submittedAt");
                                        setEntriesSortDir(prev => (prev === "asc" ? "desc" : "asc"));
                                      }}
                                    >
                                      Submitted {entriesSortKey === "submittedAt" ? (entriesSortDir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const search = (entriesSearch[m.id] || "").toLowerCase().trim();
                                    let list = [...(entriesCache[m.id] || [])];
                                    if (search) {
                                      list = list.filter(e =>
                                        (e.displayName || "").toLowerCase().includes(search) ||
                                        (e.email || "").toLowerCase().includes(search)
                                      );
                                    }
                                    list.sort((a, b) => {
                                      let valA = a[entriesSortKey];
                                      let valB = b[entriesSortKey];
                                      if (entriesSortKey === "submittedAt") {
                                        valA = new Date(valA || 0).getTime();
                                        valB = new Date(valB || 0).getTime();
                                      }
                                      if (valA < valB) return entriesSortDir === "asc" ? -1 : 1;
                                      if (valA > valB) return entriesSortDir === "asc" ? 1 : -1;
                                      return 0;
                                    });

                                    return list.map((entry, idx) => {
                                      const isWinner = Boolean(entry.grandPrizeWinner);
                                      return (
                                        <tr
                                          key={entry.uid || idx}
                                          className={`border-b border-[#295a3d]/60 transition-colors ${
                                            isWinner
                                              ? "bg-amber-500/15 border-amber-500/50 text-white font-semibold"
                                              : idx % 2 === 0
                                              ? "bg-transparent text-stone-200"
                                              : "bg-[#122b1c]/40 text-stone-300"
                                          }`}
                                        >
                                          <td className="p-2.5">
                                            <span className="font-bold text-white block">{entry.displayName}</span>
                                            {isWinner && (
                                              <span className="text-[10px] text-amber-300 font-bold uppercase block">
                                                🏆 Winner • Ref: {entry.claimCode}
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2.5 text-stone-300">
                                            {entry.email || "—"}
                                          </td>
                                          <td className="p-2.5">
                                            <span className="px-2 py-0.5 rounded bg-[#1a3e29] border border-[#295a3d] text-[11px] font-bold">
                                              {entry.outcome}
                                            </span>
                                          </td>
                                          <td className="p-2.5">
                                            <span className="font-mono text-emerald-400 font-bold">
                                              {entry.scoreline}
                                            </span>
                                          </td>
                                          <td className="p-2.5">
                                            <span className="text-white block truncate max-w-[140px]">
                                              {entry.playerName} ({entry.playerGoals})
                                            </span>
                                          </td>
                                          {m.status === "settled" && (
                                            <>
                                              <td className="p-2.5">
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                  <span className={entry.leg1Correct ? "text-emerald-400 font-bold" : "text-stone-500"}>
                                                    L1:{entry.leg1Correct ? "✓" : "✗"}
                                                  </span>
                                                  <span>•</span>
                                                  <span className={entry.leg2Correct ? "text-emerald-400 font-bold" : "text-stone-500"}>
                                                    L2:{entry.leg2Correct ? "✓" : "✗"}
                                                  </span>
                                                  <span>•</span>
                                                  <span className={entry.leg3Correct ? "text-emerald-400 font-bold" : "text-stone-500"}>
                                                    L3:{entry.leg3Correct ? "✓" : "✗"}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="p-2.5">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                  isWinner ? "bg-amber-400 text-stone-950" : "bg-[#1a3e29] text-stone-300"
                                                }`}>
                                                  {entry.legsCorrect ?? 0}/3
                                                </span>
                                              </td>
                                              <td className="p-2.5">
                                                {isWinner ? (
                                                  <div className="flex flex-col gap-0.5">
                                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-black text-[10px] uppercase inline-block w-fit">
                                                      Grand Prize
                                                    </span>
                                                    {entry.prizeCollected ? (
                                                      <span className="text-[10px] text-emerald-400 font-mono">
                                                        Collected {entry.collectedAt ? new Date(entry.collectedAt).toLocaleDateString() : ""}
                                                      </span>
                                                    ) : (
                                                      <span className="text-[10px] text-amber-300 font-mono">
                                                        Unclaimed
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-stone-500">—</span>
                                                )}
                                              </td>
                                            </>
                                          )}
                                          <td className="p-2.5 text-[11px] text-stone-400">
                                            {entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : "—"}
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ====================================================== */}
          {/* VIEW 2: CUSTOMER PREDICTIONS BROWSER WITH FILTERS */}
          {/* ====================================================== */}
          {predictionView === 'customer_predictions' && (
            <div className="flex flex-col gap-4">
              
              {/* Filter Bar */}
              <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-wrap items-center gap-3 text-xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search customer name, email, or claim code..."
                    value={predSearchTerm}
                    onChange={e => setPredSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white text-xs placeholder:text-stone-500"
                  />
                </div>

                {/* Match Filter */}
                <div>
                  <select
                    value={predFilterMatch}
                    onChange={e => setPredFilterMatch(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white text-xs"
                  >
                    <option value="">All Matches</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{m.homeTeam} vs {m.awayTeam}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={predFilterStatus}
                    onChange={e => setPredFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-white text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="winner">Grand Prize Winners (3/3)</option>
                    <option value="unclaimed">Unclaimed Winners</option>
                    <option value="claimed">Claimed / Redeemed</option>
                    <option value="pending">Upcoming Matches</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={loadAllPredictions}
                  className="px-3 py-2 rounded-lg bg-[#2d824d] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Filter size={13} />
                  <span>Apply Filter</span>
                </button>
              </div>

              {/* Table of User Predictions */}
              <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] overflow-hidden">
                <div className="p-3.5 border-b border-[#295a3d] flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold">Customer Predictions List ({allPredictions.length})</span>
                  <span className="text-stone-400">Showing submitted picks across all fixtures</span>
                </div>

                {loadingPredictions ? (
                  <div className="p-8 text-center text-xs font-mono text-stone-300">
                    Loading predictions...
                  </div>
                ) : allPredictions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-[#1a3e29] text-stone-300 border-b border-[#295a3d]">
                          <th className="p-3">Customer</th>
                          <th className="p-3">Match</th>
                          <th className="p-3">L1 (Outcome)</th>
                          <th className="p-3">L2 (Score)</th>
                          <th className="p-3">L3 (Player Goals)</th>
                          <th className="p-3">Leg Hits</th>
                          <th className="p-3">Winner Status</th>
                          <th className="p-3">Claim Reference</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#295a3d]">
                        {allPredictions.map((pred, i) => {
                          const m = pred.match;
                          const isSettled = m?.status === "settled";

                          return (
                            <tr key={i} className="hover:bg-[#1a3e29]/50 transition-colors">
                              <td className="p-3 font-semibold text-white">
                                <div>{pred.displayName}</div>
                                <span className="text-[10px] text-stone-400 font-normal">
                                  {pred.registeredEmail || pred.uid}
                                </span>
                              </td>

                              <td className="p-3 text-stone-200">
                                <div>{m ? `${m.homeTeam} vs ${m.awayTeam}` : pred.matchId}</div>
                                <span className="text-[9px] text-stone-400">{m?.weekKey || "2026"}</span>
                              </td>

                              <td className="p-3">
                                <span className="font-bold text-white">{pred.outcome}</span>
                                {isSettled && (
                                  pred.leg1Correct ? <span className="text-emerald-400 ml-1">✓</span> : <span className="text-red-400 ml-1">✗</span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className="font-bold text-white">{pred.scoreline}</span>
                                {isSettled && (
                                  pred.leg2Correct ? <span className="text-emerald-400 ml-1">✓</span> : <span className="text-red-400 ml-1">✗</span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className="text-stone-200">{pred.playerName} ({pred.playerGoals})</span>
                                {isSettled && (
                                  pred.leg3Correct ? <span className="text-emerald-400 ml-1">✓</span> : <span className="text-red-400 ml-1">✗</span>
                                )}
                              </td>

                              <td className="p-3">
                                {isSettled ? (
                                  <span className="font-bold text-white">{pred.legsCorrect}/3</span>
                                ) : (
                                  <span className="text-stone-500">Pending</span>
                                )}
                              </td>

                              <td className="p-3">
                                {pred.grandPrizeWinner ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px]">
                                    👑 Winner
                                  </span>
                                ) : isSettled ? (
                                  <span className="text-stone-400 text-[10px]">No</span>
                                ) : (
                                  <span className="text-stone-500 text-[10px]">Awaited</span>
                                )}
                              </td>

                              <td className="p-3">
                                {pred.claimCode ? (
                                  <span className="text-amber-300 font-bold text-[11px] select-all">
                                    {pred.claimCode}
                                  </span>
                                ) : (
                                  <span className="text-stone-600">-</span>
                                )}
                              </td>

                              <td className="p-3">
                                {pred.grandPrizeWinner ? (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePrizeCollected(pred.matchId, pred.uid, pred.prizeCollected)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                      pred.prizeCollected
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                        : "bg-amber-400 text-stone-950 shadow-sm"
                                    }`}
                                  >
                                    {pred.prizeCollected ? "✓ Claimed" : "Redeem"}
                                  </button>
                                ) : (
                                  <span className="text-stone-500 text-[10px]">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-stone-400">
                    No customer predictions matching your search filters.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ====================================================== */}
          {/* VIEW 3: BARISTA / COUNTER VERIFICATION & REDEMPTION */}
          {/* ====================================================== */}
          {predictionView === 'verify_claim' && (
            <div className="bg-[#122b1c] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase font-black tracking-widest block mb-1">
                  BARISTA & COUNTER VERIFICATION DESK
                </span>
                <h3 className="text-xl font-bold font-serif-display text-white">
                  Verify Customer Winning Code & Redeem Prize
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  When a customer shows their Buna voucher reference on their phone, enter or scan it below to confirm eligibility and mark it as redeemed.
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleVerifyClaimCode} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <input
                  type="text"
                  required
                  placeholder="e.g. BUNA-WIN-MCIAS-U1ABE"
                  value={claimInput}
                  onChange={e => setClaimInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a3e29] border border-[#295a3d] text-sm text-white font-mono placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={verifyingClaim}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs font-mono transition-all shadow-md cursor-pointer disabled:opacity-60"
                >
                  {verifyingClaim ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              {claimError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {/* Verified Result Voucher Display */}
              {claimResult?.prediction && (
                <div className={`p-5 rounded-2xl border-2 flex flex-col gap-4 ${
                  claimResult.prediction.prizeCollected
                    ? "bg-[#102418] border-[#295a3d]"
                    : "bg-gradient-to-br from-[#1a3e29] to-[#122b1c] border-amber-400 shadow-xl"
                }`}>
                  <div className="flex items-center justify-between border-b border-[#295a3d] pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-amber-300 uppercase font-black block">
                        VERIFIED GRAND PRIZE RECORD ✓
                      </span>
                      <h4 className="text-lg font-bold text-white">
                        Customer: {claimResult.prediction.displayName}
                      </h4>
                    </div>

                    {claimResult.prediction.prizeCollected ? (
                      <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold">
                        Already Claimed on {new Date(claimResult.prediction.prizeCollectedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
                        Eligible for Immediate Claim
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                      <span className="text-stone-400 text-[10px] block">Match Fixture</span>
                      <span className="text-white font-bold mt-0.5 block">
                        {claimResult.match ? `${claimResult.match.homeTeam} vs ${claimResult.match.awayTeam}` : claimResult.prediction.matchId}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                      <span className="text-stone-400 text-[10px] block">Prize Reward</span>
                      <span className="text-amber-300 font-bold mt-0.5 block">
                        {claimResult.match?.prizeDescription || "Free Buna Coffee"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#122b1c] border border-[#295a3d]">
                      <span className="text-stone-400 text-[10px] block">Scoreline & Outcome</span>
                      <span className="text-emerald-400 font-bold mt-0.5 block">
                        {claimResult.prediction.outcome} • {claimResult.prediction.scoreline}
                      </span>
                    </div>
                  </div>

                  {/* Duplicate Prevention Guard Notice */}
                  {claimResult.prediction.prizeCollected ? (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-mono">
                      ⚠️ <strong>Duplicate Prevention Notice:</strong> This reward has already been issued on {new Date(claimResult.prediction.prizeCollectedAt).toLocaleString()} by staff ({claimResult.prediction.collectedBy || 'Barista'}). Do NOT issue a second prize for this reference code.
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-stone-300 font-mono">
                        Hand the prize to customer and click Confirm Redemption to prevent reuse.
                      </span>

                      <button
                        type="button"
                        disabled={redeemingClaim}
                        onClick={handleConfirmRedemption}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#42bd6c] hover:from-emerald-600 hover:to-emerald-600 text-stone-950 font-black text-xs font-mono transition-all shadow-lg cursor-pointer disabled:opacity-60"
                      >
                        {redeemingClaim ? "Recording..." : "✓ Confirm Prize Redeemed & Lock Code"}
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: REGISTERED USERS */}
      {/* ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Registered Customer Accounts ({users.length})
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {users.length > 0 ? (
              users.map((u: any, idx: number) => (
                <div key={u.id || idx} className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-white font-bold">{u.name || "Customer"}</span>
                    <p className="text-stone-400 font-mono text-[11px]">{u.email || u.phone || "ID: " + u.id}</p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-stone-300">Registered: <strong>{u.date || "Active"}</strong></span>
                    <span className="text-emerald-400 text-[11px]">Active Account</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] text-center text-xs text-stone-400">
                Customer profiles appear here as users register or sign in.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: BRAND & LOGO ASSETS (ADMIN ONLY)                */}
      {/* ======================================================== */}
      {activeSubTab === 'brand_assets' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold uppercase">
                  CONFIDENTIAL ADMIN ASSETS
                </span>
                <span className="text-xs font-mono text-stone-300">Brand Identity Suite</span>
              </div>
              <h3 className="text-xl font-bold font-serif-display text-white">
                Hattrick Coffee • Official Brand & Graphic Assets
              </h3>
              <p className="text-xs text-stone-300 mt-0.5 max-w-xl leading-relaxed">
                High-resolution logos, transparent PNG cutouts, 16:9 cinematic banners, and vector SVGs for merchandise, signage, and social media.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAssetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles size={15} />
              <span>Launch Asset Suite Modal</span>
            </button>
          </div>

          {/* Grid of Brand Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Card 1: 16:9 Hero Graphic Banner */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-cyan-500/30 mb-3 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/image_74f28168.png"
                    alt="Realistic Hero Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Realistic Hero Banner</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    1376×768 PNG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Cinematic night stadium artwork featuring the realistic human soccer player kicking the coffee-ball, DSTV + COFFEE headline, and Amharic script.
                </p>
              </div>

              <a
                href="/assets/aistudio/image_74f28168.png"
                download="hattrick-coffee-dstv-hero-banner.png"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={14} />
                <span>Download Banner PNG</span>
              </a>
            </div>

            {/* Card 2: Transparent Coffee-Ball Emblem */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-square max-h-48 rounded-xl overflow-hidden bg-black/40 border border-amber-500/30 mb-3 flex items-center justify-center p-3">
                  <img
                    src="/assets/aistudio/hattrick_emblem_cropped.png"
                    alt="Transparent Emblem"
                    className="max-h-full w-auto object-contain filter drop-shadow-md"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Transparent Emblem</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Transparent PNG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Sub-pixel anti-aliased cutout of the coffee bean soccer ball with gold beveled rim, ready for embroidery and dark/light placement.
                </p>
              </div>

              <a
                href="/assets/aistudio/hattrick_emblem_cropped.png"
                download="hattrick-coffee-emblem-transparent.png"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={14} />
                <span>Download Transparent PNG</span>
              </a>
            </div>

            {/* Card 3: Official Master Emblem JPG */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-square max-h-48 rounded-xl overflow-hidden bg-stone-100 border border-stone-300 mb-3 flex items-center justify-center p-3">
                  <img
                    src="/assets/aistudio/logo_714966a9.jpg"
                    alt="Master JPG Emblem"
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Master Emblem JPG</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    Original JPG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  The unedited master ball-and-coffee emblem asset with cream texture background and full-depth shading.
                </p>
              </div>

              <a
                href="/assets/aistudio/logo_714966a9.jpg"
                download="hattrick-coffee-emblem-original.jpg"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <Download size={14} />
                <span>Download Master JPG</span>
              </a>
            </div>

            {/* Card 4: Horizontal Logo Lockup */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#faf7f2] border border-stone-300 mb-3 flex items-center justify-center p-3">
                  <img
                    src="/assets/aistudio/image_6c7db08c.png"
                    alt="Horizontal Logo Lockup"
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Horizontal Lockup</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    Original PNG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Full corporate horizontal lockup with emblem, bold uppercase title, Amharic script, and Hawassa, Ethiopia location.
                </p>
              </div>

              <a
                href="/assets/aistudio/image_6c7db08c.png"
                download="hattrick-coffee-full-lockup.png"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <Download size={14} />
                <span>Download Full Lockup</span>
              </a>
            </div>

            {/* Card 5: Scalable Vector SVG (Light) */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#faf7f2] border border-stone-300 mb-3 flex items-center justify-center p-3">
                  <img
                    src="/hattrick-coffee-logo.svg"
                    alt="Light Vector SVG"
                    className="max-h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Scalable SVG (Light)</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Vector SVG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Infinite resolution math vector file for Adobe Illustrator, CorelDraw, Figma, billboard printing, and laser engraving.
                </p>
              </div>

              <a
                href="/hattrick-coffee-logo.svg"
                download="hattrick-coffee-logo.svg"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <Download size={14} />
                <span>Download Light SVG</span>
              </a>
            </div>

            {/* Card 6: Scalable Vector SVG (Dark) */}
            <div className="bg-[#122b1c] rounded-2xl border border-[#295a3d] p-4 flex flex-col justify-between">
              <div>
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#0c0a09] border border-amber-500/30 mb-3 flex items-center justify-center p-3">
                  <img
                    src="/hattrick-coffee-logo-dark.svg"
                    alt="Dark Vector SVG"
                    className="max-h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Scalable SVG (Dark)</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Vector SVG
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Dark mode vector with imperial gold gradients and cream typography optimized for dark screens and neon applications.
                </p>
              </div>

              <a
                href="/hattrick-coffee-logo-dark.svg"
                download="hattrick-coffee-logo-dark.svg"
                className="mt-4 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <Download size={14} />
                <span>Download Dark SVG</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Admin Logo Asset Suite Modal */}
      <HattrickLogoModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
      />

    </div>
  );
}
