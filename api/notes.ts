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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { stock_id, master_notes } = req.body;
  if (!stock_id || master_notes === undefined) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  try {
    const db = await connectToDatabase();
    const coll = db.collection(COLL_NAME);

    // Find latest record's date or current date
    const latestRecord = await coll.findOne({}, { sort: { timestamp: -1 } });
    const targetDate = latestRecord ? latestRecord.date : new Date().toISOString().split('T')[0];

    // Update the note for the current date scan
    const result = await coll.updateMany(
      { date: targetDate, stock_id: stock_id },
      { $set: { master_notes: master_notes } }
    );

    res.status(200).json({ message: '備註更新成功', matchedCount: result.matchedCount });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || '更新備註發生異常' });
  }
}
