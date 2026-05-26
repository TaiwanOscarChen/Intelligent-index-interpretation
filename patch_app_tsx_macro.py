import os

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

macro_panel_jsx = """
          {/* ============================================================== */}
          {/* GLOBAL MACRO & OPENAPI LINKS DASHBOARD */}
          {/* ============================================================== */}
          <div className="bg-[#0c0e12] border border-cyan-900/50 rounded-xl p-6 mb-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,255,255,0.05)]">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur opacity-20 group-hover:opacity-40 transition duration-500 rounded-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-950/50 rounded-lg border border-blue-800/50">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">全球情報與 OpenAPI 數據直連網關</h3>
                  <p className="text-sm text-zinc-400">實時串接總經、籌碼、新聞與證交所底層資料庫，強化決策穩定度</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "全球總經與 VIX", desc: "美債殖利率與恐慌指數", icon: Activity, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", link: "https://finance.yahoo.com/quote/%5EVIX/" },
                  { title: "法人期現貨籌碼", desc: "外資投信未平倉水位", icon: Database, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", link: "https://www.taifex.com.tw/cht/3/futContractsDate" },
                  { title: "台股即時產業新聞", desc: "第一手重大訊息觀測", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", link: "https://mops.twse.com.tw/mops/web/t05st01" },
                  { title: "證交所 OpenAPI", desc: "實時逐筆交易與報價", icon: Server, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", link: "https://openapi.twse.com.tw/" },
                ].map((item, idx) => (
                  <a 
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex flex-col p-4 rounded-lg border ${item.border} ${item.bg} hover:bg-opacity-20 transition-all duration-300 cursor-pointer`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="font-bold text-gray-200">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
"""

# 1. Inject into Strategy tab
strategy_start_idx = content.find('{activeTab === "strategy" && (')
if strategy_start_idx != -1:
    div_start = content.find('<div', strategy_start_idx)
    div_end = content.find('>', div_start) + 1
    content = content[:div_end] + '\\n' + macro_panel_jsx + content[div_end:]
    print("Successfully injected into Strategy Tab.")

# 2. Add lucide-react icons if missing
icons = ["Activity", "Database", "Globe", "Server"]
lucide_import_idx = content.find("import {")
lucide_import_end_idx = content.find("} from 'lucide-react'")

if lucide_import_idx != -1 and lucide_import_end_idx != -1:
    import_str = content[lucide_import_idx:lucide_import_end_idx]
    for icon in icons:
        if icon not in import_str:
            import_str += f", {icon}"
    content = content[:lucide_import_idx] + import_str + content[lucide_import_end_idx:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx successfully.")
