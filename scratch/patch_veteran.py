# -*- coding: utf-8 -*-
import io

app_tsx_path = r"C:\Users\a0983\.gemini\antigravity\scratch\intelligent-index-interpretation\src\App.tsx"

with io.open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search by a unique smaller string of the card to find the boundaries
start_indicator = '老司機操盤四字訣 (輪・空・殺・早)'
end_indicator = '即時總觀: 當前市場信號研判'

start_pos = content.find(start_indicator)
end_pos = content.find(end_indicator)

if start_pos != -1 and end_pos != -1:
    # Find the outer <div class="border-t ..."> preceding start_indicator
    outer_div_pos = content.rfind('<div', 0, start_pos)
    # Find the closing grid container before the '即時總觀' section
    grid_end_pos = content.rfind('</div>', start_pos, end_pos)
    
    if outer_div_pos != -1 and grid_end_pos != -1:
        target_block = content[outer_div_pos:grid_end_pos]
        
        replacement = """<div className="border-t border-zinc-850 p-4 bg-[#0a0b0f]">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-[#E5A823] animate-pulse shrink-0" />
                    <h4 className="text-white text-xs md:text-sm font-bold font-mono tracking-wider">老司機操盤四字訣 (輪・空・殺・早)</h4>
                  </div>

                  {(() => {
                    const allSignalsList = data?.signals || marketData?.signals || [];
                    const wildReleaseStocks = allSignalsList.filter(s => s.scoreBreakdown?.c30_bbShortSqueezeBreakout);
                    
                    const selectStockById = (id: string) => {
                      const found = allSignalsList.find(s => s.stock_id === id);
                      if (found) {
                        setSelectedStock(found);
                        setNotesText(found.master_notes || "");
                      }
                    };

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] md:text-xs">
                        {/* 輪 */}
                        <div className="bg-gradient-to-br from-rose-950/30 via-rose-950/10 to-zinc-950/60 border border-rose-500/20 hover:border-rose-500/40 rounded-xl p-3 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5.5 h-5.5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xs font-black shrink-0">輪</span>
                              <span className="text-rose-300 font-bold text-xs md:text-sm">板塊輪動訊號</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-[10px] md:text-xs font-sans">
                              PCB主升 (欣興/南電) 帶動 DRAM 與被動元件。
                              <span className="text-amber-400 font-bold ml-1">⚠️ 妖股噴出則散場</span>
                            </p>
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {[
                              { id: "3037", name: "欣興" },
                              { id: "8046", name: "南電" },
                              { id: "2383", name: "台光電" },
                              { id: "2399", name: "映泰" }
                            ].map(s => (
                              <button
                                key={s.id}
                                onClick={() => selectStockById(s.id)}
                                className="text-[9px] md:text-xs bg-rose-950/60 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono transition cursor-pointer shadow-sm shrink-0"
                              >
                                {s.name} {s.id}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 空 */}
                        <div className="bg-gradient-to-br from-indigo-950/30 via-indigo-950/10 to-zinc-950/60 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl p-3 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5.5 h-5.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-450 text-xs font-black shrink-0">空</span>
                              <span className="text-indigo-300 font-bold text-xs md:text-sm">套牢與真空區</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-[10px] md:text-xs font-sans">
                              大量套牢區為泥沼禁地。<span className="text-emerald-400 font-bold">突破後即是強勢真空飆速路段</span>。
                            </p>
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <div className="text-[9px] font-bold text-zinc-500">🔥 當前符合野放股（布林突破）：</div>
                            <div className="flex flex-wrap gap-1">
                              {wildReleaseStocks.length > 0 ? (
                                wildReleaseStocks.map(s => (
                                  <button
                                    key={s.stock_id}
                                    onClick={() => {
                                      setSelectedStock(s);
                                      setNotesText(s.master_notes || "");
                                    }}
                                    className="inline-flex items-center gap-1 text-[9px] bg-[#E5A823]/10 hover:bg-[#E5A823]/25 border border-[#E5A823]/40 text-[#FFB74D] font-bold px-2 py-0.5 rounded-full font-mono transition cursor-pointer animate-pulse shadow-sm shrink-0"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5A823] shrink-0"></span>
                                    {s.stock_name} {s.stock_id}
                                  </button>
                                ))
                              ) : (
                                <span className="text-zinc-650 text-[9px] italic">當前無個股符合野放信號</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 殺 */}
                        <div className="bg-gradient-to-br from-emerald-950/30 via-emerald-950/10 to-zinc-950/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-3 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5.5 h-5.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-450 text-xs font-black shrink-0">殺</span>
                              <span className="text-emerald-300 font-bold text-xs md:text-sm">散戶多空反向指標</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-[10px] md:text-xs font-sans">
                              小台散戶多空比為<span className="text-emerald-400 font-bold">反向指標</span>。散戶越做空，主力越拉抬。
                            </p>
                          </div>
                          <div className="mt-2 bg-zinc-950/70 rounded-lg p-2 text-[9px] md:text-xs font-mono border border-zinc-900 flex justify-between items-center gap-2">
                            <div>
                              <span className="text-zinc-550 block">散戶多空比:</span>
                              <span className="text-white font-bold">{marketData?.retailBullBear || "0.82 (偏空)"}</span>
                            </div>
                            <div className="border-l border-zinc-850 h-5 shrink-0"></div>
                            <div>
                              <span className="text-zinc-550 block">主力拉抬信號:</span>
                              <span className="text-[#FFB74D] font-bold">{marketData?.mainForceSignal || "中強度"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 早 */}
                        <div className="bg-gradient-to-br from-amber-950/30 via-amber-950/10 to-zinc-950/60 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5.5 h-5.5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-450 text-xs font-black shrink-0">早</span>
                              <span className="text-amber-300 font-bold text-xs md:text-sm">利多出盡訊號</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-[10px] md:text-xs font-sans">
                              跟單大老闆採購規律。<span className="text-amber-400 font-bold">媒體見報頻傳營收新高即是鎖利時機</span>，提前清倉不追高。
                            </p>
                          </div>
                          <div className="mt-2 bg-zinc-950/70 rounded-lg p-2 text-[9px] md:text-xs font-mono border border-zinc-900">
                            <span className="text-amber-400 font-bold">⚠️ 防守策略：</span>
                            <span className="text-zinc-300 ml-1">媒體見報時減碼 50%↓ 鎖利</span>
                          </div>
                        </div>
                      </div>"""
        
        content = content[:outer_div_pos] + replacement + content[grid_end_pos:]
        print("Successfully replaced Veteran Trader formula block dynamically.")
    else:
        print("Error: Could not locate container positions.")
else:
    print("Error: Indicator strings not found in file.")

with io.open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch complete.")
