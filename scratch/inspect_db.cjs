const { MongoClient } = require("mongodb");
require("dotenv").config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in env");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("LionKing_DB"); // Wait, let's check what db name it is.
    // We can list databases or just check the collections.
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const holdingsColl = db.collection("simulated_holdings");
    const exitsColl = db.collection("exit_logs");
    const notificationsColl = db.collection("trade_notifications");

    const holdings = await holdingsColl.find({}).toArray();
    const exits = await exitsColl.find({}).sort({ _id: -1 }).limit(10).toArray();
    const notifications = await notificationsColl.find({}).sort({ _id: -1 }).limit(10).toArray();

    console.log("\n=== SIMULATED HOLDINGS ===");
    console.log(JSON.stringify(holdings, null, 2));

    console.log("\n=== EXIT LOGS (LAST 10) ===");
    console.log(JSON.stringify(exits, null, 2));

    console.log("\n=== TRADE NOTIFICATIONS (LAST 10) ===");
    console.log(JSON.stringify(notifications, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}
main();
