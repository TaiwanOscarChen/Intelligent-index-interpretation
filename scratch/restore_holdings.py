import sys
from pymongo import MongoClient
import datetime

MONGO_URI = "mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["LionKing_DB"]

holdings_collection = db["simulated_holdings"]
exits_collection = db["exit_logs"]
notifications_collection = db["trade_notifications"]

# 1. Define the 4 stocks to restore
stocks_to_restore = [
    {
        "stock_id": "3035",
        "stock_name": "智原",
        "buy_price": 209.5,
        "shares": 95,
        "buy_date": "2026-05-29"
    },
    {
        "stock_id": "3450",
        "stock_name": "聯鈞",
        "buy_price": 485.0,
        "shares": 41,
        "buy_date": "2026-05-29"
    },
    {
        "stock_id": "3062",
        "stock_name": "建漢",
        "buy_price": 30.0,
        "shares": 666,
        "buy_date": "2026-05-29"
    },
    {
        "stock_id": "4966",
        "stock_name": "譜瑞-KY",
        "buy_price": 909.0,
        "shares": 22,
        "buy_date": "2026-05-29"
    }
]

print("🧹 [Backtrack] 啟動 T+1 剛性風控資料庫回溯確認程序...")

# 2. Restore active positions in simulated_holdings
for s in stocks_to_restore:
    stock_id = s["stock_id"]
    new_h = {
        "stock_id": stock_id,
        "stock_name": s["stock_name"],
        "buy_price": s["buy_price"],
        "buy_date": s["buy_date"],
        "shares": s["shares"],
        "current_price": s["buy_price"],
        "current_pnl_pct": 0.0,
        "current_pnl_value": 0.0,
        "max_price_reached": s["buy_price"],
        "take_profit_triggered": False,
        "stop_loss_price": round(s["buy_price"] * 0.95 * 10) / 10,
        "trailing_stop_price": round(s["buy_price"] * 0.97 * 10) / 10,
        "suggested_action": "🟢 續抱 (多頭發訊中)"
    }
    holdings_collection.update_one({"stock_id": stock_id}, {"$set": new_h}, upsert=True)
    print(f"✅ 已成功復原持倉股票: {s['stock_name']} ({stock_id}) - 均價: {s['buy_price']}")

# 3. Delete exit logs for these stocks on 2026-05-29
delete_exits_result = exits_collection.delete_many({
    "stock_id": {"$in": ["3035", "3450", "3062", "4966"]},
    "exit_date": "2026-05-29"
})
print(f"🧹 已成功刪除錯誤的當日出場檢討紀錄共 {delete_exits_result.deleted_count} 筆。")

# 4. Delete SELL notifications for these stocks on 2026-05-29
delete_notif_result = notifications_collection.delete_many({
    "stock_id": {"$in": ["3035", "3450", "3062", "4966"]},
    "type": "SELL",
    "timestamp": {"$regex": "^2026-05-29"}
})
print(f"🧹 已成功清理錯誤的當日賣出實時情報廣播共 {delete_notif_result.deleted_count} 筆。")

print("🎉 [Success] 資料庫回溯確認程序圓滿完成！現在持倉已完美歸位！")
