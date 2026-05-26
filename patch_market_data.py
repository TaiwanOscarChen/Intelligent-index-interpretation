import os

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace twVix
content = content.replace(
    'const twVix = Math.round((16.5 + seedSin(1) * 4.2 + (isMarketHours ? seedCos(5) * 1.5 : 0)) * 100) / 100;',
    '''
    let realMacro: any = null;
    if (dbConnected && holdingsCollection) {
      try {
        const db = (holdingsCollection as any).s.db;
        const macroCol = db.collection("market_macro_data");
        realMacro = await macroCol.findOne({ _id: "latest_macro" });
      } catch(e) {}
    }
    const twVix = realMacro?.twVix ?? Math.round((16.5 + seedSin(1) * 4.2 + (isMarketHours ? seedCos(5) * 1.5 : 0)) * 100) / 100;'''
)

# Replace cnnFearGreed
content = content.replace(
    'const cnnFearGreed = Math.round(Math.max(5, Math.min(95, 55 + seedSin(2) * 22 + seedCos(3) * 8)));',
    'const cnnFearGreed = realMacro?.cnnFearGreed ?? Math.round(Math.max(5, Math.min(95, 55 + seedSin(2) * 22 + seedCos(3) * 8)));'
)

# Replace foreignNet
content = content.replace(
    'const foreignNet = Math.round((120 + seedSin(3) * 850) * 10) / 10; // 外資',
    'const foreignNet = realMacro?.foreignNet ?? Math.round((120 + seedSin(3) * 850) * 10) / 10; // 外資'
)

# Replace threePartyNet
content = content.replace(
    'const threePartyNet = Math.round((foreignNet + trustNet + dealerNet) * 10) / 10;',
    'const threePartyNet = realMacro?.threePartyNet ?? Math.round((foreignNet + trustNet + dealerNet) * 10) / 10;'
)

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Patch applied to server.ts")
