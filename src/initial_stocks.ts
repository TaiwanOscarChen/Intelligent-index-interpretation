/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockBasicInfo {
  id: string;
  name: string;
  basePrice: number;
  industry: string;
  category: string;
  fundamentalNotes: string;
}

export const INITIAL_STOCKS: StockBasicInfo[] = [
  // 1. AI與權值 (12檔)
  { id: "2330", name: "台積電", basePrice: 1045, industry: "半導體先進製程", category: "AI與權值", fundamentalNotes: "全球晶圓代工龍頭，先進製程與CoWoS封裝需求極度暢旺，長線生命線大盤指標。" },
  { id: "2317", name: "鴻海", basePrice: 205, industry: "AI伺服器組裝", category: "AI與權值", fundamentalNotes: "輝達GB200主力代工廠，組裝份額極高，垂直整合液冷散熱長線發酵。" },
  { id: "2454", name: "聯發科", basePrice: 1220, industry: "IC設計龍頭", category: "AI與權值", fundamentalNotes: "AI手機晶片天璣系列打入高端市場，邊緣運算晶片與ASIC布局完整。" },
  { id: "2308", name: "台達電", basePrice: 385, industry: "電源供應器", category: "AI與權值", fundamentalNotes: "伺服器高階電源與散熱模組領導廠商，綠能與高壓大功率電源無可替代龍頭。" },
  { id: "2382", name: "廣達", basePrice: 308, industry: "伺服器代工", category: "AI與權值", fundamentalNotes: "AI伺服器出貨放量，大廠液冷整機櫃被動資金首選，訂單直達2027年。" },
  { id: "3231", name: "緯創", basePrice: 118, industry: "伺服器代工", category: "AI與權值", fundamentalNotes: "輝達AI晶片基板主力供應商，伴隨AI伺服器量產呈現爆發式成長。" },
  { id: "6669", name: "緯穎", basePrice: 1950, industry: "雲端伺服器", category: "AI與權值", fundamentalNotes: "超高價ASIC與高純度外資鎖碼標的，專注CSP客戶高毛利液冷機櫃。" },
  { id: "2356", name: "英業達", basePrice: 54.5, industry: "代工廠", category: "AI與權值", fundamentalNotes: "低價伺服器量能壓縮突破強勢，L10伺服器組裝與低基期AI受惠。" },
  { id: "2376", name: "技嘉", basePrice: 285, industry: "電腦硬體", category: "AI與權值", fundamentalNotes: "AI伺服器品牌商溢價強勢發散，高階GPU伺服器出貨量持續高企。" },
  { id: "2324", name: "仁寶", basePrice: 36.8, industry: "代工廠", category: "AI與權值", fundamentalNotes: "車用電子與低基期邊緣AI轉型，伺服器認證取得重大斬獲。" },
  { id: "2301", name: "光寶科", basePrice: 102.5, industry: "電源供應", category: "AI與權值", fundamentalNotes: "高效能鈦金級電源與雲端機櫃發言權強，低基期轉型高毛利比重提升。" },
  { id: "3711", name: "日月光投控", basePrice: 158, industry: "封裝測試", category: "AI與權值", fundamentalNotes: "全球半導體後段封測一哥，先進封裝與矽光子核心供應鏈技術領先。" },

  // 2. 散熱電源與被動 (11檔)
  { id: "3017", name: "奇鋐", basePrice: 625, industry: "散熱模組", category: "散熱電源與被動", fundamentalNotes: "3D VC與液冷機櫃全球龍頭份額，GB200液冷冷板出貨主力。" },
  { id: "3324", name: "雙鴻", basePrice: 1010, industry: "散熱模組", category: "散熱電源與被動", fundamentalNotes: "水冷板與CDU(冷卻分配量產)爆發點，液冷系統出貨能見度高。" },
  { id: "2421", name: "建準", basePrice: 98, industry: "風扇廠", category: "散熱電源與被動", fundamentalNotes: "高規散熱風扇與氣冷模組核心供應，AI伺服器風扇出貨量增溫。" },
  { id: "3665", name: "貿聯-KY", basePrice: 480, industry: "線束廠", category: "散熱電源與被動", fundamentalNotes: "高階AI伺服器與車用高毛利線束，高速數據傳輸核心受惠者。" },
  { id: "2059", name: "川湖", basePrice: 1210, industry: "伺服器導軌", category: "散熱電源與被動", fundamentalNotes: "高階滑軌毛利率突破全球神話，具備極高專利與技術護城河。" },
  { id: "3533", name: "嘉澤", basePrice: 1390, industry: "連接器", category: "散熱電源與被動", fundamentalNotes: "CPU Socket與高階插槽世代更迭受益者，規格升級帶動平均單價大增。" },
  { id: "2327", name: "國巨", basePrice: 585, industry: "被動元件", category: "散熱電源與被動", fundamentalNotes: "全球被動元件龍頭，AI PC與車用高階電容需求帶動營運回溫。" },
  { id: "2492", name: "華新科", basePrice: 96.5, industry: "被動元件", category: "散熱電源與被動", fundamentalNotes: "中高階MLCC及低溫共燒陶瓷(LTCC)出貨回升，受惠消費電子復甦。" },
  { id: "2449", name: "京元電子", basePrice: 110, industry: "半導體測試", category: "散熱電源與被動", fundamentalNotes: "AI晶片測試大廠，受惠CoWoS後段高階測試需求，產能利用率暴漲。" },
  { id: "8046", name: "南電", basePrice: 195, industry: "IC載板", category: "散熱電源與被動", fundamentalNotes: "ABF高階載板出貨回歸健康，受惠伺服器與AI晶片封裝載板追單。" },
  { id: "3037", name: "欣興", basePrice: 160, industry: "IC載板", category: "散熱電源與被動", fundamentalNotes: "ABF高階載板龍頭，高密度連接板獲利優渥，AI核心晶片高層數首選。" },

  // 3. 矽光子與IP設計 (19檔)
  { id: "3034", name: "聯詠", basePrice: 495, industry: "驅動IC", category: "矽光子與IP設計", fundamentalNotes: "OLED驅動IC高毛利抗震代表，高殖利率與強大市佔形成護城河。" },
  { id: "2379", name: "瑞昱", basePrice: 472, industry: "網通IC", category: "矽光子與IP設計", fundamentalNotes: "車用乙太網路與Wi-Fi 7規格全面升級，PC與網通復甦共振受益。" },
  { id: "3035", name: "智原", basePrice: 235, industry: "ASIC/IP", category: "矽光子與IP設計", fundamentalNotes: "成熟製程ASIC巨頭，跨足2.5D/3D先進封裝，案源合約收割期將至。" },
  { id: "4966", name: "譜瑞-KY", basePrice: 795, industry: "高速傳輸", category: "矽光子與IP設計", fundamentalNotes: "PCIe Gen5與USB4高毛利晶片規格升級剛需，迎來AI換機大潮。" },
  { id: "3443", name: "創意", basePrice: 915, industry: "ASIC/IP", category: "矽光子與IP設計", fundamentalNotes: "台積電體系高純度ASIC，專精HBM控制器與先進製程IP委託設計。" },
  { id: "3661", name: "世芯-KY", basePrice: 1850, industry: "ASIC/IP", category: "矽光子與IP設計", fundamentalNotes: "北美CSP大客戶AI ASIC核心設計者，高階製程設計能力全球領先。" },
  { id: "3529", name: "力旺", basePrice: 3625, industry: "矽智財IP", category: "矽光子與IP設計", fundamentalNotes: "嵌入式非揮發性記憶體技術壟斷者，按晶圓量計收權利金極度暴利。" },
  { id: "3450", name: "聯鈞", basePrice: 215, industry: "光封測", category: "矽光子與IP設計", fundamentalNotes: "CPO矽光子共同封裝戰略排頭兵，轉投資捷智科技共築先進封測防線。" },
  { id: "4979", name: "華星光", basePrice: 630, industry: "光通訊", category: "矽光子與IP設計", fundamentalNotes: "美系大客戶800G高速光收發模組核心代工廠，高Beta動能指標。" },
  { id: "6442", name: "光聖", basePrice: 388, industry: "光通訊", category: "矽光子與IP設計", fundamentalNotes: "美系資料中心光纖主被動元件拉貨巨頭，高階光通訊濾鏡出貨暢旺。" },
  { id: "3163", name: "波若威", basePrice: 1145, industry: "光被動元件", category: "矽光子與IP設計", fundamentalNotes: "光波導與WDM多路複用高動能標的，5G及AI資料中心傳輸升級受惠。" },
  { id: "2345", name: "智邦", basePrice: 535, industry: "交換器", category: "矽光子與IP設計", fundamentalNotes: "400G/800G白牌交換器全球霸主，掌握高頻寬巨量網路剛性需求。" },
  { id: "5388", name: "中磊", basePrice: 112, industry: "網通設備", category: "矽光子與IP設計", fundamentalNotes: "全球5G FWA與北美寬頻基建巨頭，戶外基站與智慧家居出貨穩定。" },
  { id: "6285", name: "啟碁", basePrice: 128, industry: "網通設備", category: "矽光子與IP設計", fundamentalNotes: "車載網通、低軌衛星天線及企業級AP出貨順遂，法人吸籌重點。" },
  { id: "3596", name: "智易", basePrice: 135, industry: "網通設備", category: "矽光子與IP設計", fundamentalNotes: "電信商寬頻整合服務大廠，Wi-Fi 7與車載通訊模組開拓新成長曲線。" },
  { id: "3363", name: "上詮", basePrice: 852, industry: "光主被動件", category: "矽光子與IP設計", fundamentalNotes: "與台積電合作開發CPO矽光子光通道技術，為未來超算網絡核心元件。" },
  { id: "4908", name: "前鼎", basePrice: 267, industry: "光收發模組", category: "矽光子與IP設計", fundamentalNotes: "光收發模組資深供應商，受惠全球資料中心頻寬升級與高速傳輸浪潮。" },
  { id: "3081", name: "聯亞", basePrice: 2710, industry: "光通訊磊晶", category: "矽光子與IP設計", fundamentalNotes: "矽光子LD磊晶晶圓全球主要供應商，AI算力機櫃內部高速光互連受惠者。" },
  { id: "3062", name: "建漢", basePrice: 28.5, industry: "網通設備", category: "矽光子與IP設計", fundamentalNotes: "邊緣計算網通路由設備，低基期高Beta轉機題材，股性極度活潑。" },

  // 4. 重電綠能與電纜 (9檔)
  { id: "1513", name: "中興電", basePrice: 168.5, industry: "重電基建", category: "重電綠能與電纜", fundamentalNotes: "GIS高壓氣體絕緣開關長效百億訂單，政策強韌電網計畫最大受益者。" },
  { id: "1519", name: "華城", basePrice: 720, industry: "重電變壓器", category: "重電綠能與電纜", fundamentalNotes: "外銷北美特高壓變壓器獨占鰲頭，高毛利外銷訂單能見度直達2028年。" },
  { id: "1503", name: "士電", basePrice: 215, industry: "重電電力", category: "重電綠能與電纜", fundamentalNotes: "重電三雄之一，大容量變壓器與台積電建廠、綠能開發案高度共振。" },
  { id: "1514", name: "亞力", basePrice: 112, industry: "電氣設備", category: "重電綠能與電纜", fundamentalNotes: "配電盤變壓器，獨攬台積電海外建廠配電工程及台鐵軌道電力案。" },
  { id: "6806", name: "森崴能源", basePrice: 125, industry: "智慧綠能", category: "重電綠能與電纜", fundamentalNotes: "台電離岸風電二期工程大型認列期，綠電交易與能源儲能轉投資豐沛。" },
  { id: "9958", name: "世紀鋼", basePrice: 198, industry: "風電鋼構", category: "重電綠能與電纜", fundamentalNotes: "離岸風電套管基座(Jacket)防禦龍頭，國產化政策下長期產能滿載。" },
  { id: "1605", name: "華新", basePrice: 32.8, industry: "電線電纜", category: "重電綠能與電纜", fundamentalNotes: "不鏽鋼與電線電纜龍頭，受惠印尼冰鎳廠產能放量與重電電纜需求。" },
  { id: "1609", name: "大亞", basePrice: 47.2, industry: "電線電纜", category: "重電綠能與電纜", fundamentalNotes: "漆包線與特高壓電纜大廠，綠能太陽能案場併網與儲能金雞母貢獻顯著。" },
  { id: "1504", name: "東元", basePrice: 48.5, industry: "重電機電", category: "重電綠能與電纜", fundamentalNotes: "工業高效能馬達龍頭，積極轉型重電工程與EV動力系統，營運持穩。" },

  // 5. 網通光學與面板 (11檔)
  { id: "3008", name: "大立光", basePrice: 2350, industry: "光學鏡頭", category: "網通光學與面板", fundamentalNotes: "全球高階潛望式鏡頭王者，擁有地表最強光學專利壁壘，良率回升。" },
  { id: "3406", name: "玉晶光", basePrice: 420, industry: "光學鏡頭", category: "網通光學與面板", fundamentalNotes: "美系大廠手機前鏡頭與超廣角主力，VR/AR高階光學透鏡出貨增溫。" },
  { id: "2409", name: "友達", basePrice: 16.2, industry: "面板大廠", category: "網通光學與面板", fundamentalNotes: "面板雙虎之一，積極切入車用智慧座艙與MicroLED高價值場域轉型。" },
  { id: "3481", name: "群創", basePrice: 14.8, industry: "面板大廠", category: "網通光學與面板", fundamentalNotes: "跨足FOPLP先進晶片封裝轉型先驅，扇出型面板級封裝題材黑馬飆股。" },
  { id: "6116", name: "彩晶", basePrice: 9.25, industry: "中小面板", category: "網通光學與面板", fundamentalNotes: "中小尺寸工控面板專精，PB < 0.8 具高安全防禦邊際，低基期整理。" },
  { id: "4904", name: "遠傳", basePrice: 92, industry: "電信網絡", category: "網通光學與面板", fundamentalNotes: "新遠傳布局成熟，企業雲端與AI物聯網客製方案成為新興穩定金牛。" },
  { id: "3045", name: "台灣大", basePrice: 115, industry: "電信網絡", category: "網通光學與面板", fundamentalNotes: "電信三雄之一，合併後用戶規模顯著擴大，5G與momo電商雙引擎驅動。" },
  { id: "4906", name: "正文", basePrice: 32.5, industry: "網通設備", category: "網通光學與面板", fundamentalNotes: "白牌寬頻接入終端與Wi-Fi 7升級，高附加價值直銷電信商模式效益顯著。" },
  { id: "3704", name: "合勤控", basePrice: 36.8, industry: "網通設備", category: "網通光學與面板", fundamentalNotes: "資訊安全與光纖寬頻設備，受惠歐美寬頻去庫存結束及網通訂單復甦。" },
  { id: "2419", name: "仲琦", basePrice: 25.5, industry: "網通設備", category: "網通光學與面板", fundamentalNotes: "Cable Modems與光纖網絡接入設備，隨北美系統運營商重啟拉貨而反彈。" },
  { id: "8454", name: "富邦媒", basePrice: 420, industry: "電子商務", category: "網通光學與面板", fundamentalNotes: "台灣電信商系電商龍頭，自主物流與AI智慧倉儲效率極高，營收穩健。" },

  // 6. 機器人與自動化 (8檔)
  { id: "2359", name: "所羅門", basePrice: 142.5, industry: "AI機器人視覺", category: "機器人與自動化", fundamentalNotes: "3D視覺與AI邊緣運算晶片，為人形機器人與自動化視覺演算法全球領頭羊。" },
  { id: "2049", name: "上銀", basePrice: 218, industry: "精密傳動", category: "機器人與自動化", fundamentalNotes: "精密滾珠螺桿與線性滑軌，受惠半導體設備與自動化工業景氣週期回升。" },
  { id: "2365", name: "昆盈", basePrice: 58.2, industry: "電腦外設", category: "機器人與自動化", fundamentalNotes: "受惠智慧自動化控制模組與邊緣AI應用，轉型高階智慧家居控制核心。" },
  { id: "4562", name: "穎漢", basePrice: 62.4, industry: "智慧彎管機", category: "機器人與自動化", fundamentalNotes: "高階全自動彎管機械與機械手整合，切入航太與EV輕量化生產線。" },
  { id: "8374", name: "羅昇", basePrice: 115.5, industry: "傳動與控制", category: "機器人與自動化", fundamentalNotes: "半導體機電代理與自動化傳動，機器人關節減速機出貨高動能飆股。" },
  { id: "6640", name: "均華", basePrice: 1360, industry: "半導體設備", category: "機器人與自動化", fundamentalNotes: "CoWoS先進封裝晶片挑揀機核心供應鏈，晶粒挑揀精度與速度均冠絕台股。" },
  { id: "3680", name: "家登", basePrice: 568, industry: "半導體載具", category: "機器人與自動化", fundamentalNotes: "全球EUV Pod(極紫外光光罩傳送盒)獨占廠商，先進製程不可或缺防禦股。" },
  { id: "3019", name: "亞光", basePrice: 112, industry: "光學元件", category: "機器人與自動化", fundamentalNotes: "車載鏡頭與潛望鏡鏡片折射技術領先，光學雷達及AR衍射光波導佈局完成。" },

  // 7. 記憶體與其他電子 (8檔)
  { id: "2408", name: "南亞科", basePrice: 44.5, industry: "記憶體DRAM", category: "記憶體與其他電子", fundamentalNotes: "台股DRAM主要大廠，受惠HBM排擠效應帶動常規DDR4/DDR5合約價看漲。" },
  { id: "2344", name: "華邦電", basePrice: 18.2, industry: "利基記憶體", category: "記憶體與其他電子", fundamentalNotes: "利基型Flash與DRAM，受惠邊緣AI及穿戴式設備庫存去化結束翻揚。" },
  { id: "3260", name: "威剛", basePrice: 417.5, industry: "記憶體模組", category: "記憶體與其他電子", fundamentalNotes: "DRAM/NAND模組龍頭，掌握低價合約現貨庫存，極大化受益現貨上漲。" },
  { id: "8299", name: "群聯", basePrice: 2430, industry: "快閃控制IC", category: "記憶體與其他電子", fundamentalNotes: "NAND控制IC王者，推出aiDAPTIV+平台大幅降低中小企業微調大模型成本。" },
  { id: "2337", name: "旺宏", basePrice: 22.4, industry: "快閃記憶體", category: "記憶體與其他電子", fundamentalNotes: "NOR Flash龍頭，車用與工控高可靠度晶片出貨龍頭，庫存去化至尾聲。" },
  { id: "2303", name: "聯電", basePrice: 51.5, industry: "晶圓代工", category: "記憶體與其他電子", fundamentalNotes: "成熟製程特殊工藝與OLED驅動IC，具備極高殖利率底盤與穩定現金流。" },
  { id: "3189", name: "景碩", basePrice: 105, industry: "IC載板", category: "記憶體與其他電子", fundamentalNotes: "隱藏版落後補漲指標，BT載板隨美系手機出貨及ABF高階載板回暖。" },
  { id: "2395", name: "研華", basePrice: 345, industry: "工業電腦", category: "記憶體與其他電子", fundamentalNotes: "全球工業電腦第一大廠，邊緣AI智慧物聯網及軟硬整合平台獲利極佳。" },

  // 8. 航運與避風港 (12檔)
  { id: "2603", name: "長榮", basePrice: 198.5, industry: "貨櫃航運", category: "航運與避風港", fundamentalNotes: "貨櫃航運全球巨擘，紅海地緣局勢撐高SCFI運價，超高配息率防禦核心。" },
  { id: "2609", name: "陽明", basePrice: 72.8, industry: "貨櫃航運", category: "航運與避風港", fundamentalNotes: "貨櫃海運主力，運力調度彈性極佳，低本益比與高現金部位避險優選。" },
  { id: "2615", name: "萬海", basePrice: 81.2, industry: "貨櫃航運", category: "航運與避風港", fundamentalNotes: "亞洲近洋航線霸主，美洲航線效率提升，高能節能新船下水拉高毛利。" },
  { id: "2618", name: "長榮航", basePrice: 36, industry: "航空客貨運", category: "航運與避風港", fundamentalNotes: "高收益商務客運需求暢旺，AI高鐵空運急單拉動航空貨運價格，獲利佳。" },
  { id: "2610", name: "華航", basePrice: 22, industry: "航空客貨運", category: "航運與避風港", fundamentalNotes: "航空雙雄之一，基期極低，貨運包機及寒暑假客運旅遊旺季助推獲利。" },
  { id: "1101", name: "台泥", basePrice: 33, industry: "水泥與儲能", category: "航運與避風港", fundamentalNotes: "積極轉型歐洲低碳綠色水泥，投資土耳其與非洲大型儲能與鋰電池廠。" },
  { id: "1216", name: "統一", basePrice: 82, industry: "食品百貨", category: "航運與避風港", fundamentalNotes: "國內生鮮民生百貨零售巨無霸，轉投資家樂福與統一超整併綜效優異。" },
  { id: "2912", name: "統一超", basePrice: 275, industry: "零售通路", category: "航運與避風港", fundamentalNotes: "超商龍頭，實體店大舉擴張，數位會員卡與跨店咖啡金流防禦力無敵。" },
  { id: "1301", name: "台塑", basePrice: 65, industry: "塑膠石化", category: "航運與避風港", fundamentalNotes: "利基型特用化學品轉型中，受惠德州廠產能擴展與乙烯利差改善。" },
  { id: "1303", name: "南亞", basePrice: 54, industry: "石化電子材料", category: "航運與避風港", fundamentalNotes: "電子級玻纖布及環氧樹脂隨AI高多層板需求反彈，營運動能復甦。" },
  { id: "1326", name: "台化", basePrice: 45, industry: "化纖石化", category: "航運與避風港", fundamentalNotes: "芳香烴產業鏈隨供需改善觸底回溫，積極推進車用輕量化高值新材料。" },
  { id: "6505", name: "台塑化", basePrice: 72, industry: "煉油石化", category: "航運與避風港", fundamentalNotes: "煉油裂解利差持穩，受惠原油裂解差價維持高檔及成品油庫存利益。" }
];
