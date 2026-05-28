import yfinance as yf
from pymongo import MongoClient
import os
import sys
import urllib.parse

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    # Use the default from app.py
    MONGO_URI = "mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0"

def get_mongo_collection(collection_name):
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client["LionKing_DB"]
        return db[collection_name]
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return None

def run_fast_price_update():
    print("⚡ [Fast Price Updater] 啟動極速報價更新...")
    holdings_col = get_mongo_collection("simulated_holdings")
    signals_col = get_mongo_collection("strategy_signals")
    if holdings_col is None or signals_col is None:
        return

    # Gather all unique stock IDs from holdings and signals
    holdings = list(holdings_col.find({}))
    signals = list(signals_col.find({}))
    
    stock_ids = set()
    for h in holdings:
        stock_ids.add(h.get('stock_id'))
    for s in signals:
        stock_ids.add(s.get('stock_id'))
        
    if not stock_ids:
        print("目前沒有追蹤的標的。")
        return
        
    tickers = []
    for sid in stock_ids:
        if sid.startswith("^"):
            tickers.append(sid)
        elif len(sid) == 4 and sid.isdigit():
            tickers.append(f"{sid}.TW")
        else:
            # Some OTC might not end with TWO or TW, we assume OTC if not 4 digits TW
            # If the user data has explicit .TWO, yfinance expects .TWO
            tickers.append(f"{sid}.TWO")
            
    # Fetch latest prices in bulk
    try:
        data = yf.download(tickers, period="1d", interval="1m", progress=False)
        closes = data['Close']
    except Exception as e:
        print(f"yfinance fetch error: {e}")
        return

    updated_count = 0
    for sid in stock_ids:
        ticker = sid
        if not sid.startswith("^"):
            ticker = f"{sid}.TW" if len(sid) == 4 and sid.isdigit() else f"{sid}.TWO"
        
        try:
            # If multiple tickers are downloaded, 'closes' is a DataFrame
            if len(tickers) > 1:
                price_series = closes[ticker]
            else:
                price_series = closes
                
            if not price_series.empty:
                # Need to use dropna() to get the latest non-NaN value because some stocks might not have traded in the last minute
                valid_prices = price_series.dropna()
                if not valid_prices.empty:
                    current_price = float(valid_prices.iloc[-1])
                    if current_price and current_price > 0:
                        current_price = round(current_price, 2)
                        # Update Holdings
                        holdings_col.update_one(
                            {"stock_id": sid},
                            {"$set": {"current_price": current_price}}
                        )
                        # Update Signals
                        signals_col.update_one(
                            {"stock_id": sid},
                            {"$set": {"close_price": current_price}}
                        )
                        updated_count += 1
        except Exception as e:
            continue
            
    print(f"✅ [Fast Price Updater] 成功更新 {updated_count} 檔標的之極速報價。")

if __name__ == "__main__":
    run_fast_price_update()
