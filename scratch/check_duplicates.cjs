const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb+srv://a0983363321:38w9b6J5oPz7u7eE@lionkingcluster.z1h4g.mongodb.net/?retryWrites=true&w=majority&appName=LionKingCluster";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("LionKing_DB");
    const exits = await db.collection("exit_logs").find({}).toArray();
    console.log(`Total exits: ${exits.length}`);
    const uniqueStocks = new Set(exits.map(e => e.stock_id));
    console.log(`Unique stocks in exits: ${uniqueStocks.size}`);
    
    // Show some duplicate counts
    const counts = {};
    exits.forEach(e => {
      const key = `${e.stock_id}_${e.exit_date}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const duplicates = Object.entries(counts).filter(([k, c]) => c > 1);
    console.log(`Number of stock-date combinations with duplicates: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log("Top 5 duplicates:");
      duplicates.slice(0, 5).forEach(([k, c]) => {
        console.log(`- ${k}: ${c} occurrences`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
