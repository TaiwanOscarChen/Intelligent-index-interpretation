export interface StockSignal {
  timestamp: string;
  date: string;
  stock_id: string;
  stock_name: string;
  close_price: number;
  volume: number;
  ma20: number;
  macd_status: string;
  signal: '多' | '空' | '持倉' | '隔離';
  volume_multiplier: number;
  atr_stop: number;
  suggested_shares: number;
  change_pct: number;
  ma20_status: string;
  master_notes: string;
  action_advice: string;
  entry_price: number;
  take_profit: number;
}

export interface DashboardData {
  scan_time: string;
  date: string;
  tsmc_price: number;
  tsmc_ma20: number;
  tsmc_status: string;
  signals: StockSignal[];
}
