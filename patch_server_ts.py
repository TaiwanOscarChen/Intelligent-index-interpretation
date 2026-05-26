import os

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update odd lot entry sizing in executeAIAutoTrade
old_shares_code = "shares: 1000,"
new_shares_code = "shares: Math.floor(20000 / sig.close_price) || 1,"
content = content.replace(old_shares_code, new_shares_code)

# 2. Add /api/sweep/force endpoint
force_sweep_endpoint = """
// 🚀 Smart Start: Force Sweep immediately
app.post("/api/sweep/force", (req, res) => {
  console.log("⚡ [Smart Start] 啟動全域即時量化洗價 (Force Sweep)");
  exec("python app.py --sweep", (err, stdout, stderr) => {
    if (err) {
      console.error("Force Sweep Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log("🟢 強制掃描完成，觸發 AI Auto Trade。");
    executeAIAutoTrade();
    res.json({ success: true, message: "Sweep completed" });
  });
});
"""
# Insert before app.listen
listen_idx = content.find("app.listen(PORT")
if listen_idx != -1:
    content = content[:listen_idx] + force_sweep_endpoint + "\\n" + content[listen_idx:]

# 3. Add fast price updater interval
fast_updater_code = """
  // Start Fast Price Updater (every 30 seconds)
  setInterval(() => {
    console.log("⚡ [Fast Updater] 觸發極速報價引擎...");
    exec("python fast_price_updater.py");
  }, 30 * 1000);
"""
# Insert after setInterval for Taipei market hours
intraday_scheduler_idx = content.find("10 * 60 * 1000); // 10 minutes")
if intraday_scheduler_idx != -1:
    end_of_interval = content.find(";", intraday_scheduler_idx) + 1
    content = content[:end_of_interval] + "\\n" + fast_updater_code + content[end_of_interval:]

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("server.ts updated with force sweep, fast updater, and 20k entry logic.")
