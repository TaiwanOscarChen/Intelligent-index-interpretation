import os

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Polling Interval
content = content.replace("5 * 60 * 1000); // refresh every 5 min", "30 * 1000); // refresh every 30 sec for real-time prices")

# 2. Update triggerMatrixScan
old_trigger_code = """
  const triggerMatrixScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    const totalSteps = 15;
    const stepInterval = 100;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepInterval));
      setScanProgress((i / totalSteps) * 100);

      if (data && data.signals.length > 0) {
        const randStock = data.signals[Math.floor(Math.random() * data.signals.length)];
        setCurrScanIndex(`${randStock.stock_id} ${randStock.stock_name}`);
      }
    }

    try {
      let overrideTsmc: string | undefined = undefined;
      if (overrideTsmcState === "force_green") overrideTsmc = "green";
      if (overrideTsmcState === "force_red") overrideTsmc = "red";

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideTsmc })
      });
"""

new_trigger_code = """
  const triggerMatrixScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    // Simulated progress bar while backend sweeps
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress > 95) progress = 95; // cap until backend returns
      setScanProgress(progress);
      
      if (data && data.signals.length > 0) {
        const randStock = data.signals[Math.floor(Math.random() * data.signals.length)];
        setCurrScanIndex(`${randStock.stock_id} ${randStock.stock_name}`);
      }
    }, 500);

    try {
      // SMART START: Trigger force sweep immediately
      await fetch("/api/sweep/force", { method: "POST" });
      
      clearInterval(progressInterval);
      setScanProgress(100);
      setCurrScanIndex("全域掃描完畢，同步最新資料...");
      
      // Fetch updated data from DB
      await fetchMarketData();
      await fetchHoldings();
      
      let overrideTsmc: string | undefined = undefined;
      if (overrideTsmcState === "force_green") overrideTsmc = "green";
      if (overrideTsmcState === "force_red") overrideTsmc = "red";

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideTsmc })
      });
"""

if "const triggerMatrixScan =" in content:
    content = content.replace(old_trigger_code, new_trigger_code)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated src/App.tsx for smart sweep and real-time polling.")
