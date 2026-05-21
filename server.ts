import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface StockSignal {
  timestamp: string;
  date: string;
  stock_id: string;
  stock_name: string;
  close_price: number;
  volume: number;
  ma20: number;
  macd_status: string;
  signal: '多' | '空' | '持倉' | '隔離';
  volume_multiplier: number;
  atr_stop: number;
  suggested_shares: number;
  change_pct: number;
  ma20_status: string;
  master_notes: string;
  action_advice: string;
}

// Fallback high-fidelity simulation if MongoDB Atlas is not yet populated
const INITIAL_STOCKS = [
  {"id": "2330", "name": "台積電", "base_price": 940.0, "industry": "半導體", "notes": "全球晶圓代工龍頭，先進製程與CoWoS封裝需求極度暢旺，為長線生命線大盤指標。"},
  {"id": "2454", "name": "聯發科", "base_price": 1220.0, "industry": "晶片設計", "notes": "AI手機晶片天璣系列打入高端市場，邊緣運算晶片與ASIC佈局完整。"},
  {"id": "2317", "name": "鴻海", "base_price": 185.0, "industry": "電子代工", "notes": "輝達GB200主力代工廠，組裝份額極高，電動車與液冷散熱長線發酵。"},
  {"id": "2308", "name": "台達電", "base_price": 340.0, "industry": "電源散熱", "notes": "伺服器高階電源與散熱模組領導廠商，綠能充電樁市佔穩步上揚。"},
  {"id": "2382", "name": "廣達", "base_price": 260.0, "industry": "伺服器", "notes": "AI伺服器出貨放量，訂單能見度直達2027年，AI車用電腦同步增溫。"},
  {"id": "3231", "name": "緯創", "base_price": 115.0, "industry": "伺服器", "notes": "輝達AI晶片基板主力供應商，伴隨AI伺服器量產呈現爆發式成長。"},
  {"id": "2357", "name": "華碩", "base_price": 470.0, "industry": "電腦硬體", "notes": "Copilot+ PC首發主戰部隊，高毛利AI PC帶動硬體換機潮。"},
  {"id": "3711", "name": "日月光投控", "base_price": 155.0, "industry": "封裝測試", "notes": "全球半導體後段封測一哥，先進封裝與矽光子核心供應鏈技術領先。"},
  {"id": "2603", "name": "長榮", "base_price": 190.0, "industry": "航運", "notes": "紅海避航因素造成運價指數暴漲，高股息配息率強，長線金流充沛。"},
  {"id": "2881", "name": "富邦金", "base_price": 85.0, "industry": "金融保險", "notes": "金控獲利之王，壽險大筆投資股債收益回升，配息穩定度高。"}
];

function generateSimulatedSignals(isBullish: boolean = true): StockSignal[] {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timestampStr = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  return INITIAL_STOCKS.map(s => {
    const change = (Math.random() * 8 - 3.5); // -3.5% to +4.5%
    const currentPrice = Math.round(s.base_price * (1 + change / 100) * 10) / 10;
    const volMult = Math.round((Math.random() * 2 + 0.5) * 100) / 100;
    const isAboveMA = isBullish ? (Math.random() > 0.3) : false;
    
    let signal: '多' | '空' | '持倉' | '隔離' = '持倉';
    let advice = '⚪ 區間不變，維持原有手中部位，空手仍需觀望。';
    
    if (!isBullish) {
      signal = '隔離';
      advice = '🛑 物理隔離！全面停止買進，防止被融資多頭斷頭拖累！';
    } else if (change > 2.5 && volMult > 1.4 && isAboveMA) {
      signal = '多';
      advice = '🚀 V106訊號共振發動！滿足20MA+MACD+爆量，強勢狙擊！';
    } else if (change < -2 && !isAboveMA) {
      signal = '空';
      advice = '📉 空頭趨勢確立，請無條件避開此標的！';
    }

    return {
      timestamp: timestampStr,
      date: dateStr,
      stock_id: s.id,
      stock_name: s.name,
      close_price: currentPrice,
      volume: Math.floor(Math.random() * 5000000 + 1000000),
      ma20: Math.round(s.base_price * 0.98 * 10) / 10,
      macd_status: signal === '多' ? '💥 多頭雙發散 (柱體擴張中)' : (signal === '空' ? '🚨 空頭收斂 (柱體綠色加深)' : '橫盤震盪 (能量暫不穩定)'),
      signal,
      volume_multiplier: volMult,
      atr_stop: Math.round(currentPrice * 0.94 * 10) / 10,
      suggested_shares: Math.floor(20000 / currentPrice),
      change_pct: Math.round(change * 100) / 100,
      ma20_status: isAboveMA ? `高於生命線 20MA` : `低於生命線 20MA`,
      master_notes: s.notes,
      action_advice: advice
    };
  });
}

const PORT = parseInt(process.env.PORT || "3001", 10);
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = "LionKing_DB";
const COLL_NAME = "lion_signals";

let mongoClient: MongoClient | null = null;
let dbConnected = false;

async function connectDB() {
  if (!MONGO_URI || MONGO_URI.includes("xxxx") || MONGO_URI.includes("<password>")) {
    console.log("⚠️ [MongoDB] 無效的 MONGO_URI，將採用本機模擬與快取數據。");
    return;
  }

  try {
    console.log("🔌 [MongoDB] 正在連線至 MongoDB Atlas 股票資料庫...");
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    await mongoClient.connect();
    dbConnected = true;
    console.log("✅ [MongoDB] 成功連線至 MongoDB Atlas 'LionKing_DB'！");
  } catch (err) {
    console.error("❌ [MongoDB] 連線失敗，股票系統啟用本地高仿真模式。錯誤原因:", err);
    dbConnected = false;
    mongoClient = null;
  }
}

function getCollection(): Collection<StockSignal> | null {
  return dbConnected && mongoClient ? mongoClient.db(DB_NAME).collection<StockSignal>(COLL_NAME) : null;
}

// Global cached signals to ensure data stability when DB is missing
let localCachedSignals = generateSimulatedSignals(true);

async function startServer() {
  await connectDB();

  const app = express();
  app.use(express.json());

  // API: Get latest stock signals
  app.get("/api/signals", async (req, res) => {
    const coll = getCollection();
    if (!coll) {
      return res.json({
        scan_time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        date: new Date().toISOString().split('T')[0],
        tsmc_price: 958.0,
        tsmc_ma20: 935.0,
        tsmc_status: "綠燈 - 開放雙倍投資",
        signals: localCachedSignals
      });
    }

    try {
      // Find the latest timestamp in the database to get the latest scan batch
      const latestRecord = await coll.findOne({}, { sort: { timestamp: -1 } });
      if (!latestRecord) {
        // If empty, initialize DB with simulated signals to make it populate
        const simulated = generateSimulatedSignals(true);
        await coll.insertMany(simulated);
        console.log("🌱 [MongoDB] 初始化空集合 lion_signals 並寫入模擬數據。");
        return res.json({
          scan_time: simulated[0].timestamp,
          date: simulated[0].date,
          tsmc_price: 955.0,
          tsmc_ma20: 935.0,
          tsmc_status: "綠燈 - 開放雙倍投資",
          signals: simulated
        });
      }

      // Query all signals from the same latest scan timestamp
      const latestScanTime = latestRecord.timestamp;
      const scanBatch = await coll.find({ timestamp: latestScanTime }).toArray();

      // Find TSMC to decide the macro market status
      const tsmc = scanBatch.find(s => s.stock_id === "2330") || { close_price: 955, ma20: 935 };
      const isBullish = tsmc.close_price >= tsmc.ma20;
      
      // Update memory cache
      localCachedSignals = scanBatch;

      res.json({
        scan_time: latestScanTime,
        date: latestRecord.date,
        tsmc_price: tsmc.close_price,
        tsmc_ma20: tsmc.ma20,
        tsmc_status: isBullish ? "綠燈 - 開放雙倍投資" : "紅燈 - 物理隔離停買",
        signals: scanBatch
      });
    } catch (err) {
      console.error("Failed to query MongoDB signals:", err);
      res.status(500).json({ error: "讀取大師訊號失敗" });
    }
  });

  // API: Update master note for a stock
  app.post("/api/signals/notes", async (req, res) => {
    const { stock_id, master_notes } = req.body;
    if (!stock_id || master_notes === undefined) {
      return res.status(400).json({ error: "參數不足" });
    }

    // Update local cache
    const cachedStock = localCachedSignals.find(s => s.stock_id === stock_id);
    if (cachedStock) {
      cachedStock.master_notes = master_notes;
    }

    const coll = getCollection();
    if (!coll) {
      return res.json({ message: "備註已成功覆寫於本地記憶體快取中" });
    }

    try {
      // Find latest record's date or current date
      const latestRecord = await coll.findOne({}, { sort: { timestamp: -1 } });
      const targetDate = latestRecord ? latestRecord.date : new Date().toISOString().split('T')[0];

      // Update all instances of this stock for the target date to ensure persistence
      await coll.updateMany(
        { date: targetDate, stock_id: stock_id },
        { $set: { master_notes: master_notes } }
      );

      res.json({ message: "備註已成功同步至 MongoDB Atlas 雲端資料庫" });
    } catch (err) {
      console.error("Failed to update stock notes in MongoDB:", err);
      res.status(500).json({ error: "同步備註至雲端失敗" });
    }
  });

  // Support Vite Dev Mode, and serving Static Build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Intelligent Index terminal running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error for fullstack stock server:", err);
});
