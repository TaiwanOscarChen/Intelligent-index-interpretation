/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockBasicInfo {
  id: string;
  name: string;
  basePrice: number;
  base_price?: number;
  industry: string;
  category: string;
  fundamentalNotes: string;
  notes?: string;
}

export const INITIAL_STOCKS: StockBasicInfo[] = [
  {
    "id": "2330",
    "name": "台積電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "晶圓代工",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2454",
    "name": "聯發科",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "IC 設計",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2303",
    "name": "聯電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "晶圓代工",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3711",
    "name": "日月光投控",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "封測",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2308",
    "name": "台達電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電源管理",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3034",
    "name": "聯詠",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "驅動 IC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2379",
    "name": "瑞昱",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通 IC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3035",
    "name": "智原",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ASIC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "4966",
    "name": "譜瑞-KY",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "高速傳輸",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3443",
    "name": "創意",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ASIC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3661",
    "name": "世芯-KY",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ASIC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3529",
    "name": "力旺",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "矽智財",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "8016",
    "name": "矽創",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "驅動 IC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6138",
    "name": "茂達",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "類比 IC",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "5347",
    "name": "世界先進",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "晶圓代工",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6770",
    "name": "力積電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "晶圓代工",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2408",
    "name": "南亞科",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "記憶體",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2344",
    "name": "華邦電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "記憶體",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2337",
    "name": "旺宏",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "記憶體",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "8299",
    "name": "群聯",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "記憶體控制",
    "category": "半導體與 IC 設計",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2317",
    "name": "鴻海",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "組裝代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2382",
    "name": "廣達",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "伺服器代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3231",
    "name": "緯創",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "伺服器代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6669",
    "name": "緯穎",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "伺服器代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2356",
    "name": "英業達",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "伺服器代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2357",
    "name": "華碩",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "品牌與伺服器",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2376",
    "name": "技嘉",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "主機板與伺服器",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2324",
    "name": "仁寶",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "代工",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2301",
    "name": "光寶科",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電源供應",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2395",
    "name": "研華",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "工業電腦",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3017",
    "name": "奇鋐",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "散熱",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3324",
    "name": "雙鴻",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "散熱",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2421",
    "name": "建準",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "散熱風扇",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3665",
    "name": "貿聯-KY",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "連接線",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2059",
    "name": "川湖",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "導軌",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3533",
    "name": "嘉澤",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "連接器",
    "category": "AI 伺服器與電腦周邊",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3363",
    "name": "上詮",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3450",
    "name": "聯鈞",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "4979",
    "name": "華星光",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3163",
    "name": "波若威",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "4908",
    "name": "前鼎",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6442",
    "name": "光聖",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3081",
    "name": "聯亞",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光通訊",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2345",
    "name": "智邦",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "5388",
    "name": "中磊",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3062",
    "name": "建漢",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6285",
    "name": "啟碁",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3704",
    "name": "合勤控",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2419",
    "name": "仲琦",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3596",
    "name": "智易",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "4906",
    "name": "正文",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "網通",
    "category": "光通訊與網通設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1513",
    "name": "中興電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "重電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1519",
    "name": "華城",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "重電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1503",
    "name": "士電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "重電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1504",
    "name": "東元",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "重電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1514",
    "name": "亞力",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "重電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6806",
    "name": "森崴能源",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "綠能",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "9958",
    "name": "世紀鋼",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "風電",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1605",
    "name": "華新",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電線電纜",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1609",
    "name": "大亞",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電線電纜",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2359",
    "name": "所羅門",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "機器人",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2049",
    "name": "上銀",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "自動化",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2365",
    "name": "昆盈",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電腦周邊",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "4562",
    "name": "穎漢",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "自動化",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "8374",
    "name": "羅昇",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "自動化",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6640",
    "name": "均華",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "半導體設備",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3680",
    "name": "家登",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "半導體設備",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3019",
    "name": "亞光",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "光學",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "1536",
    "name": "和大",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "車用零組件",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6409",
    "name": "旭隼",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "不斷電系統",
    "category": "重電、綠能、自動化與設備",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2603",
    "name": "長榮",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "貨櫃航運",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2609",
    "name": "陽明",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "貨櫃航運",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2615",
    "name": "萬海",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "貨櫃航運",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2327",
    "name": "國巨",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "被動元件",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2492",
    "name": "華新科",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "被動元件",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2105",
    "name": "正新",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "輪胎",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2106",
    "name": "建大",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "輪胎",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "9921",
    "name": "巨大",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "自行車",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "9914",
    "name": "美利達",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "自行車",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3003",
    "name": "健和興",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "端子",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "6274",
    "name": "台燿",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "CCL銅箔",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "2383",
    "name": "台光電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "CCL銅箔",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "8046",
    "name": "南電",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ABF載板",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3037",
    "name": "欣興",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ABF載板",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "3189",
    "name": "景碩",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "ABF載板",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  },
  {
    "id": "8069",
    "name": "元太",
    "base_price": 100.0, "basePrice": 100.0,
    "industry": "電子紙",
    "category": "航運、被動元件與傳產電子",
    "notes": "", "fundamentalNotes": ""
  }
];
