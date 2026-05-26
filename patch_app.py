import os
import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

macro_code = '''
def update_macro_data():
    """
    Crawls TWSE and Yahoo Finance for macro data.
    Saves to MongoDB collection 'market_macro_data'.
    """
    print("🌍 啟動總經數據自動爬蟲...")
    db_col = get_mongo_collection("market_macro_data")
    if db_col is None:
        print("❌ 無法連線至 MongoDB，略過總經數據更新")
        return
        
    db = db_col.database
    macro_col = db["market_macro_data"]
    
    data = {
        "twVix": 18.0,
        "cnnFearGreed": 50,
        "threePartyNet": 0.0,
        "foreignNet": 0.0,
        "foreignFutures": 0.0,
        "tradeValue": 0.0,
        "status": "online",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    }
    
    # 1. Fetch VIX from Yahoo Finance
    try:
        vix_ticker = yf.Ticker("^VIX")
        vix_info = vix_ticker.info
        if "regularMarketPrice" in vix_info:
            data["twVix"] = vix_info["regularMarketPrice"]
        else:
            hist = vix_ticker.history(period="1d")
            if not hist.empty:
                data["twVix"] = float(hist["Close"].iloc[-1])
        print(f"✅ 成功獲取 VIX 恐慌指數: {data['twVix']}")
    except Exception as e:
        print(f"⚠️ VIX 爬取失敗: {e}")
        
    # CNN Fear Greed fallback to calculation based on VIX
    # Usually VIX < 15 is Greed (> 60), VIX > 25 is Fear (< 40)
    # Map VIX [10, 30] to [90, 10]
    vix_val = data["twVix"]
    mapped = 90 - ((vix_val - 10) * 4)
    data["cnnFearGreed"] = max(10, min(90, int(mapped)))
        
    # 2. Fetch TWSE Three-Party Net (BFI82U)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Disable SSL verification for TWSE OpenAPI to prevent CERTIFICATE_VERIFY_FAILED
        res = requests.get('https://openapi.twse.com.tw/v1/exchangeReport/BFI82U', headers=headers, verify=False, timeout=10)
        if res.status_code == 200:
            json_data = res.json()
            # The data is a list of dicts. We want the row where "Day_Week_Month" might be something, or just sum them up?
            # TWSE BFI82U: [{"Item":"自營商(自行買賣)","Buy_Sum":"123","Sell_Sum":"123","Difference":"0"}, ...]
            three_party = 0.0
            foreign = 0.0
            for item in json_data:
                diff_str = item.get("Difference", "0").replace(",", "")
                diff = float(diff_str) / 100000000.0 # Convert to hundred million (億)
                three_party += diff
                if "外資" in item.get("Item", ""):
                    foreign += diff
            data["threePartyNet"] = round(three_party, 2)
            data["foreignNet"] = round(foreign, 2)
            print(f"✅ 成功獲取 三大法人買賣超: {data['threePartyNet']}億, 外資: {data['foreignNet']}億")
        else:
            print(f"⚠️ TWSE API 回傳錯誤碼: {res.status_code}")
    except Exception as e:
        print(f"⚠️ 三大法人資料爬取失敗: {e}")

    # 3. Save to MongoDB
    try:
        macro_col.update_one(
            {"_id": "latest_macro"},
            {"$set": data},
            upsert=True
        )
        print("✅ 總經數據已寫入 MongoDB")
    except Exception as e:
        print(f"❌ MongoDB 寫入總經數據失敗: {e}")

'''

insert_idx = content.find('def run_v2026_full_sweep():')
if insert_idx != -1:
    new_content = content[:insert_idx] + macro_code + content[insert_idx:]
    
    # inject the call inside run_v2026_full_sweep
    call_target = 'print("\\n=======================================================")'
    call_idx = new_content.find(call_target, insert_idx)
    if call_idx != -1:
        new_content = new_content[:call_idx] + 'update_macro_data()\\n    ' + new_content[call_idx:]
        
    with open("app.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched app.py")
else:
    print("Failed to find run_v2026_full_sweep")
