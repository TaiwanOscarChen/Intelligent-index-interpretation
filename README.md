# 🦁 智能判讀指數 【獅王戰神 V106】全端量化戰情室

這是一個華爾街自營對沖基金級別的台股量化投資決策面板。由頂尖 Python 量化架構師操刀重構，徹底改寫原本 Colab 互動腳本，建立無重力起飛（antigravity）、Streamlit 高科技 Bloomberg 終端視覺與 MongoDB Atlas 雲端實時持久化。

## 🚀 核心模組與技術亮點

1. **無重力起飛架構 (Cloud Antigravity)**：整合 `import antigravity` 宣告，全面擺脫本機環境限制，完美相容無人值守 Serverless 環境。
2. **大盤生命水位判定 (2330.TW 20MA)**：物理隔離多空交易。當台積電價格低於 20MA 生命線時，全線警報並發動防守物理隔離限制；高於 20MA 時全面啟動金英股狙擊。
3. **50 檔晶片/權值標的即時掃描**：透過 yFinance 多線程即時洗價，計算 **20MA 突破**、**MACD 柱狀翻揚共振** 與 **Volume 爆量 (1.5倍)** 機構級強勢訊號。
4. **雲端後端記憶中樞 (MongoDB Atlas)**：結合 `pymongo` 實現高密度大批次 `bulk_write` Upsert 操作，資料永久保存。
5. **對沖限防與資產配置**：動態計算 **ATR 停損防衛線** 與 **兩萬元預算精準零股配售**。

---

## 🛠️ 本地運行指南

### 1. 安裝環境依賴
確保您已安裝 Python 3.8+，並在專案根目錄下執行：
```bash
pip install -r requirements.txt
```

### 2. 配置環境變數
在專案根目錄下建立 `.env` 檔案（已為您配妥）：
```env
MONGO_URI=mongodb+srv://qianhao_chen:Aa0983770098@cluster0.gdnkemb.mongodb.net/?appName=Cluster0
```

### 3. 啟動 Streamlit 全端面板
執行以下指令開啟 Bloomberg Terminal 風格暗色視覺面板：
```bash
streamlit run app.py
```

頁面將自動於網址 `http://localhost:8501` 開啟，即可體驗極致流暢的上帝視角盤中洗價！
