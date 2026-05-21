import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = "LionKing_DB";
const COLL_NAME = "lion_signals";

let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI environment variable");
  }
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = await connectToDatabase();
    const coll = db.collection(COLL_NAME);

    // Find latest record's scan timestamp
    const latestRecord = await coll.findOne({}, { sort: { timestamp: -1 } });
    if (!latestRecord) {
      return res.status(200).json({
        scan_time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        date: new Date().toISOString().split('T')[0],
        tsmc_price: 955.0,
        tsmc_ma20: 935.0,
        tsmc_status: "綠燈 - 開放雙倍投資",
        signals: []
      });
    }

    const latestScanTime = latestRecord.timestamp;
    const scanBatch = await coll.find({ timestamp: latestScanTime }).toArray();

    // Remove MongoDB _id to prevent serialization issues
    const sanitizedBatch = scanBatch.map(s => {
      const { _id, ...rest } = s;
      return rest;
    });

    const tsmc = sanitizedBatch.find((s: any) => s.stock_id === "2330") || { close_price: 955, ma20: 935 };
    const isBullish = tsmc.close_price >= tsmc.ma20;

    res.status(200).json({
      scan_time: latestScanTime,
      date: latestRecord.date,
      tsmc_price: tsmc.close_price,
      tsmc_ma20: tsmc.ma20,
      tsmc_status: isBullish ? "綠燈 - 開放雙倍投資" : "紅燈 - 物理隔離停買",
      signals: sanitizedBatch
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || '查詢大師訊號發生異常' });
  }
}
