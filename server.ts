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
    {
      "id": "2330",
      "name": "台積電",
      "base_price": 2230.0,
      "industry": "半導體",
      "notes": "全球晶圓代工龍頭，先進製程與CoWoS封裝需求極度暢旺，為長線生命線大盤指標。"
    },
    {
      "id": "2454",
      "name": "聯發科",
      "base_price": 3550.0,
      "industry": "晶片設計",
      "notes": "AI手機晶片天璣系列打入高端市場，邊緣運算晶片與ASIC佈局完整。"
    },
    {
      "id": "2317",
      "name": "鴻海",
      "base_price": 247.5,
      "industry": "電子代工",
      "notes": "輝達GB200主力代工廠，組裝份額極高，電動車與液冷散熱長線發酵。"
    },
    {
      "id": "2308",
      "name": "台達電",
      "base_price": 2030.0,
      "industry": "電源散熱",
      "notes": "伺服器高階電源與散熱模組領導廠商，綠能充電樁市佔穩步上揚。"
    },
    {
      "id": "2382",
      "name": "廣達",
      "base_price": 308.0,
      "industry": "伺服器",
      "notes": "AI伺服器出貨放量，訂單能見度直達2027年，AI車用電腦同步增溫。"
    },
    {
      "id": "3231",
      "name": "緯創",
      "base_price": 140.0,
      "industry": "伺服器",
      "notes": "輝達AI晶片基板主力供應商，伴隨AI伺服器量產呈現爆發式成長。"
    },
    {
      "id": "2357",
      "name": "華碩",
      "base_price": 656.0,
      "industry": "電腦硬體",
      "notes": "Copilot+ PC首發主戰部隊，高毛利AI PC帶動硬體換機潮。"
    },
    {
      "id": "2395",
      "name": "研華",
      "base_price": 463.5,
      "industry": "工業電腦",
      "notes": "全球工業電腦龍頭，邊緣AI與智慧工廠雙軸轉型帶動獲利穩健提升。"
    },
    {
      "id": "3711",
      "name": "日月光投控",
      "base_price": 510.0,
      "industry": "封裝測試",
      "notes": "全球半導體後段封測一哥，先進封裝與矽光子核心供應鏈技術領先。"
    },
    {
      "id": "2408",
      "name": "南亞科",
      "base_price": 293.0,
      "industry": "記憶體",
      "notes": "DDR5與高頻寬記憶體需求外溢，利基型記憶體合約價緩步回升。"
    },
    {
      "id": "2379",
      "name": "瑞昱",
      "base_price": 575.0,
      "industry": "通訊晶片",
      "notes": "網路通訊蟹級晶片需求回暖，車用乙太網路與Wi-Fi 7出貨力道轉強。"
    },
    {
      "id": "3034",
      "name": "聯詠",
      "base_price": 484.5,
      "industry": "驅動晶片",
      "notes": "OLED驅動IC出貨強勁，車用顯示介面晶片在大陸車廠滲透率拉高。"
    },
    {
      "id": "3037",
      "name": "欣興",
      "base_price": 905.0,
      "industry": "載板",
      "notes": "ABF高階載板需求因AI晶片大增而止跌回溫，高密度連接板獲利優渥。"
    },
    {
      "id": "3189",
      "name": "景碩",
      "base_price": 554.0,
      "industry": "載板",
      "notes": "高階封裝載板佔比提升，受惠美系AI大廠晶圓載板追單。"
    },
    {
      "id": "8046",
      "name": "南電",
      "base_price": 872.0,
      "industry": "載板",
      "notes": "晶片大廠ABF高階載板產能釋出，營運觸底反彈格局確立。"
    },
    {
      "id": "2301",
      "name": "光寶科",
      "base_price": 204.5,
      "industry": "電源供應",
      "notes": "高階伺服器電源、液冷散熱及車用電子出貨激增，高毛利比重提高。"
    },
    {
      "id": "2324",
      "name": "仁寶",
      "base_price": 30.4,
      "industry": "電子代工",
      "notes": "伺服器產品線往利基型產品切入，智慧醫療及物聯網產品線利潤提升。"
    },
    {
      "id": "2353",
      "name": "宏碁",
      "base_price": 28.4,
      "industry": "電腦硬體",
      "notes": "推廣自主研發之AI PC，在印度及多個東南亞新興市場微幅成長。"
    },
    {
      "id": "2603",
      "name": "長榮",
      "base_price": 212.0,
      "industry": "航運",
      "notes": "紅海避航因素造成運價指數爆漲，高股息配息率強，長線金流充沛。"
    },
    {
      "id": "2609",
      "name": "陽明",
      "base_price": 51.1,
      "industry": "航運",
      "notes": "受惠美東談判不確定性及運能吃緊，第二、三季旺季回報翻倍。"
    },
    {
      "id": "2615",
      "name": "萬海",
      "base_price": 81.2,
      "industry": "航運",
      "notes": "亞洲區間近洋航線運費漲幅顯著，多艘新造高效率節能船陸續交船。"
    },
    {
      "id": "2610",
      "name": "華航",
      "base_price": 18.7,
      "industry": "航空",
      "notes": "暑假出國需求突破新高，AI供應鏈空運急單拉動航空貨運高盤價。"
    },
    {
      "id": "2618",
      "name": "長榮航",
      "base_price": 35.3,
      "industry": "航空",
      "notes": "高階商務艙及北美航線載客率持續逼近滿載，燃油成本避險得宜。"
    },
    {
      "id": "2881",
      "name": "富邦金",
      "base_price": 96.1,
      "industry": "金融保險",
      "notes": "金控獲利之王，壽險大筆投資股債收益回升，配息穩定度高。"
    },
    {
      "id": "2882",
      "name": "國泰金",
      "base_price": 78.7,
      "industry": "金融保險",
      "notes": "核心國泰人壽利差改善，金控本業獲利穩步翻倍，海外資產評價揚升。"
    },
    {
      "id": "2886",
      "name": "兆豐金",
      "base_price": 40.2,
      "industry": "金融保險",
      "notes": "公股金控龍頭，高結算外匯優勢，長期獲利能力在升息環境下受惠。"
    },
    {
      "id": "2891",
      "name": "中信金",
      "base_price": 57.5,
      "industry": "金融保險",
      "notes": "核心中國信託銀行淨利差居國籍銀行之首，海外分行獲利能力強健。"
    },
    {
      "id": "2884",
      "name": "玉山金",
      "base_price": 31.5,
      "industry": "金融保險",
      "notes": "財富管理業務與信用卡簽帳金額市佔率前段班，積極數位金融化轉型。"
    },
    {
      "id": "1301",
      "name": "台塑",
      "base_price": 45.8,
      "industry": "塑膠石化",
      "notes": "利基型特用化學品轉型中，受惠德州廠產能擴展與乙烯利差改善。"
    },
    {
      "id": "1303",
      "name": "南亞",
      "base_price": 87.3,
      "industry": "石化電子材料",
      "notes": "電子環氧樹脂及玻纖布因伺服器板升級，需求觸底重回擴張區。"
    },
    {
      "id": "1326",
      "name": "台化",
      "base_price": 45.5,
      "industry": "化纖石化",
      "notes": "芳香烴與酚鏈條毛利隨供需關係改善回暖，推進高值化新材料。"
    },
    {
      "id": "6505",
      "name": "台塑化",
      "base_price": 51.3,
      "industry": "煉油石化",
      "notes": "全球原油需求回穩，成品油裂解差價維持高檔，庫存回升利益增加。"
    },
    {
      "id": "2002",
      "name": "中鋼",
      "base_price": 18.2,
      "industry": "鋼鐵冶金",
      "notes": "中國粗鋼減產與碳中和高階鋼材溢價拉大，迎來基建重建復甦潮。"
    },
    {
      "id": "1101",
      "name": "台泥",
      "base_price": 24.2,
      "industry": "水泥與儲能",
      "notes": "轉型歐洲低碳綠色水泥，並在土耳其與非洲大舉建設儲能與鋰電池廠。"
    },
    {
      "id": "1402",
      "name": "遠東新",
      "base_price": 27.2,
      "industry": "紡織控股",
      "notes": "紅色聚酯(rPET)獲國際一級運動服飾品牌包下產能，供不應求。"
    },
    {
      "id": "2105",
      "name": "正新",
      "base_price": 32.5,
      "industry": "輪胎製造",
      "notes": "大卡客車大胎回升及雙輪高毛利產品市佔率在東南亞與印度持續跑贏。"
    },
    {
      "id": "9904",
      "name": "寶成",
      "base_price": 25.8,
      "industry": "製鞋鞋材",
      "notes": "全球運動品牌去庫存進入尾聲，新季度製鞋代工出貨排程重回爆滿現狀。"
    },
    {
      "id": "5871",
      "name": "中租-KY",
      "base_price": 112.0,
      "industry": "租賃金融",
      "notes": "東協與大陸中小企業融資放款成長強，風險控管機制優秀，殖利率佳。"
    },
    {
      "id": "1216",
      "name": "統一",
      "base_price": 73.1,
      "industry": "食品百貨",
      "notes": "國內超商霸主與生鮮自營通路金雞母，轉投資家樂福整併效應擴大。"
    },
    {
      "id": "2912",
      "name": "統一超",
      "base_price": 221.0,
      "industry": "零售通路",
      "notes": "實體店突破7000家大關，數位APP及多元店型拉升客單價，營收創高。"
    },
    {
      "id": "5876",
      "name": "上海商銀",
      "base_price": 40.2,
      "industry": "商業銀行",
      "notes": "企業與海外外幣聯貸專精，利差與授信獲利在同業中維持前段優勢。"
    },
    {
      "id": "2354",
      "name": "鴻準",
      "base_price": 58.9,
      "industry": "金屬機殼",
      "notes": "散熱模組與鈦合金機殼工藝領先，主力供應高階遊戲機與伺服器機殼。"
    },
    {
      "id": "2347",
      "name": "聯強",
      "base_price": 84.4,
      "industry": "通路分銷",
      "notes": "亞太最大高科技分銷巨擘，商用伺服器零件及電競設備分銷利潤高企。"
    },
    {
      "id": "2449",
      "name": "京元電子",
      "base_price": 286.0,
      "industry": "封裝測試",
      "notes": "AI 晶片測試大廠，測試時間加倍，受惠爆發式測試產能利用率走高。"
    },
    {
      "id": "3045",
      "name": "台灣大",
      "base_price": 113.5,
      "industry": "電信網路",
      "notes": "合併台灣之星後用戶規模擴大，5G加值服務及momo電商雙引擎穩定成長。"
    },
    {
      "id": "4904",
      "name": "遠傳",
      "base_price": 95.7,
      "industry": "電信網路",
      "notes": "新遠傳佈局成功，企業雲端與AI物聯網客製方案成為新興金牛產品。"
    },
    {
      "id": "8454",
      "name": "富邦媒",
      "base_price": 191.0,
      "industry": "電子商務",
      "notes": "自主車隊與衛星倉儲優勢領航電商，AI智慧揀貨系統大幅縮減物流成本。"
    },
    {
      "id": "9910",
      "name": "豐泰",
      "base_price": 69.2,
      "industry": "鞋業製造",
      "notes": "美系運動品牌大本營，主力研發中心與高毛利訂單合約掌握在手。"
    },
    {
      "id": "9921",
      "name": "巨大",
      "base_price": 70.8,
      "industry": "自行車",
      "notes": "高階E-bike歐美庫存重整完畢，高附加價值車種銷售轉正，重拾增勢。"
    },
    {
      "id": "1590",
      "name": "亞德客-KY",
      "base_price": 1420.0,
      "industry": "氣動元件",
      "notes": "工廠自動化需求強勁復甦，電池、新能源氣動模組拉貨重現上升波段。"
    }
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
        tsmc_price: 2230.0,
        tsmc_ma20: 2180.0,
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
          tsmc_price: 2230.0,
          tsmc_ma20: 2180.0,
          tsmc_status: "綠燈 - 開放雙倍投資",
          signals: simulated
        });
      }

      // Query all signals from the same latest scan timestamp
      const latestScanTime = latestRecord.timestamp;
      const scanBatch = await coll.find({ timestamp: latestScanTime }).toArray();

      // Find TSMC to decide the macro market status
      const tsmc = scanBatch.find(s => s.stock_id === "2330") || { close_price: 2230, ma20: 2180 };
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
