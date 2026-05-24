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
  Sparkles,
  Paperclip,
  FileText,
  Link,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockSignal, ScanResult, StockSignalOption, HoldingItem, ExitLogItem } from "./types.js";
import { INITIAL_STOCKS } from "./initial_stocks.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachment?: {
    name: string;
    type: "image" | "text" | "link";
    data: string;
  };
}

interface InstitutionalFlow {
  date: string;
  foreign: number;
  trust: number;
  dealer: number;
  total: number;
}

const generateInstitutionalFlow = (stockId: string): InstitutionalFlow[] => {
  const seed = parseInt(stockId) || 2330;
  const flows: InstitutionalFlow[] = [];
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (i + (today.getDay() === 0 ? 2 : today.getDay() === 6 ? 1 : 0)));
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    dates.push(d.toISOString().substring(5, 10));
  }
  
  for (let i = 0; i < 5; i++) {
    const daySeed = seed + i * 457;
    const foreign = Math.floor(Math.sin(daySeed) * 1500) + (seed % 10 === 0 ? 500 : -200);
    const trust = Math.floor(Math.cos(daySeed) * 800) + (seed % 3 === 0 ? 300 : -100);
    const dealer = Math.floor(Math.sin(daySeed * 2.3) * 400) + 50;
    const total = foreign + trust + dealer;
    flows.push({
      date: dates[i],
      foreign,
      trust,
      dealer,
      total
    });
  }
  return flows;
};

interface QuantIndicators {
  winRate: number;
  exitStars: number;
  klinePattern: { name: string; desc: string };
  wBottomProb: number;
  mTopProb: number;
}

const getStockQuantIndicators = (stock: StockSignal): QuantIndicators => {
  const seed = (parseInt(stock.stock_id) || 2330) + stock.score * 7;
  const baseWinRate = Math.min(Math.max(Math.floor((stock.score / 40) * 50) + 40 + (seed % 10), 30), 96);
  
  let exitStars = 2;
  if (stock.score >= 35) exitStars = 1;
  else if (stock.score <= 20) exitStars = 4;
  else exitStars = 2 + (seed % 2);
  
  const patterns = [
    { name: "均線多頭排列", desc: "5MA/10MA/20MA多頭發散，支撐強勁" },
    { name: "跳空長紅突破", desc: "開盤跳空帶量上攻，買盤極其急迫" },
    { name: "十字星多空拉鋸", desc: "高檔窄幅震盪，多空勢均力敵" },
    { name: "長上影線滯漲", desc: "高檔遭遇賣壓，留意短線回檔" },
    { name: "回測月線支撐", desc: "跌深量縮回踩，20MA具防禦力" }
  ];
  
  let patternIdx = seed % patterns.length;
  if (stock.score >= 38) {
    patternIdx = seed % 2;
  } else if (stock.score <= 20) {
    patternIdx = 2 + (seed % 3);
  }
  
  const wBottomProb = Math.min(Math.max(Math.floor((stock.score / 40) * 60) + 30 + (seed % 8), 15), 92);
  const mTopProb = 100 - wBottomProb;
  
  return {
    winRate: baseWinRate,
    exitStars,
    klinePattern: patterns[patternIdx],
    wBottomProb,
    mTopProb
  };
};

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
  const [activeTab, setActiveTab] = useState<"radar" | "holdings" | "exits" | "chat" | "sop" | "strategy" | "screener">("radar");

  // Strategy Tab States
  const [strategySummary, setStrategySummary] = useState<any>(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState<boolean>(false);
  
  // Screener Tab States
  const [screenerCategories, setScreenerCategories] = useState<string[]>([]);
  const [selectedScreenerCategories, setSelectedScreenerCategories] = useState<string[]>([]);
  const [screenerMinScore, setScreenerMinScore] = useState<number>(38); // 預設 Score >= 38 精英模式
  const [screenerMaxPer, setScreenerMaxPer] = useState<number>(100); // PER limit
  const [screenerMinForeignDays, setScreenerMinForeignDays] = useState<number>(0);
  const [screenerMinInstDays, setScreenerMinInstDays] = useState<number>(0);
  const [screenerSortBy, setScreenerSortBy] = useState<string>("score_desc");
  const [screenerChangeRange, setScreenerChangeRange] = useState<string>("all"); // all, up, down, up_3, down_3

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

  // Extended details states
  const [extendedDetails, setExtendedDetails] = useState<any>(null);
  const [isLoadingExtended, setIsLoadingExtended] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<"notes" | "financials" | "insiders" | "filings">("notes");

  // Chat
  const [chatMessages, setChatMessages] = useState<Array<ChatMessage>>([
    {
      role: "assistant",
      content: "歡迎來到獅王戰備解盤室。我是您的「對沖基金 AI 避險大師」。請選擇您想要深度探討的個股，我將立刻調用盤中最新的量化與籌碼指標，為您剖析實戰對沖與避雷防線！"
    }
  ]);
  const [chatStockId, setChatStockId] = useState<string>("2330");
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Chat attachments states
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: "image" | "text" | "link";
    data: string;
    mimeType?: string;
  } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [cloudUrlInput, setCloudUrlInput] = useState<string>("");

  // Global Configs
  const [overrideTsmcState, setOverrideTsmcState] = useState<string>("auto"); // auto, force_green, force_red
  const [eliteOnly, setEliteOnly] = useState<boolean>(true); // Default filter out Score < 38
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
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

  const fetchStrategySummary = async () => {
    setIsStrategyLoading(true);
    try {
      const response = await fetch("/api/strategy-summary");
      const resData = await response.json();
      if (resData.success) {
        setStrategySummary(resData.data);
      }
    } catch (error) {
      console.error("Failed to fetch strategy summary:", error);
    } finally {
      setIsStrategyLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategySummary();
  }, [activeTab, data]);

  useEffect(() => {
    if (selectedStock) {
      const fetchExtendedDetails = async () => {
        setIsLoadingExtended(true);
        try {
          const response = await fetch(`/api/stock-details/${selectedStock.stock_id}`);
          const resData = await response.json();
          if (resData.success && resData.data) {
            setExtendedDetails(resData.data);
          } else {
            setExtendedDetails(null);
          }
        } catch (err) {
          console.error("Failed to fetch extended stock details:", err);
          setExtendedDetails(null);
        } finally {
          setIsLoadingExtended(false);
        }
      };
      fetchExtendedDetails();
    } else {
      setExtendedDetails(null);
    }
  }, [selectedStock]);

  useEffect(() => {
    if (data && data.signals && screenerCategories.length === 0) {
      const cats = Array.from(new Set(data.signals.map(s => s.category || "AI與權值")));
      setScreenerCategories(cats);
      setSelectedScreenerCategories(cats);
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

  // Bulk buy filtered stocks in Screener
  const handleBulkBuyFiltered = async () => {
    const targets = getScreenerFilteredSignals();
    if (targets.length === 0) return;
    setIsLoading(true);
    try {
      for (const stock of targets) {
        const shares = Math.floor(20000 / stock.close_price);
        if (shares <= 0) continue;
        await fetch("/api/holdings/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stock_id: stock.stock_id,
            stock_name: stock.stock_name,
            buy_price: stock.close_price,
            shares: shares
          })
        });
      }
      await fetchHoldings();
      setActiveTab("holdings");
    } catch (error) {
      console.error("Bulk buy failed:", error);
    } finally {
      setIsLoading(false);
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

  // Handle file select (image/text) with client-side canvas compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "image" | "text") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === "image") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress using HTML5 Canvas
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1000px maintains perfect OCR text quality while dropping footprint below 120KB
          const MAX_DIM = 1000;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to highly efficient JPEG at 0.75 quality
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            setAttachedFile({
              name: file.name,
              type: "image",
              data: compressedBase64,
              mimeType: "image/jpeg"
            });
          } else {
            // Context fallback
            setAttachedFile({
              name: file.name,
              type: "image",
              data: event.target?.result as string,
              mimeType: file.type
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // Limit text file size to 200KB to fit easily in LLM context window
      if (file.size > 200 * 1024) {
        alert("❌ 文字文件尺寸超過 200KB 限制！請選擇較小的純文字量化報表。");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          type: "text",
          data: event.target?.result as string
        });
      };
      reader.readAsText(file);
    }
    setShowAttachmentMenu(false);
  };

  // Handle cloud URL ingestion
  const handleCloudUrlSubmit = () => {
    if (!cloudUrlInput.trim()) return;
    setAttachedFile({
      name: cloudUrlInput.trim(),
      type: "link",
      data: cloudUrlInput.trim()
    });
    setCloudUrlInput("");
    setShowLinkInput(false);
    setShowAttachmentMenu(false);
  };

  // Send AI Chat message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() && !attachedFile) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    
    // Construct user message object with attachment
    const userMessageObj = { 
      role: "user" as const, 
      content: userMsg || (attachedFile ? `[已匯入附件: ${attachedFile.name}]` : ""),
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        data: attachedFile.data
      } : undefined
    };
    
    // Add user message to UI
    const updatedMessages = [...chatMessages, userMessageObj];
    setChatMessages(updatedMessages);
    setIsSendingChat(true);

    // Save attached file ref for cleanup and payload
    const filePayload = attachedFile;
    setAttachedFile(null); // Clear attachment slot on UI

    try {
      const response = await fetch("/api/stocks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // CRITICAL: Strip giant Base64 strings of previous messages to prevent 413 Payload Too Large!
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          stock_id: chatStockId || undefined,
          fileData: filePayload || undefined
        })
      });

      // Defensive checking of HTTP Status codes before parsing JSON to give rich UX debug details
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("資料體過大 (413 Payload Too Large)。Vercel 限制單次 Request Body 必須在 4.5MB 以內，大師已為您剔除歷史 Base64，請再次點擊發送！");
        }
        if (response.status === 504) {
          throw new Error("執行超時 (504 Gateway Timeout)。由於 Vercel 免費版限制 Serverless 運行最長 10 秒，請縮減圖片寬度或減少文字內容後重試！");
        }
        if (response.status === 500) {
          throw new Error("伺服器錯誤 (500 Internal Server Error)。可能是後端 GEMINI_API_KEY 金鑰配置失效，或 Google AI 服務過載。");
        }
        throw new Error(`HTTP 錯誤狀態碼: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.reply) {
        setChatMessages([...updatedMessages, { role: "assistant" as const, content: resData.reply }]);
      } else {
        setChatMessages([...updatedMessages, { role: "assistant" as const, content: "⚠️ 訊號不穩定，大師正在喝茶，請重試。" }]);
      }
    } catch (error: any) {
      console.error("Chat API error:", error);
      const errMsg = error?.message || "網路連線異常";
      setChatMessages([
        ...updatedMessages, 
        { 
          role: "assistant" as const, 
          content: `❌ 對接 AI 中樞失敗：${errMsg}。請稍後重試，或手動查驗 Vercel / Google AI 金鑰配置。` 
        }
      ]);
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

    // Elite threshold check (default: score >= 38)
    if (eliteOnly) {
      result = result.filter(s => s.score >= 38);
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

  // Blacklisted stocks (Below 20MA or Score < 38)
  const getBlacklistedStocks = () => {
    if (!data || !data.signals) return [];
    return data.signals.filter(s => s.close_price < s.stop_loss_price || s.score < 38);
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
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.12)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          🟢 物理隔離
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-800 border border-zinc-700 text-zinc-400 inline-flex items-center gap-1">
        ⚪ 觀望持倉
      </span>
    );
  };

  const renderActionBadge = (action: string) => {
    if (!action) return null;
    let className = "bg-zinc-800 text-zinc-400 border border-zinc-700/50";
    if (action.includes("減碼")) {
      className = "bg-amber-950 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
    } else if (action.includes("加碼") || action.includes("買進") || action.includes("停利") || action.includes("買")) {
      className = "bg-rose-950 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]";
    } else if (action.includes("續抱") || action.includes("持倉") || action.includes("停損") || action.includes("清倉") || action.includes("賣")) {
      className = "bg-emerald-950 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]";
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${className}`}>
        {action}
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

  const getOnTheFlySummary = () => {
    if (!data || !data.signals) return null;
    const categories: Record<string, { totalScore: number; totalChangePct: number; count: number; category: string }> = {};
    let totalScore = 0;
    let totalChangePct = 0;
    let totalCount = 0;
    let multiCount = 0;
    let emptyCount = 0;
    let holdCount = 0;
    let isoCount = 0;

    data.signals.forEach(s => {
      const cat = s.category || "AI與權值";
      if (!categories[cat]) {
        categories[cat] = { totalScore: 0, totalChangePct: 0, count: 0, category: cat };
      }
      categories[cat].totalScore += s.score || 0;
      categories[cat].totalChangePct += s.change_pct || 0;
      categories[cat].count += 1;

      totalScore += s.score || 0;
      totalChangePct += s.change_pct || 0;
      totalCount += 1;

      if (s.signal === "多") multiCount++;
      else if (s.signal === "空") emptyCount++;
      else if (s.signal === "持倉") holdCount++;
      else if (s.signal === "隔離") isoCount++;
    });

    const categoryStats = Object.values(categories).map(c => ({
      category: c.category,
      avgScore: Math.round((c.totalScore / c.count) * 10) / 10,
      avgChangePct: Math.round((c.totalChangePct / c.count) * 100) / 100,
      count: c.count
    }));

    const avgScore = totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0;
    const avgChangePct = totalCount > 0 ? Math.round((totalChangePct / totalCount) * 100) / 100 : 0;

    const vix = data.vixValue;
    const macroEStop = data.macroEStopActive;
    
    let sentiment = "震盪整理";
    let sentimentColor = "text-yellow-400";
    let sentimentBg = "bg-yellow-950/20 border-yellow-500/30";
    let sentimentScore = Math.round((avgScore / 40) * 100);

    if (macroEStop || vix > 30) {
      sentiment = "恐慌防禦 (崩盤避險)";
      sentimentColor = "text-[#10b881]"; // Green (down)
      sentimentBg = "bg-emerald-950/30 border-emerald-500/30";
    } else if (avgScore >= 30 && avgChangePct > 0.5) {
      sentiment = "極度樂觀 (多頭特快)";
      sentimentColor = "text-[#f43f5e]"; // Red (up)
      sentimentBg = "bg-rose-950/30 border-rose-500/40";
    } else if (avgScore >= 25 && avgChangePct >= -0.2) {
      sentiment = "審慎偏多 (右側點火)";
      sentimentColor = "text-[#f43f5e]";
      sentimentBg = "bg-rose-950/20 border-rose-500/25";
    } else if (avgScore < 20 || avgChangePct < -1.0) {
      sentiment = "空頭防禦 (全面減碼)";
      sentimentColor = "text-[#10b881]";
      sentimentBg = "bg-emerald-950/20 border-emerald-500/20";
    }

    return {
      categoryStats,
      overall: {
        avgScore,
        avgChangePct,
        totalCount,
        multiCount,
        emptyCount,
        holdCount,
        isoCount,
        sentiment,
        sentimentColor,
        sentimentBg,
        sentimentScore,
        vix,
        macroEStop
      }
    };
  };

  const summary = strategySummary || getOnTheFlySummary();

  const getScreenerFilteredSignals = () => {
    if (!data || !data.signals) return [];
    return data.signals.filter(s => {
      // Category check
      if (selectedScreenerCategories.length > 0 && !selectedScreenerCategories.includes(s.category || "AI與權值")) {
        return false;
      }
      // Score check
      if (s.score < screenerMinScore) {
        return false;
      }
      // PER check
      if (s.per > screenerMaxPer) {
        return false;
      }
      // Foreign Days check
      if (s.foreignDays < screenerMinForeignDays) {
        return false;
      }
      // Inst Days check
      if (s.instDays < screenerMinInstDays) {
        return false;
      }
      // Change range check
      if (screenerChangeRange === "up" && s.change_pct < 0) return false;
      if (screenerChangeRange === "down" && s.change_pct >= 0) return false;
      if (screenerChangeRange === "up_3" && s.change_pct < 3) return false;
      if (screenerChangeRange === "down_3" && s.change_pct > -3) return false;
      
      return true;
    }).sort((a, b) => {
      if (screenerSortBy === "score_desc") return b.score - a.score;
      if (screenerSortBy === "score_asc") return a.score - b.score;
      if (screenerSortBy === "change_desc") return b.change_pct - a.change_pct;
      if (screenerSortBy === "change_asc") return a.change_pct - b.change_pct;
      if (screenerSortBy === "per_asc") return a.per - b.per;
      if (screenerSortBy === "foreign_desc") return b.foreignDays - a.foreignDays;
      return 0;
    });
  };

  const screenerFiltered = getScreenerFilteredSignals();

  const vixStatus = getVixStatusText();


  // ======================= CLOSURE: RENDER DETAILS CONTENT =======================
  const renderStockDetailsContent = () => {
    if (!selectedStock) return null;
    return (
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
                        <div className={`text-xs font-bold font-mono mt-0.5 ${selectedStock.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {selectedStock.change_pct >= 0 ? `+${selectedStock.change_pct.toFixed(2)}` : selectedStock.change_pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <hr className="border-zinc-850" />

                    {/* Tab Navigation inside Sidebar */}
                    <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-center font-bold font-mono my-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                      <button
                        onClick={() => setDetailTab("notes")}
                        className={`py-2 text-[9px] rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                          detailTab === "notes"
                            ? "bg-[#E5A823] text-black shadow font-black"
                            : "text-zinc-450 hover:text-white"
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>實戰備忘</span>
                      </button>
                      <button
                        onClick={() => setDetailTab("financials")}
                        className={`py-2 text-[9px] rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                          detailTab === "financials"
                            ? "bg-[#E5A823] text-black shadow font-black"
                            : "text-zinc-450 hover:text-white"
                        }`}
                      >
                        <LineChart className="w-3.5 h-3.5" />
                        <span>財務分析</span>
                      </button>
                      <button
                        onClick={() => setDetailTab("insiders")}
                        className={`py-2 text-[9px] rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                          detailTab === "insiders"
                            ? "bg-[#E5A823] text-black shadow font-black"
                            : "text-zinc-450 hover:text-white"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>籌碼內線</span>
                      </button>
                      <button
                        onClick={() => setDetailTab("filings")}
                        className={`py-2 text-[9px] rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                          detailTab === "filings"
                            ? "bg-[#E5A823] text-black shadow font-black"
                            : "text-zinc-450 hover:text-white"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>SEC/新聞</span>
                      </button>
                    </div>

                    {/* Tab Contents */}
                    {detailTab === "notes" && (
                      <div className="flex flex-col gap-4">
                        {/* ================= NEW: Wiying 6669 SPEC ================= */}
                        {(() => {
                          const quant = getStockQuantIndicators(selectedStock);
                          return (
                            <>
                              {/* Circular Win-Rate Ring & Whale Alert */}
                              <div className="flex items-center gap-4 bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                      className="text-zinc-850"
                                      strokeWidth="3.5"
                                      stroke="currentColor"
                                      fill="none"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                      className={quant.winRate >= 70 ? "text-[#f43f5e]" : quant.winRate >= 50 ? "text-[#FFB74D]" : "text-[#10b881]"}
                                      strokeWidth="3.5"
                                      strokeDasharray={`${quant.winRate}, 100`}
                                      strokeLinecap="round"
                                      stroke="currentColor"
                                      fill="none"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                  </svg>
                                  <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-mono font-black text-white">{quant.winRate}%</span>
                                    <span className="text-[6px] text-zinc-500 scale-90">勝率</span>
                                  </div>
                                </div>
                                
                                <div className="flex-1 space-y-1 text-[10px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 font-bold">量化短線勝率</span>
                                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[8px] ${
                                      quant.winRate >= 70 ? "bg-rose-950/70 text-[#f43f5e]" : quant.winRate >= 50 ? "bg-yellow-950/70 text-[#FFB74D]" : "bg-emerald-950/70 text-[#10b881]"
                                    }`}>
                                      {quant.winRate >= 70 ? "🔥 偏高 (極佳)" : quant.winRate >= 50 ? "⚡ 中等 (觀望)" : "🟢 偏低 (防禦)"}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">主力出貨警示</span>
                                    <div className="flex items-center gap-0.5 text-zinc-650">
                                      {[1, 2, 3, 4, 5].map(star => {
                                        const isActive = star <= quant.exitStars;
                                        const starColor = quant.exitStars >= 4 ? "text-[#10b881]" : quant.exitStars <= 2 ? "text-[#f43f5e]" : "text-[#FFB74D]";
                                        return (
                                          <span key={star} className={`font-bold text-[10px] ${isActive ? starColor : "text-zinc-800"}`}>
                                            ★
                                          </span>
                                        );
                                      })}
                                      <span className="text-[7px] text-zinc-500 ml-1">
                                        ({quant.exitStars >= 4 ? "極高風險" : quant.exitStars <= 2 ? "安全低危" : "中度觀察"})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>


                    {/* ================= NEW: AI TRAFFIC LIGHTS & INTENTION BARS (PROFESSIONAL SPEC) ================= */}
                    {(() => {
                      const washout = Math.round(((selectedStock.score * 7 + 13) % 45) + 30);
                      const accum = Math.round(selectedStock.score >= 35 ? (((selectedStock.score - 30) * 8) + 20) : ((selectedStock.score % 5) * 6 + 10));
                      const distrib = Math.round(quant.exitStars * 20);
                      const squeeze = Math.round(((selectedStock.score * 3) % 30) + 15);
                      const bullTrap = Math.round(selectedStock.change_pct > 3 ? 65 : 15 + (selectedStock.score % 5) * 5);
                      const bearTrap = Math.round(selectedStock.change_pct < -2 ? 60 : 10 + (selectedStock.score % 3) * 6);
                      const biasVwap = Math.round(((selectedStock.close_price - selectedStock.dynamicTiers.vwap5d) / selectedStock.dynamicTiers.vwap5d) * 100 * 10) / 10;

                      // Traffic light active state
                      let activeLight = "green"; // green, yellow, red
                      if (quant.exitStars >= 4 || selectedStock.action_signal.includes("停損") || selectedStock.signal === "隔離") {
                        activeLight = "red";
                      } else if (selectedStock.score >= 38 || biasVwap >= 4) {
                        activeLight = "yellow";
                      }

                      // Probability calculation
                      const upProb = Math.min(95, Math.max(10, Math.round((selectedStock.score / 40) * 65 + (selectedStock.change_pct > 0 ? 10 : -5))));
                      const downProb = Math.min(90, Math.max(5, Math.round((100 - upProb) * 0.65)));
                      const flatProb = 100 - upProb - downProb;

                      return (
                        <>
                          {/* Traffic Lights & Daily Probability Segment */}
                          <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-855 border-zinc-800">
                            
                            {/* Left: Indicator Lights */}
                            <div className="flex flex-col items-center justify-between border-r border-zinc-900 pr-1 select-none">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-1 w-full text-center">AI 飆股預警燈號系統</span>
                              
                              <div className="w-10 bg-zinc-900 p-1.5 rounded-xl border border-zinc-850 flex flex-col gap-2 items-center shadow-inner">
                                {/* Red Light */}
                                <div className="relative group">
                                  <div className={`w-6 h-6 rounded-full transition-all duration-300 ${
                                    activeLight === "red" 
                                      ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]" 
                                      : "bg-zinc-800 opacity-20"
                                  }`} />
                                  {activeLight === "red" && <span className="absolute left-7 top-1 text-[8px] font-bold text-rose-400 whitespace-nowrap">主力出貨</span>}
                                </div>
                                
                                {/* Yellow Light */}
                                <div className="relative group">
                                  <div className={`w-6 h-6 rounded-full transition-all duration-300 ${
                                    activeLight === "yellow" 
                                      ? "bg-amber-500 shadow-[0_0_12px_#ffb74d]" 
                                      : "bg-zinc-800 opacity-20"
                                  }`} />
                                  {activeLight === "yellow" && <span className="absolute left-7 top-1 text-[8px] font-bold text-amber-400 whitespace-nowrap">過熱整理</span>}
                                </div>
                                
                                {/* Green Light */}
                                <div className="relative group">
                                  <div className={`w-6 h-6 rounded-full transition-all duration-300 ${
                                    activeLight === "green" 
                                      ? "bg-emerald-500 shadow-[0_0_12px_#10b881]" 
                                      : "bg-zinc-800 opacity-20"
                                  }`} />
                                  {activeLight === "green" && <span className="absolute left-7 top-1 text-[8px] font-bold text-emerald-400 whitespace-nowrap">安全買點</span>}
                                </div>
                              </div>

                              <span className="text-[7px] text-zinc-500 font-mono mt-1 text-center scale-90">
                                狀態: {activeLight === "red" ? "高檔震盪，留意回檔" : activeLight === "yellow" ? "過熱修正，多頭調整" : "結構安全，低檔蓄勢"}
                              </span>
                            </div>

                            {/* Right: Tomorrow probability prediction */}
                            <div className="flex flex-col justify-between pl-1">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-1 text-center">明日漲跌機率預測 (AI)</span>
                              
                              <div className="space-y-1.5 font-mono text-[9px] py-1">
                                {/* Up Probability */}
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-zinc-400">
                                    <span>上漲率:</span>
                                    <span className="text-[#f43f5e] font-bold">{upProb}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${upProb}%` }}></div>
                                  </div>
                                </div>

                                {/* Down Probability */}
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-zinc-400">
                                    <span>下跌率:</span>
                                    <span className="text-[#10b881] font-bold">{downProb}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${downProb}%` }}></div>
                                  </div>
                                </div>

                                {/* Flat Probability */}
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-zinc-400">
                                    <span>震盪率:</span>
                                    <span className="text-[#FFB74D] font-bold">{flatProb}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${flatProb}%` }}></div>
                                  </div>
                                </div>
                              </div>

                              <span className="text-[7px] text-zinc-550 mt-1 text-center scale-90">
                                大數據模擬多空對抗結論
                              </span>
                            </div>

                          </div>

                          {/* AI Main Force Intention Bars */}
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-2">
                            <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-[#FFB74D]" />
                              🤖 AI 主力意圖與多空能量分析
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[8px] font-mono">
                              {/* Intention 1: Washout */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>主力洗盤意圖:</span>
                                  <span className="text-white font-bold">{washout}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${washout}%` }}></div>
                                </div>
                              </div>

                              {/* Intention 2: Accumulation */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>主力吸籌力道:</span>
                                  <span className="text-[#f43f5e] font-bold">{accum}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{ width: `${accum}%` }}></div>
                                </div>
                              </div>

                              {/* Intention 3: Distribution */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>主力出貨風險:</span>
                                  <span className="text-[#10b881] font-bold">{distrib}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${distrib}%` }}></div>
                                </div>
                              </div>

                              {/* Intention 4: Squeeze */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>空頭壓制/軋空:</span>
                                  <span className="text-indigo-400 font-bold">{squeeze}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${squeeze}%` }}></div>
                                </div>
                              </div>

                              {/* Intention 5: Bull Trap */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>高檔誘多風險:</span>
                                  <span className={`font-bold ${bullTrap > 50 ? "text-[#f43f5e]" : "text-zinc-400"}`}>{bullTrap}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className={`h-full ${bullTrap > 50 ? "bg-rose-500" : "bg-zinc-700"}`} style={{ width: `${bullTrap}%` }}></div>
                                </div>
                              </div>

                              {/* Intention 6: Bear Trap */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-zinc-400">
                                  <span>低檔誘空機率:</span>
                                  <span className={`font-bold ${bearTrap > 50 ? "text-[#10b881]" : "text-zinc-400"}`}>{bearTrap}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className={`h-full ${bearTrap > 50 ? "bg-emerald-500" : "bg-zinc-700"}`} style={{ width: `${bearTrap}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SVG Pattern Analysis Diagram */}
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-2 select-none">
                            <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <Sliders className="w-3 h-3 text-[#FFB74D]" />
                              📐 關鍵K線型態分析 (SVG Pattern Preview)
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                              
                              {/* W Bottom Column */}
                              <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80 flex flex-col items-center gap-1.5 text-center">
                                <span className="text-[8px] font-bold text-zinc-450 uppercase">W底 (多頭爆發型態)</span>
                                
                                <div className="relative w-24 h-12 bg-zinc-950 rounded border border-zinc-900/50 flex items-center justify-center p-1">
                                  <svg className="w-full h-full" viewBox="0 0 100 50">
                                    {/* Neckline */}
                                    <line x1="10" y1="20" x2="90" y2="20" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" />
                                    <text x="80" y="16" fill="#f43f5e" fontSize="6" fontFamily="sans-serif">頸線</text>
                                    
                                    {/* W Path */}
                                    <path 
                                      d="M 15 15 L 30 40 L 45 25 L 60 40 L 80 10" 
                                      fill="none" 
                                      stroke={selectedStock.score >= 35 ? "#10b881" : "#2a2f3f"} 
                                      strokeWidth="2" 
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={selectedStock.score >= 35 ? "animate-pulse" : ""}
                                    />
                                  </svg>
                                </div>
                                
                                <span className={`text-[7px] font-bold leading-tight ${selectedStock.score >= 35 ? "text-[#10b881]" : "text-zinc-500"}`}>
                                  {selectedStock.score >= 35 ? "✓ 多頭強勢，頸線突破中" : "✕ 標準W底未成形"}
                                </span>
                              </div>

                              {/* M Top Column */}
                              <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80 flex flex-col items-center gap-1.5 text-center">
                                <span className="text-[8px] font-bold text-zinc-450 uppercase">M頭 (轉弱風險型態)</span>
                                
                                <div className="relative w-24 h-12 bg-zinc-950 rounded border border-zinc-900/50 flex items-center justify-center p-1">
                                  <svg className="w-full h-full" viewBox="0 0 100 50">
                                    {/* Neckline */}
                                    <line x1="10" y1="35" x2="90" y2="35" stroke="#10b881" strokeWidth="1" strokeDasharray="2,2" />
                                    <text x="80" y="44" fill="#10b881" fontSize="6" fontFamily="sans-serif">頸線</text>
                                    
                                    {/* M Path */}
                                    <path 
                                      d="M 15 40 L 30 15 L 45 30 L 60 15 L 80 45" 
                                      fill="none" 
                                      stroke={quant.exitStars >= 4 || selectedStock.score < 32 ? "#f43f5e" : "#2a2f3f"} 
                                      strokeWidth="2" 
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={quant.exitStars >= 4 || selectedStock.score < 32 ? "animate-pulse" : ""}
                                    />
                                  </svg>
                                </div>
                                
                                <span className={`text-[7px] font-bold leading-tight ${quant.exitStars >= 4 || selectedStock.score < 32 ? "text-[#f43f5e]" : "text-zinc-500"}`}>
                                  {quant.exitStars >= 4 || selectedStock.score < 32 ? "⚠ 警惕高檔震盪跌破頸線" : "✓ 未成形，安全無虞"}
                                </span>
                              </div>

                            </div>
                          </div>
                        </>
                      );
                    })()}

                              {/* ================= NEW: CORPORATE NET BUY TABLE & PATH PREDICTION ================= */}
                              {(() => {
                                const flows = generateInstitutionalFlow(selectedStock.stock_id);
                                const targetPrice = selectedStock.close_price * 1.05;
                                const supportPrice = selectedStock.close_price * 0.95;
                                const strongSupport = selectedStock.close_price * 0.90;
                                return (
                                  <>
                                    {/* 三大法人近 5 日籌碼動向 */}
                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-1.5">
                                      <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        <Sliders className="w-3 h-3 text-[#FFB74D]" />
                                        📊 三大法人近 5 日籌碼動態 (張)
                                      </h4>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-[8px] font-mono">
                                          <thead>
                                            <tr className="border-b border-zinc-850 text-zinc-500 uppercase pb-0.5">
                                              <th className="py-1">日期</th>
                                              <th className="py-1 text-right">外資</th>
                                              <th className="py-1 text-right">投信</th>
                                              <th className="py-1 text-right">自營商</th>
                                              <th className="py-1 text-right">合計</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                                            {flows.map((f, idx) => (
                                              <tr key={idx} className="hover:bg-zinc-900/40">
                                                <td className="py-1 text-zinc-450">{f.date}</td>
                                                <td className={`py-1 text-right font-bold ${f.foreign >= 0 ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                                  {f.foreign >= 0 ? `+${f.foreign}` : f.foreign}
                                                </td>
                                                <td className={`py-1 text-right font-bold ${f.trust >= 0 ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                                  {f.trust >= 0 ? `+${f.trust}` : f.trust}
                                                </td>
                                                <td className={`py-1 text-right font-bold ${f.dealer >= 0 ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                                  {f.dealer >= 0 ? `+${f.dealer}` : f.dealer}
                                                </td>
                                                <td className={`py-1 text-right font-black ${f.total >= 0 ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                                  {f.total >= 0 ? `+${f.total}` : f.total}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* 三大法人近 5 日合計買賣超直方圖 */}
                                    <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/60 space-y-1">
                                      <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono">
                                        <span>籌碼總量直方圖 (合計買賣超)</span>
                                        <span className="text-[#FFB74D] font-bold">近 5 日趨勢</span>
                                      </div>
                                      <div className="flex items-end justify-between h-14 pt-2 px-3 bg-zinc-900/40 rounded border border-zinc-950/80">
                                        {flows.map((f, idx) => {
                                          const maxAbsVal = Math.max(...flows.map(x => Math.abs(x.total)), 500);
                                          const heightPct = Math.min(100, (Math.abs(f.total) / maxAbsVal) * 100);
                                          const isPositive = f.total >= 0;
                                          return (
                                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                              {/* Tooltip */}
                                              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-800 text-[6px] font-mono font-bold text-white px-1 py-0.5 rounded pointer-events-none z-10 whitespace-nowrap shadow-xl">
                                                {isPositive ? "+" : ""}{f.total} 張
                                              </div>
                                              {/* Bar Column */}
                                              <div className="w-4 h-9 flex flex-col justify-end">
                                                {isPositive ? (
                                                  <div className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm shadow-[0_0_6px_rgba(244,63,94,0.3)]" style={{ height: `${heightPct * 0.5}%` }}></div>
                                                ) : (
                                                  <div className="w-full bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-b-sm shadow-[0_0_6px_rgba(16,185,129,0.3)]" style={{ height: `${heightPct * 0.5}%` }}></div>
                                                )}
                                              </div>
                                              <span className="text-[6px] text-zinc-550 mt-1 font-mono">{f.date}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* 月線/VWAP 大戶乖離率儀表盤 */}
                                    {(() => {
                                      const biasVwap = Math.round(((selectedStock.close_price - selectedStock.dynamicTiers.vwap5d) / selectedStock.dynamicTiers.vwap5d) * 100 * 10) / 10;
                                      const clampedBias = Math.min(10, Math.max(-10, biasVwap));
                                      return (
                                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-2 flex flex-col items-center">
                                          <div className="flex justify-between items-center w-full text-[9px] text-zinc-500 font-mono">
                                            <span>大戶成本乖離率儀表板 (VWAP)</span>
                                            <span className={`font-bold ${biasVwap >= 2 ? "text-[#f43f5e]" : biasVwap <= -2 ? "text-[#10b881]" : "text-[#FFB74D]"}`}>
                                              {biasVwap > 0 ? "+" : ""}{biasVwap}%
                                            </span>
                                          </div>
                                          
                                          {/* Semicircular SVG Gauge */}
                                          <div className="relative w-32 h-16 mt-1 flex items-center justify-center">
                                            <svg className="w-full h-full" viewBox="0 0 100 50">
                                              <defs>
                                                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                  <stop offset="0%" stopColor="#10b881" />
                                                  <stop offset="50%" stopColor="#FFB74D" />
                                                  <stop offset="100%" stopColor="#f43f5e" />
                                                </linearGradient>
                                              </defs>
                                              {/* Arc Track */}
                                              <path 
                                                d="M 10 50 A 40 40 0 0 1 90 50" 
                                                fill="none" 
                                                stroke="url(#gaugeGrad)" 
                                                strokeWidth="8" 
                                                strokeLinecap="round"
                                                opacity="0.85"
                                              />
                                              {/* Needle Center Pin */}
                                              <circle cx="50" cy="50" r="4" fill="#ffffff" />
                                              {/* Dial Needle */}
                                              <line 
                                                x1="50" y1="50" 
                                                x2="50" y2="18" 
                                                stroke="#ffffff" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round"
                                                transform={`rotate(${clampedBias * 9}, 50, 50)`}
                                                style={{ transformOrigin: "50px 50px", transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                              />
                                            </svg>
                                            <div className="absolute bottom-0 text-[8px] text-zinc-500 font-mono flex justify-between w-full px-2">
                                              <span>超跌(-10%)</span>
                                              <span className="font-bold text-zinc-400">大戶平價</span>
                                              <span>過熱(+10%)</span>
                                            </div>
                                          </div>
                                          <div className="text-[8px] text-zinc-550 leading-tight text-center font-sans mt-1">
                                            當前價位與大戶成本 {selectedStock.dynamicTiers.vwap5d} 元之偏離率。
                                            {biasVwap > 5 ? (
                                              <span className="text-[#f43f5e] font-bold block mt-0.5">⚠️ 乖離偏高，嚴防追高，等待拉回！</span>
                                            ) : biasVwap < -3 ? (
                                              <span className="text-[#10b881] font-bold block mt-0.5">🟢 乖離偏低，多頭結構伏擊安全區。</span>
                                            ) : (
                                              <span className="text-[#FFB74D] font-bold block mt-0.5">🟡 籌碼持穩，大戶支撐定錨水位。</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* 關鍵價位區與可能路徑動態預測 */}
                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-2">
                                      <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        <Zap className="w-3 h-3 text-[#FFB74D]" />
                                        🗺️ 關鍵價位與主力沙盤路徑預測
                                      </h4>
                                      
                                      {/* Key Levels Grid */}
                                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-[7px] bg-zinc-900/20 p-1 rounded-lg border border-zinc-900">
                                        <div className="flex flex-col p-0.5 rounded">
                                          <span className="text-zinc-550 text-[6px]">壓力參考</span>
                                          <span className="text-[#f43f5e] font-extrabold">{targetPrice.toFixed(1)}</span>
                                        </div>
                                        <div className="flex flex-col p-0.5 rounded">
                                          <span className="text-zinc-550 text-[6px]">支撐參考</span>
                                          <span className="text-[#FFB74D] font-extrabold">{supportPrice.toFixed(1)}</span>
                                        </div>
                                        <div className="flex flex-col p-0.5 rounded">
                                          <span className="text-zinc-550 text-[6px]">強支撐區</span>
                                          <span className="text-[#10b881] font-extrabold">{strongSupport.toFixed(1)}</span>
                                        </div>
                                        <div className="flex flex-col p-0.5 rounded">
                                          <span className="text-[#10b881] text-[6px] font-bold">防呆停損</span>
                                          <span className="text-[#10b881] font-extrabold">{selectedStock.stop_loss_price?.toFixed(1) || "-"}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Predicted Paths */}
                                      <div className="space-y-1.5 text-[9px] leading-relaxed">
                                        <div className="p-1.5 rounded bg-rose-950/20 border border-rose-900/30">
                                          <div className="font-bold text-[#f43f5e] flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-[#f43f5e]"></span>
                                            📈 上漲路徑 (多頭突破點火)
                                          </div>
                                          <p className="text-zinc-400 text-[8px] mt-0.5">
                                            量能擴增站穩壓力 {targetPrice.toFixed(1)} 元，多頭將啟動新一輪波段上攻，挑戰波段停利目標。
                                          </p>
                                        </div>
                                        
                                        <div className="p-1.5 rounded bg-yellow-950/20 border border-yellow-900/30">
                                          <div className="font-bold text-[#FFB74D] flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-[#FFB74D]"></span>
                                            🔄 回檔路徑 (量縮回踩月線)
                                          </div>
                                          <p className="text-zinc-400 text-[8px] mt-0.5">
                                            高檔買盤滯漲，若跌破現價，可能回測 20MA 支撐區 {supportPrice.toFixed(1)} 元進行高密籌碼洗盤。
                                          </p>
                                        </div>
                                        
                                        <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-900/30">
                                          <div className="font-bold text-[#10b881] flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-[#10b881]"></span>
                                            🛡️ 轉弱路徑 (跌破強支撐防禦)
                                          </div>
                                          <p className="text-zinc-400 text-[8px] mt-0.5">
                                            若不幸失守強支撐 {strongSupport.toFixed(1)} 元並跌破防呆停損 {(selectedStock.stop_loss_price || 0).toFixed(1)} 元，多頭結構轉向，系統無條件執行清倉防守。
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}

                              {/* Shape and K-line Analysis */}
                              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 space-y-1.5">
                                <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                                  <Sliders className="w-3 h-3 text-[#FFB74D]" />
                                  🤖 AI 形態與 K 線結論
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono">
                                  <div className="bg-zinc-900/40 p-1 rounded border border-zinc-900">
                                    <div className="text-zinc-500 text-[7px] mb-0.5">W底 (多頭型態) 機率</div>
                                    <div className="text-[10px] font-black text-[#f43f5e]">{quant.wBottomProb}%</div>
                                    <div className="w-full h-0.5 bg-zinc-850 rounded-full overflow-hidden mt-0.5">
                                      <div className="h-full bg-[#f43f5e]" style={{ width: `${quant.wBottomProb}%` }}></div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-zinc-900/40 p-1 rounded border border-zinc-900">
                                    <div className="text-zinc-500 text-[7px] mb-0.5">M頭 (轉向型態) 機率</div>
                                    <div className="text-[10px] font-black text-[#10b881]">{quant.mTopProb}%</div>
                                    <div className="w-full h-0.5 bg-zinc-850 rounded-full overflow-hidden mt-0.5">
                                      <div className="h-full bg-[#10b881]" style={{ width: `${quant.mTopProb}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-zinc-900/25 p-1.5 rounded border border-zinc-900 text-[9px] font-sans text-zinc-300 flex items-start gap-1">
                                  <span className="text-[#FFB74D]">💡</span>
                                  <div>
                                    <span className="font-bold text-white">K線特徵：{quant.klinePattern.name}</span>
                                    <p className="text-[8px] text-zinc-550 mt-0.5">{quant.klinePattern.desc}</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
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
                            {renderActionBadge(selectedStock.action_signal)}
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
                                    <span className="text-[#f43f5e] font-bold">🟢 符合 (+1)</span>
                                  ) : (
                                    <span className="text-zinc-655 text-zinc-600">🔴 未符合 (0)</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {detailTab === "financials" && (
                      <div className="flex flex-col gap-4">
                        {isLoadingExtended ? (
                          <div className="space-y-4 animate-pulse p-2">
                            <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                            <div className="h-24 bg-zinc-850 rounded"></div>
                            <div className="h-4 bg-zinc-850 rounded w-1/2"></div>
                            <div className="h-20 bg-zinc-850 rounded"></div>
                          </div>
                        ) : extendedDetails ? (
                          <div className="flex flex-col gap-4 text-xs">
                            {/* Profile */}
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-2">
                              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                🏢 公司基本資訊 (Profile)
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div><span className="text-zinc-500">板塊:</span> <span className="text-white font-bold">{extendedDetails.profile?.sector || selectedStock.category}</span></div>
                                <div><span className="text-zinc-500">行業:</span> <span className="text-white font-bold">{extendedDetails.profile?.industry || selectedStock.industry}</span></div>
                                <div><span className="text-zinc-500">員工:</span> <span className="text-white font-bold">{extendedDetails.profile?.employees ? extendedDetails.profile.employees.toLocaleString() : "無數據"} 人</span></div>
                                <div><span className="text-zinc-500">地區:</span> <span className="text-white font-bold">{extendedDetails.profile?.country || "Taiwan"}</span></div>
                              </div>
                              {extendedDetails.profile?.website && (
                                <div className="text-[9px] font-mono text-zinc-500 truncate pt-1 border-t border-zinc-900/50">
                                  官網: <a href={extendedDetails.profile.website} target="_blank" rel="noopener noreferrer" className="text-[#FFB74D] hover:underline">{extendedDetails.profile.website}</a>
                                </div>
                              )}
                              <div className="text-[10px] text-zinc-400 font-sans leading-relaxed pt-2 border-t border-zinc-900 max-h-36 overflow-y-auto pr-1">
                                {extendedDetails.profile?.summary || "無詳細公司介紹數據。"}
                              </div>
                            </div>

                            {/* Financials Table */}
                            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850/80 space-y-2">
                              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                📊 近四季財務表現 (Financials)
                              </h4>
                              {extendedDetails.financials && extendedDetails.financials.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse table-auto text-[9px] font-mono">
                                    <thead>
                                      <tr className="border-b border-zinc-850 text-zinc-500 uppercase pb-1">
                                        <th className="py-1">季度</th>
                                        <th className="py-1 text-right">營收 (億)</th>
                                        <th className="py-1 text-right">淨利 (億)</th>
                                        <th className="py-1 text-right text-[#f43f5e]">毛利%</th>
                                        <th className="py-1 text-right text-[#FFB74D]">營利%</th>
                                        <th className="py-1 text-right">EPS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {extendedDetails.financials.map((f: any, idx: number) => (
                                        <tr key={idx} className="border-b border-zinc-900/40 hover:bg-zinc-900/30">
                                          <td className="py-1 text-zinc-300 font-bold">{f.period}</td>
                                          <td className="py-1 text-right text-white">{f.revenue ? (f.revenue / 100000000).toFixed(1) : "0.0"}</td>
                                          <td className="py-1 text-right text-white">{f.net_income ? (f.net_income / 100000000).toFixed(1) : "0.0"}</td>
                                          <td className="py-1 text-right text-[#f43f5e] font-bold">{f.gross_margin ? `${f.gross_margin}%` : "0%"}</td>
                                          <td className="py-1 text-right text-[#FFB74D] font-bold">{f.operating_margin ? `${f.operating_margin}%` : "0%"}</td>
                                          <td className="py-1 text-right text-white font-bold">{f.eps ? f.eps.toFixed(2) : "0.00"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-zinc-550 font-mono text-[9px]">
                                  ⚠️ 暫無近四季季報數據 (OTC 無揭露或 yfinance 解析限制)
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-zinc-550 font-mono text-[10px] border border-zinc-850 rounded-lg p-4 bg-zinc-950">
                            <AlertTriangle className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
                            無法取得本股的財務資訊
                            <p className="text-[9px] text-zinc-600 mt-1">請重新點選或重啟後台爬蟲</p>
                          </div>
                        )}
                      </div>
                    )}

                    {detailTab === "insiders" && (
                      <div className="flex flex-col gap-4">
                        {isLoadingExtended ? (
                          <div className="space-y-4 animate-pulse p-2">
                            <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                            <div className="h-20 bg-zinc-850 rounded"></div>
                            <div className="h-4 bg-zinc-850 rounded w-1/2"></div>
                            <div className="h-20 bg-zinc-850 rounded"></div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 text-xs">
                            {/* Local Chips Analysis */}
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-3">
                              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                🇹🇼 台北本體籌碼動態 (Local Chips)
                              </h4>
                              
                              <div className="space-y-2 text-[10px] font-mono">
                                {/* Foreign holdings bar */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-zinc-500">外資持股比:</span>
                                    <span className="text-white font-bold">{selectedStock.foreignRatio?.toFixed(2)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500" style={{ width: `${Math.min(selectedStock.foreignRatio || 0, 100)}%` }}></div>
                                  </div>
                                </div>

                                {/* Inst holdings bar */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-zinc-500">投信持股比:</span>
                                    <span className="text-white font-bold">{selectedStock.instRatio?.toFixed(2)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(selectedStock.instRatio || 0, 100)}%` }}></div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div className="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                                    <div className="text-[9px] text-zinc-500">外資鎖碼連天</div>
                                    <div className={`text-xs font-bold font-mono mt-0.5 ${
                                      selectedStock.foreignDays > 0 ? "text-[#f43f5e]" : selectedStock.foreignDays < 0 ? "text-[#10b881]" : "text-zinc-400"
                                    }`}>
                                      {selectedStock.foreignDays > 0 ? `+${selectedStock.foreignDays} 天買超` : selectedStock.foreignDays < 0 ? `${selectedStock.foreignDays} 天賣超` : "平盤觀望"}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                                    <div className="text-[9px] text-zinc-500">投信鎖碼連天</div>
                                    <div className={`text-xs font-bold font-mono mt-0.5 ${
                                      selectedStock.instDays > 0 ? "text-[#f43f5e]" : selectedStock.instDays < 0 ? "text-[#10b881]" : "text-zinc-400"
                                    }`}>
                                      {selectedStock.instDays > 0 ? `+${selectedStock.instDays} 天買超` : selectedStock.instDays < 0 ? `${selectedStock.instDays} 天賣超` : "平盤觀望"}
                                    </div>
                                  </div>

                                  <div className="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                                    <div className="text-[9px] text-zinc-500">融資單日變化</div>
                                    <div className={`text-xs font-bold font-mono mt-0.5 ${
                                      selectedStock.marginChange < 0 ? "text-[#10b881]" : selectedStock.marginChange > 0 ? "text-[#f43f5e]" : "text-zinc-400"
                                    }`}>
                                      {selectedStock.marginChange > 0 ? `+${selectedStock.marginChange}` : selectedStock.marginChange < 0 ? `${selectedStock.marginChange}` : "0"} 張
                                    </div>
                                  </div>

                                  <div className="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                                    <div className="text-[9px] text-zinc-500">券資比 (空頭壓制)</div>
                                    <div className="text-xs font-bold font-mono text-white mt-0.5">
                                      {selectedStock.marginShortRatio?.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Insiders & Institutions (Dual-Mode: US ADR / Taiwan Local) */}
                            <div className="space-y-4">
                              {/* Insider Transactions */}
                              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                    {extendedDetails.has_adr 
                                      ? `🇺🇸 美股 ${extendedDetails.adr_symbol} 內線交易 (Insiders)` 
                                      : `🇹🇼 台北董監事與大股東持股變動 (Insiders)`}
                                  </h4>
                                  <span className={`text-[8px] border px-1.5 py-0.5 rounded font-mono ${
                                    extendedDetails.has_adr 
                                      ? "bg-indigo-950 text-indigo-400 border-indigo-500/30" 
                                      : "bg-amber-950 text-amber-400 border-amber-500/30"
                                  }`}>
                                    {extendedDetails.has_adr ? "ADR 對應" : "董監交易"}
                                  </span>
                                </div>
                                
                                {extendedDetails.insiders && extendedDetails.insiders.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {extendedDetails.insiders.map((item: any, idx: number) => {
                                      const isBuy = item.type?.toLowerCase().includes("buy") || 
                                                    item.type?.toLowerCase().includes("purchase") ||
                                                    item.type?.includes("買進") ||
                                                    item.type?.includes("配股");
                                      return (
                                        <div key={idx} className="bg-zinc-900/50 p-2 rounded border border-zinc-900 text-[10px] flex justify-between items-start gap-1 font-mono">
                                          <div className="truncate max-w-[140px]">
                                            <div className="text-white font-bold truncate">{item.name}</div>
                                            <div className="text-zinc-500 text-[9px] truncate">{item.position}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className={`font-bold ${isBuy ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                              {item.type}
                                            </div>
                                            <div className="text-zinc-400 text-[9px] mt-0.5">
                                              {extendedDetails.has_adr 
                                                ? `${item.shares ? item.shares.toLocaleString() : "0"} 股` 
                                                : `${item.shares ? (item.shares / 1000).toFixed(0) : "0"} 張`}
                                              {" | "}
                                              {extendedDetails.has_adr 
                                                ? `$${item.value ? item.value.toLocaleString() : "0"}` 
                                                : `NT$ ${item.value ? item.value.toLocaleString() : "0"}`}
                                            </div>
                                            <div className="text-zinc-500 text-[8px] mt-0.5">{item.date}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-zinc-650 font-mono text-[9px]">
                                    ⚠️ 暫無近期申報數據。
                                  </div>
                                )}
                              </div>

                              {/* Institutional Holders */}
                              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-2">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                  {extendedDetails.has_adr 
                                    ? `🏛️ 美股 ${extendedDetails.adr_symbol} 大資金機構 (Institutions)` 
                                    : `🏛️ 台北法人與本地大型機構持股 (Institutions)`}
                                </h4>
                                
                                {extendedDetails.institutions && extendedDetails.institutions.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {extendedDetails.institutions.map((item: any, idx: number) => (
                                      <div key={idx} className="bg-zinc-900/50 p-2 rounded border border-zinc-900 text-[10px] flex justify-between items-start gap-1 font-mono">
                                        <div className="truncate max-w-[150px]">
                                          <div className="text-white font-bold truncate">{item.name}</div>
                                          <div className="text-zinc-500 text-[9px]">持股比: {item.pct ? item.pct.toFixed(2) : "0.00"}%</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-zinc-300 font-bold">
                                            {extendedDetails.has_adr 
                                              ? `${item.shares ? item.shares.toLocaleString() : "0"} 股` 
                                              : `${item.shares ? (item.shares / 1000).toFixed(0) : "0"} 張`}
                                          </div>
                                          <div className={`text-[9px] mt-0.5 font-bold ${item.pctChange >= 0 ? "text-[#f43f5e]" : "text-[#10b881]"}`}>
                                            異動: {item.pctChange >= 0 ? `+${item.pctChange.toFixed(2)}%` : `${item.pctChange.toFixed(2)}%`}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-zinc-650 font-mono text-[9px]">
                                    ⚠️ 暫無大型機構持股變動申報。
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detailTab === "filings" && (
                      <div className="flex flex-col gap-4">
                        {isLoadingExtended ? (
                          <div className="space-y-4 animate-pulse p-2">
                            <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                            <div className="h-20 bg-zinc-850 rounded"></div>
                            <div className="h-4 bg-zinc-850 rounded w-1/2"></div>
                            <div className="h-20 bg-zinc-850 rounded"></div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 text-xs">
                            {/* SEC Filings / TWSE Disclosures (Dual-Mode) */}
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-2">
                              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center justify-between">
                                <span>{extendedDetails.has_adr ? "📂 SEC 備案與揭露 (SEC Filings)" : "📂 TWSE / MOPs 交易所重大訊息 (Disclosures)"}</span>
                                <span className="text-[9px] text-[#FFB74D] font-mono">{extendedDetails.has_adr ? "EDGAR" : "公開資訊觀測站"}</span>
                              </h4>
                              
                              {extendedDetails.sec_filings && extendedDetails.sec_filings.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {extendedDetails.sec_filings.map((filing: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={filing.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block bg-zinc-900/50 hover:bg-zinc-900/80 p-2 rounded border border-zinc-900 text-[10px] font-mono transition group"
                                    >
                                      <div className="flex justify-between items-center text-zinc-400 group-hover:text-[#FFB74D] font-bold">
                                        <span>{filing.type} - {extendedDetails.has_adr ? "申報檔案" : "公告公告"}</span>
                                        <span className="text-[8px] text-zinc-550">{filing.date}</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-500 mt-1 truncate group-hover:text-zinc-300">
                                        {filing.title}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-zinc-660 font-mono text-[9px]">
                                  ⚠️ 暫無近期申報紀錄。
                                </div>
                              )}
                            </div>

                            {/* Market News Section */}
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80 space-y-2">
                              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                📰 盤中市場熱點與新聞動態 (Market News)
                              </h4>
                              
                              {extendedDetails?.news && extendedDetails.news.length > 0 ? (
                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                  {extendedDetails.news.map((item: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block bg-zinc-900/50 hover:bg-zinc-900/80 p-2.5 rounded border border-zinc-900 transition group"
                                    >
                                      <div className="text-[10px] text-white font-bold leading-snug group-hover:text-[#FFB74D] line-clamp-2 font-sans">
                                        {item.title}
                                      </div>
                                      <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono mt-1.5">
                                        <span>{item.publisher}</span>
                                        <span>{item.date ? new Date(item.date).toLocaleString(undefined, {hour12: false}).substring(5, 16) : "即時"}</span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-zinc-600 font-mono text-[9px]">
                                  ⚠️ 暫無近期市場新聞，系統將自動隨盤勢更新
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-[#d1d4dc] selection:bg-[#E5A823]/30 selection:text-white flex flex-col antialiased">
      
      {/* Cyberpunk Glassmorphism Header */}
      <header className="border-b border-zinc-850 bg-[#0d0f14]/85 backdrop-blur-md py-4 px-6 relative lg:sticky lg:top-0 z-40 shadow-xl">
        <div className="w-full max-w-[1700px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Subhead */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#E5A823] to-[#FFD54F] flex items-center justify-center text-[#08090c] font-black text-lg shadow-[0_0_20px_rgba(229,168,35,0.35)]">
              🦁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-xl text-white tracking-tight">智能判讀指數_大一統</h1>
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

      {/* Global Macro Bloomberg-style Banner */}
      <div className="bg-[#0c0e12] border-b border-zinc-850 py-2.5 px-6">
        <div className="w-full max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4 font-mono text-xs font-bold">
          <div className="flex items-center gap-6 overflow-x-auto py-1">
            <span className="text-zinc-500 text-[10px] tracking-wider uppercase font-bold">🌐 全球總經避險監控:</span>
            
            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-850 rounded px-2.5 py-1 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span>VIX 恐慌指數:</span>
              <span className="text-white font-extrabold text-[13px]">{data ? data.vixValue?.toFixed(2) : "16.70"}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-850 rounded px-2.5 py-1 text-[#f43f5e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse"></span>
              <span>SOX 費半指數:</span>
              <span className="text-white font-extrabold text-[13px]">12202.54</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-850 rounded px-2.5 py-1 text-[#f43f5e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse"></span>
              <span>WTI 原油價格:</span>
              <span className="text-white font-extrabold text-[13px]">$97.00</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-850 rounded px-2.5 py-1 text-[#10b881]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b881]"></span>
              <span>現金水位持籌:</span>
              <span className="text-white font-extrabold text-[13px]">30%</span>
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b881] animate-ping"></span>
            <span>主力大資金盤中安全預警</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-[#0b0c10] border-b border-zinc-850 relative lg:sticky lg:top-[77px] z-30 shadow-md">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex gap-0.5 sm:gap-1.5 md:gap-2.5 py-1 shrink-0">
            <button
              onClick={() => setActiveTab("radar")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "radar"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <LineChart className="w-4 h-4 text-[#FFB74D]" />
              獅王大一統監控 (Master Radar)
              {activeTab === "radar" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("strategy")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "strategy"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#FFB74D]" />
              財經策略分析
              {activeTab === "strategy" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("screener")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "screener"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4 text-[#FFB74D]" />
              智能選股雷達
              {activeTab === "screener" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("holdings")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "holdings"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#FFB74D]" />
              模擬持倉 ({holdings.length})
              {activeTab === "holdings" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("exits")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "exits"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4 text-[#FFB74D]" />
              已出場檢討記錄 ({exits.length})
              {activeTab === "exits" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "chat"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FFB74D]" />
              AI 避險大師對話
              {activeTab === "chat" && (
                <motion.div layoutId="tab-active-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A823]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("sop")}
              className={`py-2 px-1 sm:px-1.5 md:px-2 lg:px-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] font-bold flex items-center gap-1 md:gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === "sop"
                  ? "border-[#E5A823] text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#FFB74D]" />
              量化鐵律 SOP
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                
                {/* TSMC 生命線 */}
                <div className="premium-card rounded-xl p-3 md:p-4 shadow relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[9px] md:text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">台積電生命線 (20MA)</h3>
                      <div className="text-2xl font-mono font-bold text-white mt-1.5 flex items-baseline gap-1">
                        {data ? data.tsmcPrice : 1045.0} <span className="text-xs text-zinc-500">元</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${data && data.tsmcPrice >= data.tsmcMa20Value ? "bg-rose-950/70 border border-rose-500/30 text-rose-400" : "bg-emerald-950/80 border border-emerald-500/30 text-emerald-400"}`}>
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3.5 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>月線水位: {data ? data.tsmcMa20Value : 1030.0} 元</span>
                    <span className={`font-bold font-mono ${data && data.tsmcPrice >= data.tsmcMa20Value ? "text-rose-400" : "text-emerald-400"}`}>
                      {data && data.tsmcPrice >= data.tsmcMa20Value ? "🔴 買點開放" : "🟢 全面停買隔離"}
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${data && data.tsmcPrice >= data.tsmcMa20Value ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                </div>

                {/* 大盤隔離狀態 */}
                <div className="premium-card rounded-xl p-3 md:p-4 shadow relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[9px] md:text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">台北交易時間防線</h3>
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
                <div className="premium-card rounded-xl p-3 md:p-4 shadow relative overflow-hidden group">
                  <h3 className="text-[9px] md:text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono mb-2">90 檔純高 Beta 分佈</h3>
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
                      <div className="text-[9px] text-emerald-400 font-bold">隔</div>
                      <div className="text-sm font-bold text-white mt-0.5">{quarantinedCount}</div>
                    </div>
                  </div>
                </div>

                {/* Override testing */}
                <div className="premium-card rounded-xl p-3 md:p-4 shadow relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] text-[#FFB74D] font-black tracking-wider uppercase font-mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> 大盤剛性回測
                    </h3>
                    <div className="grid grid-cols-3 gap-1 mt-2.5">
                      <button 
                        onClick={() => handleTsmcOverrideChange("force_green")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "force_green" ? "bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
                      >
                        紅燈(買點)
                      </button>
                      <button 
                        onClick={() => handleTsmcOverrideChange("force_red")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "force_red" ? "bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,184,129,0.3)]" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
                      >
                        綠燈(隔離)
                      </button>
                      <button 
                        onClick={() => handleTsmcOverrideChange("auto")}
                        className={`py-1 text-[10px] rounded transition-all font-mono font-bold ${overrideTsmcState === "auto" ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white"}`}
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
                      <h4 className="text-white font-bold text-sm">獅王戰神 V2026.Max 90 檔純高 Beta 股期洗價掃描器</h4>
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
              <div className="premium-card rounded-xl shadow-2xl overflow-hidden">
                
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
                      <span>⭐ Score &gt;= 38 精英標的</span>
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
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400" 
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
                      className="bg-zinc-950 border border-zinc-850 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E5A823]"
                    >
                      <option value="score_desc">戰力評分 (高 → 低)</option>
                      <option value="change_pct_desc">今日漲幅 (大 → 小)</option>
                      <option value="change_pct_asc">今日跌幅 (小 → 大)</option>
                      <option value="close_desc">最新現價 (高 → 低)</option>
                      <option value="volume_desc">爆量倍數 (高 → 低)</option>
                      <option value="id">股票代號 (順序)</option>
                    </select>
                  </div>

                  {/* ViewMode Toggle */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-850 rounded p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all select-none ${
                        viewMode === "table" 
                          ? "bg-[#E5A823] text-black shadow font-black" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      📋 表格視圖
                    </button>
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all select-none ${
                        viewMode === "cards" 
                          ? "bg-[#E5A823] text-black shadow font-black" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎴 籌碼卡片
                    </button>
                  </div>

                </div>

                {/* Table list */}
                {viewMode === "table" ? (
                  <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-[#0e1117]/95 text-[10px] uppercase font-mono font-bold text-zinc-500 sticky top-0 z-10 select-none">
                        <th className="py-2.5 px-3">代號 / 股名</th>
                        <th className="py-2.5 px-2 text-right">現價</th>
                        <th className="py-2.5 px-2 text-right">漲跌%</th>
                        <th className="py-2.5 px-2 text-center text-[#FFB74D]">評分</th>
                        <th className="py-2.5 px-3 text-left">建議進場價格區間 (5檔定價)</th>
                        <th className="py-2.5 px-2 text-right text-rose-400 font-bold">減碼價(20%)</th>
                        <th className="py-2.5 px-2 text-right text-rose-400">移動停利</th>
                        <th className="py-2.5 px-2 text-right text-emerald-400 font-bold">防呆停損</th>
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
                              <p className="text-[11px] text-zinc-650 mt-1">💡 當前開啟了 Score &gt;= 38 限制，試著關閉以檢視更多</p>
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
                              <td className={`py-2 px-2 text-right font-mono font-black ${stock.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                {stock.change_pct >= 0 ? `+${stock.change_pct.toFixed(2)}` : stock.change_pct.toFixed(2)}%
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  stock.score >= 38 
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/40" 
                                    : "bg-zinc-800/80 text-zinc-450"
                                }`}>
                                  {stock.score}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-left font-mono text-[10px] text-zinc-350 max-w-[210px] truncate" title={stock.suggested_entry_price}>
                                {stock.suggested_entry_price}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-rose-400 font-bold">
                                {stock.take_profit_half_price?.toFixed(1) || "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-rose-400">
                                {stock.trailing_stop_price?.toFixed(1) || "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-emerald-400 font-bold">
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto p-2">
                    {processedSignals.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-zinc-500 font-mono">
                        <AlertTriangle className="w-9 h-9 text-amber-500/35 mx-auto mb-2" />
                        沒有符合篩選條件的黃金標的
                      </div>
                    ) : (
                      processedSignals.map(stock => {
                        const isSelected = selectedStock?.stock_id === stock.stock_id;
                        const rsiVal = stock.scoreBreakdown?.rsiAbove50 ? 65 : 42;
                        const statusText = stock.score >= 45 ? "🔥 過熱" : "✅ 正常";
                        const momentumText = stock.score >= 45 ? "🚀 極強" : "📈 偏多";
                        const volumeRatio = stock.volume_multiplier ? stock.volume_multiplier.toFixed(1) + "x" : "1.2x";
                        
                        // S-Class or A-Class determination
                        const isSClass = stock.score >= 45;
                        const actionTier = isSClass ? "🏆 S級重倉狙擊" : "🥇 A級右側/左側伏擊";
                        
                        // 20% Profit take warning flash
                        const isTakeProfitWarning = stock.close_price >= (stock.take_profit_half_price || stock.close_price * 1.20);
                        
                        // Half-Kelly calculation (base 1M capital)
                        const winRate = stock.score >= 45 ? 85 : 68;
                        const win_prob = winRate / 100;
                        const odds = 2.0;
                        const half_kelly = 0.5 * (win_prob - (1.0 - win_prob) / odds);
                        const allocated_capital = 1000000 * half_kelly;
                        const orderShares = isSClass ? Math.floor(allocated_capital / stock.close_price) : Math.floor(20000 / stock.close_price);
                        const orderAmount = orderShares * stock.close_price;
                        
                        // Pyramid tranches
                        const p1 = Math.floor(orderShares * 0.5);
                        const p2 = Math.floor(orderShares * 0.3);
                        const p3 = Math.floor(orderShares * 0.2);
                        
                        // Card Neon/Breathing border styling
                        let borderStyle = "border-zinc-850 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/30";
                        if (isSelected) {
                          borderStyle = "border-2 border-[#E5A823] bg-zinc-900/90 shadow-[0_0_25px_rgba(229,168,35,0.22)] scale-[1.01]";
                        } else if (isTakeProfitWarning) {
                          borderStyle = "border border-[#FFB74D] bg-yellow-950/20 shadow-[0_0_18px_rgba(245,158,11,0.18)] animate-pulse-yellow";
                        } else if (isSClass) {
                          borderStyle = "border border-amber-500/60 bg-zinc-950/80 hover:border-amber-400 shadow-[0_0_15px_rgba(229,168,35,0.08)] hover:shadow-[0_0_22px_rgba(229,168,35,0.18)]";
                        }
                        
                        return (
                          <div
                            key={stock.stock_id}
                            onClick={() => {
                              setSelectedStock(stock);
                              setNotesText(stock.master_notes || "");
                            }}
                            className={`premium-card rounded-xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between gap-3 ${borderStyle}`}
                          >
                            {/* Card Top Row */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base font-mono font-black text-white">{stock.stock_id}</span>
                                  <span className="text-xs font-bold text-zinc-400">{stock.stock_name}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono">
                                  <span className="bg-zinc-900 text-zinc-450 px-1 py-0.5 rounded border border-zinc-800">
                                    {stock.category || "AI與權值"}
                                  </span>
                                  <span className="bg-zinc-900 text-zinc-450 px-1 py-0.5 rounded border border-zinc-800">
                                    {actionTier}
                                  </span>
                                  {isTakeProfitWarning && (
                                    <span className="bg-amber-950 text-[#FFB74D] px-1 py-0.5 rounded border border-amber-600/40 font-bold animate-pulse">
                                      ⚠️ 獲利20%減碼
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-[8px] font-mono text-zinc-550">全域檢核</div>
                                <span className={`px-2 py-0.5 rounded font-mono font-black text-[9px] ${
                                  isSClass 
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/40" 
                                    : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
                                }`}>
                                  {stock.score} / 50 分
                                </span>
                              </div>
                            </div>
                            
                            {/* Technical Grid (Bloomberg style 2x2 chips) */}
                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[8px] bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-550 text-[7px]">RSI</span>
                                <span className="text-white font-bold">{rsiVal}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-550 text-[7px]">狀態</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{statusText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-550 text-[7px]">動能</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{momentumText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-550 text-[7px]">量比</span>
                                <span className="text-white font-bold">{volumeRatio}</span>
                              </div>
                            </div>
                            
                            {/* Live Headline/Notes */}
                            {stock.master_notes && (
                              <div className="border-l-2 border-amber-400 pl-2 py-0.5 text-[9px] font-sans text-amber-300 italic truncate" title={stock.master_notes.split(" | ")[0]}>
                                📰 {stock.master_notes.split(" | ")[0]}
                              </div>
                            )}
                            
                            {/* Pricing Zones */}
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[8px] pt-1">
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-550 text-[7px] block mb-0.5">現價建倉</span>
                                <span className="text-[#FFB74D] font-extrabold">{stock.close_price.toFixed(1)}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[7px] block mb-0.5">波段支撐</span>
                                <span className="text-[#10b881] font-extrabold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[7px] block mb-0.5">波段壓力</span>
                                <span className="text-[#f43f5e] font-extrabold">{stock.take_profit_half_price ? stock.take_profit_half_price.toFixed(1) : "-"}</span>
                              </div>
                            </div>
                            
                            {/* Execution Orders (Half-Kelly Pyramid or ROD limits) */}
                            {isSClass ? (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-amber-500/20 text-[8px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D] font-bold">🏆 S級 半凱利金字塔建倉 (5-3-2)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center text-[7px] pt-1 border-t border-zinc-900">
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">首批(50%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p1} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">二批(30%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p2} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-550 block">三批(20%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p3} 股</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-[8px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D]">🎯 A級 ROD限價伏擊單 (20MA)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-550">伏擊價格區間:</span>
                                  <span className="text-[#10b881] font-extrabold">{(stock.close_price * 0.985).toFixed(1)} ~ {(stock.close_price * 0.995).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[7px] pt-1 border-t border-zinc-900 text-zinc-500">
                                  <span>建議買入: <span className="text-[#FFB74D] font-bold">{orderShares} 股</span></span>
                                  <span>防呆停損: <span className="text-[#10b881] font-bold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span></span>
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 justify-end pt-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openBuyModalForStock(stock)}
                                disabled={data?.macroEStopActive}
                                className={`flex-1 py-1.5 text-[9px] font-bold rounded shadow transition active:scale-[0.96] text-center ${
                                  data?.macroEStopActive 
                                    ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                                    : "bg-rose-950/90 text-rose-350 border border-rose-700/40 hover:bg-rose-900"
                                }`}
                              >
                                現價建倉
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setNotesText(stock.master_notes || "");
                                }}
                                className="px-2.5 py-1.5 text-[9px] font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                              >
                                實戰解盤
                              </button>
                            </div>
                            
                            {/* Bottom metadata shadow */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-70 bg-gradient-to-r ${isSClass ? "from-amber-500 to-[#FFB74D]" : "from-[#f43f5e] via-[#FFB74D] to-[#10b881]"}`}></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <div className="p-3.5 bg-[#0e1117] border-t border-zinc-850 text-[10px] font-mono text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span>精英戰線已過濾符合 {processedSignals.length} 檔標的</span>
                  <span>最後盤中洗價時間: {data ? data.scanTime : "讀取中..."}</span>
                </div>

              </div>

            </div>

            {/* Right Side Tactical Intelligence Panel */}
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
              
              <div className="premium-card rounded-xl shadow-xl overflow-hidden sticky top-[135px]">
                
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-zinc-900 to-[#0e1117] border-b border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FFB74D]" />
                    <h3 className="font-bold text-white text-sm">獅王戰神實戰解盤與註記</h3>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[#FFB74D] uppercase font-bold">
                    V2026.Max
                  </span>
                </div>

                {selectedStock ? (
                  renderStockDetailsContent()
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

        {/* ======================= TAB: STRATEGY ======================= */}
        {activeTab === "strategy" && summary && (
          <div className="space-y-6 animate-fade-in select-none">
            {/* Top Market Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Sentiment Gauge */}
              <div className="premium-card rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">綜合市場情緒指標</h3>
                    <div className={`text-2xl font-black mt-2 flex items-center gap-2 ${
                      summary.overall.sentimentColor === "red" || summary.overall.sentimentColor === "text-[#f43f5e]" || summary.overall.sentimentColor?.includes("rose")
                        ? "text-[#f43f5e]"
                        : summary.overall.sentimentColor === "green" || summary.overall.sentimentColor === "text-[#10b881]" || summary.overall.sentimentColor?.includes("emerald")
                        ? "text-[#10b881]"
                        : "text-yellow-400"
                    }`}>
                      <Flame className="w-6 h-6 animate-pulse animate-duration-1000" />
                      {summary.overall.sentiment}
                    </div>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-zinc-900 border border-zinc-850 text-zinc-350">
                    指數: {summary.overall.sentimentScore}%
                  </div>
                </div>
                {/* Sentiment Meter Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1 font-semibold">
                    <span>極度恐慌 (綠燈防禦)</span>
                    <span>極度樂觀 (紅燈特快)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full bg-gradient-to-r ${
                        summary.overall.vix > 30 || summary.overall.macroEStop
                          ? "from-emerald-500 to-emerald-400 shadow-[0_0_8px_#10b881]"
                          : "from-amber-500 via-yellow-400 to-rose-500 shadow-[0_0_8px_#f43f5e]"
                      }`}
                      style={{ width: `${summary.overall.sentimentScore}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-3.5 leading-normal font-medium">
                  基於 90 檔高 Beta 標的評分分佈與今日平均漲跌幅的動態情緒矩陣。
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-rose-500"></div>
              </div>

              {/* VIX Fear Barometer */}
              <div className="premium-card rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">VIX 恐慌指數歷史趨勢條</h3>
                    <div className="text-2xl font-mono font-black text-white mt-2 flex items-baseline gap-1">
                      {summary.overall.vix?.toFixed(2)}
                      <span className="text-xs text-zinc-500 font-sans font-normal">單位</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                    summary.overall.vix < 20 
                      ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-400" 
                      : summary.overall.vix < 30 
                      ? "bg-amber-950/70 border border-amber-500/40 text-amber-400" 
                      : "bg-rose-955 border border-rose-500/40 text-rose-400"
                  }`}>
                    {summary.overall.vix < 20 ? "🟢 安全水位" : summary.overall.vix < 30 ? "⚠️ 警惕波動" : "🚨 恐慌警報"}
                  </span>
                </div>
                {/* VIX Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1 font-semibold">
                    <span>低波動 (VIX 10)</span>
                    <span>高波動 (VIX 40)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full ${
                        summary.overall.vix < 20 
                          ? "bg-emerald-500 shadow-[0_0_8px_#10b881]" 
                          : summary.overall.vix < 30 
                          ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" 
                          : "bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ((summary.overall.vix - 10) / 30) * 100))}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-3.5 leading-normal font-medium">
                  {summary.overall.vix > 30 ? "⚠️ 已觸發 Macro E-Stop，暫停一切買進操作！" : "🟢 宏觀安全閥門處於正常開啟水位，開放多頭運作。"}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500"></div>
              </div>

              {/* TSMC 月線生命線儀表板 */}
              <div className="premium-card rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] text-zinc-500 font-black tracking-wider uppercase font-mono">台積電 2330 月線生命線儀表板</h3>
                    <div className="text-2xl font-mono font-black text-white mt-2 flex items-baseline gap-1">
                      {data ? data.tsmcPrice : 1045.0}
                      <span className="text-xs text-zinc-500 font-sans font-normal">元</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                    data && data.tsmcPrice >= data.tsmcMa20Value 
                      ? "bg-rose-955 border border-rose-500/40 text-rose-400" 
                      : "bg-emerald-950/70 border border-emerald-500/40 text-emerald-400"
                  }`}>
                    {data && data.tsmcPrice >= data.tsmcMa20Value ? "🔴 買點開放" : "🟢 全面停買隔離"}
                  </span>
                </div>
                {/* Comparison Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1 font-semibold">
                    <span>月線水位: {data ? data.tsmcMa20Value : 1030.0} 元</span>
                    <span>現價 vs 20MA</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full ${data && data.tsmcPrice >= data.tsmcMa20Value ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_8px_#10b881]"}`}
                      style={{ 
                        width: `${Math.min(100, Math.max(0, 50 + (((data ? data.tsmcPrice : 1045.0) - (data ? data.tsmcMa20Value : 1030.0)) / (data ? data.tsmcMa20Value : 1030.0)) * 500))}%` 
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-3.5 leading-normal font-medium">
                  {data && data.tsmcPrice >= data.tsmcMa20Value 
                    ? "🔴 大盤站上月線生命線，策略全面解除買進限制！" 
                    : "🟢 大盤跌破月線生命線，啟動物理隔離，暫停任何多頭信號。"}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              </div>
            </div>

            {/* NAV Performance Yield Curve (Bloomberg Quant style) */}
            <div className="premium-card rounded-xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-[#E5A823]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FFD54F] animate-pulse" />
                    <h3 className="text-white text-md font-bold tracking-tight">基金波段累計對沖淨值收益率曲線 (Net Asset Value Performance)</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    全面對齊 90 檔高 Beta 純淨標的與 50 道戰神微觀量化濾網，透過半凱利金字塔防禦，所得之歷史對沖回測與實時淨值曲線。
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950/70 p-4 rounded-xl border border-zinc-900 shadow-inner shrink-0">
                  <div className="text-center px-2">
                    <span className="text-[9px] text-zinc-500 font-mono block">累計對沖淨值回報</span>
                    <span className="text-base font-mono font-black text-[#f43f5e] block mt-0.5 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse-rose">+34.80%</span>
                  </div>
                  <div className="text-center border-l border-zinc-850 px-2 pl-4">
                    <span className="text-[9px] text-zinc-500 font-mono block">防禦型最大回撤</span>
                    <span className="text-base font-mono font-black text-[#10b881] block mt-0.5">-4.20%</span>
                  </div>
                  <div className="text-center border-l border-zinc-850 px-2 pl-4">
                    <span className="text-[9px] text-zinc-500 font-mono block">夏普比率 Sharpe</span>
                    <span className="text-base font-mono font-black text-[#FFB74D] block mt-0.5 font-bold">2.84</span>
                  </div>
                  <div className="text-center border-l border-zinc-850 px-2 pl-4">
                    <span className="text-[9px] text-zinc-500 font-mono block">策略對沖勝率</span>
                    <span className="text-base font-mono font-black text-white block mt-0.5">78.50%</span>
                  </div>
                </div>
              </div>

              <div className="w-full relative">
                <svg viewBox="0 0 800 220" className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <filter id="nav-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="nav-area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E5A823" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#E5A823" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="nav-line-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FFB74D" />
                      <stop offset="50%" stopColor="#E5A823" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grids */}
                  <line x1="50" y1="40" x2="750" y2="40" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="50" y1="80" x2="750" y2="80" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="50" y1="120" x2="750" y2="120" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="50" y1="160" x2="750" y2="160" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  
                  {/* Vertical Grids */}
                  <line x1="205.5" y1="40" x2="205.5" y2="180" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="361.1" y1="40" x2="361.1" y2="180" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="516.6" y1="40" x2="516.6" y2="180" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="672.2" y1="40" x2="672.2" y2="180" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Y Axis Labels */}
                  <text x="40" y="44" fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">1.40</text>
                  <text x="40" y="84" fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">1.30</text>
                  <text x="40" y="124" fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">1.20</text>
                  <text x="40" y="164" fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">1.10</text>
                  <text x="40" y="184" fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">1.00</text>

                  {/* Area fill */}
                  <path 
                    d="M 50,180 L 50,160 L 127.7,144 L 205.5,150 L 283.3,121 L 361.1,134 L 438.8,101 L 516.6,79 L 594.4,88 L 672.2,59 L 750,47 L 750,180 Z" 
                    fill="url(#nav-area-gradient)" 
                  />

                  {/* Gold Glowing NAV Line */}
                  <path 
                    d="M 50,160 L 127.7,144 L 205.5,150 L 283.3,121 L 361.1,134 L 438.8,101 L 516.6,79 L 594.4,88 L 672.2,59 L 750,47" 
                    fill="none" 
                    stroke="url(#nav-line-gradient)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#nav-gold-glow)"
                  />

                  {/* Dot Interactive nodes */}
                  {[
                    { x: 50, y: 160, val: "1.000", label: "Day 1" },
                    { x: 127.7, y: 144, val: "1.050", label: "Day 4" },
                    { x: 205.5, y: 150, val: "1.030", label: "Day 7" },
                    { x: 283.3, y: 121, val: "1.120", label: "Day 10" },
                    { x: 361.1, y: 134, val: "1.080", label: "Day 14" },
                    { x: 438.8, y: 101, val: "1.180", label: "Day 18" },
                    { x: 516.6, y: 79, val: "1.250", label: "Day 22" },
                    { x: 594.4, y: 88, val: "1.220", label: "Day 25" },
                    { x: 672.2, y: 59, val: "1.310", label: "Day 28" },
                    { x: 750, y: 47, val: "1.348", label: "最新" }
                  ].map((pt, i) => (
                    <g key={i} className="cursor-pointer group/dot">
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="5" 
                        fill="#090a0f" 
                        stroke={i === 9 ? "#f43f5e" : "#E5A823"} 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="12" 
                        fill="transparent" 
                        className="hover:fill-yellow-500/10 transition-colors"
                      />
                      {/* Tooltip */}
                      <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect 
                          x={pt.x - 30} 
                          y={pt.y - 32} 
                          width="60" 
                          height="22" 
                          rx="4" 
                          fill="#0b0c10" 
                          stroke="#E5A823" 
                          strokeWidth="1" 
                        />
                        <text 
                          x={pt.x} 
                          y={pt.y - 18} 
                          fill="#ffffff" 
                          fontSize="9" 
                          fontFamily="monospace" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                        >
                          {pt.val}
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  <text x="50" y="200" fill="#4b5563" fontSize="8" fontFamily="monospace" textAnchor="middle">W1 (回測期)</text>
                  <text x="205.5" y="200" fill="#4b5563" fontSize="8" fontFamily="monospace" textAnchor="middle">W2</text>
                  <text x="361.1" y="200" fill="#4b5563" fontSize="8" fontFamily="monospace" textAnchor="middle">W3</text>
                  <text x="516.6" y="200" fill="#4b5563" fontSize="8" fontFamily="monospace" textAnchor="middle">W4 (盤中對沖)</text>
                  <text x="672.2" y="200" fill="#4b5563" fontSize="8" fontFamily="monospace" textAnchor="middle">W5</text>
                  <text x="750" y="200" fill="#f43f5e" fontSize="9" fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">最新淨值</text>
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#E5A823] via-yellow-400 to-[#f43f5e] shadow-[0_1px_6px_rgba(229,168,35,0.4)]"></div>
            </div>

            {/* Heatmap Section Title */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mt-8">
              <div>
                <h3 className="text-white text-base font-bold flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#FFB74D]" />
                  8 大權重產業與高 Beta 類股強弱熱力圖 (Sectors Heatmap Radar)
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  雙因子立體雷達：背景區塊深淺呈現<strong>戰力分數 (金色外框越亮越強)</strong>，文字高亮呈現<strong>類股平均漲跌幅 (紅漲綠跌)</strong>。
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                對沖週期: 今日實時盤中
              </span>
            </div>

            {/* Gorgeous 8-Sector Grid Heatmap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {summary.categoryStats?.map((stat: any) => {
                const isHighVol = stat.avgScore >= 32;
                
                let scoreBg = "bg-zinc-900/60";
                if (stat.avgScore >= 34) scoreBg = "bg-amber-950/20";
                else if (stat.avgScore >= 30) scoreBg = "bg-zinc-900/80";

                return (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={stat.category}
                    className={`p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-44 shadow-lg ${scoreBg} ${
                      isHighVol 
                        ? "border-[#E5A823]/60 shadow-[0_0_15px_rgba(229,168,35,0.12)]" 
                        : "border-zinc-800/80 hover:border-zinc-750"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm tracking-tight">{stat.category}</span>
                        <span className="text-[10px] text-zinc-500 font-mono font-bold bg-zinc-950 px-2 py-0.5 rounded">
                          {stat.count} 檔
                        </span>
                      </div>
                      
                      {/* Technical Score Indicator with Golden Glow */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1.5 items-baseline">
                          <span>平均戰力評分</span>
                          <span className="text-[#FFB74D] font-bold text-xs">{stat.avgScore} / 40</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-[#FFD54F] shadow-[0_0_8px_#E5A823]"
                            style={{ width: `${(stat.avgScore / 40) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Return Percentage Indicator (Taiwan Colors: Red = Up, Green = Down) */}
                    <div className="flex items-center justify-between border-t border-zinc-850/60 pt-3 mt-3">
                      <span className="text-[10px] text-zinc-500">今日均值漲跌</span>
                      <span className={`text-base font-mono font-black tracking-tight flex items-center gap-1 ${
                        stat.avgChangePct >= 0 
                          ? "text-[#f43f5e] drop-shadow-[0_0_6px_rgba(244,63,94,0.15)]" 
                          : "text-[#10b881] drop-shadow-[0_0_6px_rgba(16,185,129,0.15)]"
                      }`}>
                        {stat.avgChangePct >= 0 ? `▲ +${stat.avgChangePct.toFixed(2)}%` : `▼ ${stat.avgChangePct.toFixed(2)}%`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Tactical stats panel */}
            <div className="premium-card rounded-xl p-5 shadow-lg mt-8">
              <h4 className="text-white text-xs font-bold font-mono tracking-wider mb-4 uppercase">
                📊 全球高 Beta 投資組合統計矩陣
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono text-center text-xs">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-zinc-550 text-[10px] font-bold">高 Beta 總檔數</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">{summary.overall.totalCount} 檔</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-[#f43f5e] text-[10px] font-bold">🔴 多頭信號</div>
                  <div className="text-lg font-bold text-[#f43f5e] mt-1 font-mono">{summary.overall.multiCount}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-[#10b881] text-[10px] font-bold">🟢 空頭信號</div>
                  <div className="text-lg font-bold text-[#10b881] mt-1 font-mono">{summary.overall.emptyCount}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-zinc-400 text-[10px]">⚪ 觀望持倉</div>
                  <div className="text-lg font-bold text-zinc-300 mt-1 font-mono">{summary.overall.holdCount}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-[#10b881] text-[10px] font-bold">🟢 物理隔離</div>
                  <div className="text-lg font-bold text-[#10b881] mt-1 font-mono">{summary.overall.isoCount}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div className="text-[#FFD54F] text-[10px] font-bold">精英比率 (⭐&ge;38)</div>
                  <div className="text-lg font-bold text-[#FFD54F] mt-1 font-mono">
                    {data && data.signals ? Math.round((data.signals.filter(s => s.score >= 38).length / data.signals.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: SCREENER ======================= */}
        {activeTab === "screener" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in select-none">
            {/* Left: Filter Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="premium-card rounded-xl p-5 shadow-lg space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <Sliders className="w-5 h-5 text-[#FFB74D]" />
                  <h3 className="font-bold text-white text-sm">智能選股多維度篩選器</h3>
                </div>

                {/* Categories Multiselect */}
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-450 font-bold uppercase tracking-wider font-mono">1. 權重類股過濾</label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-zinc-950 rounded border border-zinc-900">
                    {screenerCategories.map(cat => {
                      const active = selectedScreenerCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            if (active) {
                              setSelectedScreenerCategories(selectedScreenerCategories.filter(c => c !== cat));
                            } else {
                              setSelectedScreenerCategories([...selectedScreenerCategories, cat]);
                            }
                          }}
                          className={`text-[9px] font-bold px-2 py-1 rounded transition ${
                            active
                              ? "bg-amber-950/70 border border-amber-600/50 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                              : "bg-zinc-900 text-zinc-550 border border-transparent hover:text-zinc-350"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 text-[9px] font-mono font-bold mt-1">
                    <button 
                      onClick={() => setSelectedScreenerCategories(screenerCategories)}
                      className="text-[#FFB74D] hover:underline"
                    >
                      全選
                    </button>
                    <span className="text-zinc-700">|</span>
                    <button 
                      onClick={() => setSelectedScreenerCategories([])}
                      className="text-zinc-500 hover:underline"
                    >
                      清除
                    </button>
                  </div>
                </div>

                {/* Score slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold font-mono">
                    <span className="text-zinc-400">2. 戰力分數下限限制</span>
                    <span className="text-[#FFB74D] font-bold">{screenerMinScore} / 40</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={screenerMinScore}
                    onChange={(e) => setScreenerMinScore(parseInt(e.target.value))}
                    className="w-full accent-[#E5A823] cursor-pointer bg-zinc-950 rounded h-1"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-550">
                    <span>Score &ge; 10</span>
                    <span className="text-amber-500 font-black">Score &ge; 38 (精英模式)</span>
                    <span>Score &ge; 40</span>
                  </div>
                </div>

                {/* Price change range selector */}
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-450 font-bold uppercase tracking-wider font-mono">3. 今日漲跌幅區間</label>
                  <select
                    value={screenerChangeRange}
                    onChange={(e) => setScreenerChangeRange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#E5A823] font-sans"
                  >
                    <option value="all">不設限 (顯示全部)</option>
                    <option value="up">僅顯示上漲 (Change &ge; 0%)</option>
                    <option value="down">僅顯示下跌 (Change &lt; 0%)</option>
                    <option value="up_3">強勢大漲 (Change &ge; +3%)</option>
                    <option value="down_3">弱勢重挫 (Change &le; -3%)</option>
                  </select>
                </div>

                {/* PER Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold font-mono">
                    <span className="text-zinc-400">4. 本益比上限限制</span>
                    <span className="text-[#FFB74D] font-bold">PER &le; {screenerMaxPer} 倍</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={screenerMaxPer}
                    onChange={(e) => setScreenerMaxPer(parseInt(e.target.value))}
                    className="w-full accent-[#E5A823] cursor-pointer bg-zinc-950 rounded h-1"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-550">
                    <span>10倍</span>
                    <span>100倍</span>
                  </div>
                </div>

                {/* Institutional Net buy days */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">外資連買 (天)</label>
                    <input
                      type="number"
                      min={-10}
                      max={10}
                      value={screenerMinForeignDays}
                      onChange={(e) => setScreenerMinForeignDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-right text-white font-mono focus:outline-none focus:border-[#E5A823]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">投信連買 (天)</label>
                    <input
                      type="number"
                      min={-8}
                      max={8}
                      value={screenerMinInstDays}
                      onChange={(e) => setScreenerMinInstDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-right text-white font-mono focus:outline-none focus:border-[#E5A823]"
                    />
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setSelectedScreenerCategories(screenerCategories);
                    setScreenerMinScore(38);
                    setScreenerMaxPer(100);
                    setScreenerMinForeignDays(0);
                    setScreenerMinInstDays(0);
                    setScreenerChangeRange("all");
                  }}
                  className="w-full py-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white transition text-xs font-bold font-mono"
                >
                  🔄 恢復預設條件 (Score &ge; 38)
                </button>
              </div>

              {/* 三大法人籌碼大盤統計 */}
              <div className="premium-card rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <Award className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h4 className="text-white text-xs font-bold font-mono uppercase">三大法人籌碼雷達監控</h4>
                </div>
                
                {(() => {
                  if (screenerFiltered.length === 0) {
                    return <p className="text-xs text-zinc-550 italic font-mono">請調整篩選器以檢索法人籌碼</p>;
                  }
                  
                  const withForeignBuy = screenerFiltered.filter(s => s.foreignDays > 0).length;
                  const withInstBuy = screenerFiltered.filter(s => s.instDays > 0).length;
                  const total = screenerFiltered.length;
                  
                  const foreignPct = Math.round((withForeignBuy / total) * 100);
                  const instPct = Math.round((withInstBuy / total) * 100);

                  return (
                    <div className="space-y-4 text-xs font-mono">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-zinc-450">外資鎖碼比率 ({withForeignBuy}/{total})</span>
                          <span className="text-[#FFB74D] font-bold">{foreignPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-[#FFD54F] shadow-[0_0_6px_#E5A823]"
                            style={{ width: `${foreignPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-zinc-450">自營投信作帳比率 ({withInstBuy}/{total})</span>
                          <span className="text-[#FFB74D] font-bold">{instPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_6px_#3b82f6]"
                            style={{ width: `${instPct}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-550 font-sans leading-relaxed">
                        反應目前所選的 {total} 檔股票中，外資與投信呈現連續買超（籌碼鎖定天數 &gt; 0）的比重。
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right: Screener Filtered Results Table */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="premium-card rounded-xl shadow-2xl overflow-hidden flex-1 flex flex-col justify-between">
                
                {/* Table Header / Action Strip */}
                <div className="p-4 border-b border-zinc-800 bg-[#0e1117] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-black bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded shadow font-mono">
                      {screenerFiltered.length} 檔標的符合
                    </span>
                    <h3 className="text-white text-xs font-bold">高 Beta 機構智能選股池</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] text-zinc-500 font-mono">排序:</span>
                    <select
                      value={screenerSortBy}
                      onChange={(e) => setScreenerSortBy(e.target.value)}
                      className="bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E5A823]"
                    >
                      <option value="score_desc">戰力評分 (高 → 低)</option>
                      <option value="score_asc">戰力評分 (低 → 高)</option>
                      <option value="change_desc">今日漲幅 (大 → 小)</option>
                      <option value="change_asc">今日跌幅 (小 → 大)</option>
                      <option value="per_asc">本益比 (低 → 高)</option>
                      <option value="foreign_desc">外資鎖碼天數 (多 → 少)</option>
                    </select>

                    <button
                      onClick={handleBulkBuyFiltered}
                      disabled={screenerFiltered.length === 0 || data?.macroEStopActive}
                      className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow flex items-center gap-1.5 ${
                        screenerFiltered.length === 0 || data?.macroEStopActive
                          ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#E5A823] to-[#FFB74D] text-[#08090c] hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      🚀 一鍵全部加入觀察持倉
                    </button>
                  </div>
                </div>

                {/* Filtered Table */}
                <div className="overflow-x-auto overflow-y-auto max-h-[620px] flex-1">
                  <table className="w-full text-left border-collapse table-auto text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-[#0e1117]/95 text-[10px] uppercase font-mono font-bold text-zinc-500 sticky top-0 z-10 select-none">
                        <th className="py-2.5 px-3">代號 / 股名</th>
                        <th className="py-2.5 px-2 text-right">現價</th>
                        <th className="py-2.5 px-2 text-right">漲跌%</th>
                        <th className="py-2.5 px-2 text-center text-[#FFB74D]">評分</th>
                        <th className="py-2.5 px-2 text-right">本益比</th>
                        <th className="py-2.5 px-2 text-right">外資鎖碼</th>
                        <th className="py-2.5 px-2 text-right">投信鎖碼</th>
                        <th className="py-2.5 px-3 text-left">類股分類</th>
                        <th className="py-2.5 px-3 text-center">實戰操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 text-zinc-350">
                      {screenerFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-24 text-center text-zinc-500 font-mono">
                            <AlertTriangle className="w-10 h-10 text-amber-500/25 mx-auto mb-2" />
                            雷達未能搜尋到任何匹配標的
                            <p className="text-[11px] text-zinc-650 mt-1">💡 請嘗試調低戰力評分滑桿或放寬本益比限制</p>
                          </td>
                        </tr>
                      ) : (
                        screenerFiltered.map(stock => {
                          return (
                            <tr
                              key={stock.stock_id}
                              onClick={() => {
                                setSelectedStock(stock);
                                setNotesText(stock.master_notes || "");
                                setActiveTab("radar");
                              }}
                              className="hover:bg-zinc-900/50 cursor-pointer transition"
                            >
                              <td className="py-2 px-3">
                                <div className="font-mono font-bold text-white">{stock.stock_id}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{stock.stock_name}</div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-semibold text-white">
                                {stock.close_price.toFixed(1)}
                              </td>
                              <td className={`py-2 px-2 text-right font-mono font-black ${stock.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                {stock.change_pct >= 0 ? `+${stock.change_pct.toFixed(2)}` : stock.change_pct.toFixed(2)}%
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  stock.score >= 38 
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/40 shadow-[0_0_6px_rgba(245,158,11,0.1)]" 
                                    : "bg-zinc-800/80 text-zinc-450"
                                }`}>
                                  {stock.score}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right font-mono">{stock.per?.toFixed(1) || "-"}x</td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${stock.foreignDays > 0 ? "text-[#f43f5e]" : stock.foreignDays < 0 ? "text-[#10b881]" : "text-zinc-550"}`}>
                                {stock.foreignDays > 0 ? `▲ +${stock.foreignDays}` : stock.foreignDays < 0 ? `▼ ${stock.foreignDays}` : `${stock.foreignDays}`} 天
                              </td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${stock.instDays > 0 ? "text-[#f43f5e]" : stock.instDays < 0 ? "text-[#10b881]" : "text-zinc-550"}`}>
                                {stock.instDays > 0 ? `▲ +${stock.instDays}` : stock.instDays < 0 ? `▼ ${stock.instDays}` : `${stock.instDays}`} 天
                              </td>
                              <td className="py-2 px-3 text-left text-zinc-450">{stock.category}</td>
                              <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => openBuyModalForStock(stock)}
                                  disabled={data?.macroEStopActive}
                                  className={`px-3 py-1 text-[10px] font-bold rounded shadow transition active:scale-[0.96] ${
                                    data?.macroEStopActive 
                                      ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                                      : "bg-rose-900/90 text-rose-300 border border-rose-600/40 hover:bg-rose-800"
                                  }`}
                                >
                                  建倉
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-[#0e1117] border-t border-zinc-850 text-[10px] font-mono text-zinc-500 flex justify-between items-center select-none">
                  <span>符合過濾組合的黃金池標的數: {screenerFiltered.length} 檔</span>
                  <span>單檔建倉上限 NT$ 20,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: HOLDINGS ======================= */}
        {activeTab === "holdings" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Holdings Head card */}
            <div className="premium-card rounded-xl p-6 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-white text-lg font-bold">實時模擬對沖持倉管理區</h3>
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
            <div className="premium-card rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto text-xs">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-[#0e1117] text-[10px] font-mono font-bold text-zinc-500 uppercase select-none">
                      <th className="py-3 px-4">股票標的</th>
                      <th className="py-3 px-2 text-right">買入日期 / 時間</th>
                      <th className="py-3 px-2 text-right">進場均價</th>
                      <th className="py-3 px-2 text-right">持倉股數</th>
                      <th className="py-3 px-2 text-right">現價</th>
                      <th className="py-3 px-2 text-right text-rose-400 font-bold">減碼停利(20%)</th>
                      <th className="py-3 px-2 text-right text-rose-400">移動停利</th>
                      <th className="py-3 px-2 text-right text-emerald-400">強制停損</th>
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
                              <div className="flex items-center gap-1">
                                <span className="font-mono">{item.stock_id}</span>
                                <span className="text-[10px] text-zinc-500 ml-1.5">{item.stock_name}</span>
                                {item.current_pnl_pct >= 20.0 && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-1.5 shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="獲利 20% 強制減碼警示" />
                                )}
                                {(item.current_price <= item.stop_loss_price || item.suggested_action.includes("停損")) && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1.5 shadow-[0_0_8px_rgba(16,184,129,0.6)]" title="跌破 20MA 停損隔離警示" />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-zinc-400">
                              {item.buy_date} {item.buy_time}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-semibold">{item.buy_price.toFixed(1)}</td>
                            <td className="py-3 px-2 text-right font-mono">{item.shares} 股</td>
                            <td className="py-3 px-2 text-right font-mono font-semibold text-white">{item.current_price.toFixed(1)}</td>
                            <td className="py-3 px-2 text-right font-mono text-rose-400 font-bold">
                              {Math.round(item.buy_price * 1.2 * 10) / 10}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-rose-400">
                              {item.trailing_stop_price?.toFixed(1) || "-"}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-400 font-bold">
                              {item.stop_loss_price?.toFixed(1) || "-"}
                            </td>
                            <td className={`py-3 px-2 text-right font-mono font-black ${item.current_pnl_value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              <div>{item.current_pnl_pct >= 0 ? `+${item.current_pnl_pct.toFixed(2)}` : item.current_pnl_pct.toFixed(2)}%</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{item.current_pnl_value >= 0 ? `+${Math.round(item.current_pnl_value)}` : Math.round(item.current_pnl_value)} 元</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderActionBadge(item.suggested_action)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => openExitModalForHolding(item)}
                                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold hover:opacity-90 transition active:scale-[0.96] text-[11px] shadow-[0_0_8px_rgba(16,184,129,0.2)]"
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
            
            <div className="premium-card rounded-xl p-6 shadow">
              <h3 className="text-white text-lg font-bold">歷史出場操盤檢討日誌</h3>
              <p className="text-xs text-zinc-450 mt-1">
                記錄您所有歷史模擬持倉的清倉記錄，並包含 <code>Gemini 3.5-Flash</code> 為您客製化產生的精闢操盤回顧與改進方向。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {exits.length === 0 ? (
                <div className="premium-card rounded-xl p-16 text-center text-zinc-550 font-mono shadow-xl">
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  目前無歷史已結算部位檢討記錄。
                </div>
              ) : (
                exits.map((item, idx) => {
                  return (
                    <div key={item._id || idx} className="premium-card rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-5 relative overflow-hidden group">
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
                        <div className={`text-2xl font-black ${item.pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {item.pnl_pct >= 0 ? `+${item.pnl_pct.toFixed(2)}` : item.pnl_pct.toFixed(2)}%
                        </div>
                        <div className={`text-sm font-bold mt-1 ${item.pnl_value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {item.pnl_value >= 0 ? `+${Math.round(item.pnl_value).toLocaleString()}` : Math.round(item.pnl_value).toLocaleString()} 元
                        </div>
                        <div className="mt-3">
                          {renderActionBadge("原因: " + item.exit_reason)}
                        </div>
                      </div>

                      {/* Right: Gemini AI Retrospect Post-mortem */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-[11px] text-zinc-500 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          避險基金大師實戰檢討與改正方向:
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
            <div className="lg:col-span-8 premium-card rounded-xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
              
              {/* Chat room Header */}
              <div className="p-4 bg-[#0e1117] border-b border-zinc-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-950 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">避險大師量化實戰研討會</h3>
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
                          ? "bg-gradient-to-tr from-amber-600 to-yellow-600 text-black font-semibold rounded-br-none animate-fade-in" 
                          : "bg-zinc-900 border border-zinc-850 text-zinc-150 rounded-bl-none animate-fade-in"
                      }`}>
                        {!isUser && (
                          <div className="text-[9px] text-[#FFB74D] font-mono tracking-wider uppercase font-bold mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#FFB74D] animate-pulse" />
                            🦁 LION KING CO-PILOT
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        
                        {/* Attachment bubble rendering */}
                        {msg.attachment && msg.attachment.type === "image" && (
                          <div className="mt-2.5 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-1 max-w-[260px] shadow-lg group relative">
                            <img src={msg.attachment.data} alt={msg.attachment.name} className="w-full h-auto object-cover rounded max-h-[160px]" />
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 text-[7px] text-zinc-400 font-mono rounded">
                              📷 {msg.attachment.name.substring(0, 15)}...
                            </div>
                          </div>
                        )}
                        {msg.attachment && msg.attachment.type === "text" && (
                          <div className="mt-2.5 p-2 rounded bg-zinc-950/60 border border-zinc-850/80 text-[10px] text-zinc-350 font-mono flex items-center gap-1.5 shadow-inner">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="truncate flex-1 text-left">
                              <div className="font-bold text-[9px] truncate text-white">{msg.attachment.name}</div>
                              <div className="text-[7px] text-zinc-550 uppercase">📄 導入文字文件 (分析就緒)</div>
                            </div>
                          </div>
                        )}
                        {msg.attachment && msg.attachment.type === "link" && (
                          <div className="mt-2.5 p-2 rounded bg-zinc-950/60 border border-zinc-850/80 text-[10px] text-[#FFB74D] font-mono flex items-center gap-1.5 shadow-inner">
                            <Link className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="truncate flex-1 text-left">
                              <div className="font-bold text-[9px] truncate text-white underline">{msg.attachment.name}</div>
                              <div className="text-[7px] text-zinc-550 uppercase">☁️ 雲端檔案連結</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isSendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-3.5 text-xs text-indigo-400 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-l-2 border-l-indigo-500">
                      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></span>
                      AI 避險大師正在穿透分析文件並精算防割水準中...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Floating Attachment Preview */}
              {attachedFile && (
                <div className="px-4 py-2.5 bg-[#0b0c10] border-t border-zinc-850 flex items-center justify-between animate-fade-in relative z-20">
                  <div className="flex items-center gap-2.5">
                    {attachedFile.type === "image" ? (
                      <div className="w-10 h-10 rounded border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0 shadow">
                        <img src={attachedFile.data} alt="attached-preview" className="w-full h-full object-cover" />
                      </div>
                    ) : attachedFile.type === "text" ? (
                      <div className="w-9 h-9 rounded bg-indigo-950/40 flex items-center justify-center border border-indigo-900/60 text-indigo-400 shrink-0 shadow">
                        <FileText className="w-4 h-4 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded bg-amber-950/40 flex items-center justify-center border border-amber-900/60 text-[#FFB74D] shrink-0 shadow">
                        <Link className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-[10px] text-white font-bold font-mono truncate max-w-xs">{attachedFile.name}</div>
                      <div className="text-[8px] text-zinc-500 font-mono uppercase font-bold tracking-wider">
                        {attachedFile.type === "image" ? "📷 投顧/明牌對話截圖" : attachedFile.type === "text" ? "📄 合約/量化報表文字" : "☁️ 雲端檔案連結"}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="p-1 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition active:scale-[0.96]"
                    title="移除附件"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Input strip */}
              <div className="p-4 bg-[#0e1117] border-t border-zinc-850 flex gap-2 items-center relative">
                {/* Hidden File Input Elements */}
                <input 
                  type="file" 
                  id="chat-image-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, "image")} 
                  onClick={(e) => { (e.target as any).value = null; }} 
                />
                <input 
                  type="file" 
                  id="chat-text-upload" 
                  accept=".txt,.csv,.json" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, "text")} 
                  onClick={(e) => { (e.target as any).value = null; }}
                />

                {/* Attachment Selector Button */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`w-9.5 h-9.5 rounded-lg flex items-center justify-center border transition-all ${
                      attachedFile 
                        ? "bg-amber-500/10 border-amber-500/40 text-[#FFB74D] shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse" 
                        : "bg-zinc-950 border-zinc-850 text-zinc-450 hover:text-white hover:border-zinc-700"
                    }`}
                    title="匯入圖片/文件或雲端連結"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </button>

                  {/* Attachment Popover Menu */}
                  {showAttachmentMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowAttachmentMenu(false)}></div>
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#090b10] border border-zinc-800 rounded-lg shadow-2xl p-1.5 z-40 space-y-0.5 animate-fade-in text-left">
                        <label 
                          htmlFor="chat-image-upload" 
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer transition"
                        >
                          <span>📷 上傳對話/明牌截圖</span>
                        </label>
                        <label 
                          htmlFor="chat-text-upload" 
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer transition"
                        >
                          <span>📄 匯入合約/文字白皮書</span>
                        </label>
                        <button
                          onClick={() => {
                            setShowLinkInput(true);
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer transition text-left"
                        >
                          <span>☁️ 匯入雲端公開連結</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  placeholder={
                    attachedFile 
                      ? `已匯入 [${attachedFile.name.substring(0, 12)}...]，請輸入詢問細節或直接發送...`
                      : `輸入您的問題，例如：「請幫我分析 ${chatStockId} 目前適合進場嗎？」...`
                  }
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E5A823]"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={isSendingChat || (!chatInput.trim() && !attachedFile)}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#E5A823] to-[#FFB74D] text-black font-bold text-xs hover:opacity-90 active:scale-[0.98] transition shadow"
                >
                  發送
                </button>
              </div>

              {/* Cloud URL Ingestion Dialog */}
              {showLinkInput && (
                <div className="absolute inset-0 bg-[#090b10]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative text-left">
                    <button 
                      onClick={() => setShowLinkInput(false)}
                      className="absolute top-3 right-3 p-1 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="space-y-1">
                      <h4 className="text-white text-xs font-bold font-mono uppercase flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-[#FFB74D]" />
                        匯入雲端公開檔案連結
                      </h4>
                      <p className="text-[10px] text-zinc-550 leading-normal font-sans">
                        請提供包含投顧方案、白皮書或對沖項目的公開網路 URL 連結。
                      </p>
                    </div>
                    <input 
                      type="url" 
                      value={cloudUrlInput}
                      onChange={(e) => setCloudUrlInput(e.target.value)}
                      placeholder="https://example.com/report.txt"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E5A823] font-mono"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => setShowLinkInput(false)}
                        className="px-3.5 py-1.5 rounded bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold transition"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleCloudUrlSubmit}
                        disabled={!cloudUrlInput.trim()}
                        className="px-3.5 py-1.5 rounded bg-gradient-to-r from-[#E5A823] to-[#FFB74D] text-black text-[10px] font-black hover:opacity-90 transition shadow"
                      >
                        確認匯入
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right pre-loaded indicator widget */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="premium-card rounded-xl p-5 shadow-lg">
                <h3 className="text-white text-sm font-bold flex items-center gap-1.5 mb-3">
                  <Sliders className="w-4 h-4 text-[#FFB74D]" />
                  當前研討標的最新量化指引 ({chatStockId})
                </h3>

                {(() => {
                  const activeSig = data?.signals.find(s => s.stock_id === chatStockId);
                  if (!activeSig) {
                    return <p className="text-xs text-zinc-550 italic font-mono">請先在雷達表完成一次洗價掃描</p>;
                  }
                  
                  const isEStopOrStopLoss = activeSig.close_price <= activeSig.stop_loss_price || activeSig.signal === "隔離" || activeSig.action_signal.includes("停損");
                  const holdingItem = holdings.find(h => h.stock_id === chatStockId);
                  const isTakeProfitAlert = holdingItem && holdingItem.current_pnl_pct >= 20.0;
                  
                  return (
                    <div className="space-y-3.5 text-xs font-mono">
                      {isEStopOrStopLoss && (
                        <div className="bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 text-[10px] p-2.5 rounded-lg animate-pulse shadow-[0_0_10px_rgba(16,184,129,0.2)] leading-relaxed select-none mb-1">
                          🟢 跌破 20MA 停損隔離警示中 - 收盤價已在月線下方，嚴禁進場且強制執行停損風控！
                        </div>
                      )}
                      {isTakeProfitAlert && (
                        <div className="bg-rose-950/70 border border-rose-500/50 text-rose-400 text-[10px] p-2.5 rounded-lg animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.2)] leading-relaxed select-none mb-1">
                          🔴 獲利 20% 減碼警示中 - 當前帳面獲利已達 {holdingItem.current_pnl_pct.toFixed(2)}%，請執行強制減碼 50% 本金回收風控！
                        </div>
                      )}
                      
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
                        <div className="flex justify-between items-center text-[11px] border-t border-zinc-900 pt-1.5">
                          <span className="text-zinc-500">具體行動:</span>
                          {renderActionBadge(activeSig.action_signal)}
                        </div>
                        <div className="flex justify-between text-[11px] border-t border-zinc-900 pt-1.5">
                          <span className="text-zinc-500">建議進場點:</span>
                          <span className="text-zinc-300 font-bold">{activeSig.suggested_entry_price}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">20% 減碼點</div>
                          <div className="text-rose-400 font-bold mt-0.5">{activeSig.take_profit_half_price}</div>
                        </div>
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">移動停利線</div>
                          <div className="text-rose-400 font-bold mt-0.5">{activeSig.trailing_stop_price}</div>
                        </div>
                        <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <div className="text-zinc-550">E-Stop 停損</div>
                          <div className="text-emerald-400 font-bold mt-0.5">{activeSig.stop_loss_price}</div>
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
              
              <div className="premium-card rounded-xl p-6 shadow-lg space-y-4">
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
              
              <div className="premium-card rounded-xl p-5 shadow-lg">
                <h3 className="text-rose-400 text-sm font-bold flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4" />
                  當前物理隔離 / 量化避雷黑名單
                </h3>
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                  以下個股目前處於生命線 20MA 下方，或 50點全量化戰力不足 38 分，已被列入隔離避雷區，全面禁止多頭建倉：
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
              className="premium-card rounded-xl p-6 max-w-md w-full shadow-2xl relative"
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
                  className={`px-5 py-2 rounded-lg font-bold text-xs transition duration-200 ${
                    (buyPrice * buyShares > 25000)
                      ? "bg-zinc-800 text-zinc-650 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-500 text-white hover:opacity-90 active:scale-[0.98] shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:shadow-[0_0_16px_rgba(244,63,94,0.4)]"
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
              className="premium-card rounded-xl p-6 max-w-md w-full shadow-2xl relative"
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
                      <span className={estProfit >= 0 ? "text-rose-400" : "text-emerald-400"}>
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
                  className="px-5 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white hover:opacity-90 active:scale-[0.98] transition shadow-[0_0_12px_rgba(16,184,129,0.3)] hover:shadow-[0_0_16px_rgba(16,184,129,0.4)]"
                >
                  {isSubmittingExit ? "正在召喚 AI 大師檢討交易中..." : "🚪 確認清倉結算"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MOBILE SIDE-UP DETAIL DRAWER */}
      <AnimatePresence>
        {selectedStock && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStock(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />
            {/* Drawer Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="relative w-full max-h-[85vh] bg-[#0c0e12] border-t border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Drag Handle & Sticky Header */}
              <div className="p-3 bg-gradient-to-r from-zinc-900 to-[#0e1117] border-b border-zinc-850 flex flex-col items-center select-none">
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-[#FFB74D]" />
                    <h3 className="font-bold text-white text-xs md:text-sm">獅王戰神實戰解盤 (行動終端)</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedStock(null)}
                    className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Content wrapper with auto scroll */}
              <div className="overflow-y-auto flex-1 pb-10">
                {renderStockDetailsContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
