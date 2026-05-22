/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  Flame, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Cpu, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Edit3,
  Sliders,
  Award,
  MessageSquare,
  History,
  BookOpen,
  Briefcase,
  DollarSign,
  LineChart,
  Lock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockSignal, ScanResult, StockSignalOption, HoldingItem, ExitLogItem } from "./types.js";
import { INITIAL_STOCKS } from "./initial_stocks.js";

export default function App() {
  const [data, setData] = useState<ScanResult | null>(null);
  const [dbSync, setDbSync] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [currScanIndex, setCurrScanIndex] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSignalFilters, setSelectedSignalFilters] = useState<StockSignalOption[]>(["多", "空", "持倉", "隔離"]);
  const [sortBy, setSortBy] = useState<string>("score_desc"); // change_pct_desc, change_pct_asc, id, close_desc, volume_desc, score_desc
  const [selectedStock, setSelectedStock] = useState<StockSignal | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"radar" | "holdings" | "exits" | "chat" | "sop">("radar");

  // Holdings & Exits
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [exits, setExits] = useState<ExitLogItem[]>([]);

  // Modals
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [buyStock, setBuyStock] = useState<StockSignal | null>(null);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [buyShares, setBuyShares] = useState<number>(0);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState<boolean>(false);

  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [exitStock, setExitStock] = useState<HoldingItem | null>(null);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitReason, setExitReason] = useState<string>("移動停利");
  const [isSubmittingExit, setIsSubmittingExit] = useState<boolean>(false);

  // Notes
  const [notesText, setNotesText] = useState<string>("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([
    {
      role: "assistant",
      content: "歡迎來到獅王戰備解盤室。我是您的「對沖基金 AI 避險大師」。請選擇您想要深度探討的個股，我將立刻調用盤中最新的量化與籌碼指標，為您剖析實戰對沖與避雷防線！"
    }
  ]);
  const [chatStockId, setChatStockId] = useState<string>("2330");
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Global Configs
  const [overrideTsmcState, setOverrideTsmcState] = useState<string>("auto"); // auto, force_green, force_red
  const [eliteOnly, setEliteOnly] = useState<boolean>(true); // Default filter out Score < 33
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    // Keep real-time UTC Clock updated
    const updateTime = () => {
      const d = new Date();
      setUtcTime(d.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch signals
  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/signals");
      const resData = await response.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setDbSync(resData.dbSync);
        if (resData.data.signals?.length > 0 && !selectedStock) {
          setSelectedStock(resData.data.signals[0]);
          setNotesText(resData.data.signals[0].master_notes || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial signals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch holdings
  const fetchHoldings = async () => {
    try {
      const response = await fetch("/api/holdings");
      const resData = await response.json();
      if (resData.success) {
        setHoldings(resData.holdings);
        setExits(resData.exits);
      }
    } catch (error) {
      console.error("Failed to fetch simulated holdings:", error);
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchHoldings();
  }, []);

  // Keep holdings/exits in sync when data changes
  useEffect(() => {
    if (selectedStock && data) {
      const updated = data.signals.find(s => s.stock_id === selectedStock.stock_id);
      if (updated) {
        setSelectedStock(updated);
        setNotesText(updated.master_notes || "");
      }
    }
  }, [data]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Run Matrix Scan
  const triggerMatrixScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    const totalSteps = 15;
    const stepInterval = 100;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepInterval));
      setScanProgress((i / totalSteps) * 100);
      
      if (data && data.signals.length > 0) {
        const randStock = data.signals[Math.floor(Math.random() * data.signals.length)];
        setCurrScanIndex(`${randStock.stock_id} ${randStock.stock_name}`);
      }
    }

    try {
      let overrideTsmc: string | undefined = undefined;
      if (overrideTsmcState === "force_green") overrideTsmc = "green";
      if (overrideTsmcState === "force_red") overrideTsmc = "red";

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideTsmc })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setDbSync(resData.dbSync);
        fetchHoldings(); // refresh live P&L
      }
    } catch (error) {
      console.error("Scanning API error:", error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setCurrScanIndex("");
    }
  };

  // Toggle TSMC override
  const handleTsmcOverrideChange = async (state: string) => {
    setOverrideTsmcState(state);
    setIsScanning(true);
    setScanProgress(30);
    setCurrScanIndex("重新校準大盤 20MA 水位...");
    try {
      let overrideTsmc: string | undefined = undefined;
      if (state === "force_green") overrideTsmc = "green";
      if (state === "force_red") overrideTsmc = "red";

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideTsmc })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setDbSync(resData.dbSync);
        fetchHoldings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setCurrScanIndex("");
    }
  };

  // Save manual notes to DB and cache
  const saveManualNotes = async () => {
    if (!selectedStock) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch("/api/update-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stock_id: selectedStock.stock_id, 
          notes: notesText 
        })
      });
      const resData = await response.json();
      if (resData.success) {
        if (data) {
          const updatedSignals = data.signals.map(s => {
            if (s.stock_id === selectedStock.stock_id) {
              return { ...s, master_notes: notesText };
            }
            return s;
          });
          setData({ ...data, signals: updatedSignals });
        }
      }
    } catch (err) {
      console.error("Save notes error:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Call server-side Gemini to generate Notes
  const generateAiNotesWithGemini = async () => {
    if (!selectedStock) return;
    setIsGeneratingNotes(true);
    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_id: selectedStock.stock_id,
          stock_name: selectedStock.stock_name,
          close_price: selectedStock.close_price,
          signal: selectedStock.signal,
          macd_status: selectedStock.macd_status,
          ma20_status: selectedStock.ma20_status,
          change_pct: selectedStock.change_pct
        })
      });
      const resData = await response.json();
      if (resData.success && resData.notes) {
        setNotesText(resData.notes);
        if (data) {
          const updatedSignals = data.signals.map(s => {
            if (s.stock_id === selectedStock.stock_id) {
              return { ...s, master_notes: resData.notes };
            }
            return s;
          });
          setData({ ...data, signals: updatedSignals });
        }
      }
    } catch (err) {
      console.error("Gemini Gen error:", err);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Buy position modal triggers
  const openBuyModalForStock = (stock: StockSignal) => {
    setBuyStock(stock);
    setBuyPrice(stock.close_price);
    // Auto-calculate suggested shares based on NT$ 20,000 budget constraint
    const suggested = Math.floor(20000 / stock.close_price);
    setBuyShares(suggested > 0 ? suggested : 1);
    setShowBuyModal(true);
  };

  // Submit simulated buy
  const handleBuyOrderSubmit = async () => {
    if (!buyStock || buyShares <= 0 || buyPrice <= 0) return;
    setIsSubmittingBuy(true);
    try {
      const response = await fetch("/api/holdings/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_id: buyStock.stock_id,
          stock_name: buyStock.stock_name,
          buy_price: buyPrice,
          shares: buyShares
        })
      });
      const resData = await response.json();
      if (resData.success) {
        fetchHoldings();
        setShowBuyModal(false);
      }
    } catch (error) {
      console.error("Buy order failed:", error);
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  // Exit position modal triggers
  const openExitModalForHolding = (holding: HoldingItem) => {
    setExitStock(holding);
    setExitPrice(holding.current_price);
    // Determine suggested exit reason
    let reason = "移動停利";
    if (holding.current_price <= holding.stop_loss_price) {
      reason = "E-Stop 強制停損";
    } else if (holding.current_price <= holding.trailing_stop_price) {
      reason = "移動停利";
    }
    setExitReason(reason);
    setShowExitModal(true);
  };

  // Submit simulated exit
  const handleExitOrderSubmit = async () => {
    if (!exitStock || exitPrice <= 0 || !exitReason) return;
    setIsSubmittingExit(true);
    try {
      const response = await fetch("/api/holdings/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_id: exitStock.stock_id,
          exit_price: exitPrice,
          exit_reason: exitReason
        })
      });
      const resData = await response.json();
      if (resData.success) {
        fetchHoldings();
        setShowExitModal(false);
        setActiveTab("exits"); // jump to history logs to see Gemini retrospect!
      }
    } catch (error) {
      console.error("Exit order failed:", error);
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Send AI Chat message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    
    // Add user message to UI
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/stocks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          stock_id: chatStockId || undefined
        })
      });
      const resData = await response.json();
      if (resData.success && resData.reply) {
        setChatMessages([...updatedMessages, { role: "assistant" as const, content: resData.reply }]);
      } else {
        setChatMessages([...updatedMessages, { role: "assistant" as const, content: "⚠️ 訊號不穩定，大師正在喝茶，請重試。" }]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setChatMessages([...updatedMessages, { role: "assistant" as const, content: "❌ 對接 AI 中樞超時，請檢查連線狀態或 API 金鑰配置。" }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Toggling Signal Filter
  const toggleSignalFilter = (sig: StockSignalOption) => {
    if (selectedSignalFilters.includes(sig)) {
      setSelectedSignalFilters(selectedSignalFilters.filter(s => s !== sig));
    } else {
      setSelectedSignalFilters([...selectedSignalFilters, sig]);
    }
  };

  // Process signals (filter & sort)
  const getProcessedSignals = () => {
    if (!data || !data.signals) return [];
    
    let result = [...data.signals];

    // Elite threshold check (default: score >= 33)
    if (eliteOnly) {
      result = result.filter(s => s.score >= 33);
    }

    // Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        s => 
          s.stock_id.toLowerCase().includes(q) || 
          s.stock_name.toLowerCase().includes(q) ||
          (s.master_notes && s.master_notes.toLowerCase().includes(q))
      );
    }

    // Filter by Signals
    result = result.filter(s => selectedSignalFilters.includes(s.signal));

    // Sort options
    result.sort((a, b) => {
      if (sortBy === "change_pct_desc") return b.change_pct - a.change_pct;
      if (sortBy === "change_pct_asc") return a.change_pct - b.change_pct;
      if (sortBy === "id") return a.stock_id.localeCompare(b.stock_id);
      if (sortBy === "close_desc") return b.close_price - a.close_price;
      if (sortBy === "volume_desc") return b.volume_multiplier - a.volume_multiplier;
      if (sortBy === "score_desc") return b.score - a.score;
      return 0;
    });

    return result;
  };

  const processedSignals = getProcessedSignals();

  const longCount = data?.signals?.filter(s => s.signal === "多").length || 0;
  const shortCount = data?.signals?.filter(s => s.signal === "空").length || 0;
  const holdCount = data?.signals?.filter(s => s.signal === "持倉").length || 0;
  const quarantinedCount = data?.signals?.filter(s => s.signal === "隔離").length || 0;

  // Blacklisted stocks (Below 20MA or Score < 33)
  const getBlacklistedStocks = () => {
    if (!data || !data.signals) return [];
    return data.signals.filter(s => s.close_price < s.stop_loss_price || s.score < 33);
  };

  // Taiwan Stock Colors
  const renderSignalBadge = (sig: StockSignalOption) => {
    if (sig === "多") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950/70 border border-rose-500/50 text-rose-400 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.12)]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          🔴 多頭信號
        </span>
      );
    }
    if (sig === "空") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.12)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          🟢 空頭訊號
        </span>
      );
    }
    if (sig === "隔離") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950/70 border border-amber-600/50 text-amber-400 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
          ⚠️ 物理隔離
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-800 border border-zinc-700 text-zinc-400 inline-flex items-center gap-1">
        ⚪ 觀望持倉
      </span>
    );
  };

  const getVixStatusText = () => {
    if (!data) return { text: "檢索中...", color: "text-zinc-500", bg: "bg-zinc-900/60" };
    if (data.macroEStopActive) {
      return { text: `🔥 恐慌暴增 VIX > 30 (${data.vixValue.toFixed(2)}) 鎖死停買中！`, color: "text-rose-450 animate-pulse", bg: "bg-rose-950/40 border-rose-500/30" };
    }
    if (data.vixValue > 22) {
      return { text: `⚠️ 震盪偏高 VIX: ${data.vixValue.toFixed(2)}，建議審慎控倉！`, color: "text-amber-400", bg: "bg-amber-950/20 border-amber-600/30" };
    }
    return { text: `🟢 總經安全 VIX: ${data.vixValue.toFixed(2)}，多頭運作順遂。`, color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-600/20" };
  };

  const vixStatus = getVixStatusText();

  return (
    <div className="min-h-screen bg-[#08090c] text-[#d1d4dc] selection:bg-[#E5A823]/30 selection:text-white flex flex-col antialiased">
      
      {/* Cyberpunk Glassmorphism Header */}
      <header className="border-b border-zinc-850 bg-[#0d0f14]/85 backdrop-blur-md py-4 px-6 sticky top-0 z-40 shadow-xl">
        <div className="w-full max-w-[1700px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Subhead */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#E5A823] to-[#FFD54F] flex items-center justify-center text-[#08090c] font-black text-lg shadow-[0_0_20px_rgba(229,168,35,0.35)]">
              🦁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-xl text-white tracking-tight">獅王戰神 V2026.Max</h1>
                <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black px-2 py-0.5 rounded shadow">
                  終極大一統版
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-0.5">
                WALL STREET ELITE QUANT DECISION SYSTEM & SIMULATOR
              </p>
            </div>
          </div>

          {/* VIX Macro Radar banner */}
          <div className={`px-4 py-2 rounded-lg border text-xs font-semibold ${vixStatus.bg} ${vixStatus.color} flex items-center gap-2 shadow`}>
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{vixStatus.text}</span>
          </div>

          {/* Time & DB indicators */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 shadow">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
              <span className="text-zinc-500">TAIPEI:</span>
              <span className="text-[#FFB74D] font-bold">{utcTime || "2026-05-22 14:00:00"}</span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 shadow">
              <Database className={`w-3.5 h-3.5 ${dbSync ? "text-emerald-400" : "text-amber-500"}`} />
              <span className="text-zinc-500">MONGO:</span>
              <span className={`font-bold ${dbSync ? "text-emerald-400" : "text-amber-500"}`}>
                {dbSync ? "LionKing_DB" : "Memory Sandbox"}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 shadow">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-500">CO-PILOT:</span>
              <span className="text-indigo-300 font-bold">Gemini 3.5-Flash</span>
            </div>
          </div>

        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-[#0b0c10] border-b border-zinc-850 sticky top-[77px] z-30 shadow-md">
        <div className="w-full max-w-[1700px] mx-auto px-6 flex items-center justify-between overflow-x-auto">
          <div className="flex gap-1 md:gap-4 py-1">
            <button
              onClick={() => setActiveTab("radar")}
              className={`py-3 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
                activeTab === "radar"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <LineChart className="w-4 h-4 text-[#FFB74D]" />
              📊 獅王大一統監控 (Master Radar)
              {activeTab === "radar" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("holdings")}
              className={`py-3 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
                activeTab === "holdings"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#FFB74D]" />
              📦 模擬持倉 ({holdings.length})
              {activeTab === "holdings" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("exits")}
              className={`py-3 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
                activeTab === "exits"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4 text-[#FFB74D]" />
              🚪 已出場檢討記錄 ({exits.length})
              {activeTab === "exits" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`py-3 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
                activeTab === "chat"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FFB74D]" />
              💬 AI 避險大師對話
              {activeTab === "chat" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("sop")}
              className={`py-3 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
                activeTab === "sop"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#FFB74D]" />
              🛡️ 量化鐵律 SOP
              {activeTab === "sop" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-550">V2026.Max ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6">
        
        {/* ======================= TAB 1: RADAR ======================= */}
        {activeTab === "radar" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left and Mid Content Table Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Top Tactical Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* TSMC 生命線 */}
                <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-4 shadow relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">台積電生命線 (20MA)</h3>
                      <div className="text-2xl font-mono font-bold text-white mt-1.5 flex items-baseline gap-1">
                        {data ? data.tsmcPrice : 1045.0} <span className="text-xs text-zinc-500">元</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${data && data.tsmcPrice >= data.tsmcMa20Value ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-400" : "bg-rose-955 border border-rose-500/30 text-rose-400"}`}>
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3.5 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>月線水位: {data ? data.tsmcMa20Value : 1030.0} 元</span>
                    <span className={`font-bold font-mono ${data && data.tsmcPrice >= data.tsmcMa20Value ? "text-emerald-400" : "text-rose-400"}`}>
                      {data && data.tsmcPrice >= data.tsmcMa20Value ? "🟢 買點開放" : "🔴 全面停買隔離"}
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${data && data.tsmcPrice >= data.tsmcMa20Value ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                </div>

                {/* 大盤隔離狀態 */}
                <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-4 shadow relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">台北交易時間防線</h3>
                      <div className="mt-2.5">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-zinc-900 border border-zinc-800 text-[#FFB74D] inline-flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          台北時間盤中濾網
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-zinc-500 leading-tight">
                    僅限台北時間 09:00 - 13:30 允許觸發買進，其餘自動觀望。
                  </div>
                </div>

                {/* Score Stats */}
                <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-4 shadow relative overflow-hidden group">
                  <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono mb-2">90 檔純高 Beta 分佈</h3>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono">
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-850">
                      <div className="text-[9px] text-rose-400 font-bold">多</div>
                      <div className="text-sm font-bold text-white mt-0.5">{longCount}</div>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-850">
                      <div className="text-[9px] text-emerald-400 font-bold">空</div>
                      <div className="text-sm font-bold text-white mt-0.5">{shortCount}</div>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-850">
                      <div className="text-[9px] text-zinc-400">持</div>
                      <div className="text-sm font-bold text-zinc-300 mt-0.5">{holdCount}</div>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-850">
                      <div className="text-[9px] text-amber-500">隔</div>
                      <div className="text-sm font-bold text-white mt-0.5">{quarantinedCount}</div>
                    </div>
                  </div>
                </div>

                {/* Override testing */}
                <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-4 shadow relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] text-[#FFB74D] font-black tracking-wider uppercase font-mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> 大盤剛性回測
                    </h3>
                    <div className="grid grid-cols-3 gap-1 mt-2.5">
                      <button 
                        onClick={() => handleTsmcOverrideChange("force_green")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "force_green" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
                      >
                        綠燈
                      </button>
                      <button 
                        onClick={() => handleTsmcOverrideChange("force_red")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "force_red" ? "bg-rose-600 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
                      >
                        紅燈
                      </button>
                      <button 
                        onClick={() => handleTsmcOverrideChange("auto")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "auto" ? "bg-[#E5A823] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
                      >
                        自動
                      </button>
                    </div>
                  </div>
                  <div className="text-[9px] text-zinc-550 mt-1.5 font-mono">
                    提供手動測試紅燈(跌破20MA)與綠燈狀態
                  </div>
                </div>

              </div>

              {/* Sweep Trigger Module */}
              <div className="bg-gradient-to-r from-zinc-900 to-[#0e1117] rounded-xl border border-zinc-800 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E5A823]/5 rounded-full blur-2xl"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFB74D] flex items-center justify-center animate-pulse shrink-0">
                      <RefreshCw className={`w-5 h-5 ${isScanning ? "animate-spin" : ""}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">🦁 獅王戰神 V2026.Max 90 檔純高 Beta 股期洗價掃描器</h4>
                      <p className="text-xs text-zinc-400 mt-1">配備自動重試指數退避、防空值裝甲，一鍵批次同步洗盤</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto">
                    <button
                      onClick={triggerMatrixScan}
                      disabled={isScanning}
                      className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                        isScanning 
                          ? "bg-zinc-800 text-zinc-550 border border-zinc-700 cursor-not-allowed" 
                          : "bg-gradient-to-r from-[#E5A823] to-[#FFB74D] text-[#08090c] hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {isScanning ? "正在為 90 檔高 Beta 洗價中..." : "⚡ 啟動全域即時量化洗價"}
                    </button>
                  </div>
                </div>

                {isScanning && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 text-xs">
                    <div className="flex justify-between items-center text-zinc-400 font-mono mb-1.5">
                      <span>掃描進度: {currScanIndex || "正在連接 yfinance 對沖中樞..."}</span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#E5A823] to-yellow-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Main Matrix Table */}
              <div className="bg-[#0d0f14] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                
                {/* Filters Row */}
                <div className="p-4 border-b border-zinc-800 bg-[#0e1117] flex flex-wrap gap-4 items-center justify-between">
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="代號、名稱、實戰備忘錄..." 
                        className="pl-9 pr-4 py-2 text-xs rounded bg-zinc-950 border border-zinc-850 text-white placeholder-zinc-650 focus:outline-none focus:border-[#E5A823] w-60"
                      />
                    </div>

                    {/* Elite filter checkbox */}
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-zinc-300 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 hover:text-white transition">
                      <input 
                        type="checkbox" 
                        checked={eliteOnly}
                        onChange={(e) => setEliteOnly(e.target.checked)}
                        className="accent-[#E5A823] cursor-pointer"
                      />
                      <span>⭐ Score &gt;= 33 精英標的</span>
                    </label>
                  </div>

                  {/* Signal pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500 font-mono">裁決:</span>
                    {(["多", "空", "持倉", "隔離"] as StockSignalOption[]).map(sig => {
                      const active = selectedSignalFilters.includes(sig);
                      return (
                        <button
                          key={sig}
                          onClick={() => toggleSignalFilter(sig)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded transition ${
                            active 
                              ? sig === "多" 
                                ? "bg-rose-950/70 border border-rose-500/50 text-rose-400" 
                                : sig === "空" 
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400" 
                                : sig === "隔離" 
                                ? "bg-amber-950/70 border border-amber-600/50 text-amber-400" 
                                : "bg-zinc-800 text-white border border-zinc-700"
                              : "bg-zinc-900 text-zinc-550 border border-transparent hover:text-zinc-350"
                          }`}
                        >
                          {sig}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500 font-mono">排序:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E5A823]"
                    >
                      <option value="score_desc">戰力評分 (高 → 低)</option>
                      <option value="change_pct_desc">今日漲幅 (大 → 小)</option>
                      <option value="change_pct_asc">今日跌幅 (小 → 大)</option>
                      <option value="close_desc">最新現價 (高 → 低)</option>
                      <option value="volume_desc">爆量倍數 (高 → 低)</option>
                      <option value="id">股票代號 (順序)</option>
                    </select>
                  </div>

                </div>

                {/* Table list */}
                <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                  <table className="w-full text-left border-collapse table-auto text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-[#0e1117]/95 text-[10px] uppercase font-mono font-bold text-zinc-500 sticky top-0 z-10 select-none">
                        <th className="py-2.5 px-3">代號 / 股名</th>
                        <th className="py-2.5 px-2 text-right">現價</th>
                        <th className="py-2.5 px-2 text-right">漲跌%</th>
                        <th className="py-2.5 px-2 text-center text-[#FFB74D]">評分</th>
                        <th className="py-2.5 px-3 text-left">建議進場價格區間 (5檔定價)</th>
                        <th className="py-2.5 px-2 text-right text-yellow-500 font-bold">減碼價(20%)</th>
                        <th className="py-2.5 px-2 text-right text-emerald-400">移動停利</th>
                        <th className="py-2.5 px-2 text-right text-rose-400 font-bold">防呆停損</th>
                        <th className="py-2.5 px-2 text-center">策略訊號</th>
                        <th className="py-2.5 px-3 text-center">實戰操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 text-zinc-300">
                      {processedSignals.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-16 text-center text-zinc-500 font-mono">
                            <AlertTriangle className="w-9 h-9 text-amber-500/35 mx-auto mb-2" />
                            沒有符合篩選條件的黃金標的
                            {eliteOnly && (
                              <p className="text-[11px] text-zinc-650 mt-1">💡 當前開啟了 Score &gt;= 33 限制，試著關閉以檢視更多</p>
                            )}
                          </td>
                        </tr>
                      ) : (
                        processedSignals.map(stock => {
                          const isSelected = selectedStock?.stock_id === stock.stock_id;
                          return (
                            <tr
                              key={stock.stock_id}
                              onClick={() => {
                                setSelectedStock(stock);
                                setNotesText(stock.master_notes || "");
                              }}
                              className={`hover:bg-zinc-900/50 cursor-pointer transition ${
                                isSelected ? "bg-zinc-900/70 border-l-2 border-[#E5A823] text-white" : ""
                              }`}
                            >
                              <td className="py-2 px-3">
                                <div className="font-mono font-bold flex items-center gap-1">
                                  {stock.stock_id}
                                  {stock.liquidity_warning && <span className="text-amber-500" title="流動性警告">⚠️</span>}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{stock.stock_name}</div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-semibold">
                                {stock.close_price.toFixed(1)}
                              </td>
                              <td className={`py-2 px-2 text-right font-mono font-black ${stock.change_pct >= 0 ? "text-rose-455" : "text-emerald-455"}`}>
                                {stock.change_pct >= 0 ? `+${stock.change_pct.toFixed(2)}` : stock.change_pct.toFixed(2)}%
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  stock.score >= 33 
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/40" 
                                    : "bg-zinc-800/80 text-zinc-450"
                                }`}>
                                  {stock.score}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-left font-mono text-[10px] text-zinc-350 max-w-[210px] truncate" title={stock.suggested_entry_price}>
                                {stock.suggested_entry_price}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-yellow-500 font-bold">
                                {stock.take_profit_half_price?.toFixed(1) || "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-emerald-400">
                                {stock.trailing_stop_price?.toFixed(1) || "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-rose-400 font-bold">
                                {stock.stop_loss_price?.toFixed(1) || "-"}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {renderSignalBadge(stock.signal)}
                              </td>
                              <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={() => openBuyModalForStock(stock)}
                                    disabled={data?.macroEStopActive}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded shadow transition active:scale-[0.96] ${
                                      data?.macroEStopActive 
                                        ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                                        : "bg-rose-900/90 text-rose-300 border border-rose-600/40 hover:bg-rose-800"
                                    }`}
                                  >
                                    買入
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setNotesText(stock.master_notes || "");
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                                  >
                                    解盤
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-[#0e1117] border-t border-zinc-850 text-[10px] font-mono text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span>精英戰線已過濾符合 {processedSignals.length} 檔標的</span>
                  <span>最後盤中洗價時間: {data ? data.scanTime : "讀取中..."}</span>
                </div>

              </div>

            </div>

            {/* Right Side Tactical Intelligence Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div className="bg-[#0e1117] border border-zinc-800 rounded-xl shadow-xl overflow-hidden sticky top-[135px]">
                
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-zinc-900 to-[#0e1117] border-b border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FFB74D]" />
                    <h3 className="font-bold text-white text-sm">🦁 獅王戰神實戰解盤與註記</h3>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[#FFB74D] uppercase font-bold">
                    V2026.Max
                  </span>
                </div>

                {selectedStock ? (
                  <div className="p-5 flex flex-col gap-4">
                    
                    {/* Selected stock core info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-mono font-black text-white">{selectedStock.stock_id}</span>
                          <span className="text-sm font-bold text-zinc-400">{selectedStock.stock_name}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                          行業: {selectedStock.industry} | {selectedStock.category}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-mono font-black text-white">{selectedStock.close_price.toFixed(1)}</span>
                        <span className="text-[10px] text-zinc-450 ml-0.5">元</span>
                        <div className={`text-xs font-bold font-mono mt-0.5 ${selectedStock.change_pct >= 0 ? "text-rose-455" : "text-emerald-455"}`}>
                          {selectedStock.change_pct >= 0 ? `+${selectedStock.change_pct.toFixed(2)}` : selectedStock.change_pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <hr className="border-zinc-850" />

                    {/* Technical score & checklist summary */}
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">當前策略評分:</span>
                        <span className="font-mono text-[#FFB74D] font-bold text-sm">
                          {selectedStock.score} / 40 分
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-zinc-850/40 pt-1.5">
                        <span className="text-zinc-400">行動指令:</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          selectedStock.action_signal.includes("買進") 
                            ? "bg-rose-950 text-rose-400 border border-rose-500/40" 
                            : selectedStock.action_signal.includes("停損") 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {selectedStock.action_signal}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-zinc-850/40 pt-1.5">
                        <span className="text-zinc-400">5檔動態定價:</span>
                        <span className="font-mono text-white text-[10px]">
                          成本: {selectedStock.dynamicTiers?.vwap5d} | 漲停: {selectedStock.dynamicTiers?.limitUp}
                        </span>
                      </div>
                    </div>

                    {/* Gemini intelligent notes generation section */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          操盤手機構備忘錄
                        </h4>
                        
                        <button
                          onClick={generateAiNotesWithGemini}
                          disabled={isGeneratingNotes}
                          className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900 transition flex items-center gap-1"
                        >
                          {isGeneratingNotes ? (
                            <span className="w-2.5 h-2.5 border-t-2 border-indigo-400 animate-spin rounded-full"></span>
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                          )}
                          AI 大師診斷
                        </button>
                      </div>

                      <div className="relative">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          rows={4}
                          placeholder="請輸入機構實戰策略筆記，或者點選右上角 [AI 大師診斷] 自動剖析對沖位階..."
                          className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-zinc-200 placeholder-zinc-650 resize-none focus:outline-none focus:border-[#E5A823]/80 leading-relaxed font-sans"
                        />
                        {isGeneratingNotes && (
                          <div className="absolute inset-0 bg-[#0d0e12]/90 rounded-lg flex flex-col items-center justify-center text-xs text-indigo-400">
                            <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-1.5"></span>
                            AI 正在對接對沖中樞運算中...
                          </div>
                        )}
                      </div>

                      {/* Save Notes button */}
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <button
                          onClick={() => setNotesText(INITIAL_STOCKS.find(s => s.id === selectedStock.stock_id)?.fundamentalNotes || "")}
                          className="px-3 py-1.5 text-xs text-zinc-550 border border-zinc-850 rounded hover:text-white transition font-medium"
                        >
                          還原
                        </button>
                        <button
                          onClick={saveManualNotes}
                          disabled={isSavingNotes}
                          className="px-4 py-1.5 text-xs font-bold rounded bg-[#E5A823] text-black hover:opacity-90 transition active:scale-[0.98]"
                        >
                          {isSavingNotes ? "寫入中..." : "💾 儲存個股註記"}
                        </button>
                      </div>

                    </div>

                    {/* V2026.Max Score Checklist Breakdown */}
                    <div className="mt-2">
                      <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-2">
                        📋 V2026.Max 40分布林指標檢核 (滿分 {selectedStock.score} 分)
                      </h4>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 max-h-[160px] overflow-y-auto space-y-1 text-[10px] font-mono">
                        {selectedStock.scoreBreakdown && Object.entries(selectedStock.scoreBreakdown).map(([key, val]) => {
                          return (
                            <div key={key} className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                              <span className="text-zinc-450 truncate max-w-[210px]">{key}</span>
                              {val ? (
                                <span className="text-rose-400 font-bold">🟢 符合 (+1)</span>
                              ) : (
                                <span className="text-zinc-600">🔴 未符合 (0)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-16 text-center text-zinc-550 font-mono">
                    <AlertTriangle className="w-10 h-10 text-amber-500/20 mx-auto mb-3" />
                    請點選左側表格中的股票代號
                    <p className="text-[11px] text-zinc-650 mt-1">開啟該個股對沖與風控戰情面板</p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ======================= TAB 2: HOLDINGS ======================= */}
        {activeTab === "holdings" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Holdings Head card */}
            <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-6 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-white text-lg font-bold">📦 實時模擬對沖持倉管理區</h3>
                <p className="text-xs text-zinc-450 mt-1">
                  依據 NT$ 20,000 單檔預算上限建倉。系統盤中自動拉取收盤現價，計算即時盈虧與動態減碼出場點。
                </p>
              </div>

              <div className="flex gap-4 font-mono text-center">
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-850">
                  <div className="text-[10px] text-zinc-500">當前持倉個股</div>
                  <div className="text-xl font-bold text-white mt-0.5">{holdings.length} 檔</div>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-850">
                  <div className="text-[10px] text-zinc-500">持倉總價值</div>
                  <div className="text-xl font-bold text-[#FFB74D] mt-0.5">
                    {holdings.reduce((sum, h) => sum + h.current_price * h.shares, 0).toLocaleString()} 元
                  </div>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-850">
                  <div className="text-[10px] text-zinc-500">預計總利潤 (P&L)</div>
                  {(() => {
                    const totalPnl = holdings.reduce((sum, h) => sum + h.current_pnl_value, 0);
                    return (
                      <div className={`text-xl font-bold mt-0.5 ${totalPnl >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {totalPnl >= 0 ? `+${totalPnl.toLocaleString()}` : totalPnl.toLocaleString()} 元
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-[#0d0f14] border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto text-xs">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-[#0e1117] text-[10px] font-mono font-bold text-zinc-500 uppercase select-none">
                      <th className="py-3 px-4">股票標的</th>
                      <th className="py-3 px-2 text-right">買入日期 / 時間</th>
                      <th className="py-3 px-2 text-right">進場均價</th>
                      <th className="py-3 px-2 text-right">持倉股數</th>
                      <th className="py-3 px-2 text-right">現價</th>
                      <th className="py-3 px-2 text-right text-yellow-500">減碼停利(20%)</th>
                      <th className="py-3 px-2 text-right text-emerald-400">移動停利</th>
                      <th className="py-3 px-2 text-right text-rose-400">強制停損</th>
                      <th className="py-3 px-2 text-right">未實現損益 (P&L)</th>
                      <th className="py-3 px-3 text-center">操盤手指導建議</th>
                      <th className="py-3 px-4 text-center">清倉指令</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/50 text-zinc-350">
                    {holdings.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-16 text-center text-zinc-500 font-mono">
                          <Sliders className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                          當前無任何模擬持倉部位
                          <p className="text-[11px] text-[#FFB74D] mt-1 hover:underline cursor-pointer" onClick={() => setActiveTab("radar")}>
                            👉 前往 📊 獅王大一統監控 掃描買進信號建倉
                          </p>
                        </td>
                      </tr>
                    ) : (
                      holdings.map(item => {
                        return (
                          <tr key={item.stock_id} className="hover:bg-zinc-900/30 transition">
                            <td className="py-3 px-4 font-bold text-white">
                              <span className="font-mono">{item.stock_id}</span>
                              <span className="text-[10px] text-zinc-500 ml-1.5">{item.stock_name}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-zinc-400">
                              {item.buy_date} {item.buy_time}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-semibold">{item.buy_price.toFixed(1)}</td>
                            <td className="py-3 px-2 text-right font-mono">{item.shares} 股</td>
                            <td className="py-3 px-2 text-right font-mono font-semibold text-white">{item.current_price.toFixed(1)}</td>
                            <td className="py-3 px-2 text-right font-mono text-yellow-500 font-bold">
                              {Math.round(item.buy_price * 1.2 * 10) / 10}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-400">
                              {item.trailing_stop_price?.toFixed(1) || "-"}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-rose-400 font-bold">
                              {item.stop_loss_price?.toFixed(1) || "-"}
                            </td>
                            <td className={`py-3 px-2 text-right font-mono font-black ${item.current_pnl_value >= 0 ? "text-rose-455" : "text-emerald-455"}`}>
                              <div>{item.current_pnl_pct >= 0 ? `+${item.current_pnl_pct.toFixed(2)}` : item.current_pnl_pct.toFixed(2)}%</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{item.current_pnl_value >= 0 ? `+${Math.round(item.current_pnl_value)}` : Math.round(item.current_pnl_value)} 元</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                item.suggested_action.includes("停損")
                                  ? "bg-rose-950 text-rose-400 border border-rose-500/40"
                                  : item.suggested_action.includes("移動停利")
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}>
                                {item.suggested_action}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => openExitModalForHolding(item)}
                                className="px-3 py-1 rounded bg-[#E5A823] text-black font-bold hover:opacity-90 transition active:scale-[0.96] text-[11px]"
                              >
                                出場結算
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB 3: EXITS ======================= */}
        {activeTab === "exits" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-6 shadow">
              <h3 className="text-white text-lg font-bold">🚪 歷史出場操盤檢討日誌</h3>
              <p className="text-xs text-zinc-450 mt-1">
                記錄您所有歷史模擬持倉的清倉記錄，並包含 <code>Gemini 3.5-Flash</code> 為您客製化產生的精闢操盤回顧與改進方向。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {exits.length === 0 ? (
                <div className="bg-[#0d0f14] border border-zinc-800 rounded-xl p-16 text-center text-zinc-550 font-mono shadow-xl">
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  目前無歷史已結算部位檢討記錄。
                </div>
              ) : (
                exits.map((item, idx) => {
                  return (
                    <div key={item._id || idx} className="bg-[#0d0f14] border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-5 relative overflow-hidden group">
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.pnl_pct >= 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                      
                      {/* Left: Metadata */}
                      <div className="md:w-72 shrink-0 flex flex-col gap-1.5 border-r border-zinc-850/60 pr-5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-mono font-bold text-white">{item.stock_id}</span>
                          <span className="text-xs font-bold text-zinc-400">{item.stock_name}</span>
                        </div>

                        <div className="text-[10px] text-zinc-550 font-mono mt-1 space-y-1">
                          <div>進場日期: {item.buy_date}</div>
                          <div>清倉日期: {item.exit_date}</div>
                          <div>交易股數: {item.shares} 股</div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-1 text-center font-mono">
                          <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 text-[10px]">
                            <div className="text-zinc-500">進場價</div>
                            <div className="text-zinc-300 font-bold mt-0.5">{item.buy_price.toFixed(1)}</div>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 text-[10px]">
                            <div className="text-zinc-500">清倉價</div>
                            <div className="text-zinc-300 font-bold mt-0.5">{item.exit_price.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Profit card */}
                      <div className="md:w-56 shrink-0 flex flex-col justify-center items-center font-mono border-r border-zinc-850/60 pr-5">
                        <div className={`text-2xl font-black ${item.pnl_pct >= 0 ? "text-rose-455" : "text-emerald-455"}`}>
                          {item.pnl_pct >= 0 ? `+${item.pnl_pct.toFixed(2)}` : item.pnl_pct.toFixed(2)}%
                        </div>
                        <div className={`text-sm font-bold mt-1 ${item.pnl_value >= 0 ? "text-rose-455" : "text-emerald-455"}`}>
                          {item.pnl_value >= 0 ? `+${Math.round(item.pnl_value).toLocaleString()}` : Math.round(item.pnl_value).toLocaleString()} 元
                        </div>
                        <div className="text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-450 px-2 py-0.5 rounded mt-3 font-sans font-semibold">
                          原因: {item.exit_reason}
                        </div>
                      </div>

                      {/* Right: Gemini AI Retrospect Post-mortem */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-[11px] text-zinc-500 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          🦁 避險基金大師實戰檢討與改正方向:
                        </h4>
                        <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-lg text-zinc-300 text-xs leading-relaxed italic font-sans">
                          {item.review_summary}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ======================= TAB 4: CHAT ======================= */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left dialog window */}
            <div className="lg:col-span-8 bg-[#0d0f14] border border-zinc-800 rounded-xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
              
              {/* Chat room Header */}
              <div className="p-4 bg-[#0e1117] border-b border-zinc-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-950 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">🦁 避險大師量化實戰研討會</h3>
                    <p className="text-[10px] text-zinc-500">Gemini 3.5-Flash 自營部首席解盤大師在線</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">鎖定研討標的:</span>
                  <select
                    value={chatStockId}
                    onChange={(e) => setChatStockId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E5A823]"
                  >
                    {INITIAL_STOCKS.map(s => (
                      <option key={s.id} value={s.id}>{s.id} {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message flow area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl p-3.5 text-xs shadow-md leading-relaxed ${
                        isUser 
                          ? "bg-gradient-to-tr from-amber-600 to-yellow-600 text-black font-semibold rounded-br-none" 
                          : "bg-zinc-900 border border-zinc-850 text-zinc-150 rounded-bl-none"
                      }`}>
                        {!isUser && (
                          <div className="text-[9px] text-[#FFB74D] font-mono tracking-wider uppercase font-bold mb-1">
                            🦁 LION KING CO-PILOT
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
                {isSendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-3.5 text-xs text-indigo-400 flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></span>
                      AI 大師正在調用台積電月線防線與籌碼比率算力中...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input strip */}
              <div className="p-4 bg-[#0e1117] border-t border-zinc-850 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  placeholder={`輸入您的問題，例如：「請幫我分析 ${chatStockId} 目前適合進場嗎？」...`}
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E5A823]"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={isSendingChat || !chatInput.trim()}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#E5A823] to-[#FFB74D] text-black font-bold text-xs hover:opacity-90 active:scale-[0.98] transition"
                >
                  發送
                </button>
              </div>

            </div>

            {/* Right pre-loaded indicator widget */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-white text-sm font-bold flex items-center gap-1.5 mb-3">
                  <Sliders className="w-4 h-4 text-[#FFB74D]" />
                  當前研討標的最新量化指引 ({chatStockId})
                </h3>

                {(() => {
                  const activeSig = data?.signals.find(s => s.stock_id === chatStockId);
                  if (!activeSig) {
                    return <p className="text-xs text-zinc-550 italic font-mono">請先在雷達表完成一次洗價掃描</p>;
                  }
                  return (
                    <div className="space-y-3.5 text-xs font-mono">
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                          <div className="text-zinc-550">最新收盤價</div>
                          <div className="text-sm font-bold text-white mt-0.5">{activeSig.close_price} 元</div>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                          <div className="text-zinc-550">今日表現 %</div>
                          <div className={`text-sm font-bold mt-0.5 ${activeSig.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                            {activeSig.change_pct >= 0 ? `+${activeSig.change_pct}%` : `${activeSig.change_pct}%`}
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">綜合戰力評估:</span>
                          <span className="text-[#FFB74D] font-bold">{activeSig.score} / 40 分</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-t border-zinc-900 pt-1.5">
                          <span className="text-zinc-500">策略信號:</span>
                          {renderSignalBadge(activeSig.signal)}
                        </div>
                        <div className="flex justify-between text-[11px] border-t border-zinc-900 pt-1.5">
                          <span className="text-zinc-500">具體行動:</span>
                          <span className="text-white font-bold">{activeSig.action_signal}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-t border-zinc-900 pt-1.5">
                          <span className="text-zinc-500">建議進場點:</span>
                          <span className="text-zinc-300 font-bold">{activeSig.suggested_entry_price}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">20% 減碼點</div>
                          <div className="text-yellow-500 font-bold mt-0.5">{activeSig.take_profit_half_price}</div>
                        </div>
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">移動停利線</div>
                          <div className="text-emerald-400 font-bold mt-0.5">{activeSig.trailing_stop_price}</div>
                        </div>
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">E-Stop 停損</div>
                          <div className="text-rose-400 font-bold mt-0.5">{activeSig.stop_loss_price}</div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-3 rounded border border-zinc-850 text-[10px] text-zinc-400 leading-relaxed font-sans">
                        <strong>大師實操備忘：</strong><br />
                        {activeSig.master_notes || "無註記"}
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

        {/* ======================= TAB 5: SOP ======================= */}
        {activeTab === "sop" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left rule sheet details */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-6 shadow-lg space-y-4">
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FFB74D]" />
                  獅王戰神 V2026.Max 全域對沖量化鐵律與風控 SOP 白皮書
                </h2>
                <p className="text-xs text-zinc-450 leading-relaxed">
                  本系統严格執行華爾街自營部頂尖對沖策略，所有訊號裁決皆具備純數理與量價剛性約束。操盤手禁止任何手動違規逆勢交易，請嚴格遵循以下四大防護機制：
                </p>

                <hr className="border-zinc-800" />

                <div className="space-y-4 text-xs leading-relaxed">
                  
                  {/* VIX stop */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-rose-950 text-rose-400 flex items-center justify-center shrink-0 border border-rose-800/40">
                      <ShieldAlert className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">1. 總經 VIX E-Stop 斷路停買機制</h4>
                      <p className="text-zinc-400 mt-1">
                        系統即時爬取 VIX 恐慌指數。若 <strong>`VIX &gt; 30`</strong> 則強制亮起全站危險停買隔離狀態，此時買進訊號完全阻斷發送，僅允許停損與移動減碼。保留 70% 現金部位以抵禦宏觀巨震。
                      </p>
                    </div>
                  </div>

                  {/* Taipei hours filter */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-amber-950 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/40">
                      <Sliders className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">2. 台北標準時間交易濾網限制</h4>
                      <p className="text-zinc-400 mt-1">
                        校正時區為 <code>Asia/Taipei</code>。買進建倉訊號 <strong>僅限於台股盤中 09:00 - 13:30 允許觸發發送</strong>。盤後交易時段新訊號自動遮蔽進入「觀望」或「持倉」分析狀態，防止盤後滑價與無序波動。
                      </p>
                    </div>
                  </div>

                  {/* 20MA stop */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/40">
                      <Zap className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">3. 生命線 20MA (月線) 物理隔離停損</h4>
                      <p className="text-zinc-400 mt-1">
                        任何個股收盤價實體只要 <strong>跌破月線 20MA</strong>，策略一律亮起 <code>🔴 隔離</code> 燈號，強制操盤手發出停損清倉指令，严禁任何向下攤平交易！
                      </p>
                    </div>
                  </div>

                  {/* Profit Lock */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-yellow-950 text-[#FFB74D] flex items-center justify-center shrink-0 border border-yellow-800/40">
                      <Flame className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">4. 動態雙關卡停利與利潤奔跑</h4>
                      <p className="text-zinc-400 mt-1">
                        持倉部位帳面獲利達 <strong>+20% 時強制發出減碼 50% 鎖利指令</strong> 收回部分本金；剩餘 50% 部位以 <code>10MA</code> 或 <code>最高價回落 1.5 倍 ATR</code> 之較高者設為動態移動停利線，跌破則全數清倉落袋。
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right: Real-time blacklist filter */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#0e1117] border border-zinc-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-rose-400 text-sm font-bold flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4" />
                  當前物理隔離 / 量化避雷黑名單
                </h3>
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                  以下個股目前處於生命線 20MA 下方，或 40分量化戰力不足 33 分，已被列入隔離避雷區，全面禁止多頭建倉：
                </p>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {getBlacklistedStocks().length === 0 ? (
                    <p className="text-xs text-emerald-400 font-mono text-center py-4 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
                      🟢 目前全宇宙高 Beta 個股均站上生命線，狀態極佳。
                    </p>
                  ) : (
                    getBlacklistedStocks().map(s => {
                      return (
                        <div key={s.stock_id} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-white">{s.stock_id}</span>
                            <span className="text-zinc-450 ml-1.5 font-bold">{s.stock_name}</span>
                            <div className="text-[9px] text-zinc-550 font-mono mt-0.5">現價: {s.close_price.toFixed(1)} 元</div>
                          </div>

                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-955 border border-rose-500/30 text-rose-400">
                              隔離 ({s.score}分)
                            </span>
                            <div className="text-[8px] text-zinc-650 font-mono mt-1">20MA: {s.stop_loss_price.toFixed(1)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-850 bg-[#0d0f14] py-5 text-center text-xs text-zinc-550 font-mono mt-12">
        <div className="w-full max-w-[1700px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span>© 2026 獅王量化交易基金會. All rights reserved. 獅王戰神 V2026.Max 終極大一統核心.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-emerald-400">● 雲端 MONGODB ATLAS 同步對接正常</span>
            <span>|</span>
            <span className="text-[10px] text-amber-500">ANTIGRAVITY STABLE FLIGHT</span>
          </div>
        </div>
      </footer>

      {/* ============================================================================== */}
      {/* 🚀 MODALS SECTION */}
      {/* ============================================================================== */}
      
      {/* 1. BUY SIMULATED POSITION MODAL */}
      <AnimatePresence>
        {showBuyModal && buyStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1117] border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative"
            >
              
              {/* Close Button */}
              <button 
                onClick={() => setShowBuyModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-white text-base font-bold flex items-center gap-2 mb-2">
                <Sliders className="w-4.5 h-4.5 text-[#FFB74D]" />
                模擬交易建倉指令 (NT$ 20,000 上限)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                系統遵循鐵律：每檔標的最高交易額上限限制為 <strong>NT$ 20,000 元整</strong>。已自動計算最優股數，請進行確認：
              </p>

              <div className="space-y-3 font-mono text-xs bg-zinc-950 p-4 rounded-lg border border-zinc-900 mb-5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">建倉標的:</span>
                  <span className="text-white font-bold">{buyStock.stock_id} {buyStock.stock_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">現行成交價:</span>
                  <span className="text-[#FFB74D] font-bold">{buyStock.close_price.toFixed(1)} 元</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-2.5">
                  <span className="text-zinc-500">建議股數 (2W預算):</span>
                  <span className="text-emerald-400 font-bold">{Math.floor(20000 / buyStock.close_price)} 股</span>
                </div>

                <div className="flex justify-between border-t border-zinc-900 pt-2.5 items-center">
                  <span className="text-zinc-500 font-sans">手動調整股數:</span>
                  <input 
                    type="number" 
                    value={buyShares}
                    onChange={(e) => setBuyShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-[#E5A823]"
                  />
                </div>

                <div className="flex justify-between border-t border-zinc-900 pt-2.5 items-center">
                  <span className="text-zinc-500 font-sans">交易成交價格:</span>
                  <input 
                    type="number" 
                    value={buyPrice}
                    step={0.1}
                    onChange={(e) => setBuyPrice(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-[#E5A823]"
                  />
                </div>

                <div className="flex justify-between border-t border-zinc-900 pt-2.5 font-bold text-sm">
                  <span className="text-zinc-400 font-sans">預計交易總成本:</span>
                  <span className="text-rose-400">{(buyPrice * buyShares).toLocaleString()} 元</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-lg hover:text-white transition"
                >
                  取消
                </button>
                <button
                  onClick={handleBuyOrderSubmit}
                  disabled={isSubmittingBuy || (buyPrice * buyShares > 25000)}
                  className={`px-5 py-2 rounded-lg font-bold text-xs ${
                    (buyPrice * buyShares > 25000)
                      ? "bg-zinc-800 text-zinc-650 cursor-not-allowed"
                      : "bg-[#E5A823] text-black hover:opacity-90 active:scale-[0.98] transition"
                  }`}
                >
                  {isSubmittingBuy ? "正在對衝建倉中..." : "🚀 確認模擬建倉"}
                </button>
              </div>

              {buyPrice * buyShares > 25000 && (
                <p className="text-[10px] text-rose-400 font-bold mt-2 font-mono text-right">
                  ⚠️ 警告: 交易成本超過 NT$ 25,000 的風控安全紅線！請調低股數
                </p>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EXIT SIMULATED POSITION MODAL */}
      <AnimatePresence>
        {showExitModal && exitStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1117] border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative"
            >
              
              <button 
                onClick={() => setShowExitModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-white text-base font-bold flex items-center gap-2 mb-2">
                <History className="w-4.5 h-4.5 text-[#FFB74D]" />
                模擬清倉出場結算 & AI 交易檢討
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                清倉部位後，系統將立刻調用 <code>Gemini 3.5-Flash</code> 大模型，針對此次交易之盈虧表現、量價防線進行深度的大師級實戰評估與檢討存檔。
              </p>

              <div className="space-y-3 font-mono text-xs bg-zinc-950 p-4 rounded-lg border border-zinc-900 mb-5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">出場標的:</span>
                  <span className="text-white font-bold">{exitStock.stock_id} {exitStock.stock_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">買入均價:</span>
                  <span className="text-zinc-400">{exitStock.buy_price.toFixed(1)} 元</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-2">
                  <span className="text-zinc-500">交易股數:</span>
                  <span className="text-zinc-300">{exitStock.shares} 股</span>
                </div>

                <div className="flex justify-between border-t border-zinc-900 pt-2 items-center">
                  <span className="text-zinc-500 font-sans">清倉結算價格:</span>
                  <input 
                    type="number" 
                    value={exitPrice}
                    step={0.1}
                    onChange={(e) => setExitPrice(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-[#E5A823]"
                  />
                </div>

                <div className="flex justify-between border-t border-zinc-900 pt-2 items-center">
                  <span className="text-zinc-500 font-sans">出場決策原因:</span>
                  <select
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#E5A823]"
                  >
                    <option value="移動停利">移動停利 (鎖定利潤)</option>
                    <option value="E-Stop 強制停損">E-Stop 強制停損</option>
                    <option value="手動清倉出場">手動清倉出場</option>
                    <option value="大盤高危壓制">大盤高危壓制 (VIX &gt; 30)</option>
                  </select>
                </div>

                {(() => {
                  const estProfit = Math.round((exitPrice - exitStock.buy_price) * exitStock.shares);
                  return (
                    <div className="flex justify-between border-t border-zinc-900 pt-2.5 font-bold text-sm">
                      <span className="text-zinc-400 font-sans">預計結算損益:</span>
                      <span className={estProfit >= 0 ? "text-rose-400" : "text-emerald-455"}>
                        {estProfit >= 0 ? `+${estProfit.toLocaleString()}` : estProfit.toLocaleString()} 元 ({Math.round(((exitPrice - exitStock.buy_price) / exitStock.buy_price) * 10000) / 100}%)
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-lg hover:text-white transition"
                >
                  取消
                </button>
                <button
                  onClick={handleExitOrderSubmit}
                  disabled={isSubmittingExit}
                  className="px-5 py-2 rounded-lg font-bold text-xs bg-[#E5A823] text-black hover:opacity-90 active:scale-[0.98] transition"
                >
                  {isSubmittingExit ? "正在召喚 AI 大師檢討交易中..." : "🚪 確認清倉結算"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
