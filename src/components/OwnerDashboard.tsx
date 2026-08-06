import React, { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, RefreshCw, Layers, Sliders, ToggleLeft, ToggleRight, Trash2, Edit2, Plus, Check, AlertTriangle, Calendar, ShoppingBag, Coins, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MenuItem, CoffeeEvent } from "../types";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'promotions' | 'raffle'>('analytics');
  const [stats, setStats] = useState<any | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [events, setEvents] = useState<CoffeeEvent[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding menu item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "coffee",
    price: 150.00,
    calories: 120,
    caffeine: 90,
    ingredients: "",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60"
  });

  // Form states for adding promotion
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState({
    name: "",
    discount: 10,
    desc: "",
    image: ""
  });

  // Raffle prizes state
  const [rafflePrizes, setRafflePrizes] = useState<any[]>([]);
  const [showRafflePrizeForm, setShowRafflePrizeForm] = useState(false);
  const [newRafflePrize, setNewRafflePrize] = useState({ name: "", desc: "" });

  // State variables for editing existing promotions and raffle prizes
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [editingRafflePrize, setEditingRafflePrize] = useState<any | null>(null);

  const getAdminHeaders = () => {
    const token = localStorage.getItem("buna_admin_token") || "";
    const pin = localStorage.getItem("buna_admin_pin") || "2026";
    return {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
      "X-Admin-PIN": pin
    };
  };

  const loadOwnerData = () => {
    setLoading(true);
    // Fetch stats
    const fetchStats = fetch("/api/owner/stats", { headers: getAdminHeaders() })
      .then(res => res.json())
      .then(data => {
        setStats(data);
      })
      .catch(e => console.error("Error fetching owner stats:", e));

    // Fetch menu
    const fetchMenu = fetch("/api/menu")
      .then(res => res.json())
      .then(data => {
        setMenuItems(data);
      })
      .catch(e => console.error("Error fetching menu:", e));

    // Fetch raffle registered users
    const fetchUsers = fetch("/api/owner/users", { headers: getAdminHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegisteredUsers(data.registeredUsers || []);
        }
      })
      .catch(e => console.error("Error fetching registered users:", e));

    // Fetch events
    const fetchEvents = fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data);
      })
      .catch(e => console.error("Error fetching events:", e));

    // Fetch live raffle prizes
    const fetchRafflePrizes = fetch("/api/raffle/prizes")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRafflePrizes(data);
        }
      })
      .catch(e => console.error("Error fetching raffle prizes:", e));

    Promise.allSettled([fetchStats, fetchMenu, fetchUsers, fetchEvents, fetchRafflePrizes])
      .then(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleToggleSoldOut = (item: MenuItem) => {
    fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-status", item })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMenuItems(data.menuItems);
        }
      })
      .catch(e => console.error(e));
  };

  const handleDeleteItem = (item: MenuItem) => {
    fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", item })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMenuItems(data.menuItems);
        }
      })
      .catch(e => console.error(e));
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newItem,
      ingredients: newItem.ingredients.split(",").map(i => i.trim()).filter(Boolean)
    };

    fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", item: payload })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMenuItems(data.menuItems);
          setShowAddForm(false);
          setNewItem({
            name: "",
            description: "",
            category: "coffee",
            price: 4.50,
            calories: 120,
            caffeine: 90,
            ingredients: "",
            image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60"
          });
        }
      })
      .catch(e => console.error(e));
  };

  const handleTogglePromo = (promoId: string) => {
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", promoId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
        }
      })
      .catch(e => console.error(e));
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", ...newPromo })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
          setShowPromoForm(false);
          setNewPromo({ name: "", discount: 10, desc: "" });
        }
      })
      .catch(e => console.error(e));
  };

  const handleDeletePromo = (promoId: string) => {
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", promoId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
        }
      })
      .catch(e => console.error(e));
  };

  const handleRaffleAction = (action: 'reset-spin' | 'delete', userId: string) => {
    fetch("/api/owner/users/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegisteredUsers(data.registeredUsers);
          if (data.loyalty) {
            setStats((prev: any) => ({ ...prev, loyalty: data.loyalty }));
          }
        }
      })
      .catch(e => console.error(e));
  };

  const handleAddRafflePrize = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/owner/raffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", name: newRafflePrize.name, desc: newRafflePrize.desc })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRafflePrizes(data.prizes);
          setNewRafflePrize({ name: "", desc: "" });
          setShowRafflePrizeForm(false);
        }
      })
      .catch(e => console.error(e));
  };

  const handleDeleteRafflePrize = (prizeId: string) => {
    fetch("/api/owner/raffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", prizeId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRafflePrizes(data.prizes);
        }
      })
      .catch(e => console.error(e));
  };

  const handleEditPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    fetch("/api/owner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        promoId: editingPromo.id,
        name: editingPromo.name,
        discount: editingPromo.discount,
        desc: editingPromo.desc,
        image: editingPromo.image
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats((prev: any) => ({ ...prev, promotions: data.promotions }));
          setEditingPromo(null);
        }
      })
      .catch(e => console.error(e));
  };

  const handleToggleRafflePrize = (prizeId: string) => {
    fetch("/api/owner/raffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", prizeId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRafflePrizes(data.prizes);
        }
      })
      .catch(e => console.error(e));
  };

  const handleEditRafflePrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRafflePrize) return;
    fetch("/api/owner/raffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        prizeId: editingRafflePrize.id,
        prize: {
          name: editingRafflePrize.name,
          desc: editingRafflePrize.desc
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRafflePrizes(data.prizes);
          setEditingRafflePrize(null);
        }
      })
      .catch(e => console.error(e));
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#c89d7c]"></div>
      </div>
    );
  }

  // Realistic sample hourly sales data for graph
  const hourlySalesData = [
    { time: "7 AM", sales: 120 },
    { time: "8 AM", sales: 240 },
    { time: "9 AM", sales: 310 }, // peak
    { time: "10 AM", sales: 220 },
    { time: "11 AM", sales: 140 },
    { time: "12 PM", sales: 180 },
    { time: "1 PM", sales: 150 },
    { time: "2 PM", sales: 190 },
    { time: "3 PM", sales: 230 }, // afternoon rush
    { time: "4 PM", sales: 110 },
    { time: "5 PM", sales: 80 }
  ];

  return (
    <div id="owner-dashboard" className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
      
      {/* Top Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#241c19] pb-5">
        <div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-900/30 font-bold">
            🔒 ADMINISTRATIVE BACKOFFICE
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight mt-1.5 font-display">Owner Analytics Hub & Control Panel</h3>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadOwnerData}
          className="flex items-center gap-1.5 text-xs font-mono text-stone-400 hover:text-white bg-[#120f0e] px-3.5 py-2 rounded-xl border border-[#221a17]"
        >
          <RefreshCw size={12} /> Sync Dashboard
        </button>
      </div>

      {/* Control Tabs Row */}
      <div className="flex flex-wrap md:flex-nowrap gap-2 border-b border-[#221a17] pb-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? "bg-[#c89d7c] text-black font-extrabold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          📊 Analytics Hub
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
            activeTab === 'menu'
              ? "bg-[#c89d7c] text-black font-extrabold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          🍽 Menu Management ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
            activeTab === 'promotions'
              ? "bg-[#c89d7c] text-black font-extrabold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          🎫 Promotions & Events
        </button>
        <button
          onClick={() => setActiveTab('raffle')}
          className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
            activeTab === 'raffle'
              ? "bg-[#c89d7c] text-black font-extrabold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          🎰 Raffle Spins ({registeredUsers.length})
        </button>
      </div>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: ANALYTICS HUB */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Quick counters grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-[#120f0e] p-4 rounded-xl border border-[#231b18]">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Today's Revenue</span>
                  <Coins size={16} className="text-[#c89d7c]" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{stats.shopStats.revenue.toFixed(2)} Birr</p>
                <p className="text-[9px] text-[#82ca9d] font-mono mt-1">↑ +14.2% from yesterday</p>
              </div>

              <div className="bg-[#120f0e] p-4 rounded-xl border border-[#231b18]">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Total Orders</span>
                  <ShoppingBag size={16} className="text-[#c89d7c]" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{stats.shopStats.orders}</p>
                <p className="text-[9px] text-[#82ca9d] font-mono mt-1">↑ +8 orders this hour</p>
              </div>

              <div className="bg-[#120f0e] p-4 rounded-xl border border-[#231b18]">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Customer Loyalty</span>
                  <Users size={16} className="text-[#c89d7c]" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{stats.shopStats.returningRate}%</p>
                <p className="text-[9px] text-stone-500 font-mono mt-1">Active Morning Streaks: 45</p>
              </div>

              <div className="bg-[#120f0e] p-4 rounded-xl border border-[#231b18]">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Avg Ticket Size</span>
                  <Coins size={16} className="text-[#c89d7c]" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{stats.shopStats.averageTicket.toFixed(2)} Birr</p>
                <p className="text-[9px] text-stone-500 font-mono mt-1">Goal target: 450.00 Birr</p>
              </div>

            </div>

            {/* Graphs row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Hourly Traffic Chart */}
              <div className="lg:col-span-8 bg-[#120f0e] rounded-xl p-5 border border-[#231b18] min-h-[280px]">
                <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <TrendingUp size={12} /> Hourly Peak Transactions
                </h4>
                <div className="w-full h-52 text-stone-400 text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlySalesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c89d7c" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#c89d7c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#221a17" />
                      <XAxis dataKey="time" stroke="#52433d" />
                      <YAxis stroke="#52433d" />
                      <Tooltip contentStyle={{ backgroundColor: "#120f0e", borderColor: "#2c221e" }} />
                      <Area type="monotone" dataKey="sales" stroke="#c89d7c" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory Stock Alerts */}
              <div className="lg:col-span-4 bg-[#120f0e] rounded-xl p-5 border border-[#231b18] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-4">
                    📦 Inventory Levels
                  </h4>
                  <div className="flex flex-col gap-3">
                    {stats.shopStats.beanInventory?.map((item: any, idx: number) => {
                      const ratio = item.current / item.max;
                      const isLow = ratio < 0.3;
                      return (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-stone-300 font-bold">{item.name}</span>
                            <span className={`font-mono font-bold ${isLow ? "text-red-400" : "text-stone-400"}`}>
                              {item.current} / {item.max} {item.unit}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isLow ? "bg-red-500 animate-pulse" : "bg-[#c89d7c]"}`}
                              style={{ width: `${(item.current / item.max) * 100}%` }}
                            ></div>
                          </div>
                          {isLow && (
                            <div className="flex items-center gap-1 text-[9px] text-red-400 font-mono mt-1 uppercase">
                              <AlertTriangle size={8} /> Auto-Predictive Shortage Alert
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Activity Logs Feed */}
            <div className="bg-[#120f0e] rounded-xl p-5 border border-[#231b18]">
              <h4 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-3">
                🔔 Live Customer Engagement Stream
              </h4>
              <div className="flex flex-col gap-2">
                {stats.shopStats.activityLog?.slice(0, 5).map((log: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#161211] rounded border border-[#221c19] text-xs text-stone-300">
                    <span className="font-mono">{log.text}</span>
                    <span className="text-[10px] font-mono text-stone-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 2: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-stone-500">Edit prices, toggle sold-out status, or add items.</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c89d7c] hover:bg-[#b08766] text-[#120f0e] text-xs font-bold transition-all"
              >
                {showAddForm ? "Close Form" : "Add Menu Item"}
              </button>
            </div>

            {/* Add menu item form overlay */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  onSubmit={handleAddMenuItem}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#120f0e] p-5 rounded-xl border border-[#c89d7c]/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Traditional Spiced Cappuccino"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200"
                    >
                      <option value="coffee">Single Origin Coffee</option>
                      <option value="traditional">Traditional Ritual</option>
                      <option value="pastry">Pastry / Nibbles</option>
                      <option value="merchandise">Merchandise / Ware</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-stone-400">Description</label>
                    <textarea
                      required
                      placeholder="Explain notes, processing methods, and farmer connections..."
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200 h-16 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-stone-400">Price (ETB)</label>
                      <input
                        type="number"
                        step="0.05"
                        required
                        value={newItem.price}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-stone-400">Est. Calories</label>
                      <input
                        type="number"
                        value={newItem.calories}
                        onChange={(e) => setNewItem(prev => ({ ...prev, calories: Number(e.target.value) }))}
                        className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-stone-400">Est. Caffeine (mg)</label>
                      <input
                        type="number"
                        value={newItem.caffeine}
                        onChange={(e) => setNewItem(prev => ({ ...prev, caffeine: Number(e.target.value) }))}
                        className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-stone-400">Ingredients (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardamom, Steamed Milk, Honey"
                      value={newItem.ingredients}
                      onChange={(e) => setNewItem(prev => ({ ...prev, ingredients: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-stone-200"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#c89d7c] text-black font-bold py-2.5 rounded text-xs hover:bg-[#b08766] transition-all"
                    >
                      ✓ Publish Item to Live Customer Menu
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Menu Items Table */}
            <div className="overflow-x-auto bg-[#120f0e] rounded-xl border border-[#231b18]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#241c19] text-stone-500 font-mono uppercase bg-black/10">
                    <th className="p-3.5">Item Details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Caffeine</th>
                    <th className="p-3.5">Live Stock Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1614]">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-950/20 transition-all">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={item.image} className="h-10 w-10 object-cover rounded" alt="" />
                        <div>
                          <p className="font-bold text-white leading-snug">{item.name}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5 truncate max-w-sm">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono capitalize text-stone-400">{item.category}</td>
                      <td className="p-3.5 font-mono font-bold text-white">{item.price.toFixed(2)} Birr</td>
                      <td className="p-3.5 font-mono text-stone-400">{item.caffeine} mg</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleSoldOut(item)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                            item.soldOut
                              ? "bg-red-950/40 text-red-400 border border-red-900/30"
                              : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                          }`}
                        >
                          {item.soldOut ? "🔴 Sold Out" : "🟢 In Stock"}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleSoldOut(item)}
                            className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-all"
                            title="Toggle Out of stock"
                          >
                            <Sliders size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-400 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

        {/* TAB 3: PROMOTIONS & EVENTS */}
        {activeTab === 'promotions' && (
          <motion.div
            key="promotions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs"
          >
            {/* Promotions Column */}
            <div className="lg:col-span-7 bg-[#120f0e] rounded-xl p-5 border border-[#231b18]">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider">Smart Promotions</h4>
                <button
                  onClick={() => setShowPromoForm(!showPromoForm)}
                  className="flex items-center gap-1 bg-[#1c1412] text-[#c89d7c] border border-[#c89d7c]/20 px-2.5 py-1 rounded-lg hover:bg-[#251e1b] font-bold"
                >
                  {showPromoForm ? "Close Form" : "+ Add Promotion"}
                </button>
              </div>

              {/* Add promotion form overlay */}
              {showPromoForm && (
                <form onSubmit={handleAddPromo} className="bg-[#181412] p-4 rounded-xl border border-stone-800 mb-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Promotion Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rainy Day Cappuccino Special"
                      value={newPromo.name}
                      onChange={(e) => setNewPromo(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Discount Percentage (%)</label>
                    <input
                      type="number"
                      required
                      value={newPromo.discount}
                      onChange={(e) => setNewPromo(prev => ({ ...prev, discount: Number(e.target.value) }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Description Rule</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15% off any drink if raining outside"
                      value={newPromo.desc}
                      onChange={(e) => setNewPromo(prev => ({ ...prev, desc: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Promotion Image / Banner URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={newPromo.image}
                      onChange={(e) => setNewPromo(prev => ({ ...prev, image: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#c89d7c] text-black font-bold py-2 rounded text-xs transition-all hover:bg-[#b08766]">
                    ✓ Publish Promotion Live
                  </button>
                </form>
              )}

              {/* Edit promotion form overlay */}
              {editingPromo && (
                <form onSubmit={handleEditPromo} className="bg-[#1a1411] p-4 rounded-xl border border-[#c89d7c]/30 mb-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#2c221e]">
                    <span className="font-bold text-[#c89d7c]">✏️ Edit Promotion: {editingPromo.name}</span>
                    <button
                      type="button"
                      onClick={() => setEditingPromo(null)}
                      className="text-stone-500 hover:text-stone-300 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Promotion Name</label>
                    <input
                      type="text"
                      required
                      value={editingPromo.name}
                      onChange={(e) => setEditingPromo((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Discount Percentage (%)</label>
                    <input
                      type="number"
                      required
                      value={editingPromo.discount}
                      onChange={(e) => setEditingPromo((prev: any) => ({ ...prev, discount: Number(e.target.value) }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Description Rule</label>
                    <input
                      type="text"
                      required
                      value={editingPromo.desc}
                      onChange={(e) => setEditingPromo((prev: any) => ({ ...prev, desc: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Promotion Image / Banner URL (Optional)</label>
                    <input
                      type="text"
                      value={editingPromo.image || ""}
                      onChange={(e) => setEditingPromo((prev: any) => ({ ...prev, image: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-2 text-stone-200"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#c89d7c] text-black font-bold py-2 rounded text-xs transition-all hover:bg-[#b08766]">
                    ✓ Save Promotion Changes
                  </button>
                </form>
              )}

              {/* Promotions List */}
              <div className="flex flex-col gap-3">
                {stats.promotions?.map((p: any) => (
                  <div key={p.id} className="p-3.5 bg-[#181412] rounded-xl border border-[#231b18] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <img 
                          src={p.image} 
                          className="h-10 w-12 object-cover rounded bg-stone-900 border border-stone-800" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{p.name}</span>
                          <span className="font-mono bg-amber-950/40 text-amber-400 border border-amber-900/30 px-1.5 py-0.2 rounded font-bold">{p.discount}% OFF</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">{p.desc}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePromo(p.id)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 rounded text-stone-400 hover:text-[#c89d7c]"
                        title="Toggle Active"
                      >
                        {p.active ? "🟢 Active" : "⚫ Inactive"}
                      </button>
                      <button
                        onClick={() => setEditingPromo(p)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 rounded text-stone-400 hover:text-[#c89d7c]"
                        title="Edit Promo"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeletePromo(p.id)}
                        className="p-1.5 bg-stone-900 hover:bg-red-950 rounded text-stone-600 hover:text-red-400"
                        title="Delete Promo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events Bookings Column */}
            <div className="lg:col-span-5 bg-[#120f0e] rounded-xl p-5 border border-[#231b18]">
              <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar size={13} /> Active Masterclass Bookings
              </h4>
              <div className="flex flex-col gap-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#181412] rounded-lg border border-[#251e1b]">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-stone-200 truncate max-w-[150px]">{ev.title}</span>
                      <span className="font-mono text-[10px] text-stone-400">{ev.date}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#231d1a]">
                      <span className="text-stone-500">Filled Seats:</span>
                      <span className="font-mono font-bold text-white">
                        {ev.maxSeats - ev.seats} / {ev.maxSeats} Filled
                      </span>
                    </div>
                    <div className="w-full h-1 bg-stone-800 rounded mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#c89d7c]"
                        style={{ width: `${((ev.maxSeats - ev.seats) / ev.maxSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 4: RAFFLE REGISTRATIONS & PRIZES */}
        {activeTab === 'raffle' && (
          <motion.div
            key="raffle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs"
          >
            {/* Column 1: Manage Raffle Prizes (5 cols) */}
            <div className="lg:col-span-5 bg-[#120f0e] rounded-xl p-5 border border-[#231b18] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider font-bold">🎯 Raffle Wheel Prizes</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Customize options shown on the client spin wheel.</p>
                </div>
                <button
                  onClick={() => setShowRafflePrizeForm(!showRafflePrizeForm)}
                  className="flex items-center gap-1 bg-[#1c1412] text-[#c89d7c] border border-[#c89d7c]/20 px-2 py-1 rounded hover:bg-[#251e1b] font-bold text-[10px]"
                >
                  {showRafflePrizeForm ? "Close" : "+ Add"}
                </button>
              </div>

              {showRafflePrizeForm && (
                <form onSubmit={handleAddRafflePrize} className="bg-[#181412] p-3.5 rounded-xl border border-stone-800 flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Prize Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Free Jebena Cappuccino"
                      value={newRafflePrize.name}
                      onChange={(e) => setNewRafflePrize(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Rarity / Subtitle (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ultra Rare Cup"
                      value={newRafflePrize.desc}
                      onChange={(e) => setNewRafflePrize(prev => ({ ...prev, desc: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#c89d7c] text-black font-bold py-1.5 rounded transition-all hover:bg-[#b08766] text-[11px]">
                    ✓ Save Prize
                  </button>
                </form>
              )}

              {/* Edit Raffle Prize form overlay */}
              {editingRafflePrize && (
                <form onSubmit={handleEditRafflePrize} className="bg-[#1a1411] p-3.5 rounded-xl border border-[#c89d7c]/30 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center pb-1.5 border-b border-[#2c221e]">
                    <span className="font-bold text-[#c89d7c]">✏️ Edit Prize</span>
                    <button
                      type="button"
                      onClick={() => setEditingRafflePrize(null)}
                      className="text-stone-500 hover:text-stone-300 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Prize Title</label>
                    <input
                      type="text"
                      required
                      value={editingRafflePrize.name}
                      onChange={(e) => setEditingRafflePrize((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-400">Rarity / Subtitle</label>
                    <input
                      type="text"
                      value={editingRafflePrize.desc || ""}
                      onChange={(e) => setEditingRafflePrize((prev: any) => ({ ...prev, desc: e.target.value }))}
                      className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#c89d7c] text-black font-bold py-1.5 rounded transition-all hover:bg-[#b08766] text-[11px]">
                    ✓ Save Prize Changes
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-2.5">
                {rafflePrizes.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 bg-[#181412] rounded-xl border border-[#231b18] flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm block">{p.name}</span>
                        <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${p.active !== false ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "bg-stone-950 text-stone-500 border border-stone-800"}`}>
                          {p.active !== false ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{p.desc || "Regular Welcome Prize"}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleRafflePrize(p.id)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 rounded text-stone-400 hover:text-[#c89d7c]"
                        title={p.active !== false ? "Deactivate Prize" : "Activate Prize"}
                      >
                        {p.active !== false ? "🟢" : "⚫"}
                      </button>
                      <button
                        onClick={() => setEditingRafflePrize(p)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 rounded text-stone-400 hover:text-[#c89d7c]"
                        title="Edit Prize"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRafflePrize(p.id)}
                        disabled={rafflePrizes.length <= 2}
                        className="p-1.5 bg-stone-900 hover:bg-red-950 rounded text-stone-600 hover:text-red-400 disabled:opacity-40 disabled:hover:bg-stone-900 disabled:hover:text-stone-600 transition-colors"
                        title={rafflePrizes.length <= 2 ? "Requires at least 2 prizes to spin" : "Delete Prize"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Registered Guests (7 cols) */}
            <div className="lg:col-span-7 bg-[#120f0e] rounded-xl p-5 border border-[#231b18]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h4 className="text-xs font-mono text-[#c89d7c] uppercase tracking-wider font-bold">
                    🎰 Registered Guests & Spins
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Monitor, reset, and manage client raffle profiles.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20 rounded-full">
                  {registeredUsers.length} REGISTERED
                </span>
              </div>

              {registeredUsers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#231b18] rounded-xl text-stone-500 text-xs italic">
                  No guest raffle accounts found. Newly registered users will show up here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-[#181412] rounded-xl border border-[#231b18] flex flex-col justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-white text-sm block truncate">{user.name}</span>
                            <span className="block text-[11px] text-stone-500 font-mono mt-0.5 truncate">{user.email}</span>
                          </div>
                          
                          {/* Spin state badge */}
                          {user.hasSpun ? (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 shrink-0">
                              SPUN 🎯
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/30 shrink-0">
                              UNSPUN ⏳
                            </span>
                          )}
                        </div>

                        <div className="border-t border-[#231d1a] my-2 pt-2">
                          <span className="text-[10px] text-stone-500 font-mono block">Registered Date</span>
                          <span className="text-xs text-stone-300 font-mono">{user.date}</span>
                        </div>

                        {user.hasSpun && (
                          <div className="bg-[#2c221e]/30 border border-[#c89d7c]/10 p-2.5 rounded-lg text-xs mt-1">
                            <span className="text-[9px] font-mono text-[#c89d7c] block uppercase font-bold">Won Prize</span>
                            <p className="font-sans italic text-white font-bold mt-0.5">
                              "{user.prize || "Premium Coffee"}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Admin action buttons */}
                      <div className="flex gap-2.5 pt-3 border-t border-[#231d1a]/50 text-xs font-mono">
                        <button
                          onClick={() => handleRaffleAction('reset-spin', user.id)}
                          className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-[#c89d7c] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-bold text-[10px]"
                        >
                          <RefreshCw size={10} /> Reset Spin
                        </button>
                        <button
                          onClick={() => handleRaffleAction('delete', user.id)}
                          className="py-2 px-3 bg-stone-950 hover:bg-red-950/50 border border-stone-900 text-stone-600 hover:text-red-400 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-bold text-[10px]"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
