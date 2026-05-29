import os

app_path = "app.py"

# Read original file
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '# 2. 處理自動進場 (最多 5 檔)'
start_idx = content.find(start_marker)
if start_idx == -1:
    # Try with raw text or different markers
    print("Error: Start marker not found!")
    exit(1)

end_marker = 'except Exception as e:'
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Error: End marker not found!")
    exit(1)

# New Python code segment to inject
new_segment = """# 2. 進場與換股交易 (上限 5 檔，總額 10 萬，各 2 萬)
        current_holdings = list(holdings_collection.find({}))
        
        # Filter candidate signals not in current holdings
        candidates = [s for s in signals if s.get('score', 0) >= 38 and not any(h.get('stock_id') == s.get('stock_id') for h in current_holdings)]
        candidates.sort(key=lambda x: x.get('score', 0), reverse=True)

        for sig in candidates:
            current_holdings_count = len(current_holdings)
            score = sig.get('score', 0)
            stock_id = sig.get('stock_id')
            stock_name = sig.get('stock_name')
            close_price = sig.get('close_price')
            if not close_price or close_price == 0:
                continue

            if current_holdings_count < 5:
                # Buy directly
                print(f"➕ [AI Auto Trade] 買入新訊號股 {stock_name} ({stock_id}) 評分: {score}分")
                now_taipei = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))
                shares = max(1, int(20000 // close_price))
                new_h = {
                    "stock_id": stock_id,
                    "stock_name": stock_name,
                    "buy_price": close_price,
                    "buy_date": now_taipei.strftime('%Y-%m-%d'),
                    "buy_time": now_taipei.strftime('%H:%M:%S'),
                    "shares": shares,
                    "current_price": close_price,
                    "current_pnl_pct": 0,
                    "current_pnl_value": 0,
                    "max_price_reached": close_price,
                    "take_profit_triggered": False,
                    "stop_loss_price": sig.get('stop_loss_price'),
                    "trailing_stop_price": sig.get('trailing_stop_price'),
                    "suggested_action": "💡 AI 進場"
                }
                holdings_collection.update_one({"stock_id": stock_id}, {"$set": new_h}, upsert=True)
                current_holdings.append(new_h)

                # Log buy notification
                notifications_collection.insert_one({
                    "type": "BUY",
                    "stock_id": stock_id,
                    "stock_name": stock_name,
                    "price": close_price,
                    "shares": shares,
                    "reason": f"評分達 {score} 分，AI 庫存常規買入",
                    "timestamp": now_taipei.isoformat()
                })
            else:
                # Compare scores with current holdings
                def get_h_score(h):
                    h_sig = next((s for s in signals if s.get('stock_id') == h.get('stock_id')), None)
                    return h_sig.get('score', 0) if h_sig else 0

                # Find holding with minimum score
                h_min = min(current_holdings, key=get_h_score)
                min_score = get_h_score(h_min)

                if score > min_score:
                    # Swap!
                    h_min_id = h_min.get('stock_id')
                    h_min_name = h_min.get('stock_name')
                    print(f"🔄 [AI Auto Trade] 換股操作：以高評分 {stock_name} ({score}分) 替換最低評分持股 {h_min_name} ({min_score}分)")
                    
                    # Exit the minimum scoring holding
                    now_taipei = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))
                    exit_reason = f"換股操作：由更高效益評分股票({stock_name}: {score}分)替換得分最低持股({h_min_name}: {min_score}分)"
                    
                    h_min_buy_price = h_min.get('buy_price')
                    h_min_current_price = h_min.get('current_price', h_min_buy_price)
                    h_min_pnl_pct = ((h_min_current_price - h_min_buy_price) / h_min_buy_price * 100) if h_min_buy_price else 0
                    
                    exit_item = {
                        "stock_id": h_min_id,
                        "stock_name": h_min_name,
                        "buy_price": h_min_buy_price,
                        "buy_date": h_min.get('buy_date'),
                        "exit_price": h_min_current_price,
                        "exit_date": now_taipei.strftime('%Y-%m-%d'),
                        "exit_time": now_taipei.strftime('%H:%M:%S'),
                        "shares": h_min.get('shares', 1),
                        "pnl_value": round((h_min_current_price - h_min_buy_price) * h_min.get('shares', 1)),
                        "pnl_pct": round(h_min_pnl_pct, 2),
                        "exit_reason": exit_reason,
                        "review_notes": "AI 換股平衡操作"
                    }
                    
                    exits_collection.insert_one(exit_item)
                    holdings_collection.delete_one({"stock_id": h_min_id})
                    
                    notifications_collection.insert_one({
                        "type": "SELL",
                        "stock_id": h_min_id,
                        "stock_name": h_min_name,
                        "price": h_min_current_price,
                        "reason": exit_reason,
                        "timestamp": now_taipei.isoformat()
                    })
                    
                    # Buy candidate sig
                    shares = max(1, int(20000 // close_price))
                    new_h = {
                        "stock_id": stock_id,
                        "stock_name": stock_name,
                        "buy_price": close_price,
                        "buy_date": now_taipei.strftime('%Y-%m-%d'),
                        "buy_time": now_taipei.strftime('%H:%M:%S'),
                        "shares": shares,
                        "current_price": close_price,
                        "current_pnl_pct": 0,
                        "current_pnl_value": 0,
                        "max_price_reached": close_price,
                        "take_profit_triggered": False,
                        "stop_loss_price": sig.get('stop_loss_price'),
                        "trailing_stop_price": sig.get('trailing_stop_price'),
                        "suggested_action": "💡 AI 進場"
                    }
                    holdings_collection.update_one({"stock_id": stock_id}, {"$set": new_h}, upsert=True)
                    
                    # Remove h_min and add new_h to current_holdings list
                    current_holdings = [h for h in current_holdings if h.get('stock_id') != h_min_id]
                    current_holdings.append(new_h)
                    
                    notifications_collection.insert_one({
                        "type": "BUY",
                        "stock_id": stock_id,
                        "stock_name": stock_name,
                        "price": close_price,
                        "shares": shares,
                        "reason": f"評分達 {score} 分，高於汰換門檻",
                        "timestamp": now_taipei.isoformat()
                    })
                else:
                    # Since candidates are sorted by score descending, if this candidate cannot beat the min_score,
                    # no other candidate can. Break the loop.
                    break
        
        # Spacer
        print("🤖 [AI Auto Trade] 進場與換股檢查完畢。")
        
        # Spacer
        
        """

# Perform replacement
patched_content = content[:start_idx] + new_segment + content[end_idx:]

# Write back to app.py
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(patched_content)

print("app.py successfully patched!")
