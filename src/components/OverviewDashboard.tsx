import React from 'react';
import { Shield, Radio, Flame, Clock } from 'lucide-react';
import { DashboardData } from '../types';

interface Props {
  data: DashboardData;
}

export const OverviewDashboard: React.FC<Props> = ({ data }) => {
  const isMarketBullish = data.tsmc_status.includes("綠燈");
  
  const longSignals = data.signals.filter(s => s.signal === '多').length;
  const shortSignals = data.signals.filter(s => s.signal === '空').length;
  const totalStocks = data.signals.length;

  return (
    <div className="fade-in">
      {/* ⚠️ 大盤空頭物理隔離警告橫幅 */}
      {!isMarketBullish && (
        <div className="danger-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px', color: '#ff3366' }}>
            <Shield size={24} />
            【大盤強行物理隔離警報】2330 台積電現價低於 20MA 生命線！
          </div>
          <p style={{ color: '#d1d4dc', fontSize: '0.95rem' }}>
            系統已觸發強制物理隔離保護！全面停買，嚴格規避融資多頭殺跌風險，部位資金轉向極度防守。
          </p>
        </div>
      )}

      {/* 🟢 四格宏觀儀表板 */}
      <div className="macro-grid">
        {/* TSMC 裁判價 */}
        <div className="cyber-panel macro-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="macro-card-title">2330 台積電裁判收盤價</span>
            <Shield size={16} style={{ color: isMarketBullish ? 'var(--color-bullish)' : 'var(--color-bearish)' }} />
          </div>
          <div style={{ margin: '4px 0' }}>
            <span className="macro-card-value" style={{ 
              color: isMarketBullish ? 'var(--color-bullish)' : 'var(--color-bearish)',
              textShadow: isMarketBullish ? '0 0 12px rgba(0, 255, 102, 0.25)' : '0 0 12px rgba(255, 51, 102, 0.25)'
            }}>
              {data.tsmc_price}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '4px' }}>元</span>
          </div>
          <span className="macro-card-desc">
            生命水位 20MA 日線：{data.tsmc_ma20} 元
          </span>
        </div>

        {/* 紅綠燈狀態 */}
        <div className="cyber-panel macro-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="macro-card-title">大盤生命線紅綠燈</span>
            <span className={`glow-dot ${isMarketBullish ? 'bullish' : 'bearish'}`}></span>
          </div>
          <div style={{ margin: '4px 0', fontWeight: 800, color: isMarketBullish ? 'var(--color-bullish)' : 'var(--color-bearish)' }} className="macro-card-value-text">
            {data.tsmc_status}
          </div>
          <span className="macro-card-desc">
            判定機制：收盤價 &gt; 20MA 即翻綠開倉
          </span>
        </div>

        {/* 獵殺名單數 */}
        <div className="cyber-panel macro-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="macro-card-title">精英獵殺突破標的</span>
            <Flame size={16} style={{ color: 'var(--color-bullish)' }} />
          </div>
          <div style={{ margin: '4px 0' }}>
            <span className="macro-card-value" style={{ 
              color: 'var(--color-bullish)',
              textShadow: '0 0 12px rgba(0, 255, 102, 0.2)'
            }}>
              {longSignals}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '4px' }}>/ {totalStocks} 檔</span>
          </div>
          <span className="macro-card-desc">
            符合 V106 多頭多維度共振突破
          </span>
        </div>

        {/* 同步時間 */}
        <div className="cyber-panel macro-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="macro-card-title">資料同步與洗價時間</span>
            <Clock size={16} style={{ color: 'var(--color-gold)' }} />
          </div>
          <div style={{ margin: '4px 0', fontWeight: 700, color: 'var(--color-gold)', fontFamily: "'JetBrains Mono', monospace" }} className="macro-card-value-text">
            {data.scan_time.includes(' ') ? data.scan_time.split(' ')[1] : data.scan_time}
          </div>
          <span className="macro-card-desc">
            同步協議：雲端 Atlas 自動 Upsert
          </span>
        </div>
      </div>
    </div>
  );
};
