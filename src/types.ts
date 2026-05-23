/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StockSignalOption = '多' | '空' | '持倉' | '隔離';

export interface ScoreConditions {
  [key: string]: boolean;
}

export interface DynamicPricingTiers {
  limitUp: number;              // 漲停進場價 (+10%)
  limitDown: number;            // 跌停進場價 (-10%)
  chaseUp2: number;             // 追價進場價 (+2%)
  ambushDown2: number;          // 伏擊進場價 (-2%)
  vwap5d: number;               // 5日大戶成本成本價 (VWAP)
}

export interface StockSignal {
  _id?: string;
  timestamp: string;
  stock_id: string;
  stock_name: string;
  close_price: number;
  signal: StockSignalOption;
  macd_status: string;
  ma20_status: string;
  volume_multiplier: number;
  atr_stop: number;
  change_pct: number;
  master_notes: string;
  category: string;
  industry: string;
  
  // V2026.Max Scoring Engine
  score: number;
  scoreBreakdown: ScoreConditions;
  
  // Fundamental & Chip Details
  marginChange: number;         // 融資變化 (張)
  marginShortRatio: number;     // 融券比率 (%)
  foreignDays: number;          // 外資連買天數
  instDays: number;             // 投信連買天數
  foreignRatio: number;         // 外資持股比 (%)
  instRatio: number;            // 投信持股比 (%)
  per: number;                  // 本益比
  pbr: number;                  // 股淨比
  debtRatio: number;            // 負債比 (%)

  // Multi-period performance (%)
  perf1w: number;
  perf1m: number;
  perf3m: number;
  perf6m: number;
  perf1y: number;
  
  // 5-Tier dynamic pricing
  dynamicTiers: DynamicPricingTiers;

  // Quantitative Risk Tiers
  suggested_entry_price: string;      // 建議進場價描述
  stop_loss_price: number;            // 物理隔離停損價 (E-Stop)
  take_profit_half_price: number;     // 強制鎖利減碼價 (20%)
  trailing_stop_price: number;        // 移動停利價 (Trailing Stop)
  action_signal: string;              // 具體行動指令 (觀望 / 買進 / 減碼 / 停損)
  liquidity_warning: boolean;         // 流動性警告
}

export interface HoldingItem {
  _id?: string;
  stock_id: string;
  stock_name: string;
  buy_price: number;
  buy_date: string;
  buy_time: string;
  shares: number;
  current_price: number;
  current_pnl_pct: number;
  current_pnl_value: number;
  max_price_reached: number;
  take_profit_triggered: boolean;     // 是否已觸發減碼 50% 鎖利
  stop_loss_price: number;            // 動態停損價
  trailing_stop_price: number;        // 移動停利價
  suggested_action: string;           // 建議操作 (續抱 / 減碼鎖利 / 清倉 / 停損)
}

export interface ExitLogItem {
  _id?: string;
  stock_id: string;
  stock_name: string;
  buy_price: number;
  buy_date: string;
  shares: number;
  exit_price: number;
  exit_date: string;
  pnl_pct: number;
  pnl_value: number;
  exit_reason: string;                // 出場原因 (E-Stop / 移動停利 / 手動 / 大盤壓制)
  review_summary: string;             // 大師實戰檢討與改正方向
}

export interface ScanResult {
  scanTime: string;
  tsmcMa20Status: string;
  tsmcPrice: number;
  tsmcMa20Value: number;
  vixValue: number;
  macroEStopActive: boolean;
  signals: StockSignal[];
}
