export interface ClockConfig {
  id: string;
  city: string;
  tz: string;
  lat?: number;
  lng?: number;
  country?: string;
  lastTemp?: number;
}

export interface MarketIndicator {
  id: string;
  name: string;
  type: 'ticker' | 'url';
  ticker?: string;
  url?: string;
  valuePath?: string;
  changePath?: string;
  prefix?: string;
  suffix?: string;
  note?: string;
  interval: string;
  refreshSec: number;
  currentPrice?: number;
  currentChange?: number;
  lastUpdated?: number;
}

export interface ChartPoint {
  time: number;
  price: number;
}
