import os

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add yahooFinance import
if "import yahooFinance" not in content:
    content = content.replace('import { exec } from "child_process";', 'import { exec } from "child_process";\\nimport yahooFinance from "yahoo-finance2";')

# 2. Add /api/prices/fast endpoint
fast_price_endpoint = """
// ⚡ Vercel Cloud Fast Price Updater
app.post("/api/prices/fast", async (req, res) => {
  try {
    if (!dbConnected || !holdingsCollection) return res.status(500).json({ success: false, message: "DB not connected" });
    const holdings = await holdingsCollection.find({}).toArray();
    
    let updated = 0;
    for (const h of holdings) {
      try {
        let ticker = h.stock_id;
        if (!ticker.startsWith("^")) {
           ticker = (ticker.length === 4 && !isNaN(Number(ticker))) ? `${ticker}.TW` : `${ticker}.TWO`;
        }
        const quote = await yahooFinance.quote(ticker);
        if (quote && quote.regularMarketPrice) {
          const current_price = Number(quote.regularMarketPrice.toFixed(2));
          await holdingsCollection.updateOne(
            { stock_id: h.stock_id },
            { $set: { current_price } }
          );
          
          const db = (holdingsCollection as any).s.db;
          const signalsCol = db.collection("strategy_signals");
          await signalsCol.updateOne(
            { stock_id: h.stock_id },
            { $set: { close_price: current_price } }
          );
          updated++;
        }
      } catch (err) {
        console.error(`Error fetching price for ${h.stock_id}:`, err);
      }
    }
    res.json({ success: true, updated, message: `Fast prices updated for ${updated} stocks via Cloud.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
"""

if "/api/prices/fast" not in content:
    listen_idx = content.find("app.listen(PORT")
    if listen_idx != -1:
        content = content[:listen_idx] + fast_price_endpoint + "\\n" + content[listen_idx:]

# 3. Modify /api/sweep/force to trigger GitHub Actions
old_force = """app.post("/api/sweep/force", (req, res) => {
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
});"""

new_force = """app.post("/api/sweep/force", async (req, res) => {
  console.log("⚡ [Smart Start] 向 GitHub Actions 請求啟動全域即時量化洗價");
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return res.status(400).json({ success: false, error: "未設定 GITHUB_TOKEN 機密變數，無法啟動雲端洗價。請至 Vercel 儀表板設定 GITHUB_TOKEN 或等待背景 10 分鐘排程。" });
  }
  
  try {
    const fetchResponse = await fetch("https://api.github.com/repos/TaiwanOscarChen/Intelligent-index-interpretation/actions/workflows/quant_sweep.yml/dispatches", {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref: "main" })
    });
    
    if (fetchResponse.ok) {
      res.json({ success: true, message: "已成功向 GitHub 雲端機房發送洗價指令！資料將在稍後自動更新於儀表板。" });
    } else {
      const errorText = await fetchResponse.text();
      res.status(500).json({ success: false, error: `GitHub API 錯誤: ${fetchResponse.status} - ${errorText}` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});"""

content = content.replace(old_force, new_force)

# 4. Remove local setIntervals since we use cloud now
# Specifically, we want to remove the block from startViteAndExpress:
local_intervals = """
  // Run intraday task manually via Python for V2026.Max (Only run on weekdays between 09:00 - 13:30)
  setInterval(() => {
    try {
      const nowTaipei = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const nowStr = nowTaipei.toLocaleString("en-US", { timeZone: "Asia/Taipei", hour12: false, weekday: 'short' });
      const [weekday, dateStr, timeStr] = nowStr.split(' ');
      const [hour, minute] = timeStr ? timeStr.split(':') : ["0", "0"];
      // Quick map to get exactly parts
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: "Asia/Taipei", hour12: false, weekday: 'short', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date());
      const partMap: any = {};
      parts.forEach(p => partMap[p.type] = p.value);
      
      const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(partMap.weekday);
      const isTradingTime = (parseInt(partMap.hour, 10) >= 9 && parseInt(partMap.hour, 10) < 14) || (parseInt(partMap.hour, 10) === 14 && parseInt(partMap.minute, 10) === 0);
      
      if (isWeekday && isTradingTime) {
        console.log(`⏰ [Intraday Scheduler] 台北標準時間 (${partMap.weekday} ${partMap.hour}:${partMap.minute})，執行 Lion King 背景自動掃描洗價...`);
        exec("python app.py --sweep", (err) => {
          if (!err) executeAIAutoTrade();
        });
      }
    } catch (err) {
      console.error("❌ [Scheduler Error] 盤中定時任務異常:", err);
    }
  }, 10 * 60 * 1000);

  // Start Fast Price Updater (every 30 seconds)
  setInterval(() => {
    console.log("⚡ [Fast Updater] 觸發極速報價引擎...");
    exec("python fast_price_updater.py");
  }, 30 * 1000);
"""

# Let's use regex to remove all setIntervals in startViteAndExpress to be safe
import re
content = re.sub(r'  // Run intraday task manually.*?30 \* 1000\);', '', content, flags=re.DOTALL)

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("server.ts patched for Vercel Cloud APIs.")
