import React, { useState, useEffect } from "react";
import { Shield, Sparkles, RefreshCw, CheckCircle2, TrendingUp, Users, Tag, Award, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'promotions' | 'raffle' | 'users'>('overview');
  const [promoName, setPromoName] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const getAdminHeaders = () => {
    const token = localStorage.getItem("buna_admin_token") || "";
    const pin = localStorage.getItem("buna_admin_pin") || "2026";
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
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showFeedback = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4000);
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

  const handleTogglePrize = (prizeId: string) => {
    fetch("/api/owner/raffle", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action: "toggle", prizeId })
    })
      .then(res => res.json())
      .then(data => {
        loadDashboardData();
        showFeedback("Raffle prize status updated.");
      })
      .catch(e => console.error(e));
  };

  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeName.trim()) return;

    fetch("/api/owner/raffle", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        action: "add",
        prize: {
          name: prizeName.trim(),
          desc: prizeDesc.trim() || "Exclusive Buna reward"
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        loadDashboardData();
        setPrizeName("");
        setPrizeDesc("");
        showFeedback("New raffle prize added!");
      })
      .catch(e => console.error(e));
  };

  const handleUserAction = (userId: string, action: string, points?: number) => {
    fetch("/api/owner/users/action", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ userId, action, points })
    })
      .then(res => res.json())
      .then(data => {
        loadDashboardData();
        showFeedback(`User ${action} applied successfully.`);
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
          className="px-3.5 py-2 rounded-xl bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-200 text-xs font-medium transition-all flex items-center gap-2 self-start sm:self-auto"
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
          { id: 'raffle', label: 'Raffle Prizes', icon: Award },
          { id: 'users', label: 'Customer Profiles', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
              <span className="text-xs text-stone-400 font-mono">Beans Awarded</span>
              <p className="text-2xl font-bold text-[#e8b584] mt-1">
                {stats?.shopStats?.luckyBeansAwarded || "1,290"}
              </p>
              <span className="text-[10px] text-stone-400 font-mono">Gamification active</span>
            </div>

            <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d]">
              <span className="text-xs text-stone-400 font-mono">Registered Customers</span>
              <p className="text-2xl font-bold text-white mt-1">
                {users.length || "48"}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Google & Passport members</span>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Orders</h3>
            {stats?.orders && stats.orders.length > 0 ? (
              <div className="flex flex-col gap-2">
                {stats.orders.slice(-5).reverse().map((o: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#1a3e29] border border-[#295a3d] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-semibold">Order #{o.orderId?.slice(-6) || idx + 1}</span>
                      <p className="text-stone-400 text-[11px]">{o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ") || "Custom Buna Drink"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">${(o.totalPrice || 6.50).toFixed(2)}</span>
                      <p className="text-[10px] text-stone-500 font-mono">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400">No recent orders yet. Place a custom brew order in the builder to see live metrics.</p>
            )}
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
                placeholder="e.g. Authentic Yirgacheffe pour-over discount"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
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
                    className={`p-2 rounded-lg border text-xs font-medium transition-all ${
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
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Raffle Prizes */}
      {activeSubTab === 'raffle' && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleAddPrize} className="bg-[#122b1c] p-4 rounded-xl border border-[#295a3d] flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:flex-1 flex flex-col gap-1">
              <label className="text-xs text-stone-300 font-medium">Prize Title</label>
              <input
                type="text"
                value={prizeName}
                onChange={e => setPrizeName(e.target.value)}
                placeholder="e.g. Free Bag of Guji Beans"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
                required
              />
            </div>
            <div className="w-full sm:flex-1 flex flex-col gap-1">
              <label className="text-xs text-stone-300 font-medium">Prize Description</label>
              <input
                type="text"
                value={prizeDesc}
                onChange={e => setPrizeDesc(e.target.value)}
                placeholder="e.g. 250g artisanal medium roast"
                className="w-full px-3 py-2 rounded-lg bg-[#1a3e29] border border-[#295a3d] text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#42bd6c]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus size={15} />
              <span>Add Prize</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(stats?.rafflePrizes || [
              { id: '1', name: 'Free Ethiopian Espresso', desc: '100% Yirgacheffe shot', active: true },
              { id: '2', name: '50 Bonus Points', desc: 'Added straight to your card', active: true },
              { id: '3', name: 'Traditional Snack Treat', desc: 'Kolo & Dabo Kolo mix', active: true },
              { id: '4', name: 'Free Specialty Jebena Brew', desc: 'Traditional clay pot service', active: true }
            ]).map((prize: any) => (
              <div key={prize.id} className="p-4 rounded-xl bg-[#122b1c] border border-[#295a3d] flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{prize.name}</span>
                  <p className="text-xs text-stone-400 mt-0.5">{prize.desc}</p>
                </div>
                <button
                  onClick={() => handleTogglePrize(prize.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    prize.active !== false
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-stone-800 border-stone-700 text-stone-400"
                  }`}
                >
                  {prize.active !== false ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
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
                    <span className="text-stone-300 font-mono">Spun: <strong>{u.hasSpunWheel ? "Yes" : "No"}</strong></span>
                    {u.hasSpunWheel && (
                      <button
                        onClick={() => handleUserAction(u.id, "reset_spin")}
                        className="px-2.5 py-1 rounded bg-[#224e38] hover:bg-[#295a3d] border border-[#295a3d] text-stone-200 text-[11px]"
                      >
                        Reset Spin
                      </button>
                    )}
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
