const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb+srv://a0983363321:38w9b6J5oPz7u7eE@lionkingcluster.z1h4g.mongodb.net/?retryWrites=true&w=majority&appName=LionKingCluster";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("LionKing_DB");
    const holdingsCol = db.collection("simulated_holdings");
    const exitsCol = db.collection("exit_logs");
    const signalsCol = db.collection("strategy_signals");

    console.log("Starting DB Cleanup and Migration...");

    // 1. Fetch data
    const holdings = await holdingsCol.find({}).toArray();
    const signals = await signalsCol.find({}).toArray();
    const exits = await exitsCol.find({}).toArray();

    console.log(`Original holdings count: ${holdings.length}`);
    console.log(`Original exits count: ${exits.length}`);

    // 2. Prune holdings to max 5
    // Add current score to each holding
    const getScore = (h) => {
      const sig = signals.find(s => s.stock_id === h.stock_id);
      return sig ? (sig.score || 0) : 0;
    };

    const holdingsWithScores = holdings.map(h => ({
      ...h,
      score: getScore(h)
    }));

    // Sort by score descending
    holdingsWithScores.sort((a, b) => b.score - a.score);

    const keepHoldings = holdingsWithScores.slice(0, 5);
    const removeHoldings = holdingsWithScores.slice(5);

    console.log(`Keeping top 5 holdings:`);
    keepHoldings.forEach(h => console.log(`- ${h.stock_name} (${h.stock_id}): score = ${h.score}`));

    // Remove excess holdings from simulated_holdings
    if (removeHoldings.length > 0) {
      console.log(`Removing ${removeHoldings.length} excess holdings...`);
      for (const h of removeHoldings) {
        await holdingsCol.deleteOne({ _id: h._id });
        
        // Add to exits if not already exists in a reasonable form
        // To avoid clutter, we will insert one clean exit record for each removed stock
        const pnlPct = h.buy_price ? ((h.current_price - h.buy_price) / h.buy_price) * 100 : 0;
        const nowTaipei = new Date(Date.now() + 8 * 60 * 60 * 1000);
        
        const exitDoc = {
          stock_id: h.stock_id,
          stock_name: h.stock_name,
          buy_price: h.buy_price,
          buy_date: h.buy_date,
          exit_price: h.current_price || h.buy_price,
          exit_date: nowTaipei.toISOString().split('T')[0],
          exit_time: nowTaipei.toISOString().split('T')[1].substring(0, 8),
          shares: h.shares || 1,
          pnl_value: Math.round(((h.current_price || h.buy_price) - h.buy_price) * (h.shares || 1)),
          pnl_pct: Math.round(pnlPct * 100) / 100,
          exit_reason: "系統重整：依評分限制維持最大五檔持股",
          review_notes: "系統自動汰弱留強重整"
        };
        await exitsCol.insertOne(exitDoc);
      }
    }

    // 3. Deduplicate exits in exit_logs
    console.log("Deduplicating exit_logs...");
    const uniqueExits = [];
    const seen = new Set();

    // Sort exits by _id descending to keep the newest ones
    exits.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));

    for (const e of exits) {
      // Create a unique key for deduplication
      const key = `${e.stock_id}_${e.exit_date}_${e.exit_reason}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueExits.push(e);
      }
    }

    console.log(`Unique exits after deduplication: ${uniqueExits.length}`);

    // If we have duplicates, let's clear the collection and rewrite unique exits
    if (uniqueExits.length < exits.length) {
      console.log(`Rewriting exit_logs with unique records...`);
      await exitsCol.deleteMany({});
      
      // Insert in chunks of 500 to avoid max document size limits
      const chunkSize = 500;
      for (let i = 0; i < uniqueExits.length; i += chunkSize) {
        const chunk = uniqueExits.slice(i, i + chunkSize);
        await exitsCol.insertMany(chunk);
      }
      console.log("Deduplication successfully written to database!");
    }

    console.log("Database successfully cleaned up and migrated!");

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.close();
  }
}
run();
