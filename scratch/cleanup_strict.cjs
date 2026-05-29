const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("LionKing_DB");
    const exitsCol = db.collection("exit_logs");
    
    console.log("Starting strict exit_logs deduplication by stock_id and exit_date...");
    
    const exits = await exitsCol.find({}).toArray();
    console.log(`Original exits count: ${exits.length}`);
    
    // Sort by _id descending to keep the newest exit logs
    exits.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));
    
    const uniqueExits = [];
    const seenKeys = new Set();
    
    for (const e of exits) {
      if (!e.stock_id || !e.exit_date) continue;
      const key = `${e.stock_id}_${e.exit_date}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueExits.push(e);
      }
    }
    
    console.log(`Unique exits strictly deduplicated: ${uniqueExits.length}`);
    
    if (uniqueExits.length < exits.length) {
      console.log("Deduplication needed! Clearing collection and rewriting unique exits...");
      await exitsCol.deleteMany({});
      
      const chunkSize = 500;
      for (let i = 0; i < uniqueExits.length; i += chunkSize) {
        const chunk = uniqueExits.slice(i, i + chunkSize);
        await exitsCol.insertMany(chunk);
      }
      console.log("Strict deduplication successfully written to DB!");
    } else {
      console.log("No duplicates found strictly by stock_id and exit_date.");
    }
    
  } catch (err) {
    console.error("Deduplication error:", err);
  } finally {
    await client.close();
  }
}
run();
