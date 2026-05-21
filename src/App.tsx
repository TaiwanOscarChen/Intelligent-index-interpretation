import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Cpu, Database, UserCheck, Flame, Laptop, Compass } from 'lucide-react';
import { DashboardData, StockSignal } from './types';
import { OverviewDashboard } from './components/OverviewDashboard';
import { StockMatrixTable } from './components/StockMatrixTable';
import { MasterNoteModal } from './components/MasterNoteModal';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<StockSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得台北當前時間的字串
  const getTaipeiTime = () => {
    return new Date().toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" });
  };

  const [currentTime, setCurrentTime] = useState(getTaipeiTime());

  // 動態更新台北時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTaipeiTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSignals = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const res = await fetch('/api/signals');
      if (!res.ok) throw new Error('讀取伺服器訊號失敗');
      const json: DashboardData = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('❌ 連線至股票決策伺服器失敗，請確認後端運行狀態。');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    // 每 15 秒自動輪詢一次，實現高頻率 AI 動態刷新感
    const interval = setInterval(() => {
      fetchSignals();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveNotes = async (stock_id: string, notes: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/signals/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id, master_notes: notes })
      });
      if (!res.ok) throw new Error('同步備註至伺服器失敗');
      
      // 動態更新本地狀態，防止重新載入造成介面閃爍
      if (data) {
        const updatedSignals = data.signals.map(s => {
          if (s.stock_id === stock_id) {
            return { ...s, master_notes: notes };
          }
          return s;
        });
        setData({ ...data, signals: updatedSignals });
      }
      return true;
    } catch (err) {
      console.error(err);
      alert('⚠️ 同步失敗！請檢查網絡與 MongoDB 連線狀態。');
      return false;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 🚀 科技感標頭 (Cyber Header) */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(42, 49, 66, 0.4)'
      }} className="fade-in">
        
        {/* 左側標題 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #00ff66 0%, #00bbff 100%)', 
              padding: '8px', 
              borderRadius: '8px',
              boxShadow: '0 0 15px rgba(0, 255, 102, 0.3)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Flame size={24} style={{ color: '#0d0f14' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '1px', background: 'linear-gradient(to right, #ffffff, #8a96a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                智能判斷指數
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                🕵️ 華爾街自營部對沖量化決策看板 | yFinance 即時洗價、MongoDB 雙向持久化、台北標準時間盤中濾網
              </span>
            </div>
          </div>
        </div>

        {/* 右側高科技戰情狀態 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* 台北時間 */}
          <div className="cyber-panel" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255, 187, 0, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="glow-dot" style={{ backgroundColor: 'var(--color-gold)', animation: 'pulseGlow 2s infinite' }}></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TAIPEI：</span>
            <span style={{ fontSize: '0.9rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--color-gold)' }}>
              {currentTime}
            </span>
          </div>

          {/* MongoDB 連線指示點 */}
          <div className="cyber-panel" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={14} style={{ color: data ? 'var(--color-bullish)' : 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MONGO-DB：</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: data ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
              {data ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>

          {/* 刷新鈕 */}
          <button 
            className={`cyber-btn ${isRefreshing ? 'active' : ''}`}
            onClick={() => fetchSignals(true)}
            disabled={isLoading || isRefreshing}
            style={{ padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'rotate-animation' : ''} />
            手動洗價
          </button>
        </div>
      </header>

      {/* 🔄 加載骨架屏 (Skeleton Loading) */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="macro-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="cyber-panel" style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span className="skeleton" style={{ width: '40%', height: '14px' }}></span>
                <span className="skeleton" style={{ width: '70%', height: '36px' }}></span>
                <span className="skeleton" style={{ width: '90%', height: '12px' }}></span>
              </div>
            ))}
          </div>
          <div className="cyber-panel" style={{ height: '300px' }}>
            <span className="skeleton" style={{ width: '100%', height: '100%' }}></span>
          </div>
        </div>
      ) : error ? (
        <div className="cyber-panel" style={{ textAlign: 'center', padding: '40px', borderColor: 'var(--color-bearish)' }}>
          <p style={{ color: 'var(--color-bearish)', fontSize: '1.1rem', fontWeight: 'bold' }}>{error}</p>
          <button className="cyber-btn" style={{ marginTop: '16px' }} onClick={() => fetchSignals()}>
            重新嘗試連線
          </button>
        </div>
      ) : data ? (
        <>
          {/* 📈 大盤宏觀儀表 */}
          <OverviewDashboard data={data} />

          {/* 📊 50檔全矩陣雷達表 */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="fade-in">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} style={{ color: 'var(--color-gold)' }} />
                核心宇宙全矩陣雷達監控 (Full Market Matrix)
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                自動洗價週期：15秒
              </span>
            </div>
            <StockMatrixTable 
              signals={data.signals} 
              onEditNotes={(sig) => setSelectedSignal(sig)} 
            />
          </div>
        </>
      ) : null}

      {/* ✍️ 大師評註彈窗 (Modal Overlay Window) */}
      <MasterNoteModal 
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onSave={handleSaveNotes}
      />

      {/* ⚠️ 免責聲明底邊欄 */}
      <footer style={{ marginTop: '40px', padding: '20px', textAlign: 'center', borderTop: '1px solid rgba(42, 49, 66, 0.2)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <p style={{ marginBottom: '6px' }}>
          ⚠️ 警告與聲明：本系統所有量化數據、均線判定、ATR與MACD指標皆為演算法模擬推算，非投資邀約。股市投資具備極高風險，請自主調控部位，嚴格執行防守停損。
        </p>
        <p>© 2026 智能判斷指數 全端量化操盤終端. Powered by React + Vite + MongoDB Atlas.</p>
      </footer>

      {/* CSS 旋轉與打轉動畫 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate 1s linear infinite;
        }
      `}} />

    </div>
  );
};

export default App;
