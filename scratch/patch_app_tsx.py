# -*- coding: utf-8 -*-
import io
import subprocess

app_tsx_path = r"C:\Users\a0983\.gemini\antigravity\scratch\intelligent-index-interpretation\src\App.tsx"

# First reset using git checkout to avoid duplicate overlay issues
subprocess.call(["git", "checkout", "src/App.tsx"])
print("Reset src/App.tsx using git checkout.")

# Re-apply the exits-related states and functions first since we reset
# We can do this in Python as well!
with io.open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State Insertion
target_states = """  const [isSubmittingExit, setIsSubmittingExit] = useState<boolean>(false);

  // Notes"""

replacement_states = """  const [isSubmittingExit, setIsSubmittingExit] = useState<boolean>(false);

  // Exited Trades UI States
  const [exitsPage, setExitsPage] = useState<number>(1);
  const [isExitSelectMode, setIsExitSelectMode] = useState<boolean>(false);
  const [selectedExitIds, setSelectedExitIds] = useState<string[]>([]);
  const [editingExit, setEditingExit] = useState<ExitLogItem | null>(null);
  const [editExitReason, setEditExitReason] = useState<string>("");
  const [editExitReview, setEditExitReview] = useState<string>("");
  const [isSubmittingEditExit, setIsSubmittingEditExit] = useState<boolean>(false);

  // Notes"""

if target_states in content:
    content = content.replace(target_states, replacement_states)
    print("Re-applied state variables.")

# 2. Handler Functions Insertion
target_funcs = """      const resData = await response.json();
      if (resData.success) {
        fetchHoldings();
        setShowExitModal(false);
        setActiveTab("exits"); // jump to history logs to see Gemini retrospect!
      }
    } catch (error) {
      console.error("Exit order failed:", error);
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Handle file select (image/text)"""

replacement_funcs = """      const resData = await response.json();
      if (resData.success) {
        fetchHoldings();
        setShowExitModal(false);
        setActiveTab("exits"); // jump to history logs to see Gemini retrospect!
      }
    } catch (error) {
      console.error("Exit order failed:", error);
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Save edited exited trade review & reason
  const handleEditExitSave = async () => {
    if (!editingExit) return;
    setIsSubmittingEditExit(true);
    const targetId = editingExit._id || editingExit.stock_id;
    try {
      const response = await fetch("/api/exits/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          exit_reason: editExitReason,
          review_summary: editExitReview
        })
      });
      const resData = await response.json();
      if (resData.success) {
        // Update local state
        setExits(prev => prev.map(e => {
          const currentId = e._id || e.stock_id;
          if (currentId === targetId) {
            return { ...e, exit_reason: editExitReason, review_summary: editExitReview };
          }
          return e;
        }));
        setEditingExit(null);
      } else {
        alert("更新失敗：" + (resData.message || resData.error || "未知錯誤"));
      }
    } catch (error) {
      console.error("更新已出場紀錄失敗:", error);
      alert("更新已出場紀錄失敗，請稍後再試。");
    } finally {
      setIsSubmittingEditExit(false);
    }
  };

  // Batch delete exited trades
  const handleBatchDeleteExits = async () => {
    if (selectedExitIds.length === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedExitIds.length} 筆已出場檢討紀錄嗎？此動作無法復原。`)) return;
    try {
      const response = await fetch("/api/exits/delete-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedExitIds })
      });
      const resData = await response.json();
      if (resData.success) {
        // Update local state
        setExits(prev => prev.filter(e => {
          const currentId = e._id || e.stock_id;
          return !selectedExitIds.includes(currentId);
        }));
        setSelectedExitIds([]);
        setIsExitSelectMode(false);
        // Reset page if it exceeds bounds
        setExitsPage(1);
      } else {
        alert("刪除失敗：" + (resData.message || resData.error || "未知錯誤"));
      }
    } catch (error) {
      console.error("批次刪除已出場紀錄失敗:", error);
      alert("批次刪除已出場紀錄失敗，請稍後再試。");
    }
  };

  // Handle file select (image/text)"""

if target_funcs in content:
    content = content.replace(target_funcs, replacement_funcs)
    print("Re-applied handler functions.")

# 3. Exits Tab list replacement
target_exits_list = """            <div className="grid grid-cols-1 gap-6">
              {exits.length === 0 ? (
                <div className="premium-card rounded-xl p-16 text-center text-zinc-550 font-mono shadow-xl">
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  目前無歷史已結算部位檢討記錄。
                </div>
              ) : (
                exits.map((item, idx) => {
                  return (
                    <div key={item._id || idx} className="premium-card rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-5 relative overflow-hidden group">
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.pnl_pct >= 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                      
                      {/* Left: Metadata */}
                      <div className="md:w-72 shrink-0 flex flex-col gap-1.5 border-r border-zinc-850/60 pr-5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-mono font-bold text-white">{item.stock_id}</span>
                          <span className="text-xs font-bold text-zinc-400">{item.stock_name}</span>
                        </div>

                        <div className="text-[10px] text-zinc-550 font-mono mt-1 space-y-1">
                          <div>進場日期: {item.buy_date}</div>
                          <div>清倉日期: {item.exit_date}</div>
                          <div>交易股數: {item.shares} 股</div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-1 text-center font-mono">
                          <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 text-[10px]">
                            <div className="text-zinc-500">進場價</div>
                            <div className="text-zinc-300 font-bold mt-0.5">{item.buy_price.toFixed(1)}</div>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 text-[10px]">
                            <div className="text-zinc-500">清倉價</div>
                            <div className="text-zinc-300 font-bold mt-0.5">{item.exit_price.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Profit card */}
                      <div className="md:w-56 shrink-0 flex flex-col justify-center items-center font-mono border-r border-zinc-850/60 pr-5">
                        <div className={`text-2xl font-black ${item.pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {item.pnl_pct >= 0 ? `+${item.pnl_pct.toFixed(2)}` : item.pnl_pct.toFixed(2)}%
                        </div>
                        <div className={`text-sm font-bold mt-1 ${item.pnl_value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {item.pnl_value >= 0 ? `+${Math.round(item.pnl_value).toLocaleString()}` : Math.round(item.pnl_value).toLocaleString()} 元
                        </div>
                        <div className="mt-3">
                          {renderActionBadge("原因: " + item.exit_reason)}
                        </div>
                      </div>

                      {/* Right: Gemini AI Retrospect Post-mortem */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-[11px] text-zinc-500 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          避險基金大師實戰檢討與改正方向:
                        </h4>
                        <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-lg text-zinc-300 text-xs leading-relaxed italic font-sans">
                          {item.review_summary}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>"""

replacement_exits_list = """            {/* 對沖操作工具列 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 shadow-inner">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#E5A823] shrink-0" />
                <h3 className="text-white text-sm md:text-base font-bold">歷史出場操盤檢討日誌</h3>
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full shrink-0">
                  共 {exits.length} 筆
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {isExitSelectMode ? (
                  <>
                    <button
                      onClick={() => {
                        const allIds = exits.map(e => e._id || e.stock_id);
                        if (selectedExitIds.length === exits.length) {
                          setSelectedExitIds([]);
                        } else {
                          setSelectedExitIds(allIds);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
                    >
                      {selectedExitIds.length === exits.length ? "取消全選" : "全選所有"}
                    </button>
                    
                    <button
                      onClick={handleBatchDeleteExits}
                      disabled={selectedExitIds.length === 0}
                      className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:text-rose-300 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      確認刪除 ({selectedExitIds.length})
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsExitSelectMode(false);
                        setSelectedExitIds([]);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 transition cursor-pointer"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsExitSelectMode(true)}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto sm:ml-0"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#E5A823] shrink-0" />
                    多選刪除紀錄
                  </button>
                )}
              </div>
            </div>

            {/* 出場歷史清單 */}
            <div className="grid grid-cols-1 gap-6">
              {exits.length === 0 ? (
                <div className="premium-card rounded-xl p-16 text-center text-zinc-550 font-mono shadow-xl">
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-2 shrink-0" />
                  目前無歷史已結算部位檢討記錄。
                </div>
              ) : (() => {
                const exitsPerPage = 5;
                const totalExitsPages = Math.ceil(exits.length / exitsPerPage) || 1;
                const activeExitsPage = Math.min(exitsPage, totalExitsPages);
                const paginatedExits = exits.slice(
                  (activeExitsPage - 1) * exitsPerPage,
                  activeExitsPage * exitsPerPage
                );

                return (
                  <>
                    <div className="space-y-4">
                      {paginatedExits.map((item, idx) => {
                        const isSelected = selectedExitIds.includes(item._id || item.stock_id);
                        return (
                          <div 
                            key={item._id || idx} 
                            onClick={() => {
                              if (isExitSelectMode) {
                                const currentId = item._id || item.stock_id;
                                if (isSelected) {
                                  setSelectedExitIds(prev => prev.filter(id => id !== currentId));
                                } else {
                                  setSelectedExitIds(prev => [...prev, currentId]);
                                }
                              }
                            }}
                            className={`premium-card rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-5 relative overflow-hidden group transition-all duration-300 ${
                              isExitSelectMode ? "cursor-pointer select-none" : ""
                            } ${isSelected ? "border-2 border-rose-500/50 bg-rose-950/5" : "border border-zinc-850/45 hover:border-zinc-800"}`}
                          >
                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.pnl_pct >= 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                            
                            {/* Checkbox 欄位 */}
                            {isExitSelectMode && (
                              <div className="flex items-center justify-center pr-1 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // 由卡片 onClick 統一接管
                                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500 focus:ring-opacity-25 transition duration-150 cursor-pointer pointer-events-none"
                                />
                              </div>
                            )}

                            {/* 左側：中繼數據 */}
                            <div className="md:w-64 shrink-0 flex flex-col gap-1.5 border-r border-zinc-850/60 pr-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-mono font-bold text-white">{item.stock_id}</span>
                                  <span className="text-xs font-bold text-zinc-400">{item.stock_name}</span>
                                </div>
                                
                                {/* 非多選模式下顯示編輯按鈕 */}
                                {!isExitSelectMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingExit(item);
                                      setEditExitReason(item.exit_reason);
                                      setEditExitReview(item.review_summary);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#1a1c23] text-zinc-400 hover:text-white transition duration-200 cursor-pointer flex items-center justify-center shrink-0 border border-zinc-800 shadow-sm"
                                    title="編輯此交易紀錄"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>

                              <div className="text-[10px] md:text-xs text-zinc-550 font-mono mt-1 space-y-1">
                                <div>進場日期: {item.buy_date}</div>
                                <div>清倉日期: {item.exit_date}</div>
                                <div>交易股數: {item.shares} 股</div>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-1.5 text-center font-mono">
                                <div className="bg-zinc-950/80 p-2 rounded border border-zinc-900/60 text-[10px] md:text-xs">
                                  <div className="text-zinc-550">進場價</div>
                                  <div className="text-zinc-300 font-bold mt-0.5">{item.buy_price.toFixed(1)}</div>
                                </div>
                                <div className="bg-zinc-950/80 p-2 rounded border border-zinc-900/60 text-[10px] md:text-xs">
                                  <div className="text-zinc-550">清倉價</div>
                                  <div className="text-zinc-300 font-bold mt-0.5">{item.exit_price.toFixed(1)}</div>
                                </div>
                              </div>
                            </div>

                            {/* 中間：盈虧數據與原因 */}
                            <div className="md:w-52 shrink-0 flex flex-col justify-center items-center font-mono border-r border-zinc-850/60 pr-5">
                              <div className={`text-2xl font-black ${item.pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                {item.pnl_pct >= 0 ? `+${item.pnl_pct.toFixed(2)}` : item.pnl_pct.toFixed(2)}%
                              </div>
                              <div className={`text-sm font-bold mt-1 ${item.pnl_value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                {item.pnl_value >= 0 ? `+${Math.round(item.pnl_value).toLocaleString()}` : Math.round(item.pnl_value).toLocaleString()} 元
                              </div>
                              <div className="mt-3.5 text-center">
                                {renderActionBadge("原因: " + item.exit_reason)}
                              </div>
                            </div>

                            {/* 右側：Gemini AI / 避險基金大師實戰檢討 */}
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className="text-[10px] md:text-xs text-zinc-500 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                避險基金大師實戰檢討與改正方向:
                              </h4>
                              <div className="bg-indigo-950/15 border border-indigo-900/30 p-4 rounded-lg text-zinc-300 text-xs md:text-sm leading-relaxed italic font-sans shadow-sm">
                                {item.review_summary}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 美化的分頁按鈕框架 */}
                    {totalExitsPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900/80 pt-6 mt-4 gap-4">
                        <div className="text-xs md:text-sm text-zinc-555 font-mono">
                          顯示第 <span className="text-zinc-300 font-bold">{(activeExitsPage - 1) * exitsPerPage + 1}</span> 至 <span className="text-zinc-300 font-bold">{Math.min(activeExitsPage * exitsPerPage, exits.length)}</span> 筆，共 <span className="text-[#FFB74D] font-bold">{exits.length}</span> 筆紀錄
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExitsPage(prev => Math.max(prev - 1, 1))}
                            disabled={activeExitsPage === 1}
                            className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-zinc-955 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-md"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180 shrink-0" />
                          </button>

                          {Array.from({ length: totalExitsPages }, (_, idx) => {
                            const pageNum = idx + 1;
                            const isActive = pageNum === activeExitsPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setExitsPage(pageNum)}
                                className={`w-8.5 h-8.5 rounded-lg font-mono text-xs md:text-sm font-bold transition-all cursor-pointer shadow-md ${
                                  isActive
                                    ? "bg-[#E5A823] text-black shadow-lg shadow-[#E5A823]/10 font-black border border-[#E5A823]"
                                    : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setExitsPage(prev => Math.min(prev + 1, totalExitsPages))}
                            disabled={activeExitsPage === totalExitsPages}
                            className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-zinc-955 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-md"
                          >
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* 編輯已出場紀錄 Modal */}
            {editingExit && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[#0e1117] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
                  <div className="flex justify-between items-center bg-zinc-950 px-6 py-4 border-b border-zinc-900">
                    <h3 className="text-white text-base font-bold flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-[#E5A823] shrink-0" />
                      編輯歷史清倉檢討日誌
                    </h3>
                    <button
                      onClick={() => setEditingExit(null)}
                      className="text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5 shrink-0" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 bg-zinc-950/60 p-3 rounded-lg border border-zinc-900">
                      <div>
                        <span className="text-[10px] text-zinc-550 block font-mono">標的代號</span>
                        <span className="text-sm font-bold text-white font-mono">{editingExit.stock_id}</span>
                      </div>
                      <div className="border-l border-zinc-850 h-8"></div>
                      <div>
                        <span className="text-[10px] text-zinc-550 block">標的名稱</span>
                        <span className="text-sm font-bold text-zinc-300">{editingExit.stock_name}</span>
                      </div>
                      <div className="border-l border-zinc-850 h-8"></div>
                      <div>
                        <span className="text-[10px] text-zinc-550 block font-mono">盈虧結果</span>
                        <span className={`text-sm font-bold font-mono ${editingExit.pnl_value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {editingExit.pnl_value >= 0 ? "+" : ""}{Math.round(editingExit.pnl_value).toLocaleString()} 元 ({editingExit.pnl_pct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5 font-mono">出場原因</label>
                      <input
                        type="text"
                        value={editExitReason}
                        onChange={(e) => setEditExitReason(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#E5A823] transition-all font-sans"
                        placeholder="例如：移動停利、物理隔離 (E-Stop)、手動減碼..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5 font-mono">避險基金大師實戰檢討與改正方向</label>
                      <textarea
                        value={editExitReview}
                        onChange={(e) => setEditExitReview(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-[#E5A823] transition-all font-sans h-32 resize-none"
                        placeholder="請輸入該筆交易的操盤心得、改進空間或主力籌碼檢討..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 px-6 py-4 bg-zinc-950 border-t border-zinc-900">
                    <button
                      onClick={() => setEditingExit(null)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 transition cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleEditExitSave}
                      disabled={isSubmittingEditExit}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-black bg-[#E5A823] hover:bg-[#ffbe33] transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      {isSubmittingEditExit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                          更新中...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          儲存修改
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}"""

if target_exits_list in content:
    content = content.replace(target_exits_list, replacement_exits_list)
    print("Successfully replaced exits list block.")

# 4. Veteran Trader Card replacement
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
                                type="button"
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
                                    type="button"
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
                      </div>
                    );
                  })()}
                </div>"""
        
        content = content[:outer_div_pos] + replacement + content[grid_end_pos + 6:]
        print("Successfully replaced Veteran Trader formula block dynamically.")
    else:
        print("Error: Could not locate container positions.")
else:
    print("Error: Indicator strings not found in file.")

with io.open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Consolidated patch complete.")
