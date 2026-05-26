import os
import re

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('app.post("/api/prices/fast"')
end_idx = content.find('  } catch (err: any) {\\n    res.status(500).json({ success: false, error: err.message });\\n  }\\n});', start_idx)

if start_idx != -1 and end_idx != -1:
    end_pattern = '  } catch (err: any) {\\n    res.status(500).json({ success: false, error: err.message });\\n  }\\n});'
    end_idx += len(end_pattern)
    
    new_code = '''app.post("/api/prices/fast", async (req, res) => {
  try {
    if (!dbConnected) return res.status(500).json({ success: false, message: "DB not connected" });
    
    // Convert INITIAL_STOCKS to yahoo finance tickers
    const tickers = INITIAL_STOCKS.map(s => {
      let ticker = s.stock_id;
      if (!ticker.startsWith("^")) {
        ticker = (ticker.length === 4 && !isNaN(Number(ticker))) ? `${ticker}.TW` : `${ticker}.TWO`;
      }
      return { id: s.stock_id, ticker };
    });

    let updated = 0;
    const db = (holdingsCollection as any).s.db;
    const signalsCol = db.collection("strategy_signals");

    // Fetch in batches to avoid timeout or rate limit
    const batchSize = 10;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        try {
          const quote = await yahooFinance.quote(item.ticker);
          if (quote && quote.regularMarketPrice) {
            const current_price = Number(quote.regularMarketPrice.toFixed(2));
            
            // Update strategy signals
            await signalsCol.updateOne(
              { stock_id: item.id },
              { $set: { close_price: current_price } },
              { upsert: true }
            );
            
            // Also update holdings if present
            if (holdingsCollection) {
              await holdingsCollection.updateOne(
                { stock_id: item.id },
                { $set: { current_price: current_price } }
              );
            }
            
            updated++;
          }
        } catch (err) {
          console.error(`Error fetching price for ${item.id}:`, err);
        }
      }));
    }
    
    res.json({ success: true, updated, message: `Fast prices updated for ${updated} stocks via Cloud.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});'''
    content = content[:start_idx] + new_code + content[end_idx:]
    with open("server.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully replaced /api/prices/fast")
else:
    print("Could not find the function")
