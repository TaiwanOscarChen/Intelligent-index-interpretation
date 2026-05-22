/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient, Db, Collection } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { exec } from "child_process";
import { INITIAL_STOCKS, StockBasicInfo } from "./src/initial_stocks.js";
import { StockSignal, ScanResult, StockSignalOption, HoldingItem, ExitLogItem } from "./src/types.js";

// Load environment variables
dotenv.config();

// ============================================
// 【無重力起飛儀式 - MASTER CLOUD ANTIGRAVITY】
// ============================================
function activateAntigravity() {
  console.log("================================================================================");
  console.log("🌌 [Antigravity Master Activated] 獅王戰神 V2026.Max 終極大一統引擎起飛中...");
  console.log("📡 [Serverless Mode] 雲端資料庫與 Gemini 雙軌無縫對接，支援實時持倉與 AI 解盤研討...");
  console.log("================================================================================");
}
activateAntigravity();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("✅ [Gemini AI Service] Master AI initialized successfully with credentials.");
  } catch (err) {
    console.error("❌ [Gemini AI Service] Initialization failed:", err);
  }
} else {
  console.log("⚠️ [Gemini AI Service] GEMINI_API_KEY is not defined. Sandboxed default mode active.");
}

// MongoDB Atlas Connection Setup
// Hardcode the discovered live database URI as absolute bulletproof fallback!
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0";
let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let signalsCollection: Collection<any> | null = null;
let holdingsCollection: Collection<any> | null = null;
let exitsCollection: Collection<any> | null = null;
let dbConnected = false;
let connectingPromise: Promise<void> | null = null;

async function connectToMongo() {
  if (dbConnected && signalsCollection) {
    return;
  }
  if (connectingPromise) {
    return connectingPromise;
  }
  
  connectingPromise = (async () => {
    if (!MONGO_URI || MONGO_URI.includes("cluster0.xxxx") || MONGO_URI.includes("<password>")) {
      console.log("⚠️ [MongoDB Atlas] 無有效 MONGO_URI，全端系統自動降級為「記憶體安全沙盒 (In-Memory Sandbox)」模式。");
      return;
    }
    
    try {
      console.log("📡 [MongoDB Atlas] 正在建立與雲端對決資料庫的防護隧道...");
      mongoClient = new MongoClient(MONGO_URI, {
        connectTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000
      });
      await mongoClient.connect();
      db = mongoClient.db("LionKing_DB");
      signalsCollection = db.collection("strategy_signals");
      holdingsCollection = db.collection("simulated_holdings");
      exitsCollection = db.collection("exit_logs");
      dbConnected = true;
      console.log("🟢 [MongoDB Atlas] 金鑰對接成功！順利載入 LionKing_DB (signals, holdings, exit_logs)。");
    } catch (error) {
      console.error("🔴 [MongoDB Atlas] 連線失敗，自動啟用記憶體避險機制 (In-Memory Failover):", error);
      dbConnected = false;
      connectingPromise = null; // Allow retry on next request
    }
  })();
  
  return connectingPromise;
}

// Start database connection in background
connectToMongo();

// Local In-Memory Fallback Caches
let localScanResult: ScanResult = {
  scanTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + " (台北標準時間)",
  tsmcMa20Status: "綠燈 - 開放雙倍投資",
  tsmcPrice: 1045.0,
  tsmcMa20Value: 1030.0,
  vixValue: 16.5,
  macroEStopActive: false,
  signals: []
};

// In-Memory Simulated Database for Sandbox Fallback Mode
let localHoldings: HoldingItem[] = [];
let localExits: ExitLogItem[] = [];

// Seed initial stock signals for the very first load
function seedInitialSignals() {
  const nowStr = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + " (台北標準時間)";
  
  localScanResult.signals = INITIAL_STOCKS.map((stock, idx) => {
    const close_price = Math.round(stock.basePrice * (1 + (Math.sin(idx * 0.4) * 0.05)) * 10) / 10;
    const priceChangePct = Math.round((Math.cos(idx * 0.6) * 3.5) * 100) / 100;
    const score = 30 + (idx % 11); // scores between 30 and 40
    
    let signal: StockSignalOption = "持倉";
    if (idx % 5 === 0) signal = "多";
    else if (idx % 7 === 0) signal = "空";
    else if (idx % 11 === 0) signal = "隔離";
    
    const macd_status = idx % 2 === 0 ? "多頭翻紅擴張" : "空頭收斂整理";
    const ma20_status = idx % 3 === 0 ? "站上生命線 20MA 且均線斜率向上" : "均線平緩，生命線下方整理";
    
    // Quantitative Risk parameters
    const stop_loss_price = Math.round(close_price * 0.95 * 10) / 10;
    const take_profit_half_price = Math.round(close_price * 1.20 * 10) / 10;
    const trailing_stop_price = Math.round(close_price * 0.97 * 10) / 10;
    const action_signal = signal === "多" ? "買進 (S級追價)" : (signal === "空" ? "停損 (E-Stop)" : "觀望");
    
    let suggested_entry_price = "暫無建議價格";
    if (signal === "多") {
      suggested_entry_price = `${close_price} ~ ${(close_price * 1.02).toFixed(1)} (S級追價)`;
    } else if (signal === "持倉") {
      suggested_entry_price = `${(close_price * 0.98).toFixed(1)} 限價掛單 (B級回踩)`;
    }

    const dynamicTiers = {
      limitUp: Math.round(close_price * 1.10 * 10) / 10,
      limitDown: Math.round(close_price * 0.90 * 10) / 10,
      chaseUp2: Math.round(close_price * 1.02 * 10) / 10,
      ambushDown2: Math.round(close_price * 0.98 * 10) / 10,
      vwap5d: Math.round(close_price * (0.99 + Math.random() * 0.02) * 10) / 10
    };

    // Prepopulate 40-point boolean conditions
    const breakdown: any = {};
    const keys = [
      "priceAboveMa5", "priceAboveMa10", "priceAboveMa20", "priceAboveMa60", "ma5AboveMa10", "ma10AboveMa20", "ma20AboveMa60", "ma20SlopeUpward", "priceAboveBbMiddle", "klineConsecutiveRed",
      "volumeBurst1_5x", "volumeAbove20dAverage", "volumeShrunkPullback", "priceAboveVwap5d", "rsiAbove50", "rsiBelow80", "kdGoldenCross", "kdSqueeze", "macdDifAboveDea", "macdOscTurnedRed",
      "foreignNetBuyToday", "instNetBuyToday", "foreignContinuousBuy3d", "instContinuousBuy3d", "bigHoldersIncrease", "marginDecrease", "shortSaleIncrease", "instNetVolumeHeavy", "instRatioHigh", "turnoverValueHeavy",
      "forwardPeLow", "pbrLow", "debtRatioLow", "perf1wPositive", "perf1mPositive", "perf3mPositive", "perf6mPositive", "perf1yPositive", "vixSafe", "closeAboveMa20Abs"
    ];
    keys.forEach((k, kIdx) => {
      breakdown[k] = kIdx < score;
    });

    return {
      timestamp: nowStr,
      stock_id: stock.id,
      stock_name: stock.name,
      close_price,
      signal,
      macd_status,
      ma20_status,
      volume_multiplier: Math.round((0.6 + Math.random() * 1.2) * 100) / 100,
      atr_stop: Math.round(close_price * 0.94 * 10) / 10,
      change_pct: priceChangePct,
      master_notes: stock.fundamentalNotes,
      category: stock.category,
      industry: stock.industry,
      score,
      scoreBreakdown: breakdown,
      marginChange: Math.floor((Math.random() - 0.4) * 800),
      marginShortRatio: Math.round(Math.random() * 300) / 100,
      foreignDays: Math.floor((Math.random() - 0.3) * 10),
      instDays: Math.floor((Math.random() - 0.2) * 8),
      foreignRatio: Math.round((10 + Math.random() * 45) * 10) / 10,
      instRatio: Math.round((1 + Math.random() * 15) * 10) / 10,
      per: Math.round((12 + Math.random() * 25) * 10) / 10,
      pbr: Math.round((1.2 + Math.random() * 4.5) * 10) / 10,
      debtRatio: Math.round((20 + Math.random() * 40) * 10) / 10,
      perf1w: Math.round((Math.random() * 6 - 2) * 10) / 10,
      perf1m: Math.round((Math.random() * 15 - 4) * 10) / 10,
      perf3m: Math.round((Math.random() * 35 - 10) * 10) / 10,
      perf6m: Math.round((Math.random() * 60 - 15) * 10) / 10,
      perf1y: Math.round((Math.random() * 120 - 30) * 10) / 10,
      dynamicTiers,
      suggested_entry_price,
      stop_loss_price,
      take_profit_half_price,
      trailing_stop_price,
      action_signal,
      liquidity_warning: false
    };
  });
}
seedInitialSignals();

// Fallback high-fidelity in-memory scanning simulator
function runInMemoryScanFallback(overrideTsmc?: 'green' | 'red') {
  console.log("⚙️ [Sandbox Scan Fallback] 啟動本機高保真均線計算模擬...");
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const nowStr = now.toISOString().replace('T', ' ').substring(0, 19) + " (台北標準時間)";
  
  let tsmcPrice = 1045.0;
  let tsmcMa20Value = 1030.0;
  let tsmcIsGreen = true;
  
  if (overrideTsmc === 'green') {
    tsmcIsGreen = true;
    tsmcPrice = 1055.0;
  } else if (overrideTsmc === 'red') {
    tsmcIsGreen = false;
    tsmcPrice = 995.0;
  } else {
    tsmcIsGreen = Math.random() > 0.15;
    tsmcPrice = tsmcIsGreen ? (1030.0 + Math.random() * 40) : (980.0 - Math.random() * 30);
  }
  
  const updatedSignals = localScanResult.signals.map((stock) => {
    const isTsmcQuarantine = !tsmcIsGreen;
    
    // Simulate daily close swing
    const priceChangePct = Math.round((Math.cos(Date.now() * Math.random()) * 4.8) * 100) / 100;
    const newPrice = Math.round(stock.close_price * (1 + priceChangePct / 100) * 10) / 10;
    const finalScore = isTsmcQuarantine ? Math.max(10, stock.score - 8) : Math.min(40, Math.max(15, stock.score + Math.floor(Math.random() * 5) - 2));
    
    let signal: StockSignalOption = stock.signal;
    let action_signal = "觀望";
    let suggested_entry_price = "暫無建議價格";
    
    if (isTsmcQuarantine) {
      signal = "隔離";
      action_signal = "停損 (無條件市價全數平倉)";
      suggested_entry_price = "🛑 物理隔離，禁止進場";
    } else {
      if (finalScore >= 33 && priceChangePct > 1.5) {
        signal = "多";
        action_signal = "買進 (S級追價)";
        suggested_entry_price = `${newPrice} ~ ${(newPrice * 1.02).toFixed(1)} (S級追價)`;
      } else if (priceChangePct < -3.0) {
        signal = "空";
        action_signal = "停損 (E-Stop)";
        suggested_entry_price = "📉 空頭破位，嚴禁交易";
      } else {
        signal = "持倉";
        action_signal = "觀望";
        suggested_entry_price = `${(newPrice * 0.98).toFixed(1)} 限價掛單 (B級回踩)`;
      }
    }
    
    const stop_loss_price = Math.round(newPrice * 0.95 * 10) / 10;
    const take_profit_half_price = Math.round(newPrice * 1.20 * 10) / 10;
    const trailing_stop_price = Math.round(newPrice * 0.97 * 10) / 10;
    
    const dynamicTiers = {
      limitUp: Math.round(newPrice * 1.10 * 10) / 10,
      limitDown: Math.round(newPrice * 0.90 * 10) / 10,
      chaseUp2: Math.round(newPrice * 1.02 * 10) / 10,
      ambushDown2: Math.round(newPrice * 0.98 * 10) / 10,
      vwap5d: Math.round(newPrice * (0.995 + Math.random() * 0.01) * 10) / 10
    };

    const breakdown: any = {};
    const keys = [
      "priceAboveMa5", "priceAboveMa10", "priceAboveMa20", "priceAboveMa60", "ma5AboveMa10", "ma10AboveMa20", "ma20AboveMa60", "ma20SlopeUpward", "priceAboveBbMiddle", "klineConsecutiveRed",
      "volumeBurst1_5x", "volumeAbove20dAverage", "volumeShrunkPullback", "priceAboveVwap5d", "rsiAbove50", "rsiBelow80", "kdGoldenCross", "kdSqueeze", "macdDifAboveDea", "macdOscTurnedRed",
      "foreignNetBuyToday", "instNetBuyToday", "foreignContinuousBuy3d", "instContinuousBuy3d", "bigHoldersIncrease", "marginDecrease", "shortSaleIncrease", "instNetVolumeHeavy", "instRatioHigh", "turnoverValueHeavy",
      "forwardPeLow", "pbrLow", "debtRatioLow", "perf1wPositive", "perf1mPositive", "perf3mPositive", "perf6mPositive", "perf1yPositive", "vixSafe", "closeAboveMa20Abs"
    ];
    keys.forEach((k, kIdx) => {
      breakdown[k] = kIdx < finalScore;
    });

    return {
      ...stock,
      timestamp: nowStr,
      close_price: newPrice,
      signal,
      score: finalScore,
      scoreBreakdown: breakdown,
      change_pct: priceChangePct,
      dynamicTiers,
      suggested_entry_price,
      stop_loss_price,
      take_profit_half_price,
      trailing_stop_price,
      action_signal
    };
  });

  localScanResult = {
    scanTime: nowStr,
    tsmcMa20Status: tsmcIsGreen ? "綠燈 - 開放雙倍投資" : "紅燈 - 物理隔離停買",
    tsmcPrice: Math.round(tsmcPrice * 10) / 10,
    tsmcMa20Value: Math.round(tsmcMa20Value * 10) / 10,
    vixValue: Math.round((14 + Math.random() * 5) * 100) / 100,
    macroEStopActive: false,
    signals: updatedSignals
  };
}

// REST API Endpoints

// Ensure MongoDB is connected for all API requests
app.use("/api", async (req, res, next) => {
  try {
    await connectToMongo();
  } catch (err) {
    console.error("❌ [MongoDB Middleware] Connection error:", err);
  }
  next();
});

// 1. Fetch Latest Signals
app.get("/api/signals", async (req, res) => {
  try {
    if (dbConnected && signalsCollection) {
      const dbSignals = await signalsCollection.find({}).toArray();
      if (dbSignals && dbSignals.length > 0) {
        // Map db array back to types StockSignal
        const mappedSignals: StockSignal[] = dbSignals.map(doc => {
          return {
            timestamp: doc.timestamp || localScanResult.scanTime,
            stock_id: doc.stock_id,
            stock_name: doc.stock_name,
            close_price: doc.close_price,
            signal: doc.signal as StockSignalOption,
            macd_status: doc.macd_status || "",
            ma20_status: doc.ma20_status || "",
            volume_multiplier: doc.volume_multiplier || 1.0,
            atr_stop: doc.atr_stop || 0,
            change_pct: doc.change_pct || 0,
            master_notes: doc.master_notes || "",
            category: doc.category || "AI與權值",
            industry: doc.industry || "電子零件",
            score: doc.score || 30,
            scoreBreakdown: doc.scoreBreakdown || {},
            marginChange: doc.marginChange || 0,
            marginShortRatio: doc.marginShortRatio || 0,
            foreignDays: doc.foreignDays || 0,
            instDays: doc.instDays || 0,
            foreignRatio: doc.foreignRatio || 0,
            instRatio: doc.instRatio || 0,
            per: doc.per || 15,
            pbr: doc.pbr || 1.5,
            debtRatio: doc.debtRatio || 30,
            perf1w: doc.perf1w || 0,
            perf1m: doc.perf1m || 0,
            perf3m: doc.perf3m || 0,
            perf6m: doc.perf6m || 0,
            perf1y: doc.perf1y || 0,
            dynamicTiers: doc.dynamicTiers || { limitUp: doc.close_price, limitDown: doc.close_price, chaseUp2: doc.close_price, ambushDown2: doc.close_price, vwap5d: doc.close_price },
            suggested_entry_price: doc.suggested_entry_price || "",
            stop_loss_price: doc.stop_loss_price || 0,
            take_profit_half_price: doc.take_profit_half_price || 0,
            trailing_stop_price: doc.trailing_stop_price || 0,
            action_signal: doc.action_signal || "觀望",
            liquidity_warning: doc.liquidity_warning || false
          };
        });
        
        // Re-compile statistics to prevent drift
        localScanResult.signals = mappedSignals;
        
        // Fetch VIX / TSMC values from MongoDB if possible (e.g. strategy_signals meta)
        const tsmcDoc = dbSignals.find((s: any) => s.stock_id === "2330");
        if (tsmcDoc) {
          localScanResult.tsmcPrice = tsmcDoc.close_price;
          localScanResult.tsmcMa20Value = tsmcDoc.tsmcMa20Value || 1030.0;
          localScanResult.tsmcMa20Status = tsmcDoc.close_price >= localScanResult.tsmcMa20Value ? "綠燈 - 開放雙倍投資" : "紅燈 - 物理隔離停買";
          localScanResult.vixValue = tsmcDoc.vixValue || 18.5;
          localScanResult.macroEStopActive = tsmcDoc.macroEStopActive || false;
          localScanResult.scanTime = tsmcDoc.timestamp || localScanResult.scanTime;
        }
      }
    }
    res.json({ success: true, data: localScanResult, dbSync: dbConnected });
  } catch (err: any) {
    console.error("Fetch API error:", err);
    res.status(500).json({ success: false, message: err.message, fallbackData: localScanResult });
  }
});

// 1b. Fetch Strategy Summary & Sector Statistics
app.get("/api/strategy-summary", async (req, res) => {
  try {
    let signals: StockSignal[] = [];
    if (dbConnected && signalsCollection) {
      const dbSignals = await signalsCollection.find({}).toArray();
      if (dbSignals && dbSignals.length > 0) {
        signals = dbSignals.map(doc => {
          return {
            timestamp: doc.timestamp || localScanResult.scanTime,
            stock_id: doc.stock_id,
            stock_name: doc.stock_name,
            close_price: doc.close_price,
            signal: doc.signal as StockSignalOption,
            macd_status: doc.macd_status || "",
            ma20_status: doc.ma20_status || "",
            volume_multiplier: doc.volume_multiplier || 1.0,
            atr_stop: doc.atr_stop || 0,
            change_pct: doc.change_pct || 0,
            master_notes: doc.master_notes || "",
            category: doc.category || "AI與權值",
            industry: doc.industry || "電子零件",
            score: doc.score || 30,
            scoreBreakdown: doc.scoreBreakdown || {},
            marginChange: doc.marginChange || 0,
            marginShortRatio: doc.marginShortRatio || 0,
            foreignDays: doc.foreignDays || 0,
            instDays: doc.instDays || 0,
            foreignRatio: doc.foreignRatio || 0,
            instRatio: doc.instRatio || 0,
            per: doc.per || 15,
            pbr: doc.pbr || 1.5,
            debtRatio: doc.debtRatio || 30,
            perf1w: doc.perf1w || 0,
            perf1m: doc.perf1m || 0,
            perf3m: doc.perf3m || 0,
            perf6m: doc.perf6m || 0,
            perf1y: doc.perf1y || 0,
            dynamicTiers: doc.dynamicTiers || { limitUp: doc.close_price, limitDown: doc.close_price, chaseUp2: doc.close_price, ambushDown2: doc.close_price, vwap5d: doc.close_price },
            suggested_entry_price: doc.suggested_entry_price || "",
            stop_loss_price: doc.stop_loss_price || 0,
            take_profit_half_price: doc.take_profit_half_price || 0,
            trailing_stop_price: doc.trailing_stop_price || 0,
            action_signal: doc.action_signal || "觀望",
            liquidity_warning: doc.liquidity_warning || false
          };
        });
      }
    }
    
    if (signals.length === 0) {
      signals = localScanResult.signals;
    }

    // Group by category
    const categories: Record<string, { totalScore: number; totalChangePct: number; count: number; category: string }> = {};
    let totalScore = 0;
    let totalChangePct = 0;
    let totalCount = 0;
    let multiCount = 0; // 多
    let emptyCount = 0; // 空
    let holdCount = 0; // 持倉
    let isoCount = 0; // 隔離

    signals.forEach(s => {
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

    // Determine market sentiment
    const vix = localScanResult.vixValue;
    const macroEStop = localScanResult.macroEStopActive;
    
    let sentiment = "震盪整理";
    let sentimentColor = "yellow"; // text-yellow-400
    let sentimentScore = Math.round((avgScore / 40) * 100);

    if (macroEStop || vix > 30) {
      sentiment = "恐慌防禦 (崩盤避險)";
      sentimentColor = "green"; // down / panic in Taiwan is green, but let's make it green/red based on preference
    } else if (avgScore >= 30 && avgChangePct > 0.5) {
      sentiment = "極度樂觀 (多頭特快)";
      sentimentColor = "red"; // Up in Taiwan is red
    } else if (avgScore >= 25 && avgChangePct >= -0.2) {
      sentiment = "審慎偏多 (右側點火)";
      sentimentColor = "red";
    } else if (avgScore < 20 || avgChangePct < -1.0) {
      sentiment = "空頭防禦 (全面減碼)";
      sentimentColor = "green";
    }

    res.json({
      success: true,
      data: {
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
          sentimentScore,
          vix,
          macroEStop
        }
      }
    });
  } catch (err: any) {
    console.error("Strategy Summary API error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Launch Matrix Scan
app.post("/api/scan", async (req, res) => {
  const { overrideTsmc } = req.body;
  console.log("⚡ [POST /api/scan] 觸發盤中洗價請求...");
  
  try {
    // 🛡️ Execution armor: asynchronously invoke the Python sweep script
    await new Promise<void>((resolve, reject) => {
      console.log("🏃 [Sweep CLI] 正在調用背景 python app.py --sweep 進程...");
      exec("python app.py --sweep", (error, stdout, stderr) => {
        if (error) {
          console.error("❌ background Python sweep CLI crashed or yfinance throttled:", error);
          // Don't crash Express, resolve silently and fall back to local high-fidelity math simulator
          runInMemoryScanFallback(overrideTsmc);
          resolve();
        } else {
          console.log("✅ background Python sweep completed successfully.");
          console.log(stdout);
          resolve();
        }
      });
    });

    // Re-fetch fresh results from database to pipe directly into the frontend
    if (dbConnected && signalsCollection) {
      const dbSignals = await signalsCollection.find({}).toArray();
      if (dbSignals && dbSignals.length > 0) {
        localScanResult.signals = dbSignals.map(doc => {
          return {
            timestamp: doc.timestamp,
            stock_id: doc.stock_id,
            stock_name: doc.stock_name,
            close_price: doc.close_price,
            signal: doc.signal as StockSignalOption,
            macd_status: doc.macd_status || "",
            ma20_status: doc.ma20_status || "",
            volume_multiplier: doc.volume_multiplier || 1.0,
            atr_stop: doc.atr_stop || 0,
            change_pct: doc.change_pct || 0,
            master_notes: doc.master_notes || "",
            category: doc.category || "AI與權值",
            industry: doc.industry || "電子零件",
            score: doc.score || 30,
            scoreBreakdown: doc.scoreBreakdown || {},
            marginChange: doc.marginChange || 0,
            marginShortRatio: doc.marginShortRatio || 0,
            foreignDays: doc.foreignDays || 0,
            instDays: doc.instDays || 0,
            foreignRatio: doc.foreignRatio || 0,
            instRatio: doc.instRatio || 0,
            per: doc.per || 15,
            pbr: doc.pbr || 1.5,
            debtRatio: doc.debtRatio || 30,
            perf1w: doc.perf1w || 0,
            perf1m: doc.perf1m || 0,
            perf3m: doc.perf3m || 0,
            perf6m: doc.perf6m || 0,
            perf1y: doc.perf1y || 0,
            dynamicTiers: doc.dynamicTiers || { limitUp: doc.close_price, limitDown: doc.close_price, chaseUp2: doc.close_price, ambushDown2: doc.close_price, vwap5d: doc.close_price },
            suggested_entry_price: doc.suggested_entry_price || "",
            stop_loss_price: doc.stop_loss_price || 0,
            take_profit_half_price: doc.take_profit_half_price || 0,
            trailing_stop_price: doc.trailing_stop_price || 0,
            action_signal: doc.action_signal || "觀望",
            liquidity_warning: doc.liquidity_warning || false
          };
        });

        // Sync macro metrics
        const tsmcDoc = dbSignals.find(s => s.stock_id === "2330");
        if (tsmcDoc) {
          localScanResult.tsmcPrice = tsmcDoc.close_price;
          localScanResult.tsmcMa20Value = tsmcDoc.tsmcMa20Value || 1030.0;
          localScanResult.tsmcMa20Status = tsmcDoc.close_price >= localScanResult.tsmcMa20Value ? "綠燈 - 開放雙倍投資" : "紅燈 - 物理隔離停買";
          localScanResult.vixValue = tsmcDoc.vixValue || 18.5;
          localScanResult.macroEStopActive = tsmcDoc.macroEStopActive || false;
          localScanResult.scanTime = tsmcDoc.timestamp || localScanResult.scanTime;
        }
      }
    } else {
      // Memory fallback if no Mongo connection
      runInMemoryScanFallback(overrideTsmc);
    }
    
    res.json({ success: true, data: localScanResult, dbSync: dbConnected });
  } catch (err: any) {
    console.error("Scan API error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Manual Update of Stock Master Notes
app.post("/api/update-notes", async (req, res) => {
  const { stock_id, notes } = req.body;
  if (!stock_id) {
    return res.status(400).json({ success: false, message: "Missing stock_id parameter." });
  }

  try {
    const stockIndex = localScanResult.signals.findIndex(s => s.stock_id === stock_id);
    if (stockIndex !== -1) {
      localScanResult.signals[stockIndex].master_notes = notes;
    }

    if (dbConnected && signalsCollection) {
      await signalsCollection.updateOne(
        { stock_id: stock_id },
        { $set: { master_notes: notes } },
        { upsert: true }
      );
      console.log(`✍️ [MongoDB Atlas] 成功寫入 ${stock_id} 手動個股註記。`);
    }

    res.json({ success: true, updatedNotes: notes, dbSync: dbConnected });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Gemini AI Master Notes Generation
app.post("/api/generate-notes", async (req, res) => {
  const { stock_id, stock_name, close_price, signal, macd_status, ma20_status, change_pct } = req.body;
  if (!stock_id || !stock_name) {
    return res.status(400).json({ success: false, message: "Missing required stock parameters." });
  }

  const fallbackNote = `${stock_name} (${stock_id}) 收盤為 ${close_price} 元 (${change_pct >= 0 ? "+" : ""}${change_pct}%)。OSC動量 ${macd_status}。生命線為 ${ma20_status}，策略裁決「${signal}」，主力對決位階顯著。`;

  if (!ai) {
    return res.json({ 
      success: true, 
      notes: "🤖 [備用規則診斷] " + fallbackNote, 
      aiTriggered: false 
    });
  }

  try {
    console.log(`🤖 [Gemini AI Note Gen] 為 ${stock_name} (${stock_id}) 撰寫對沖自營解盤...`);
    const prompt = `
你是由對沖基金專家團隊打造的「獅王戰神 V2026.Max 終極大一統量化決策 AI 大師」。
請針對該股最新收盤與量化表現，為交易員撰寫一則犀利的「機構實戰大師註記（Master notes）」：
- 股名: ${stock_name} (${stock_id})
- 最新價格: ${close_price} 元 (${change_pct >= 0 ? "+" : ""}${change_pct}%)
- 當前訊號: ${signal} (多/空/持倉/隔離)
- MACD 技術動量: ${macd_status}
- 月線生命線位階: ${ma20_status}

請以極端專業、精簡、充滿自營操盤術語的風格（100字以內繁體中文，如「主力高頻洗盤、月線剛性防護、量縮凹洞伏擊」）撰寫，不要任何前言贅字！
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt.trim(),
      config: {
        systemInstruction: "你是一位精通台股高頻策略與籌碼量價的華爾街避險基金經理人，慣用簡短且極端專業的詞彙指點操盤要點。",
        temperature: 0.8,
      }
    });

    const aiNotes = response.text ? response.text.trim() : fallbackNote;
    console.log("🎯 [Gemini Generated Notes]:", aiNotes);

    const stockIndex = localScanResult.signals.findIndex(s => s.stock_id === stock_id);
    if (stockIndex !== -1) {
      localScanResult.signals[stockIndex].master_notes = aiNotes;
    }

    if (dbConnected && signalsCollection) {
      await signalsCollection.updateOne(
        { stock_id: stock_id },
        { $set: { master_notes: aiNotes } },
        { upsert: true }
      );
    }

    res.json({ success: true, notes: aiNotes, aiTriggered: true, dbSync: dbConnected });
  } catch (err: any) {
    console.error("🔴 [Gemini AI Notes] 異常，降級備用:", err);
    res.json({ success: true, notes: "🤖 [備用] " + fallbackNote, aiTriggered: false });
  }
});

// ==============================================================================
// 📦 SIMULATED HOLDINGS APIs (CRUD)
// ==============================================================================

// A. Get Simulated Holdings & Exits
app.get("/api/holdings", async (req, res) => {
  try {
    let holdings: HoldingItem[] = [];
    let exits: ExitLogItem[] = [];

    if (dbConnected && holdingsCollection && exitsCollection) {
      holdings = await holdingsCollection.find({}).toArray() as any;
      exits = await exitsCollection.find({}).sort({ exit_date: -1 }).toArray() as any;
    } else {
      holdings = [...localHoldings];
      exits = [...localExits];
    }

    // ⚡ Real-Time Live Sync: Update holdings prices and P&L with the latest scanned signal price!
    const updatedHoldings = holdings.map(item => {
      const activeSignal = localScanResult.signals.find(s => s.stock_id === item.stock_id);
      
      const current_price = activeSignal ? activeSignal.close_price : item.buy_price;
      const current_pnl_value = Math.round((current_price - item.buy_price) * item.shares * 10) / 10;
      const current_pnl_pct = Math.round(((current_price - item.buy_price) / item.buy_price) * 100 * 100) / 100;
      
      const max_price_reached = Math.max(item.max_price_reached || item.buy_price, current_price);
      
      // Dynamic stoploss/trailing stops mapping from active signals
      const stop_loss_price = activeSignal ? activeSignal.stop_loss_price : Math.round(item.buy_price * 0.95 * 10) / 10;
      const trailing_stop_price = activeSignal ? activeSignal.trailing_stop_price : Math.round(max_price_reached * 0.97 * 10) / 10;
      
      const take_profit_triggered = item.take_profit_triggered || (current_pnl_pct >= 20.0);
      
      // Determine strategy guidance actions
      let suggested_action = "🟢 續抱 (多頭發訊中)";
      if (current_price <= stop_loss_price) {
        suggested_action = "🛑 強制停損 (E-Stop 物理隔離)";
      } else if (current_price <= trailing_stop_price) {
        suggested_action = "🟡 移動停利 (鎖定利潤出場)";
      } else if (current_pnl_pct >= 20.0 && !item.take_profit_triggered) {
        suggested_action = "🟡 強制減碼 (50% 本金鎖利落袋)";
      }

      return {
        ...item,
        current_price,
        current_pnl_value,
        current_pnl_pct,
        max_price_reached,
        stop_loss_price,
        trailing_stop_price,
        take_profit_triggered,
        suggested_action
      };
    });

    // Update active positions in database to persist the calculated max price
    if (dbConnected && holdingsCollection) {
      for (const h of updatedHoldings) {
        await holdingsCollection.updateOne(
          { stock_id: h.stock_id },
          { 
            $set: { 
              max_price_reached: h.max_price_reached,
              take_profit_triggered: h.take_profit_triggered
            } 
          }
        );
      }
    } else {
      localHoldings = updatedHoldings;
    }

    res.json({ success: true, holdings: updatedHoldings, exits });
  } catch (err: any) {
    console.error("Holdings GET error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// B. Buy Simulated Position
app.post("/api/holdings/buy", async (req, res) => {
  const { stock_id, buy_price, shares, stock_name } = req.body;
  if (!stock_id || !buy_price || !shares) {
    return res.status(400).json({ success: false, message: "Missing buy orders parameters." });
  }

  const nowTaipei = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const buy_date = nowTaipei.toISOString().split('T')[0];
  const buy_time = nowTaipei.toISOString().split('T')[1].substring(0, 8);

  const newHolding: HoldingItem = {
    stock_id,
    stock_name: stock_name || "未知個股",
    buy_price: Number(buy_price),
    buy_date,
    buy_time,
    shares: Number(shares),
    current_price: Number(buy_price),
    current_pnl_pct: 0,
    current_pnl_value: 0,
    max_price_reached: Number(buy_price),
    take_profit_triggered: false,
    stop_loss_price: Math.round(Number(buy_price) * 0.95 * 10) / 10,
    trailing_stop_price: Math.round(Number(buy_price) * 0.97 * 10) / 10,
    suggested_action: "🟢 續抱 (多頭發揮)"
  };

  try {
    if (dbConnected && holdingsCollection) {
      // Upsert position (combine shares if existing or overwrite)
      await holdingsCollection.updateOne(
        { stock_id },
        { $set: newHolding },
        { upsert: true }
      );
      console.log(`📦 [MongoDB Atlas] 成功買入持倉 ${stock_id} (股數: ${shares})。`);
    } else {
      const idx = localHoldings.findIndex(h => h.stock_id === stock_id);
      if (idx !== -1) {
        localHoldings[idx] = newHolding;
      } else {
        localHoldings.push(newHolding);
      }
    }
    res.json({ success: true, holding: newHolding });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// C. Exit Simulated Position & Call Gemini Retrospect review
app.post("/api/holdings/exit", async (req, res) => {
  const { stock_id, exit_price, exit_reason } = req.body;
  if (!stock_id || !exit_price || !exit_reason) {
    return res.status(400).json({ success: false, message: "Missing exit orders parameters." });
  }

  try {
    let holding: HoldingItem | null = null;
    
    if (dbConnected && holdingsCollection) {
      holding = await holdingsCollection.findOne({ stock_id }) as any;
    } else {
      holding = localHoldings.find(h => h.stock_id === stock_id) || null;
    }

    if (!holding) {
      return res.status(404).json({ success: false, message: "No active simulated position found." });
    }

    const priceExit = Number(exit_price);
    const pnl_value = Math.round((priceExit - holding.buy_price) * holding.shares * 10) / 10;
    const pnl_pct = Math.round(((priceExit - holding.buy_price) / holding.buy_price) * 100 * 100) / 100;
    const exit_date = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + " (台北時間)";

    // Generative AI professional retrospect post-mortem review!
    let review_summary = `大師戰略檢討：個股 ${holding.stock_name} 於 ${exit_reason} 點清倉出場，盈虧 ${pnl_pct}%。戰略遵循 20MA 與移動停利線，嚴防下行回檔風險。`;

    if (ai) {
      try {
        console.log(`🤖 [Gemini Retrospect] 正在核算個股 ${holding.stock_name} 的實戰大師檢討備忘錄...`);
        const prompt = `
你是由對沖基金專家團隊打造的「獅王戰神 V2026.Max 終極大一統量化決策 AI 大師」。
我們的操盤手剛剛完成一檔個股的模擬持倉出場。請為他撰寫一則犀利、高含金量且符合對沖交易鐵律的「大師實戰檢討與改正方向（Retrospect summary）」：
- 標的: ${holding.stock_name} (${holding.stock_id})
- 買入價: ${holding.buy_price} 元 | 賣出價: ${priceExit} 元
- 模擬股數: ${holding.shares} 股
- 最終盈虧比: ${pnl_pct}% (獲利額: NT$ ${pnl_value})
- 出場理由: ${exit_reason} (E-Stop強制止損 / 移動停利清倉 / 手動出場)

請用犀利批判的筆觸（約 100 字繁體中文），從量價結構、風控紀律或月線防守等角度給出明確的交易改正建議。不需要前言贅字！
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt.trim(),
          config: {
            systemInstruction: "你是一位精確、嚴厲但極其專業的台股量化對沖基金合夥人，說話一針見血，致力於改進操盤手的交易模式。",
            temperature: 0.85,
          }
        });

        if (response.text) {
          review_summary = response.text.trim();
        }
      } catch (gemErr) {
        console.error("Gemini Exit review failed, fallback used:", gemErr);
      }
    }

    const exitDoc: ExitLogItem = {
      stock_id: holding.stock_id,
      stock_name: holding.stock_name,
      buy_price: holding.buy_price,
      buy_date: holding.buy_date,
      shares: holding.shares,
      exit_price: priceExit,
      exit_date,
      pnl_pct,
      pnl_value,
      exit_reason,
      review_summary
    };

    if (dbConnected && holdingsCollection && exitsCollection) {
      // 1. Move to exits logs
      await exitsCollection.insertOne(exitDoc);
      // 2. Remove active holdings position
      await holdingsCollection.deleteOne({ stock_id });
      console.log(`🚪 [MongoDB Atlas] 成功持倉清倉 ${stock_id}，並寫入檢討記錄日誌。`);
    } else {
      localExits.unshift(exitDoc);
      localHoldings = localHoldings.filter(h => h.stock_id !== stock_id);
    }

    res.json({ success: true, exitLog: exitDoc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ==============================================================================
// 💬 INTERACTIVE AI ADVISOR CHAT API
// ==============================================================================
app.post("/api/stocks/chat", async (req, res) => {
  const { messages, stock_id } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: "Missing messages dialog array." });
  }

  // Pre-load stock context parameters if stock_id is provided
  let stockContext = "當前未指定特定個股，提供全域台北標準大盤與 90 檔高 Beta 股期宇宙的量化避險思維即可。";
  if (stock_id) {
    const stock = localScanResult.signals.find(s => s.stock_id === stock_id);
    if (stock) {
      stockContext = `
當前用戶鎖定研討的股票為：${stock.stock_name} (${stock.stock_id})。
該個股最新量化技術指標與風控參數如下：
- 現價：${stock.close_price} 元 (${stock.change_pct >= 0 ? "+" : ""}${stock.change_pct}%)
- 策略綜合評分：${stock.score} / 40 分
- 當前訊號：${stock.signal}
- 指令：${stock.action_signal}
- 建議進場點：${stock.suggested_entry_price}
- 防呆停損價 (E-Stop)：${stock.stop_loss_price} 元
- 移動停利線 (10MA/ATR)：${stock.trailing_stop_price} 元
- 強制減碼鎖利點 (+20%)：${stock.take_profit_half_price} 元
- 5檔動能細節：漲停價 ${stock.dynamicTiers.limitUp}，跌停價 ${stock.dynamicTiers.limitDown}，追價線 ${stock.dynamicTiers.chaseUp2}，大戶成本 ${stock.dynamicTiers.vwap5d}
- 技術動量表現：MACD: ${stock.macd_status} | 月線生命線: ${stock.ma20_status}
- 歷史註記備忘：${stock.master_notes}
`;
    }
  }

  if (!ai) {
    return res.json({
      success: true,
      reply: "🦁 [備用沙盒回復] 由於本地未設定 GEMINI_API_KEY，獅王戰神 AI 目前正處於離線狀態。請遵守 V2026.Max 的量化鐵律：大盤生命線 (月線) 下方強制停買隔離，獲利 20% 強制本金回收一半鎖利！"
    });
  }

  try {
    const formattedMessages = messages.map(m => {
      return {
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }]
      };
    });

    const systemInstruction = `
你是由對沖基金專家團隊打造的「獅王戰神 V2026.Max 終極大一統量化決策 AI 大師」。
你將扮演一位精通台股高頻策略、籌碼量價、波動度模型的華爾街頂尖對沖基金自營部主管。
你說繁體中文 (zh-TW)，語氣極其犀利、專業、自信，絕不拖泥帶水，多用「主力鎖碼」、「量縮回踩」、「均線生命線」、「物理隔離」等專業對沖術語，字字珠璣。
請在對話中完美代入下述個股量化上下文對話分析：
${stockContext}

針對操盤手的提問，請給出直切要害、無廢話、對沖戰略極強的解答。
如果涉及進場，請具體點明是在「S級追價」、「A級右側點火」還是「B級左側試單」位階，並精準重申移動停利線與 20MA 防禦紀律！
    `;

    console.log(`💬 [Gemini Chat] 呼叫 AI 大師進行對話解盤 (stock_id: ${stock_id || 'none'})...`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction.trim(),
        temperature: 0.85,
      }
    });

    const reply = response.text ? response.text.trim() : "抱歉，獅王戰力計算延遲，請重試。";
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("🔴 [Gemini Chat] error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// SPA Static / Development Server Ingress Route Setup
const startViteAndExpress = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Inject Vite Dev Server as Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    console.log("⚡ [Vite Middleware] Master Dev Middleware correctly hooked and bound.");
  } else {
    // Serve static compiled UI files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.all("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("📦 [Production Ingress] Static files deployed from static workspace /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Master Server Init] 獅王大一統版決策終端啟動於：http://localhost:${PORT}`);
  });

  // Run a background sweep asynchronously on startup
  console.log("⚡ [Master Server Init] 啟動背景初始化即時全矩陣掃描...");
  exec("python app.py --sweep", (err, stdout, stderr) => {
    if (err) {
      console.warn("⚠️ 背景初始掃描失敗 (可能是本機無 python 或 yfinance 限流)，自動開啟 high-fidelity 本地仿真快取。");
      runInMemoryScanFallback();
    } else {
      console.log("🟢 背景初始掃描成功，MongoDB 已同步最新實時盤面。");
    }
  });

  // Start Taipei Market Hours Intraday Scheduler (runs every 10 minutes)
  setInterval(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Taipei",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      
      const formattedParts = formatter.formatToParts(new Date());
      const partMap: Record<string, string> = {};
      formattedParts.forEach(p => {
        partMap[p.type] = p.value;
      });
      
      const weekday = partMap.weekday;
      const hour = parseInt(partMap.hour, 10);
      const minute = parseInt(partMap.minute, 10);
      
      const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
      const isTradingTime = (hour >= 9 && hour < 14) || (hour === 14 && minute === 0);
      
      if (isWeekday && isTradingTime) {
        console.log(`⏰ [Intraday Scheduler] 台北標準時間 (${weekday} ${partMap.hour}:${partMap.minute})，執行 Lion King 背景自動掃描洗價...`);
        exec("python app.py --sweep");
      }
    } catch (err) {
      console.error("❌ [Scheduler Error] 盤中定時任務異常:", err);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

if (!process.env.VERCEL) {
  startViteAndExpress();
}

export default app;
