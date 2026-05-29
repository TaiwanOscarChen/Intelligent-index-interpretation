const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb+srv://a0983363321:38w9b6J5oPz7u7eE@lionkingcluster.z1h4g.mongodb.net/?retryWrites=true&w=majority&appName=LionKingCluster";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("LionKing_DB");
    const holdings = await db.collection("simulated_holdings").find({}).toArray();
    const exits = await db.collection("exit_logs").find({}).toArray();
    const signals = await db.collection("strategy_signals").find({}).toArray();

    console.log(`Total holdings in DB: ${holdings.length}`);
    console.log(`Total exits in DB: ${exits.length}`);
    console.log(`Total signals in DB: ${signals.length}`);

    if (holdings.length > 0) {
      console.log("\nSome holdings examples:");
      holdings.slice(0, 5).forEach(h => {
        console.log(`- ${h.stock_name} (${h.stock_id}): buy_price=${h.buy_price}, buy_date=${h.buy_date}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
