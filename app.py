# -*- coding: utf-8 -*-
"""
🦁 【獅王戰神 V106】全端量化大一統重構程式碼
對沖基金級大盤生命線判定、50檔晶片/權值股即時掃描、MongoDB Atlas 雲端同步、Streamlit 頂級 Bloomberg 終端面板

SPDX-License-Identifier: Apache-2.0
"""

# ==============================================================================
# 🚀 【無重力起飛儀式 - CLOUD ANTIGRAVITY FREEDOM】
# ==============================================================================
import antigravity  # 象徵本系統脫離本機束縛，高維全雲端自動化運作

import os
import sys
import glob
import time
import random
from datetime import datetime, timedelta
import pytz
import numpy as np
import pandas as pd
import yfinance as yf
import requests
import concurrent.futures
from pymongo import MongoClient, UpdateOne
import streamlit as st

# ==============================================================================
# ⚙️ 1. 系統初始化與時區校正 (台北標準時間 Asia/Taipei)
# ==============================================================================
TW_TZ = pytz.timezone("Asia/Taipei")

# 50 檔晶片、晶圓代工、低碳綠能、海運及金融權值精英標的預載靜態資訊
INITIAL_STOCKS = [
        {
            "id": "2330",
            "name": "台積電",
            "base_price": 2230.0,
            "industry": "半導體",
            "notes": "全球晶圓代工龍頭，先進製程與CoWoS封裝需求極度暢旺，為長線生命線大盤指標。"
        },
        {
            "id": "2454",
            "name": "聯發科",
            "base_price": 3550.0,
            "industry": "晶片設計",
            "notes": "AI手機晶片天璣系列打入高端市場，邊緣運算晶片與ASIC佈局完整。"
        },
        {
            "id": "2317",
            "name": "鴻海",
            "base_price": 247.5,
            "industry": "電子代工",
            "notes": "輝達GB200主力代工廠，組裝份額極高，電動車與液冷散熱長線發酵。"
        },
        {
            "id": "2308",
            "name": "台達電",
            "base_price": 2030.0,
            "industry": "電源散熱",
            "notes": "伺服器高階電源與散熱模組領導廠商，綠能充電樁市佔穩步上揚。"
        },
        {
            "id": "2382",
            "name": "廣達",
            "base_price": 308.0,
            "industry": "伺服器",
            "notes": "AI伺服器出貨放量，訂單能見度直達2027年，AI車用電腦同步增溫。"
        },
        {
            "id": "3231",
            "name": "緯創",
            "base_price": 140.0,
            "industry": "伺服器",
            "notes": "輝達AI晶片基板主力供應商，伴隨AI伺服器量產呈現爆發式成長。"
        },
        {
            "id": "2357",
            "name": "華碩",
            "base_price": 656.0,
            "industry": "電腦硬體",
            "notes": "Copilot+ PC首發主戰部隊，高毛利AI PC帶動硬體換機潮。"
        },
        {
            "id": "2395",
            "name": "研華",
            "base_price": 463.5,
            "industry": "工業電腦",
            "notes": "全球工業電腦龍頭，邊緣AI與智慧工廠雙軸轉型帶動獲利穩健提升。"
        },
        {
            "id": "3711",
            "name": "日月光投控",
            "base_price": 510.0,
            "industry": "封裝測試",
            "notes": "全球半導體後段封測一哥，先進封裝與矽光子核心供應鏈技術領先。"
        },
        {
            "id": "2408",
            "name": "南亞科",
            "base_price": 293.0,
            "industry": "記憶體",
            "notes": "DDR5與高頻寬記憶體需求外溢，利基型記憶體合約價緩步回升。"
        },
        {
            "id": "2379",
            "name": "瑞昱",
            "base_price": 575.0,
            "industry": "通訊晶片",
            "notes": "網路通訊蟹級晶片需求回暖，車用乙太網路與Wi-Fi 7出貨力道轉強。"
        },
        {
            "id": "3034",
            "name": "聯詠",
            "base_price": 484.5,
            "industry": "驅動晶片",
            "notes": "OLED驅動IC出貨強勁，車用顯示介面晶片在大陸車廠滲透率拉高。"
        },
        {
            "id": "3037",
            "name": "欣興",
            "base_price": 905.0,
            "industry": "載板",
            "notes": "ABF高階載板需求因AI晶片大增而止跌回溫，高密度連接板獲利優渥。"
        },
        {
            "id": "3189",
            "name": "景碩",
            "base_price": 554.0,
            "industry": "載板",
            "notes": "高階封裝載板佔比提升，受惠美系AI大廠晶圓載板追單。"
        },
        {
            "id": "8046",
            "name": "南電",
            "base_price": 872.0,
            "industry": "載板",
            "notes": "晶片大廠ABF高階載板產能釋出，營運觸底反彈格局確立。"
        },
        {
            "id": "2301",
            "name": "光寶科",
            "base_price": 204.5,
            "industry": "電源供應",
            "notes": "高階伺服器電源、液冷散熱及車用電子出貨激增，高毛利比重提高。"
        },
        {
            "id": "2324",
            "name": "仁寶",
            "base_price": 30.4,
            "industry": "電子代工",
            "notes": "伺服器產品線往利基型產品切入，智慧醫療及物聯網產品線利潤提升。"
        },
        {
            "id": "2353",
            "name": "宏碁",
            "base_price": 28.4,
            "industry": "電腦硬體",
            "notes": "推廣自主研發之AI PC，在印度及多個東南亞新興市場微幅成長。"
        },
        {
            "id": "2603",
            "name": "長榮",
            "base_price": 212.0,
            "industry": "航運",
            "notes": "紅海避航因素造成運價指數爆漲，高股息配息率強，長線金流充沛。"
        },
        {
            "id": "2609",
            "name": "陽明",
            "base_price": 51.1,
            "industry": "航運",
            "notes": "受惠美東談判不確定性及運能吃緊，第二、三季旺季回報翻倍。"
        },
        {
            "id": "2615",
            "name": "萬海",
            "base_price": 81.2,
            "industry": "航運",
            "notes": "亞洲區間近洋航線運費漲幅顯著，多艘新造高效率節能船陸續交船。"
        },
        {
            "id": "2610",
            "name": "華航",
            "base_price": 18.7,
            "industry": "航空",
            "notes": "暑假出國需求突破新高，AI供應鏈空運急單拉動航空貨運高盤價。"
        },
        {
            "id": "2618",
            "name": "長榮航",
            "base_price": 35.3,
            "industry": "航空",
            "notes": "高階商務艙及北美航線載客率持續逼近滿載，燃油成本避險得宜。"
        },
        {
            "id": "2881",
            "name": "富邦金",
            "base_price": 96.1,
            "industry": "金融保險",
            "notes": "金控獲利之王，壽險大筆投資股債收益回升，配息穩定度高。"
        },
        {
            "id": "2882",
            "name": "國泰金",
            "base_price": 78.7,
            "industry": "金融保險",
            "notes": "核心國泰人壽利差改善，金控本業獲利穩步翻倍，海外資產評價揚升。"
        },
        {
            "id": "2886",
            "name": "兆豐金",
            "base_price": 40.2,
            "industry": "金融保險",
            "notes": "公股金控龍頭，高結算外匯優勢，長期獲利能力在升息環境下受惠。"
        },
        {
            "id": "2891",
            "name": "中信金",
            "base_price": 57.5,
            "industry": "金融保險",
            "notes": "核心中國信託銀行淨利差居國籍銀行之首，海外分行獲利能力強健。"
        },
        {
            "id": "2884",
            "name": "玉山金",
            "base_price": 31.5,
            "industry": "金融保險",
            "notes": "財富管理業務與信用卡簽帳金額市佔率前段班，積極數位金融化轉型。"
        },
        {
            "id": "1301",
            "name": "台塑",
            "base_price": 45.8,
            "industry": "塑膠石化",
            "notes": "利基型特用化學品轉型中，受惠德州廠產能擴展與乙烯利差改善。"
        },
        {
            "id": "1303",
            "name": "南亞",
            "base_price": 87.3,
            "industry": "石化電子材料",
            "notes": "電子環氧樹脂及玻纖布因伺服器板升級，需求觸底重回擴張區。"
        },
        {
            "id": "1326",
            "name": "台化",
            "base_price": 45.5,
            "industry": "化纖石化",
            "notes": "芳香烴與酚鏈條毛利隨供需關係改善回暖，推進高值化新材料。"
        },
        {
            "id": "6505",
            "name": "台塑化",
            "base_price": 51.3,
            "industry": "煉油石化",
            "notes": "全球原油需求回穩，成品油裂解差價維持高檔，庫存回升利益增加。"
        },
        {
            "id": "2002",
            "name": "中鋼",
            "base_price": 18.2,
            "industry": "鋼鐵冶金",
            "notes": "中國粗鋼減產與碳中和高階鋼材溢價拉大，迎來基建重建復甦潮。"
        },
        {
            "id": "1101",
            "name": "台泥",
            "base_price": 24.2,
            "industry": "水泥與儲能",
            "notes": "轉型歐洲低碳綠色水泥，並在土耳其與非洲大舉建設儲能與鋰電池廠。"
        },
        {
            "id": "1402",
            "name": "遠東新",
            "base_price": 27.2,
            "industry": "紡織控股",
            "notes": "紅色聚酯(rPET)獲國際一級運動服飾品牌包下產能，供不應求。"
        },
        {
            "id": "2105",
            "name": "正新",
            "base_price": 32.5,
            "industry": "輪胎製造",
            "notes": "大卡客車大胎回升及雙輪高毛利產品市佔率在東南亞與印度持續跑贏。"
        },
        {
            "id": "9904",
            "name": "寶成",
            "base_price": 25.8,
            "industry": "製鞋鞋材",
            "notes": "全球運動品牌去庫存進入尾聲，新季度製鞋代工出貨排程重回爆滿現狀。"
        },
        {
            "id": "5871",
            "name": "中租-KY",
            "base_price": 112.0,
            "industry": "租賃金融",
            "notes": "東協與大陸中小企業融資放款成長強，風險控管機制優秀，殖利率佳。"
        },
        {
            "id": "1216",
            "name": "統一",
            "base_price": 73.1,
            "industry": "食品百貨",
            "notes": "國內超商霸主與生鮮自營通路金雞母，轉投資家樂福整併效應擴大。"
        },
        {
            "id": "2912",
            "name": "統一超",
            "base_price": 221.0,
            "industry": "零售通路",
            "notes": "實體店突破7000家大關，數位APP及多元店型拉升客單價，營收創高。"
        },
        {
            "id": "5876",
            "name": "上海商銀",
            "base_price": 40.2,
            "industry": "商業銀行",
            "notes": "企業與海外外幣聯貸專精，利差與授信獲利在同業中維持前段優勢。"
        },
        {
            "id": "2354",
            "name": "鴻準",
            "base_price": 58.9,
            "industry": "金屬機殼",
            "notes": "散熱模組與鈦合金機殼工藝領先，主力供應高階遊戲機與伺服器機殼。"
        },
        {
            "id": "2347",
            "name": "聯強",
            "base_price": 84.4,
            "industry": "通路分銷",
            "notes": "亞太最大高科技分銷巨擘，商用伺服器零件及電競設備分銷利潤高企。"
        },
        {
            "id": "2449",
            "name": "京元電子",
            "base_price": 286.0,
            "industry": "封裝測試",
            "notes": "AI 晶片測試大廠，測試時間加倍，受惠爆發式測試產能利用率走高。"
        },
        {
            "id": "3045",
            "name": "台灣大",
            "base_price": 113.5,
            "industry": "電信網路",
            "notes": "合併台灣之星後用戶規模擴大，5G加值服務及momo電商雙引擎穩定成長。"
        },
        {
            "id": "4904",
            "name": "遠傳",
            "base_price": 95.7,
            "industry": "電信網路",
            "notes": "新遠傳佈局成功，企業雲端與AI物聯網客製方案成為新興金牛產品。"
        },
        {
            "id": "8454",
            "name": "富邦媒",
            "base_price": 191.0,
            "industry": "電子商務",
            "notes": "自主車隊與衛星倉儲優勢領航電商，AI智慧揀貨系統大幅縮減物流成本。"
        },
        {
            "id": "9910",
            "name": "豐泰",
            "base_price": 69.2,
            "industry": "鞋業製造",
            "notes": "美系運動品牌大本營，主力研發中心與高毛利訂單合約掌握在手。"
        },
        {
            "id": "9921",
            "name": "巨大",
            "base_price": 70.8,
            "industry": "自行車",
            "notes": "高階E-bike歐美庫存重整完畢，高附加價值車種銷售轉正，重拾增勢。"
        },
        {
            "id": "1590",
            "name": "亞德客-KY",
            "base_price": 1420.0,
            "industry": "氣動元件",
            "notes": "工廠自動化需求強勁復甦，電池、新能源氣動模組拉貨重現上升波段。"
        }
    ])
            tsmc_df = pd.concat([tsmc_df, new_row], ignore_index=True)
            downloaded_results[tsmc_ticker] = tsmc_df

    if tsmc_df is not None and len(tsmc_df) >= 20:
        tsmc_price = float(tsmc_df['Close'].iloc[-1])
        tsmc_ma20_val = float(tsmc_df['Close'].rolling(20).mean().iloc[-1])
        tsmc_is_above_ma20 = tsmc_price >= tsmc_ma20_val
    elif "2330" in fallback_data:
        # 若 API 全倒，直接取用 MongoDB 歷史上的最新數據
        tsmc_price = fallback_data["2330"].get("close_price", 940.0)
        tsmc_ma20_val = fallback_data["2330"].get("ma20", 935.0)
        tsmc_is_above_ma20 = tsmc_price >= tsmc_ma20_val

    # 支援大盤強制控制 (覆寫)
    if tsmc_override is not None:
        tsmc_is_above_ma20 = tsmc_override
        if not tsmc_is_above_ma20:
            tsmc_price = 920.0
        else:
            tsmc_price = 955.0

    tsmc_status_label = "綠燈 - 開放雙倍投資" if tsmc_is_above_ma20 else "紅燈 - 物理隔離停買"

    scanned_signals = []

    # 啟動 50 股循環深度演算，百分百比對 V106 原本邏輯
    for stock in INITIAL_STOCKS:
        stock_id = stock["id"]
        ticker_tw = f"{stock_id}.TW"
        
        # 預設基本值
        close_price = stock["base_price"]
        prev_close = stock["base_price"]
        ma20_val = stock["base_price"]
        ma10_val = stock["base_price"]
        volume = 2500000.0
        vol_5ma_val = 2000000.0
        macd_h_val = 0.05
        macd_val_val = 0.1
        atr_val = stock["base_price"] * 0.02

        has_real_data = False
        df_single = downloaded_results.get(ticker_tw)

        # 若當日證交所有最新價格且 K 線中尚未包含今日，則補齊
        if df_single is not None and stock_id in twse_today:
            today_twse = twse_today[stock_id]
            if today_twse["Close"] > 0 and (df_single.empty or df_single["Date"].iloc[-1] != date_str):
                new_row = pd.DataFrame([{
                    "Date": date_str,
                    "Close": today_twse["Close"],
                    "High": today_twse["High"],
                    "Low": today_twse["Low"],
                    "Open": today_twse["Open"],
                    "Volume": today_twse["Volume"]
                }])
                df_single = pd.concat([df_single, new_row], ignore_index=True)
                downloaded_results[ticker_tw] = df_single

        try:
            if df_single is not None and len(df_single) >= 20:
                closes = df_single['Close']
                highs = df_single['High']
                lows = df_single['Low']
                vols = df_single['Volume']
                
                close_price = float(closes.iloc[-1])
                prev_close = float(closes.iloc[-2]) if len(closes) > 1 else close_price
                ma20_series = closes.rolling(20).mean()
                ma20_val = float(ma20_series.iloc[-1])
                ma10_val = float(closes.rolling(10).mean().iloc[-1])
                
                # 爆量倍數 (成交量 vs 5日均量)
                volume = float(vols.iloc[-1])
                vol_5ma_val = float(vols.rolling(5).mean().iloc[-1])
                
                # 手工無損純 pandas 計算 ATR-14
                hl = highs - lows
                hc = (highs - closes.shift()).abs()
                lc = (lows - closes.shift()).abs()
                tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
                atr_val = float(tr.rolling(14).mean().iloc[-1])
                
                # 手工純 pandas 計算 MACD (12, 26, 9)
                ema12 = closes.ewm(span=12, adjust=False).mean()
                ema26 = closes.ewm(span=26, adjust=False).mean()
                macd_line = ema12 - ema26
                signal_line = macd_line.ewm(span=9, adjust=False).mean()
                macd_h_series = macd_line - signal_line
                
                macd_h_val = float(macd_h_series.iloc[-1])
                macd_val_val = float(macd_line.iloc[-1])
                has_real_data = True
        except Exception:
            has_real_data = False

        # --- 徹底消除隨機仿真價格：若爬蟲失敗，改為從 MongoDB Atlas 恢復上次的真實數值！ ---
        if not has_real_data:
            fallback_doc = fallback_data.get(stock_id)
            if fallback_doc:
                close_price = fallback_doc.get("close_price", stock["base_price"])
                prev_close = close_price / (1 + (fallback_doc.get("change_pct", 0.0) / 100.0))
                ma20_val = fallback_doc.get("ma20", stock["base_price"])
                ma10_val = ma20_val
                volume = fallback_doc.get("volume", 2500000.0)
                vol_multiplier = fallback_doc.get("volume_multiplier", 1.0)
                vol_5ma_val = volume / vol_multiplier if vol_multiplier > 0 else volume
                atr_val = close_price * 0.02
                # 直接恢復其指標判定
                macd_good = "多頭" in fallback_doc.get("macd_status", "") or "💥" in fallback_doc.get("macd_status", "")
                price_above_ma = close_price > ma20_val
                vol_breakout = vol_multiplier > 1.5
                change_pct = fallback_doc.get("change_pct", 0.0)
                vol_multiplier = fallback_doc.get("volume_multiplier", 1.0)
                atr_stop = fallback_doc.get("atr_stop", close_price * 0.95)
                suggested_shares = fallback_doc.get("suggested_shares", int(20000 // close_price))
                macd_status = fallback_doc.get("macd_status", "橫盤震盪 (能量暫不穩定)")
                signal = fallback_doc.get("signal", "持倉")
                ma20_status = fallback_doc.get("ma20_status", "均線糾結合攏中")
                action_advice = fallback_doc.get("action_advice", "⚪ 區間不變，維持原有手中部位，空手仍需觀望。")
                master_notes = fallback_doc.get("master_notes", stock["notes"])
            else:
                # 僅在初次部署且資料庫為空時使用的靜態基本值，但絕不隨機震盪
                close_price = stock["base_price"]
                prev_close = stock["base_price"]
                ma20_val = stock["base_price"]
                ma10_val = stock["base_price"]
                volume = 2500000.0
                vol_5ma_val = 2000000.0
                macd_h_val = 0.05
                macd_val_val = 0.1
                atr_val = stock["base_price"] * 0.02
                change_pct = 0.0
                vol_multiplier = 1.0
                atr_stop = round(close_price * 0.95, 1)
                suggested_shares = int(20000 // close_price)
                macd_good = True
                price_above_ma = True
                vol_breakout = False
                macd_status = "橫盤震盪 (能量暫不穩定)"
                signal = "持倉"
                ma20_status = "均線糾結合攏中"
                action_advice = "⚪ 區間不變，維持原有手中部位，空手仍需觀望。"
                master_notes = stock["notes"]
        else:
            # 有真實的爬蟲數據，執行指標判定與計算
            macd_good = (macd_h_val > 0) and (macd_val_val > 0) or (macd_h_val > -0.05)
            vol_breakout = volume > (vol_5ma_val * 1.5)
            price_above_ma = close_price > ma20_val
            change_pct = round(((close_price - prev_close) / prev_close) * 100, 2)
            vol_multiplier = round(volume / vol_5ma_val, 2) if vol_5ma_val > 0 else 1.0
            atr_stop_v106 = ma20_val - (0.5 * atr_val)
            atr_stop = round(max(atr_stop_v106, close_price * 0.95), 1)
            suggested_shares = int(20000 // close_price) if close_price > 0 else 0
            
            # 從 MongoDB 獲取最新的備註（避免被 INITIAL_STOCKS 覆蓋）
            master_notes = fallback_data.get(stock_id, {}).get("master_notes", stock["notes"])

            # 大師戰略裁決邏輯
            if not tsmc_is_above_ma20:
                signal = "隔離"
                macd_status = "大盤強制隔離壓制中"
                ma20_status = "大盤空頭警戒 (全面迴避交易)"
                action_advice = "🛑 物理隔離！全面停止買進，防止被融資多頭斷頭拖累！"
            else:
                if price_above_ma and macd_good and vol_breakout:
                    signal = "多"
                    macd_status = "💥 多頭雙發散 (柱體擴張中)"
                    ma20_status = f"站上生命線 20MA ({ma20_val:.1f})"
                    action_advice = "🚀 V106訊號共振發動！滿足20MA+MACD+爆量，強勢狙擊！"
                elif not price_above_ma and macd_h_val < 0:
                    signal = "空"
                    macd_status = "🚨 空頭收斂 (柱體綠色加深)"
                    ma20_status = f"跌破生命線 20MA ({ma20_val:.1f})"
                    action_advice = "📉 空頭趨勢確立，請無條件避開此標的！"
                else:
                    signal = "持倉"
                    macd_status = "橫盤震盪 (能量暫不穩定)"
                    ma20_status = "均線糾結合攏中"
                    action_advice = "⚪ 區間不變，維持原有手中部位，空手仍需觀望。"

            if change_pct >= 18.5:
                action_advice += " (🎯 獲利逼近20%，已觸發強制鎖利機制，可減碼1/2)"

        scanned_signals.append({
            "timestamp": timestamp_str,
            "date": date_str,
            "stock_id": stock_id,
            "stock_name": stock["name"],
            "close_price": round(close_price, 1),
            "volume": int(volume),
            "ma20": round(ma20_val, 1),
            "macd_status": macd_status,
            "signal": signal,
            "volume_multiplier": vol_multiplier,
            "atr_stop": atr_stop,
            "suggested_shares": suggested_shares,
            "change_pct": change_pct,
            "ma20_status": ma20_status,
            "master_notes": master_notes,
            "action_advice": action_advice
        })

    result = {
        "scan_time": timestamp_str,
        "date": date_str,
        "tsmc_price": round(tsmc_price, 1),
        "tsmc_ma20": round(tsmc_ma20_val, 1),
        "tsmc_status": tsmc_status_label,
        "signals": scanned_signals
    }

    collection = get_mongo_collection()
    if collection is not None:
        operations = []
        for sig in scanned_signals:
            operations.append(
                UpdateOne(
                    {"date": sig["date"], "stock_id": sig["stock_id"]},
                    {"$set": sig},
                    upsert=True
                )
            )
        try:
            if operations:
                collection.bulk_write(operations)
                st.sidebar.success(f"🎯 50檔精英信號 Upsert 寫入雲端 'lion_signals' (共 {len(operations)} 筆)")
        except Exception as e:
            st.sidebar.error(f"❌ MongoDB 大批次 Upsert 寫入異常: {e}")

    return result

# ==============================================================================
# 🖥️ 4. STREAMLIT 全端視覺呈獻佈局 (Bloomberg 像素級極道黑色風格)
# ==============================================================================
st.set_page_config(
    page_title="智能判斷指數",
    page_icon="🦁",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 導入 Bloomberg Terminal 技術感深色 CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap');
    
    html, body, [class*="css"] {
        background-color: #0d0f14 !important;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        color: #d1d4dc !important;
    }
    
    /* 頂級邊框與 Bloomberg 暗盒 */
    .bloomberg-box {
        background-color: #121620;
        border: 1px solid #2a3142;
        border-radius: 6px;
        padding: 18px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .neon-text-green {
        color: #00ff66 !important;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(0, 255, 102, 0.3);
    }
    .neon-text-red {
        color: #ff3366 !important;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(255, 51, 102, 0.3);
    }
    .neon-text-gold {
        color: #ffbb00 !important;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
    }
    
    /* 醒目紅色斷頭警告橫幅 */
    .danger-banner {
        background: linear-gradient(135deg, #711717 0%, #300c0c 100%);
        border: 2px solid #ff3366;
        padding: 16px;
        font-size: 1.15rem;
        border-radius: 8px;
        text-align: center;
        color: #f1f1f1 !important;
        box-shadow: 0 4px 15px rgba(255, 51, 102, 0.45);
        margin-bottom: 20px;
    }
    
    /* Table Ticker Bold Styles */
    .ticker-lbl {
        background-color: #1c2333;
        color: #ffbb00;
        font-family: 'JetBrains Mono', monospace;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.85rem;
    }
</style>
""", unsafe_allow_html=True)

# 頂級品牌 Banner
st.title("🦁 智能判斷指數")
st.markdown("##### 🕵️ 華爾街自營部對沖量化決策看板 | 爬蟲雙重保障洗價、MongoDB 雙向持久化、台北標準時間盤中濾網")
st.write("---")

# 🖥️ 側邊欄：戰情與手動覆寫控制
st.sidebar.header("🛠️ 戰情控制中心")
now_taiwan = datetime.now(TW_TZ)
st.sidebar.markdown(f"**當前台北時間：** `{now_taiwan.strftime('%H:%M:%S')}`")

override_choice = st.sidebar.selectbox(
    "大盤手動覆寫 (台積電 20MA 裁決)",
    ["智能判定 (自動跳躍)", "強制綠燈 (開放交易)", "強制紅燈 (物理隔離)"]
)

tsmc_override_val = None
if override_choice == "強制綠燈 (開放交易)":
    tsmc_override_val = True
elif override_choice == "強制紅燈 (物理隔離)":
    tsmc_override_val = False

# 50檔全快照與即時掃描觸發器
if st.sidebar.button("🚀 啟動全宇宙上帝視角掃描 (Async Sweep)"):
    with st.spinner("🤖 正在調用 YFinance 原始多線程網關，校正 MACD 結構、ATR 波動防線..."):
        scan_result = run_v106_full_sweep(tsmc_override=tsmc_override_val)
        st.session_state["lion_scan_result"] = scan_result
        st.sidebar.success("🟢 雲端洗價計算並上傳 MongoDB 完成！")
else:
    # 預設自雲端庫載入最新數據或初始化
    if "lion_scan_result" not in st.session_state:
        collection = get_mongo_collection()
        loaded_list = []
        if collection is not None:
            try:
                # 載入最新的歷史紀錄
                db_cursor = collection.find({}).sort("timestamp", -1).limit(50)
                db_data = list(db_cursor)
                if db_data:
                    for doc in db_data:
                        doc.pop("_id", None)
                        loaded_list.append(doc)
            except Exception as e:
                st.sidebar.error(f"讀取資料庫失誤: {e}")
                
        # 決定是否重用資料庫快取或是自動執行新洗價掃描
        should_reuse = False
        if loaded_list and len(loaded_list) >= 40:
            last_record_date_str = loaded_list[0].get("date", "")
            try:
                now_taipei = datetime.now(TW_TZ)
                date_str = now_taipei.strftime("%Y-%m-%d")
                
                last_date = datetime.strptime(last_record_date_str, "%Y-%m-%d").date()
                today_date = now_taipei.date()
                delta_days = (today_date - last_date).days
                
                if delta_days == 0:
                    # 同一天，直接重用
                    should_reuse = True
                elif now_taipei.weekday() >= 5: # 週末 (週六或週日)
                    # 週末期間若有最近三天內 (即週五) 的資料，直接重用
                    if delta_days <= 3:
                        should_reuse = True
                elif now_taipei.weekday() == 0 and now_taipei.hour < 9: # 週一開盤前
                    # 週一早上九點前，重用週五的資料
                    if delta_days <= 3:
                        should_reuse = True
                elif now_taipei.hour < 9: # 平日開盤前 (週二至週五早上 9 點前)
                    # 平日早上開盤前，重用昨天的資料
                    if delta_days <= 1:
                        should_reuse = True
            except Exception:
                pass

        if should_reuse:
            # 從載入的信號中動態提取真實的台積電收盤價與 20MA，避免寫死 955.0/935.0
            tsmc_doc = next((s for s in loaded_list if s["stock_id"] == "2330"), None)
            tsmc_price = tsmc_doc.get("close_price", 2230.0) if tsmc_doc else 2230.0
            tsmc_ma20 = tsmc_doc.get("ma20", 2180.0) if tsmc_doc else 2180.0
            tsmc_status = "綠燈 - 開放雙倍投資" if tsmc_price >= tsmc_ma20 else "紅燈 - 物理隔離停買"
            
            st.session_state["lion_scan_result"] = {
                "scan_time": loaded_list[0].get("timestamp", "未知"),
                "date": loaded_list[0].get("date", "未知"),
                "tsmc_price": tsmc_price,
                "tsmc_ma20": tsmc_ma20,
                "tsmc_status": tsmc_status,
                "signals": loaded_list
            }
            st.sidebar.info("📂 自 MongoDB Atlas 讀取最近一次訊號結果。")
        else:
            # 資料庫為空、過少或資料已過期，自動觸發並行洗價掃描
            st.session_state["lion_scan_result"] = run_v106_full_sweep(tsmc_override=tsmc_override_val)

scan_data = st.session_state["lion_scan_result"]

# ==============================================================================
# 🚥 【大盤宏觀雷達】：台積電 20MA 大魔王裁決 indicator
# ==============================================================================
is_market_bullish = "綠燈" in scan_data["tsmc_status"]

if not is_market_bullish:
    st.markdown("""
    <div class="danger-banner">
        ⚠️ <strong>【大盤阻斷警報】 2330 台積電現價低於 20MA 生命線！</strong> <br>
        系統全線發動 <strong>物理隔離、全面停買、警惕融資斷頭追繳避雷！</strong> 資金全面轉入現金或高度防守防線。
    </div>
    """, unsafe_allow_html=True)
else:
    st.success("🟢 【大盤安全多頭】2330 台積電高於 20MA 生命線，允許啟動雙倍投資及進攻型戰略標的。")

col_tsmc, col_status, col_signal_num, col_sync_time = st.columns(4)

with col_tsmc:
    st.markdown(f"""
    <div class="bloomberg-box" style="text-align: center;">
        <div style="font-size: 0.85rem; color: #848e9c; font-weight: bold;">2330 台積電裁判收盤價</div>
        <div style="font-size: 2rem; margin-top: 10px;" class="{"neon-text-green" if is_market_bullish else "neon-text-red"}">
            {scan_data['tsmc_price']} <span style='font-size: 1.1rem; color:#848e9c;'>元</span>
        </div>
        <div style="font-size: 0.75rem; color: #848e9c; margin-top: 5px;">生命水位 20MA (日線): {scan_data['tsmc_ma20']} 元</div>
    </div>
    """, unsafe_allow_html=True)

with col_status:
    st.markdown(f"""
    <div class="bloomberg-box" style="text-align: center;">
        <div style="font-size: 0.85rem; color: #848e9c; font-weight: bold;">大盤生命線紅綠燈</div>
        <div style="font-size: 1.5rem; margin-top: 15px;" class="{"neon-text-green" if is_market_bullish else "neon-text-red"}">
            {scan_data['tsmc_status']}
        </div>
        <div style="font-size: 0.75rem; color: #848e9c; margin-top: 8px;">觸發條件: 現價 &gt; 20MA 則翻綠</div>
    </div>
    """, unsafe_allow_html=True)

df_signals = pd.DataFrame(scan_data["signals"])
long_count = len(df_signals[df_signals["signal"] == "多"])
short_count = len(df_signals[df_signals["signal"] == "空"])
hold_count = len(df_signals[df_signals["signal"] == "持倉"])
quarantine_count = len(df_signals[df_signals["signal"] == "隔離"])

with col_signal_num:
    st.markdown(f"""
    <div class="bloomberg-box" style="text-align: center;">
        <div style="font-size: 0.85rem; color: #848e9c; font-weight: bold;">多頭金英獵殺名單</div>
        <div style="font-size: 2rem; margin-top: 10px;" class="neon-text-green">
            {long_count} <span style='font-size:1.1rem; color:#848e9c;'>檔</span>
        </div>
        <div style="font-size: 0.75rem; color: #848e9c; margin-top: 5px;">符合 V106 強勢突破共振</div>
    </div>
    """, unsafe_allow_html=True)

with col_sync_time:
    st.markdown(f"""
    <div class="bloomberg-box" style="text-align: center;">
        <div style="font-size: 0.85rem; color: #848e9c; font-weight: bold;">對決與同步時間</div>
        <div style="font-size: 1.25rem; margin-top: 18px; color: #ffbb00; font-family: 'JetBrains Mono', monospace;">
            {scan_data['scan_time'].split(' ')[1]} (TW)
        </div>
        <div style="font-size: 0.75rem; color: #848e9c; margin-top: 8px;">同步協議: Upsert 歸檔</div>
    </div>
    """, unsafe_allow_html=True)

st.write("---")

# ==============================================================================
# 🎯 【精華獵殺監控區】：動態呈顯符合"多"進場的重磅狂飆標的
# ==============================================================================
st.subheader("🎯 精英獵殺強勢飆股特區 (V106 Strong Buy Monitor)")

# 過濾出 signal == "多" 的黃金標的
hunting_df = df_signals[df_signals["signal"] == "多"].copy()

if hunting_df.empty:
    st.info("💡 目前大盤處於空頭或大盤隔離時期，精英獵殺區暫無買進標的。資金保持空手觀望，落實物理隔離避雷。")
else:
    # 只呈現核心決策重要數據
    hunting_df["奇襲代號"] = hunting_df["stock_id"]
    hunting_df["黃金股名"] = hunting_df["stock_name"]
    hunting_df["收盤價"] = hunting_df["close_price"]
    hunting_df["今日漲跌(%)"] = hunting_df["change_pct"]
    hunting_df["建議零股精配股數 (2W預算)"] = hunting_df["suggested_shares"]
    hunting_df["絕對停損防禦線"] = hunting_df["atr_stop"]
    hunting_df["爆量倍比"] = hunting_df["volume_multiplier"]
    hunting_df["MACD動能形態"] = hunting_df["macd_status"]
    hunting_df["2MA生命位階碼"] = hunting_df["ma20_status"]
    hunting_df["主力操盤精要"] = hunting_df["action_advice"]

    display_hunting = hunting_df[[
        "奇襲代號", "黃金股名", "收盤價", "今日漲跌(%)", "建議零股精配股數 (2W預算)", 
        "絕對停損防禦線", "爆量倍比", "MACD動能形態", "2MA生命位階碼", "主力操盤精要"
    ]]

    st.dataframe(
        display_hunting,
        use_container_width=True,
        column_config={
            "今日漲跌(%)": st.column_config.NumberColumn(format="%.2f %%"),
            "收盤價": st.column_config.NumberColumn(format="%.1f 元"),
            "絕對停損防禦線": st.column_config.NumberColumn(format="%.1f 元"),
            "爆量倍比": st.column_config.NumberColumn(format="%.2f 倍"),
            "建議零股精配股數 (2W預算)": st.column_config.NumberColumn(format="%d 股"),
        }
    )

st.write("---")

# ==============================================================================
# 📊 【核心宇宙全矩陣雷達】：展示完整的 50 檔核心標的快照
# ==============================================================================
st.subheader("📊 核心宇宙 50 檔全矩陣雷達監控 (Full Market matrix)")

mat_search, mat_filter, mat_sort = st.columns([2, 1, 1])

with mat_search:
    search_input = st.text_input("🔍 過濾個股代代號/名稱/備忘錄:", "")
with mat_filter:
    filter_choices = st.multiselect("過濾大師訊號:", ["多", "空", "持倉", "隔離"], default=["多", "空", "持倉", "隔離"])
with mat_sort:
    sort_key = st.selectbox("核心排序列欄:", ["今日漲跌幅 (%)", "股票代號", "收盤現價", "爆量倍數"])

# 雷達過濾邏輯
radar_df = df_signals.copy()

if search_input:
    radar_df = radar_df[
        radar_df["stock_id"].str.contains(search_input, case=False) |
        radar_df["stock_name"].str.contains(search_input, case=False) |
        radar_df["master_notes"].str.contains(search_input, case=False)
    ]

radar_df = radar_df[radar_df["signal"].isin(filter_choices)]

# 排序邏輯
if sort_key == "今日漲跌幅 (%)":
    radar_df = radar_df.sort_values(by="change_pct", ascending=False)
elif sort_key == "股票代號":
    radar_df = radar_df.sort_values(by="stock_id", ascending=True)
elif sort_key == "收盤現價":
    radar_df = radar_df.sort_values(by="close_price", ascending=False)
elif sort_key == "爆量倍數":
    radar_df = radar_df.sort_values(by="volume_multiplier", ascending=False)

# 重塑高密度顯示表格
radar_df["信號標記"] = radar_df["signal"].apply(lambda x: "🟢 多頭進擊" if x == "多" else ("🔴 空頭破位" if x == "空" else ("⚠️ 隔離避險" if x == "隔離" else "⚪ 區間持倉")))
radar_df["2W預算零股"] = radar_df["suggested_shares"]

display_radar = radar_df[[
    "stock_id", "stock_name", "close_price", "change_pct", 
    "信號標記", "volume_multiplier", "atr_stop", "2W預算零股", "macd_status", "ma20_status", "master_notes"
]]

display_radar.columns = [
    "股票代號", "股票名稱", "最新收盤價", "今日漲跌 (%)", 
    "交易訊號", "爆量比率 (倍)", "動態 ATR 停損線", "2W預算精配(股)", "MACD能量形態", "20MA生命水位", "大師實戰評註"
]

st.dataframe(
    display_radar,
    use_container_width=True,
    column_config={
        "今日漲跌 (%)": st.column_config.NumberColumn(format="%.2f %%"),
        "最新收盤價": st.column_config.NumberColumn(format="%.1f 元"),
        "爆量比率 (倍)": st.column_config.NumberColumn(format="%.2f 倍"),
        "動態 ATR 停損線": st.column_config.NumberColumn(format="%.1f 元"),
        "2912精準零股(股)": st.column_config.NumberColumn(format="%d 股")
    }
)

# ==============================================================================
# ✍️ 大師級個股實戰備忘錄編輯
# ==============================================================================
st.write("---")
st.subheader("✍️ 操盤戰略大師註記編輯器 (Real-time DB Sync)")

edit_c1, edit_c2 = st.columns([1, 2])

with edit_c1:
    selected_stock_label = st.selectbox(
        "選擇要新增或更新大師備註的標的:",
        options=[f"{s['stock_id']} - {s['stock_name']}" for s in scan_data["signals"]]
    )
    selected_stock_id = selected_stock_label.split(" - ")[0]
    
    # 查找當下快取備忘內容
    current_item = next((s for s in scan_data["signals"] if s["stock_id"] == selected_stock_id), None)
    default_text = current_item["master_notes"] if current_item else ""

with edit_c2:
    revised_notes = st.text_area(f"✍️ 編輯修訂【{selected_stock_label}】之基本學理及籌碼量能戰術要旨：", value=default_text, height=110)
    
    if st.button("💾 將新戰術備註強勢寫入 MongoDB (防重複建檔協定)"):
        # 1. 直接更新本會話快取
        stock_idx = next((i for i, s in enumerate(st.session_state["lion_scan_result"]["signals"]) if s["stock_id"] == selected_stock_id), -1)
        if stock_idx != -1:
            st.session_state["lion_scan_result"]["signals"][stock_idx]["master_notes"] = revised_notes
            
            # 2. 直通 MongoDB 大寫入
            collection = get_mongo_collection()
            if collection is not None:
                try:
                    # 依據日期+標的代码 upsert 寫入或更新
                    today_str = st.session_state["lion_scan_result"]["date"]
                    collection.update_one(
                        {"date": today_str, "stock_id": selected_stock_id},
                        {"$set": {"master_notes": revised_notes}},
                        upsert=True
                    )
                    st.success(f"🎉 成功！【{selected_stock_label}】的大師實戰備註，已安全備份至雲端 `lion_signals` 集合。")
                except Exception as e:
                    st.error(f"❌ 雲端 MongoDB 寫入溢出: {e}")
            else:
                st.info("💡 已完成記憶體快取覆寫 (未連通真實 MongoDB，數據暫存在本期快取中)。")
            st.rerun()

st.warning("⚠️ 警示：本系統數據全部為量化模擬與財報估算，實戰操盤請自主調控槓桿，严守 ATR 動態停損底線。")
