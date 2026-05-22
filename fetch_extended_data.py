# -*- coding: utf-8 -*-
"""
Lion King Financial & Institutional Data Engine
Emoji-free version for high-compatibility Windows execution
"""
import os
import sys
import time
import argparse
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, date
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0"

ADR_MAPPING = {
    "2330": "TSM",      # 台積電 -> TSMC ADR
    "2303": "UMC",      # 聯電 -> UMC ADR
    "3711": "ASX",      # 日月光投控 -> ASE Technology ADR
    "2409": "AUOTY",    # 友達 -> AUO ADR
    "2317": "HNHPF",    # 鴻海 -> Foxconn ADR/OTC
    "2454": "MDTKF",    # 聯發科 -> MediaTek ADR/OTC
    "2308": "DLTNY",    # 台達電 -> Delta Electronics ADR/OTC
    "3481": "CIMYT",    # 群創 -> Innolux ADR/OTC
}

def clean_for_mongo(val):
    if isinstance(val, dict):
        return {k: clean_for_mongo(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [clean_for_mongo(v) for v in val]
    elif isinstance(val, (datetime, date)):
        return val.isoformat()
    elif isinstance(val, float):
        if np.isnan(val) or np.isinf(val):
            return 0.0
        return val
    elif isinstance(val, int):
        return val
    elif pd.isna(val):
        return None
    elif hasattr(val, "to_pydatetime"):
        return val.to_pydatetime().isoformat()
    return val

def safe_get(df, index_name, column_name):
    try:
        if index_name in df.index:
            val = df.loc[index_name, column_name]
            if isinstance(val, pd.Series):
                val = val.iloc[0]
            val = float(val)
            return 0.0 if np.isnan(val) else val
    except Exception:
        pass
    return 0.0

def fetch_single_stock_extended(stock_id, stock_name):
    print(f"[Extended Crawler] Fetching data for {stock_id} ({stock_name})...")
    ticker_tw = f"{stock_id}.TW"
    t_tw = yf.Ticker(ticker_tw)
    
    # 1. Company Profile
    profile = {
        "sector": "科技",
        "industry": "電子製造",
        "summary": "暫無公司基本資訊介紹。",
        "website": "",
        "employees": 0,
        "country": "Taiwan",
        "city": ""
    }
    
    try:
        info = t_tw.info
        if info:
            profile["sector"] = info.get("sector", profile["sector"])
            profile["industry"] = info.get("industry", profile["industry"])
            profile["summary"] = info.get("longBusinessSummary", profile["summary"])
            profile["website"] = info.get("website", profile["website"])
            profile["employees"] = info.get("fullTimeEmployees", profile["employees"])
            profile["country"] = info.get("country", profile["country"])
            profile["city"] = info.get("city", profile["city"])
    except Exception as e:
        print(f"Warning: Info fetch failed for {ticker_tw}: {e}")

    # 2. Financial Statements (Income Statement & Balance Sheet)
    financials_list = []
    try:
        quarterly = t_tw.quarterly_financials
        if quarterly is not None and not quarterly.empty:
            cols = list(quarterly.columns)[:4] # Last 4 quarters
            for col in cols:
                period_str = str(col).split(" ")[0]
                
                # Extract key fields
                revenue = safe_get(quarterly, "Total Revenue", col)
                net_income = safe_get(quarterly, "Net Income", col)
                gross_profit = safe_get(quarterly, "Gross Profit", col)
                operating_income = safe_get(quarterly, "Operating Income", col)
                
                eps = safe_get(quarterly, "Basic EPS", col)
                if eps == 0.0:
                    eps = safe_get(quarterly, "Diluted EPS", col)
                
                operating_margin = 0.0
                if revenue > 0:
                    operating_margin = round((operating_income / revenue) * 100, 2)
                    
                gross_margin = 0.0
                if revenue > 0:
                    gross_margin = round((gross_profit / revenue) * 100, 2)
                
                financials_list.append({
                    "period": period_str,
                    "revenue": revenue,
                    "net_income": net_income,
                    "gross_profit": gross_profit,
                    "operating_income": operating_income,
                    "gross_margin": gross_margin,
                    "operating_margin": operating_margin,
                    "eps": eps
                })
    except Exception as e:
        print(f"Warning: Financials fetch failed for {ticker_tw}: {e}")

    # 3. US Counterpart Data (Insider Trading, Institutional Holders, SEC Filings)
    adr_ticker = ADR_MAPPING.get(stock_id)
    insiders_list = []
    institutions_list = []
    sec_filings_list = []
    has_adr = False
    adr_symbol = ""

    if adr_ticker:
        has_adr = True
        adr_symbol = adr_ticker
        print(f"Found US ADR/OTC counterpart: {adr_ticker} for {stock_id}")
        t_adr = yf.Ticker(adr_ticker)
        
        # A. Insider Transactions
        try:
            insiders = t_adr.insider_transactions
            if insiders is not None and not insiders.empty:
                for idx, row in insiders.head(5).iterrows():
                    insiders_list.append({
                        "name": str(row.get("Insider", "Unknown")),
                        "position": str(row.get("Position", "Executive")),
                        "shares": int(row.get("Shares", 0)),
                        "value": float(row.get("Value", 0.0)),
                        "date": str(row.get("Start Date", "")).split(" ")[0],
                        "type": str(row.get("Transaction", "Buy/Sell")),
                        "ownership": str(row.get("Ownership", "D"))
                    })
        except Exception as e:
            print(f"Warning: Insider transactions fetch failed for {adr_ticker}: {e}")
            
        # B. Institutional Holders
        try:
            inst = t_adr.institutional_holders
            if inst is not None and not inst.empty:
                for idx, row in inst.head(5).iterrows():
                    institutions_list.append({
                        "name": str(row.get("Holder", "Unknown")),
                        "shares": int(row.get("Shares", 0)),
                        "value": float(row.get("Value", 0.0)),
                        "pct": float(row.get("pctHeld", 0.0)) * 100,
                        "pctChange": float(row.get("pctChange", 0.0)) * 100
                    })
        except Exception as e:
            print(f"Warning: Institutional holders fetch failed for {adr_ticker}: {e}")
            
        # C. SEC Filings
        try:
            if hasattr(t_adr, "sec_filings") and t_adr.sec_filings:
                for filing in t_adr.sec_filings[:5]:
                    sec_filings_list.append({
                        "date": str(filing.get("date", "")),
                        "type": str(filing.get("type", "6-K")),
                        "title": str(filing.get("title", "SEC Filing")),
                        "url": str(filing.get("edgarUrl", ""))
                    })
        except Exception as e:
            print(f"Warning: SEC filings fetch failed for {adr_ticker}: {e}")

    # 4. Market Dynamics (News)
    news_list = []
    try:
        t_news = yf.Ticker(adr_ticker if adr_ticker else ticker_tw)
        news = t_news.news
        if news:
            for item in news[:5]:
                news_list.append({
                    "title": item.get("title", "Market Hotspot News"),
                    "publisher": item.get("publisher", "Yahoo Finance"),
                    "link": item.get("link", "#"),
                    "date": datetime.fromtimestamp(item.get("providerPublishTime", time.time())).isoformat()
                })
    except Exception as e:
        print(f"Warning: News fetch failed: {e}")

    # Build Unified Document
    doc = {
        "stock_id": stock_id,
        "stock_name": stock_name,
        "last_updated": datetime.now().isoformat(),
        "has_adr": has_adr,
        "adr_symbol": adr_symbol,
        "profile": profile,
        "financials": financials_list,
        "insiders": insiders_list,
        "institutions": institutions_list,
        "sec_filings": sec_filings_list,
        "news": news_list
    }
    
    return clean_for_mongo(doc)

def save_to_mongodb(doc):
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client["LionKing_DB"]
        collection = db["stock_extended_details"]
        
        result = collection.update_one(
            {"stock_id": doc["stock_id"]},
            {"$set": doc},
            upsert=True
        )
        print(f"Saved to MongoDB stock_extended_details collection for ID {doc['stock_id']}! Upserted: {result.upserted_id is not None or result.modified_count > 0}")
    except Exception as e:
        print(f"Failed to save to MongoDB: {e}")

def main():
    parser = argparse.ArgumentParser(description="Lion King Financial & Institutional Data Engine")
    parser.add_argument("--stock", type=str, help="Specify stock ID (e.g. 2330)")
    parser.add_argument("--sweep", action="store_true", help="Sweep scan for all 90 stocks")
    args = parser.parse_args()

    from app import INITIAL_STOCKS
    
    if args.stock:
        stock = next((s for s in INITIAL_STOCKS if s["id"] == args.stock), None)
        if stock:
            doc = fetch_single_stock_extended(stock["id"], stock["name"])
            save_to_mongodb(doc)
        else:
            print(f"Error: Stock code not found: {args.stock}")
    elif args.sweep:
        print(f"Starting sweep scan for all {len(INITIAL_STOCKS)} stocks...")
        for idx, stock in enumerate(INITIAL_STOCKS):
            print(f"[{idx+1}/{len(INITIAL_STOCKS)}]")
            try:
                doc = fetch_single_stock_extended(stock["id"], stock["name"])
                save_to_mongodb(doc)
                time.sleep(1.0)
            except Exception as e:
                print(f"Error fetching {stock['id']}: {e}")
    else:
        for sid in ["2330", "2317", "2454", "2303"]:
            stock = next(s for s in INITIAL_STOCKS if s["id"] == sid)
            doc = fetch_single_stock_extended(stock["id"], stock["name"])
            save_to_mongodb(doc)

if __name__ == "__main__":
    main()
