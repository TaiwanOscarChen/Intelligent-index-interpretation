import os

def main():
    filepath = "src/App.tsx"
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Modify Status Bar (Delete engine label and rename crawler)
    old_status = """          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-550">V2026.Max 量化引擎運作中</span>
            {/* V8050.0 即時爬蟲倒計時 */}
            <div className="ml-2 flex items-center gap-1.5 bg-zinc-900 border border-[#E5A823]/30 rounded px-2 py-0.5">
              <Zap className="w-3 h-3 text-[#E5A823] animate-pulse" />
              <span className="text-[#E5A823] font-black text-[10px]">
                ⚡ 即時爬蟲 | 次更 {realtimeCountdown}s
              </span>
            </div>
          </div>"""

    new_status = """          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {/* V8050.0 即時爬蟲倒計時 */}
            <div className="ml-2 flex items-center gap-1.5 bg-zinc-900 border border-[#E5A823]/30 rounded px-2 py-0.5">
              <Zap className="w-3 h-3 text-[#E5A823] animate-pulse" />
              <span className="text-[#E5A823] font-black text-[10px]">
                即時爬蟲 | 次更 {realtimeCountdown}s
              </span>
            </div>
          </div>"""

    if old_status in content:
        content = content.replace(old_status, new_status)
        print("Success: Patched status bar labels!")
    else:
        # Fallback split check
        print("Warning: Exact status bar block not found. Checking fallback...")
        content = content.replace('<span className="text-zinc-550">V2026.Max 量化引擎運作中</span>', '')
        content = content.replace('⚡ 即時爬蟲 | 次更', '即時爬蟲 | 次更')
        print("Fallback search applied.")

    # 2. Scale Up Typography in card view return block
    old_card_return = """                        return (
                          <div
                            key={stock.stock_id}
                            onClick={() => {
                              setSelectedStock(stock);
                              setNotesText(stock.master_notes || "");
                            }}
                            className={`premium-card rounded-xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between gap-3 ${borderStyle}`}
                          >
                            {/* Card Top Row */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base font-mono font-black text-white">{stock.stock_id}</span>
                                  <span className="text-xs font-bold text-zinc-400">{stock.stock_name}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono">
                                  <span className="bg-zinc-900 text-zinc-450 px-1 py-0.5 rounded border border-zinc-800">
                                    {stock.category || "AI與權值"}
                                  </span>
                                  <span className="bg-zinc-900 text-zinc-450 px-1 py-0.5 rounded border border-zinc-800">
                                    {actionTier}
                                  </span>
                                  {isTakeProfitWarning && (
                                    <span className="bg-amber-950 text-[#FFB74D] px-1 py-0.5 rounded border border-amber-600/40 font-bold animate-pulse">
                                      ⚠️ 獲利20%減碼
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-[8px] font-mono text-zinc-550">V8050.0 全域檢核</div>
                                <span className={`px-2 py-0.5 rounded font-mono font-black text-[9px] ${
                                  isSClass
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/60 shadow-[0_0_8px_rgba(229,168,35,0.3)] animate-pulse"
                                    : isAClass
                                    ? "bg-sky-950 text-sky-300 border border-sky-600/50"
                                    : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
                                }`}>
                                  {isSClass ? "🏆" : isAClass ? "🥇" : "❌"} {stock.score} / 50
                                </span>
                              </div>
                            </div>
                            
                            {/* Technical Grid (Bloomberg style 2x2 chips) */}
                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[8px] bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[7px]">RSI</span>
                                <span className="text-white font-bold">{rsiVal}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[7px]">狀態</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{statusText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[7px]">動能</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{momentumText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[7px]">量比</span>
                                <span className="text-white font-bold">{volumeRatio}</span>
                              </div>
                            </div>
                            
                            {/* Live Headline/Notes */}
                            {stock.master_notes && (
                              <div className="border-l-2 border-amber-400 pl-2 py-0.5 text-[9px] font-sans text-amber-300 italic truncate" title={stock.master_notes.split(" | ")[0]}>
                                📰 {stock.master_notes.split(" | ")[0]}
                              </div>
                            )}
                            
                            {/* Pricing Zones */}
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[8px] pt-1">
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-550 text-[7px] block mb-0.5">現價建倉</span>
                                <span className="text-[#FFB74D] font-extrabold">{stock.close_price.toFixed(1)}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[7px] block mb-0.5">波段支撐</span>
                                <span className="text-[#10b881] font-extrabold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[7px] block mb-0.5">波段壓力</span>
                                <span className="text-[#f43f5e] font-extrabold">{stock.take_profit_half_price ? stock.take_profit_half_price.toFixed(1) : "-"}</span>
                              </div>
                            </div>
                            
                            {/* Execution Orders (Half-Kelly Pyramid or ROD limits) */}
                            {isSClass ? (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-amber-500/20 text-[8px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D] font-bold">🏆 S級 半凱利金字塔建倉 (5-3-2)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center text-[7px] pt-1 border-t border-zinc-900">
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">首批(50%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p1} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">二批(30%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p2} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-550 block">三批(20%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p3} 股</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-[8px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D]">🎯 A級 ROD限價伏擊單 (20MA)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-555">伏擊價格區間:</span>
                                  <span className="text-[#10b881] font-extrabold">{(stock.close_price * 0.985).toFixed(1)} ~ {(stock.close_price * 0.995).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[7px] pt-1 border-t border-zinc-900 text-zinc-500">
                                  <span>建議買入: <span className="text-[#FFB74D] font-bold">{orderShares} 股</span></span>
                                  <span>防呆停損: <span className="text-[#10b881] font-bold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span></span>
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 justify-end pt-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openBuyModalForStock(stock)}
                                disabled={data?.macroEStopActive}
                                className={`flex-1 py-1.5 text-[9px] font-bold rounded shadow transition active:scale-[0.96] text-center ${
                                  data?.macroEStopActive 
                                    ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                                    : "bg-rose-950/90 text-rose-350 border border-rose-700/40 hover:bg-rose-900"
                                }`}
                              >
                                現價建倉
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setNotesText(stock.master_notes || "");
                                }}
                                className="px-2.5 py-1.5 text-[9px] font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                              >
                                實戰解盤
                              </button>
                            </div>
                            
                            {/* Bottom metadata shadow */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-70 bg-gradient-to-r ${isSClass ? "from-amber-500 to-[#FFB74D]" : "from-[#f43f5e] via-[#FFB74D] to-[#10b881]"}`}></div>
                          </div>
                        );"""

    new_card_return = """                        return (
                          <div
                            key={stock.stock_id}
                            onClick={() => {
                              setSelectedStock(stock);
                              setNotesText(stock.master_notes || "");
                            }}
                            className={`premium-card rounded-xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between gap-3 ${borderStyle}`}
                          >
                            {/* Card Top Row */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base font-mono font-black text-white">{stock.stock_id}</span>
                                  <span className="text-xs font-bold text-zinc-400">{stock.stock_name}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1 text-[10px] md:text-[11px] font-mono">
                                  <span className="bg-zinc-900 text-zinc-400 px-1 py-0.5 rounded border border-zinc-800">
                                    {stock.category || "AI與權值"}
                                  </span>
                                  <span className="bg-zinc-900 text-zinc-400 px-1 py-0.5 rounded border border-zinc-800">
                                    {actionTier}
                                  </span>
                                  {isTakeProfitWarning && (
                                    <span className="bg-amber-950 text-[#FFB74D] px-1 py-0.5 rounded border border-amber-600/40 font-bold animate-pulse">
                                      ⚠️ 獲利20%減碼
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-[10px] md:text-[11px] font-mono text-zinc-550">V8050.0 全域檢核</div>
                                <span className={`px-2 py-0.5 rounded font-mono font-black text-[11px] md:text-xs ${
                                  isSClass
                                    ? "bg-yellow-950 text-[#FFB74D] border border-yellow-500/60 shadow-[0_0_8px_rgba(229,168,35,0.3)] animate-pulse"
                                    : isAClass
                                    ? "bg-sky-950 text-sky-300 border border-sky-600/50"
                                    : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
                                }`}>
                                  {isSClass ? "🏆" : isAClass ? "🥇" : "❌"} {stock.score} / 50
                                </span>
                              </div>
                            </div>
                            
                            {/* Technical Grid (Bloomberg style 2x2 chips) */}
                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px] md:text-xs bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[10px] md:text-[11px]">RSI</span>
                                <span className="text-white font-bold">{rsiVal}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[10px] md:text-[11px]">狀態</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{statusText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[10px] md:text-[11px]">動能</span>
                                <span className={`font-bold ${isSClass ? "text-[#f43f5e]" : "text-[#10b881]"}`}>{momentumText}</span>
                              </div>
                              <div className="flex flex-col p-1 rounded bg-zinc-900/60">
                                <span className="text-zinc-555 text-[10px] md:text-[11px]">量比</span>
                                <span className="text-white font-bold">{volumeRatio}</span>
                              </div>
                            </div>
                            
                            {/* Live Headline/Notes */}
                            {stock.master_notes && (
                              <div className="border-l-2 border-amber-400 pl-2 py-0.5 text-[11px] md:text-xs font-sans text-amber-300 italic truncate" title={stock.master_notes.split(" | ")[0]}>
                                📰 {stock.master_notes.split(" | ")[0]}
                              </div>
                            )}
                            
                            {/* Pricing Zones */}
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] md:text-xs pt-1">
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-550 text-[8px] md:text-[9px] block mb-0.5">現價建倉</span>
                                <span className="text-[#FFB74D] font-extrabold">{stock.close_price.toFixed(1)}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[8px] md:text-[9px] block mb-0.5">波段支撐</span>
                                <span className="text-[#10b881] font-extrabold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span>
                              </div>
                              <div className="bg-zinc-900/60 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-555 text-[8px] md:text-[9px] block mb-0.5">波段壓力</span>
                                <span className="text-[#f43f5e] font-extrabold">{stock.take_profit_half_price ? stock.take_profit_half_price.toFixed(1) : "-"}</span>
                              </div>
                            </div>
                            
                            {/* Execution Orders (Half-Kelly Pyramid or ROD limits) */}
                            {isSClass ? (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-amber-500/20 text-[10px] md:text-[11px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D] font-bold">🏆 S級 半凱利金字塔建倉 (5-3-2)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center text-[9px] md:text-[10px] pt-1 border-t border-zinc-900">
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">首批(50%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p1} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-500 block">二批(30%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p2} 股</span>
                                  </div>
                                  <div className="bg-zinc-900/40 p-0.5 rounded">
                                    <span className="text-zinc-555 block">三批(20%)</span>
                                    <span className="text-[#f43f5e] font-bold">{p3} 股</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-[10px] md:text-[11px] font-mono space-y-1">
                                <div className="flex justify-between items-center text-zinc-450">
                                  <span className="text-[#FFB74D]">🎯 A級 ROD限價伏擊單 (20MA)</span>
                                  <span className="text-white font-bold">約 NT$ {orderAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] md:text-[10px]">
                                  <span className="text-zinc-550">伏擊價格區間:</span>
                                  <span className="text-[#10b881] font-extrabold">{(stock.close_price * 0.985).toFixed(1)} ~ {(stock.close_price * 0.995).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] md:text-[9px] pt-1 border-t border-zinc-900 text-zinc-500">
                                  <span>建議買入: <span className="text-[#FFB74D] font-bold">{orderShares} 股</span></span>
                                  <span>防呆停損: <span className="text-[#10b881] font-bold">{stock.stop_loss_price ? stock.stop_loss_price.toFixed(1) : "-"}</span></span>
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 justify-end pt-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openBuyModalForStock(stock)}
                                disabled={data?.macroEStopActive}
                                className={`flex-1 py-1.5 text-[11px] md:text-xs font-bold rounded shadow transition active:scale-[0.96] text-center ${
                                  data?.macroEStopActive 
                                    ? "bg-zinc-800 text-zinc-550 border border-zinc-850 cursor-not-allowed"
                                    : "bg-rose-950/90 text-rose-350 border border-rose-700/40 hover:bg-rose-900"
                                }`}
                              >
                                現價建倉
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setNotesText(stock.master_notes || "");
                                }}
                                className="px-2.5 py-1.5 text-[11px] md:text-xs font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                              >
                                實戰解盤
                              </button>
                            </div>
                            
                            {/* Bottom metadata shadow */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-70 bg-gradient-to-r ${isSClass ? "from-amber-500 to-[#FFB74D]" : "from-[#f43f5e] via-[#FFB74D] to-[#10b881]"}`}></div>
                          </div>
                        );"""

    if old_card_return in content:
        content = content.replace(old_card_return, new_card_return)
        print("Success: Patched card typography values!")
    else:
        # Check standard normalized comparison (e.g. line ending split)
        old_normalized = old_card_return.replace('\r\n', '\n')
        content_normalized = content.replace('\r\n', '\n')
        if old_normalized in content_normalized:
            content_normalized = content_normalized.replace(old_normalized, new_card_return.replace('\r\n', '\n'))
            content = content_normalized
            print("Success: Patched card typography with normalized line endings!")
        else:
            print("Error: Could not locate card return block. Text must have slight variances.")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
