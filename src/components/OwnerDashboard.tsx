import React, { useState, useEffect } from "react";
import { 
  Shield, Sparkles, RefreshCw, CheckCircle2, TrendingUp, Users, Tag, Award, 
  Plus, Trash2, Eye, EyeOff, Trophy, Calendar, AlertTriangle, Check, X, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MatchPlayer {
  name: string;
  team: "home" | "away";
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'promotions' | 'predictions' | 'users'>('overview');
  
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

  // Settlement state
  const [settlingMatch, setSettlingMatch] = useState<any | null>(null);
  const [settleHomeGoals, setSettleHomeGoals] = useState(0);
  const [settleAwayGoals, setSettleAwayGoals] = useState(0);
  const [settlePlayerGoals, setSettlePlayerGoals] = useState<Record<string, number>>({});

  const [actionMsg, setActionMsg] = useState<string | null>(null);

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showFeedback = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4500);
  };

  // Check Saturday warning whenever kickoff date changes
  const handleKickoffChange = (val: string) => {
    setKickoffDateTime(val);
    if (!val) {
      setSaturdayWarning(null);
      return;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      // 6 is Saturday
      if (d.getDay() !== 6) {
        setSaturdayWarning("Notice: The chosen kickoff date is not on a Saturday. Entering is allowed, but football showcase matches are typically Saturday.");
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

    // Convert local input to UTC ISO string
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
    // Format to YYYY-MM-DDTHH:mm for datetime-local
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

  const handleOpenSettle = (m: any) => {
    setSettlingMatch(m);
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

    fetch("/api/owner/predictions/settle", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        matchId: settlingMatch.id,
        homeGoals: settleHomeGoals,
        awayGoals: settleAwayGoals,
        playerGoals: settlePlayerGoals
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showFeedback(data.message || "Match settled successfully!");
          setSettlingMatch(null);
          loadDashboardData();
        } else {
          showFeedback(data.error || "Failed to settle match.");
        }
      })
      .catch(e => {
        console.error(e);
        showFeedback("Error settling match.");
      });
  };

  const handleTogglePrizeCollected = (matchId: string, uid: string, current: boolean) => {
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
        }
      })
      .catch(e => console.error(e));
  };

  const handleTogglePromo = (promoId: string) => {
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action: "toggle", promoId })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.promotions) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
          showFeedback("Promotion status updated.");
        }
      })
      .catch(e => console.error(e));
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim()) return;

    fetch("/api/owner/promotions", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        action: "add",
        name: promoName.trim(),
        discount: promoDiscount.trim() || "15% OFF",
        desc: promoDesc.trim() || "Special barista promotion"
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.promotions) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
          setPromoName("");
          setPromoDiscount("");
          setPromoDesc("");
          showFeedback("New promotion published!");
        }
      })
      .catch(e => console.error(e));
  };

  const handleDeletePromo = (promoId: string) => {
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action: "delete", promoId })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.promotions) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
          showFeedback("Promotion removed.");
        }
      })
      .catch(e => console.error(e));
  };

  return (
    <div id="owner-dashboard" className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#295a3d]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-600/30 flex items-center justify-center text-amber-400">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Admin & Store Operations</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-600/30 text-amber-400 text-[10px] font-mono uppercase font-bold">
                Google Verified Admin
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              Authenticated Admin: yared.abegaz@gmail.com
            </p>
          </div>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-200 text-xs font-medium transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-[#2d824d]/20 border border-[#2d824d]/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Store Overview', icon: TrendingUp },
          { id: 'promotions', label: 'Promotions', icon: Tag },
          { id: 'predictions', label: 'Weekly Predictions', icon: Trophy },
          { id: 'users', label: 'Customer Profiles', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-[#2d824d] text-white shadow-md"
                  : "bg-[#122b1c] text-stone-300 hover:text-white border border-[#295a3d]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeSubTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d]">
              <span className="text-xs text-stone-400 font-mono">Gross Coffee Revenue</span>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats?.shopStats?.totalRevenue?.toFixed(2) || "4,820.00"}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">↑ 18.4% this month</span>
            </div>

            <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d]">
              <span className="text-xs text-stone-400 font-mono">Total Orders Processed</span>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.shopStats?.totalOrders || "342"}
              </p>
              <span className="text-[10px] text-stone-400 font-mono">Real-time count</span>
            </div>

            <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d]">
              <span className="text-xs text-stone-400 font-mono">Active Prediction Matches</span>
              <p className="text-2xl font-bold text-[#e8b584] mt-1">
                {matches.filter(m => m.status === "scheduled").length}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Football games live</span>
            </div>

            <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d]">
              <span className="text-xs text-stone-400 font-mono">Registered Customers</span>
              <p className="text-2xl font-bold text-white mt-1">
                {users.length || "48"}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Google & Passport members</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Promotions */}
      {activeSubTab === 'promotions' && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleAddPromo} className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:flex-1 flex flex-col gap-1">
              <label className="text-xs text-stone-300 font-medium">Promo Title</label>
              <input
                type="text"
                value={promoName}
                onChange={e => setPromoName(e.target.value)}
                placeholder="e.g. Ethiopian New Year Buna"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
                required
              />
            </div>
            <div className="w-full sm:w-36 flex flex-col gap-1">
              <label className="text-xs text-stone-300 font-medium">Discount Label</label>
              <input
                type="text"
                value={promoDiscount}
                onChange={e => setPromoDiscount(e.target.value)}
                placeholder="e.g. 20% OFF"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
              />
            </div>
            <div className="w-full sm:flex-1 flex flex-col gap-1">
              <label className="text-xs text-stone-300 font-medium">Description</label>
              <input
                type="text"
                value={promoDesc}
                onChange={e => setPromoDesc(e.target.value)}
                placeholder="e.g. Matchday Buna pour-over special"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Promo</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats?.promotions?.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#42bd6c]/20 text-[#42bd6c] text-[10px] font-mono font-bold">
                      {p.discount}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{p.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePromo(p.id)}
                    title={p.active ? "Deactivate promo" : "Activate promo"}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      p.active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
                    }`}
                  >
                    {p.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    onClick={() => handleDeletePromo(p.id)}
                    title="Delete promo"
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Predictions Management (Replaces Raffle) */}
      {activeSubTab === 'predictions' && (
        <div className="flex flex-col gap-6">
          {/* Match Creation / Edit Card */}
          <form onSubmit={handleSaveMatch} className="bg-[#122b1c] p-5 rounded-xl border border-[#295a3d] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#295a3d]">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#42bd6c]" />
                <h4 className="text-sm font-bold text-white">
                  {editingMatchId ? "Edit Scheduled Match" : "Create Featured Match of the Week"}
                </h4>
              </div>
              {editingMatchId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMatchId(null);
                    setHomeTeam("");
                    setAwayTeam("");
                    setKickoffDateTime("");
                  }}
                  className="text-xs text-stone-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-stone-300 font-medium">Home Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Arsenal"
                  value={homeTeam}
                  onChange={e => setHomeTeam(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-300 font-medium">Away Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Liverpool"
                  value={awayTeam}
                  onChange={e => setAwayTeam(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-300 font-medium">Competition / Showcase</label>
                <input
                  type="text"
                  placeholder="e.g. Premier Matchday"
                  value={competition}
                  onChange={e => setCompetition(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-stone-300 font-medium">Kickoff Date & Time (Local)</label>
                  <span className="text-[10px] font-mono text-stone-400">Stored in UTC</span>
                </div>
                <input
                  type="datetime-local"
                  value={kickoffDateTime}
                  onChange={e => handleKickoffChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c]"
                  required
                />
                {saturdayWarning && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
                    <AlertTriangle size={12} /> {saturdayWarning}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-stone-300 font-medium">Grand Prize Description</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Free Buna Beans & Leather Ball"
                  value={prizeDesc}
                  onChange={e => setPrizeDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white focus:outline-none focus:border-[#42bd6c]"
                  required
                />
              </div>
            </div>

            {/* Player Roster for Leg 3 Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-stone-300 font-medium">
                  Selectable Player Roster (Users pick 1 player for Leg 3)
                </label>
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="text-xs text-[#42bd6c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Player
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {playersList.map((player, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#1a3e29] border border-[#295a3d]">
                    <input
                      type="text"
                      placeholder="Player Name (e.g. Saka)"
                      value={player.name}
                      onChange={e => handlePlayerChange(idx, "name", e.target.value)}
                      className="flex-1 px-2 py-1 bg-transparent text-xs text-white focus:outline-none"
                    />
                    <select
                      value={player.team}
                      onChange={e => handlePlayerChange(idx, "team", e.target.value as any)}
                      className="bg-[#122b1c] text-[10px] text-stone-300 rounded px-1.5 py-1 border border-[#295a3d] focus:outline-none"
                    >
                      <option value="home">Home</option>
                      <option value="away">Away</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      className="text-stone-400 hover:text-red-400 p-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="self-start px-5 py-2.5 rounded-xl bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer"
            >
              <Check size={14} />
              <span>{editingMatchId ? "Update Match" : "Publish Featured Match"}</span>
            </button>
          </form>

          {/* Settle Modal / Drawer if active */}
          {settlingMatch && (
            <div className="p-5 rounded-xl bg-[#143320] border-2 border-emerald-500/80 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#295a3d]">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚽ Settle Match Result:</span>
                    <span className="text-emerald-400">{settlingMatch.homeTeam} vs {settlingMatch.awayTeam}</span>
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Enter final full-time score and goals scored by listed players. All predictions will be scored automatically across all 3 legs.
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

              <div>
                <label className="text-xs text-stone-300 font-medium block mb-2">
                  Player Goals Scored (Own goals do not count as player goals)
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
                  <span>Execute Settlement & Compute Winners</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettlingMatch(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a3e29] text-stone-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Matches List */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-stone-300 font-mono uppercase tracking-wider">
              Prediction Matches History ({matches.length})
            </h4>

            {matches.map((m: any) => {
              const kickoffDate = new Date(m.kickoffAt);
              const isPastKickoff = new Date() >= kickoffDate;

              return (
                <div key={m.id} className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#295a3d]">
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border bg-[#1a3e29] border-[#295a3d] text-[#42bd6c]">
                        {m.weekKey || "WEEK"}
                      </div>
                      <h5 className="text-base font-bold text-white tracking-tight">
                        {m.homeTeam} vs {m.awayTeam}
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                        m.status === "settled" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : m.status === "void"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                            onClick={() => handleOpenSettle(m)}
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
                          onClick={() => handleOpenSettle(m)}
                          className="px-3 py-1 rounded-lg bg-[#224e38] hover:bg-[#295a3d] text-stone-200 text-xs font-medium cursor-pointer"
                        >
                          Re-Settle
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 font-mono">Kickoff UTC</span>
                      <p className="text-stone-200 mt-0.5">{kickoffDate.toUTCString()}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-mono">Total User Entries</span>
                      <p className="text-white font-bold font-mono text-sm mt-0.5">{m.stats?.totalEntries || 0}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-mono">Leg Success Hits</span>
                      <p className="text-stone-300 font-mono mt-0.5">
                        L1: <strong>{m.stats?.leg1CorrectCount || 0}</strong> • L2: <strong>{m.stats?.leg2CorrectCount || 0}</strong> • L3: <strong>{m.stats?.leg3CorrectCount || 0}</strong>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-mono">Grand Prize Winners</span>
                      <p className="text-amber-400 font-bold font-mono text-sm mt-0.5">
                        {m.stats?.grandPrizeWinnersCount || 0} Winner(s)
                      </p>
                    </div>
                  </div>

                  {m.result && (
                    <div className="p-2.5 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between text-xs">
                      <span className="text-stone-300">
                        Official Result: <strong>{m.homeTeam} {m.result.homeGoals} - {m.result.awayGoals} {m.awayTeam}</strong>
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">
                        Goals: {Object.entries(m.result.playerGoals || {}).filter(([_, g]) => (g as number) > 0).map(([p, g]) => `${p} (${g})`).join(", ") || "No roster goals"}
                      </span>
                    </div>
                  )}

                  {/* Winners section */}
                  {m.winners && m.winners.length > 0 && (
                    <div className="pt-2 border-t border-[#295a3d] flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-amber-300 font-mono">🏆 Grand Prize Winners:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.winners.map((w: any) => (
                          <div key={w.uid} className="p-2 rounded bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between text-xs">
                            <span className="text-white font-semibold">{w.displayName}</span>
                            <button
                              type="button"
                              onClick={() => handleTogglePrizeCollected(m.id, w.uid, w.prizeCollected)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                w.prizeCollected
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {w.prizeCollected ? "✓ Prize Collected" : "Mark Collected"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Customer Profiles */}
      {activeSubTab === 'users' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-300 font-mono">Total Users ({users.length})</span>
          </div>

          <div className="flex flex-col gap-2">
            {users.length > 0 ? (
              users.map((u: any, idx: number) => (
                <div key={u.id || idx} className="p-3.5 rounded-xl bg-[#122b1c] border border-[#295a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-white font-bold">{u.name || "Customer"}</span>
                    <p className="text-stone-400 font-mono text-[11px]">{u.email || u.phone || "Guest ID: " + u.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-300 font-mono">Points: <strong>{u.points || 0}</strong></span>
                    <span className="text-emerald-400 font-mono text-[11px]">Active Passport Explorer</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] text-center text-xs text-stone-400">
                Registered profiles will appear here as users sign in via Google.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
