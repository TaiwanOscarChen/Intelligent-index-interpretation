import React, { useState } from 'react';
import { Search, SlidersHorizontal, Edit3, ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { StockSignal } from '../types';

interface Props {
  signals: StockSignal[];
  onEditNotes: (signal: StockSignal) => void;
}

type SortKey = 'id' | 'price' | 'change' | 'multiplier';

export const StockMatrixTable: React.FC<Props> = ({ signals, onEditNotes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | '多' | '空' | '持倉' | '隔離'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('change');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedStockId, setExpandedStockId] = useState<string | null>(null);

  // 1. 處理搜尋與過濾
  const filteredSignals = signals.filter(s => {
    const matchesSearch = 
      s.stock_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stock_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.master_notes.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = activeFilter === 'ALL' || s.signal === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // 2. 處理排序
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    let valA: number | string = 0;
    let valB: number | string = 0;

    if (sortKey === 'id') {
      valA = a.stock_id;
      valB = b.stock_id;
    } else if (sortKey === 'price') {
      valA = a.close_price;
      valB = b.close_price;
    } else if (sortKey === 'change') {
      valA = a.change_pct;
      valB = b.change_pct;
    } else if (sortKey === 'multiplier') {
      valA = a.volume_multiplier;
      valB = b.volume_multiplier;
    }

    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const getSignalBadge = (sig: '多' | '空' | '持倉' | '隔離') => {
    switch (sig) {
      case '多':
        return <span className="signal-badge bullish">🟢 多頭突破</span>;
      case '空':
        return <span className="signal-badge bearish">🔴 空頭破位</span>;
      case '隔離':
        return <span className="signal-badge quarantine">⚠️ 隔離避險</span>;
      default:
        return <span className="signal-badge neutral">⚪ 區間持倉</span>;
    }
  };

  return (
    <div className="fade-in">
      {/* 🔍 控制面板：搜尋與快速過濾 */}
      <div className="cyber-panel" style={{ marginBottom: '12px', padding: '10px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* 搜尋框 */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: '1 1 280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="cyber-input" 
              placeholder="搜尋代號、名稱、或操盤評註要點..."
              style={{ paddingLeft: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 快速過濾鈕 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button 
              className={`cyber-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              全部 ({signals.length})
            </button>
            <button 
              className={`cyber-btn ${activeFilter === '多' ? 'active' : ''}`}
              onClick={() => setActiveFilter('多')}
              style={{ borderColor: activeFilter === '多' ? 'var(--color-bullish)' : '' }}
            >
              🟢 多頭 ({signals.filter(s => s.signal === '多').length})
            </button>
            <button 
              className={`cyber-btn ${activeFilter === '空' ? 'active' : ''}`}
              onClick={() => setActiveFilter('空')}
              style={{ borderColor: activeFilter === '空' ? 'var(--color-bearish)' : '' }}
            >
              🔴 空頭 ({signals.filter(s => s.signal === '空').length})
            </button>
            <button 
              className={`cyber-btn ${activeFilter === '持倉' ? 'active' : ''}`}
              onClick={() => setActiveFilter('持倉')}
            >
              ⚪ 持倉 ({signals.filter(s => s.signal === '持倉').length})
            </button>
            <button 
              className={`cyber-btn ${activeFilter === '隔離' ? 'active' : ''}`}
              onClick={() => setActiveFilter('隔離')}
              style={{ borderColor: activeFilter === '隔離' ? 'var(--color-quarantine)' : '' }}
            >
              ⚠️ 隔離 ({signals.filter(s => s.signal === '隔離').length})
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 行動端優先 (RWD) 的精英狂飆卡片視圖（在小螢幕自動排列，寬螢幕下以表格呈現） */}
      <div className="split-grid" style={{ gridTemplateColumns: '1fr', marginTop: '0' }}>
        
        {/* 電腦端 (Desktop) 表格視圖 - 中大型螢幕 */}
        <div className="cyber-panel hide-on-mobile" style={{ padding: '0px', overflow: 'hidden' }}>
          <div className="tech-table-container" style={{ border: 'none', margin: '0' }}>
            <table className="tech-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('id')}>
                    代號 <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th>個股名稱</th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('price')}>
                    收盤現價 <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('change')}>
                    今日漲跌 (%) <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th>交易訊號</th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('multiplier')}>
                    爆量比率 (倍) <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th style={{ textAlign: 'right' }}>動態停損線</th>
                  <th style={{ textAlign: 'right' }}>2W零股配比</th>
                  <th>操盤實戰要旨</th>
                  <th>動作</th>
                </tr>
              </thead>
              <tbody>
                {sortedSignals.map(s => {
                  const isUp = s.change_pct >= 0;
                  return (
                    <tr key={s.stock_id}>
                      <td>
                        <span className="ticker-badge">{s.stock_id}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.stock_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {s.close_price.toFixed(1)}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 'bold', 
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isUp ? 'var(--color-bullish)' : 'var(--color-bearish)'
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                        </div>
                      </td>
                      <td>{getSignalBadge(s.signal)}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontFamily: "'JetBrains Mono', monospace",
                        color: s.volume_multiplier >= 1.5 ? 'var(--color-bullish)' : 'var(--text-primary)'
                      }}>
                        {s.volume_multiplier.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-bearish)', fontWeight: 500 }}>
                        {s.atr_stop.toFixed(1)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-gold)', fontWeight: 600 }}>
                        {s.suggested_shares} 股
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={s.action_advice}>
                        {s.action_advice}
                      </td>
                      <td>
                        <button 
                          className="cyber-btn" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => onEditNotes(s)}
                        >
                          <Edit3 size={12} /> 筆記
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 手機端 (Mobile) 卡片式視圖 - 在小螢幕時表格隱藏，改渲染高可讀性卡片 */}
        <div style={{ display: 'none' }} className="show-on-mobile-flex">
          {/* 這個 class 會在 css 中控制，為了代碼方便我們用 inline style */}
        </div>

        {/* 使用 CSS media query 來控制顯示 */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .hide-on-mobile { display: none !important; }
            .mobile-cards-grid { display: grid !important; }
          }
          .mobile-cards-grid {
            display: none;
            grid-template-columns: 1fr;
            gap: 16px;
          }
        `}} />

        <div className="mobile-cards-grid">
          <div className="mobile-row-accordion">
            {sortedSignals.map(s => {
              const isUp = s.change_pct >= 0;
              const isExpanded = expandedStockId === s.stock_id;
              
              // Get border-left indicator class
              let borderClass = 'border-neutral';
              if (s.signal === '多') borderClass = 'border-bullish';
              else if (s.signal === '空') borderClass = 'border-bearish';
              else if (s.signal === '隔離') borderClass = 'border-quarantine';

              const getSignalBadgeSlim = (sig: '多' | '空' | '持倉' | '隔離') => {
                switch (sig) {
                  case '多':
                    return <span className="signal-badge-slim bullish">🟢 多頭</span>;
                  case '空':
                    return <span className="signal-badge-slim bearish">🔴 空頭</span>;
                  case '隔離':
                    return <span className="signal-badge-slim quarantine">⚠️ 隔離</span>;
                  default:
                    return <span className="signal-badge-slim neutral">⚪ 持倉</span>;
                }
              };

              return (
                <div 
                  key={s.stock_id} 
                  className={`mobile-row-item fade-in ${borderClass} ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Collapsed Header (Always Visible) */}
                  <div 
                    className="mobile-row-header"
                    onClick={() => setExpandedStockId(isExpanded ? null : s.stock_id)}
                  >
                    <div className="mobile-row-left">
                      <span className="mobile-row-ticker">{s.stock_id}</span>
                      <span className="mobile-row-name">{s.stock_name}</span>
                    </div>

                    <div className="mobile-row-mid">
                      <span className="mobile-row-price">{s.close_price.toFixed(1)}</span>
                      <span className="mobile-row-change" style={{ color: isUp ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                        {isUp ? <TrendingUp size={11} style={{ marginRight: '1px' }} /> : <TrendingDown size={11} style={{ marginRight: '1px' }} />}
                        {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mobile-row-right">
                      {getSignalBadgeSlim(s.signal)}
                      {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />}
                    </div>
                  </div>

                  {/* Expanded Content Details */}
                  {isExpanded && (
                    <div className="mobile-row-details">
                      <div className="mobile-details-grid">
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">爆量比率</span>
                          <span className="mobile-detail-value" style={{ color: s.volume_multiplier >= 1.5 ? 'var(--color-bullish)' : 'var(--text-primary)' }}>
                            {s.volume_multiplier.toFixed(2)}x
                          </span>
                        </div>
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">動態停損</span>
                          <span className="mobile-detail-value" style={{ color: 'var(--color-bearish)' }}>
                            {s.atr_stop.toFixed(1)}
                          </span>
                        </div>
                        <div className="mobile-detail-item" style={{ gridColumn: 'span 2' }}>
                          <span className="mobile-detail-label">2W 零股配比</span>
                          <span className="mobile-detail-value" style={{ color: 'var(--color-gold)' }}>
                            {s.suggested_shares} 股
                          </span>
                        </div>
                      </div>

                      <div className="mobile-tactics-box">
                        <strong>戰術要旨：</strong>{s.action_advice}
                      </div>

                      <div className="mobile-notes-row">
                        <span className="mobile-notes-text" title={s.master_notes}>
                          <strong>備註：</strong>{s.master_notes || '無評註'}
                        </span>
                        <button 
                          className="cyber-btn"
                          style={{ padding: '3px 6px', fontSize: '0.7rem', borderRadius: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNotes(s);
                          }}
                        >
                          <Edit3 size={10} /> 筆記
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {sortedSignals.length === 0 && (
          <div className="cyber-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            沒有符合目前篩選條件的精選標的。
          </div>
        )}

      </div>
    </div>
  );
};
