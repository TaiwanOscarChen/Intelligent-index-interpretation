import React, { useState, useEffect } from 'react';
import { X, Send, Cpu, CheckCircle } from 'lucide-react';
import { StockSignal } from '../types';

interface Props {
  signal: StockSignal | null;
  onClose: () => void;
  onSave: (stock_id: string, notes: string) => Promise<boolean>;
}

export const MasterNoteModal: React.FC<Props> = ({ signal, onClose, onSave }) => {
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (signal) {
      setNoteText(signal.master_notes);
      setSaveSuccess(false);
    }
  }, [signal]);

  if (!signal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onSave(signal.stock_id, noteText);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200); // 延遲關閉，展示成功打勾動畫
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content fade-in" style={{ border: '1px solid var(--color-gold)' }}>
        
        {/* 關閉按鈕 */}
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)',
            cursor: 'pointer' 
          }}
        >
          <X size={20} />
        </button>

        {/* 標題與 AI 微動態 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Cpu size={24} style={{ color: 'var(--color-gold)', animation: 'pulseGlow 2s infinite' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            編修【{signal.stock_id} {signal.stock_name}】大師評註
          </h2>
        </div>

        {/* 即時資訊 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          backgroundColor: 'rgba(10, 13, 20, 0.6)',
          border: '1px solid rgba(42, 49, 66, 0.4)',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>最新現價</span>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)', marginTop: '4px' }}>
              {signal.close_price.toFixed(1)} 元
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>今日漲跌</span>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '1rem', 
              color: signal.change_pct >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
              marginTop: '4px'
            }}>
              {signal.change_pct >= 0 ? '+' : ''}{signal.change_pct.toFixed(2)}%
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>決策訊號</span>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-gold)', marginTop: '4px' }}>
              {signal.signal === '多' ? '🟢 多頭進攻' : (signal.signal === '空' ? '🔴 空頭避讓' : '⚪ 區間觀望')}
            </div>
          </div>
        </div>

        {/* 表單區域 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}
            >
              ✍️ 大師實戰筆記及量能戰略部署（此欄位將即時 Upsert 至雲端 MongoDB）：
            </label>
            <textarea
              className="cyber-input"
              style={{ minHeight: '140px', resize: 'vertical', lineHeight: '1.5', fontFamily: 'inherit' }}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={isSaving || saveSuccess}
              placeholder="輸入學理、籌碼面、主力洗水、以及主力部署戰略..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="cyber-btn"
              onClick={onClose}
              disabled={isSaving || saveSuccess}
            >
              取消
            </button>
            
            <button 
              type="submit" 
              className="cyber-btn active"
              style={{ 
                borderColor: 'var(--color-gold)', 
                boxShadow: saveSuccess ? '0 0 15px rgba(0, 255, 102, 0.4)' : '0 0 10px rgba(255, 187, 0, 0.2)' 
              }}
              disabled={isSaving || saveSuccess}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={16} style={{ color: 'var(--color-bullish)' }} />
                  成功同步雲端！
                </>
              ) : isSaving ? (
                <>
                  <span className="glow-dot bullish" style={{ width: '12px', height: '12px' }}></span>
                  儲存中...
                </>
              ) : (
                <>
                  <Send size={16} />
                  儲存並發佈 (MongoDB)
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
