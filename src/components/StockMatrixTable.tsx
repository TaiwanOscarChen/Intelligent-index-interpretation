import React, { useState } from 'react';
import { Search, SlidersHorizontal, Edit3, ArrowUpDown, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
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
          {sortedSignals.map(s => {
            const isUp = s.change_pct >= 0;
            const isBull = s.signal === '多';
            return (
              <div 
                key={s.stock_id} 
                className={`cyber-panel fade-in ${isBull ? 'bullish-hover' : ''}`}
                style={{ 
                  padding: '10px 12px', 
                  borderLeft: isBull ? '4px solid var(--color-bullish)' : (s.signal === '空' ? '4px solid var(--color-bearish)' : '')
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="ticker-badge" style={{ padding: '2px 4px', fontSize: '0.75rem' }}>{s.stock_id}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{s.stock_name}</span>
                  </div>
                  {getSignalBadge(s.signal)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginBottom: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>現價：</span>
                    <span style={{ fontWeight: 600 }}>{s.close_price.toFixed(1)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>漲跌：</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: isUp ? 'var(--color-bullish)' : 'var(--color-bearish)'
                    }}>
                      {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>爆量：</span>
                    <span style={{ fontWeight: 500 }}>{s.volume_multiplier.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>停損：</span>
                    <span style={{ color: 'var(--color-bearish)', fontWeight: 500 }}>{s.atr_stop.toFixed(1)}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>2W配比：</span>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{s.suggested_shares} 股</span>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'rgba(10, 13, 20, 0.5)', 
                  border: '1px solid rgba(42, 49, 66, 0.3)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  lineHeight: '1.3'
                }}>
                  <strong>戰術：</strong>{s.action_advice}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '60%' }} title={s.master_notes}>
                    備註：{s.master_notes || '無'}
                  </span>
                  <button 
                    className="cyber-btn"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => onEditNotes(s)}
                  >
                    <Edit3 size={11} /> 筆記
                  </button>
                </div>
              </div>
            );
          })}
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
