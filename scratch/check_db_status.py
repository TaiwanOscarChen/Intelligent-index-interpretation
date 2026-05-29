import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv("MONGO_URI") or "mongodb+srv://a0983363321:38w9b6J5oPz7u7eE@lionkingcluster.z1h4g.mongodb.net/?retryWrites=true&w=majority&appName=LionKingCluster"
client = MongoClient(mongo_uri)
db = client["LionKing_DB"]
holdings_col = db["simulated_holdings"]
exits_col = db["exit_logs"]
signals_col = db["strategy_signals"]

holdings = list(holdings_col.find({}))
exits = list(exits_col.find({}))
signals = list(signals_col.find({}))

print(f"Total holdings in DB: {len(holdings)}")
print(f"Total exits in DB: {len(exits)}")
print(f"Total signals in DB: {len(signals)}")

if holdings:
    print("\nSome holdings examples:")
    for h in holdings[:5]:
        print(f"- {h.get('stock_name')} ({h.get('stock_id')}): buy_price={h.get('buy_price')}, buy_date={h.get('buy_date')}")
