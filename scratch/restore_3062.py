import sys
from pymongo import MongoClient

def main():
    print("Connecting to MongoDB Atlas...")
    client = MongoClient("mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0")
    db = client["LionKing_DB"]
    exits_coll = db["exit_logs"]
    holdings_coll = db["simulated_holdings"]

    print("Checking for 3062 in exit_logs...")
    exit_item = exits_coll.find_one({"stock_id": "3062", "exit_date": "2026-05-29"})
    if not exit_item:
        print("Error: No exit log found for 3062 on 2026-05-29!")
        return

    print("Found exit log:", exit_item)

    # 1. Delete from exit_logs
    res_delete = exits_coll.delete_one({"_id": exit_item["_id"]})
    print(f"Deleted from exit_logs: {res_delete.deleted_count} doc(s)")

    # 2. Re-insert into simulated_holdings
    holding_item = {
        "stock_id": "3062",
        "stock_name": "建漢",
        "buy_price": 30.0,
        "buy_date": "2026-05-29",
        "buy_time": "09:30:00",
        "shares": 666,
        "current_price": 29.95,
        "highest_price": 30.2,
        "lowest_price": 29.8,
        "high_limit_price": 33.0,
        "low_limit_price": 27.0
    }
    
    res_insert = holdings_coll.insert_one(holding_item)
    print(f"Successfully restored 3062 to simulated_holdings! Inserted ID: {res_insert.inserted_id}")
    print("🎉 All operations completed successfully!")

if __name__ == "__main__":
    main()
