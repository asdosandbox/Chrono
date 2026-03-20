import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { MarketIndicator, ChartPoint } from '../types';
import { fetchMarketData } from '../services/marketService';
import { cn } from '../lib/utils';
import { Edit2, X, Loader2 } from 'lucide-react';

interface MarketCardProps {
  indicator: MarketIndicator;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  globalInterval?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({ indicator, onEdit, onRemove }) => {
  const [data, setData] = useState<{
    price: number | null;
    change: number;
    chart: ChartPoint[];
    loading: boolean;
    error: string | null;
  }>(() => {
    const cached = localStorage.getItem(`cm_data_${indicator.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { ...parsed, loading: true, error: null };
      } catch (e) {}
    }
    return {
      price: indicator.currentPrice || null,
      change: indicator.currentChange || 0,
      chart: [],
      loading: true,
      error: null
    };
  });

  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const result = await fetchMarketData(indicator);
      const newData = {
        price: result.currentPrice,
        change: result.currentChange,
        chart: result.chartData,
        loading: false,
        error: null
      };
      setData(newData);
      localStorage.setItem(`cm_data_${indicator.id}`, JSON.stringify(newData));
      setLastUpdated(Date.now());
    } catch (err: any) {
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, indicator.refreshSec * 1000);
    return () => clearInterval(timer);
  }, [indicator.ticker, indicator.url, indicator.interval, indicator.refreshSec]);

  const trend = data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'neutral';
  
  const formatValue = (v: number | null) => {
    if (v === null) return '—';
    if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (Math.abs(v) >= 10000) return v.toLocaleString('es', { maximumFractionDigits: 2 });
    if (Math.abs(v) >= 100) return v.toFixed(2);
    return v.toFixed(4);
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'var(--up)';
    if (trend === 'down') return 'var(--down)';
    return 'var(--neutral)';
  };

  const timeAgo = Math.round((Date.now() - lastUpdated) / 1000);
  const timeAgoStr = timeAgo < 60 ? `hace ${timeAgo}s` : `hace ${Math.floor(timeAgo / 60)}m`;

  return (
    <div className={cn(
      "group relative bg-[var(--panel)] border-r border-b border-[var(--border)] border-t-2 flex flex-col overflow-hidden transition-colors hover:bg-[var(--bg2)]",
      trend === 'up' ? "border-t-[var(--up)]" : trend === 'down' ? "border-t-[var(--down)]" : "border-t-[var(--ink3)]"
    )}>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => onEdit(indicator.id)} className="p-1 text-[var(--ink3)] hover:text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] rounded-sm">
          <Edit2 size={10} />
        </button>
        <button onClick={() => onRemove(indicator.id)} className="p-1 text-[var(--ink3)] hover:text-red-500 bg-[var(--panel)] border border-[var(--border)] rounded-sm">
          <X size={10} />
        </button>
      </div>

      <div className="p-3 pb-1 flex justify-between items-start icard-head">
        <div>
          <div className="font-mono text-[0.46rem] tracking-[0.18em] text-[var(--ink3)] uppercase mb-0.5 ic-ticker">
            {indicator.ticker || indicator.id}
          </div>
          <div className="font-serif text-[0.95rem] text-[var(--ink)] leading-tight ic-name">
            {indicator.name}
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-0.5 font-mono text-[0.54rem] font-semibold px-1.5 py-0.5 rounded-sm whitespace-nowrap ic-badge",
          trend === 'up' ? "text-[var(--up)] bg-[var(--up-bg)]" : trend === 'down' ? "text-[var(--down)] bg-[var(--down-bg)]" : "text-[var(--neutral)] bg-[var(--bg3)]"
        )}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {Math.abs(data.change).toFixed(2)}%
        </div>
      </div>

      <div className="px-3 py-1 flex items-baseline gap-1 ic-val-container">
        {indicator.prefix && <span className="font-mono text-[0.6rem] text-[var(--ink3)] ic-prefix">{indicator.prefix}</span>}
        <span className="font-mono text-[1.45rem] font-medium text-[var(--ink)] tracking-tight leading-none ic-val">
          {formatValue(data.price)}
        </span>
        {indicator.suffix && <span className="font-mono text-[0.6rem] text-[var(--ink3)] ic-suffix">{indicator.suffix}</span>}
      </div>

      <div className="flex-1 min-h-[40px] relative">
        {data.loading && data.chart.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--panel)]/50 z-10">
            <Loader2 size={16} className="animate-spin text-[var(--ink3)]" />
          </div>
        )}
        {data.error && data.chart.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[0.6rem] italic text-[var(--ink3)] p-2 text-center">
            Sin datos: {data.error}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.chart} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getTrendColor()} stopOpacity={0.2} />
                <stop offset="95%" stopColor={getTrendColor()} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['auto', 'auto']} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={getTrendColor()}
              fillOpacity={1}
              fill={`url(#grad-${indicator.id})`}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="px-3 py-1.5 flex items-center justify-between border-t border-[var(--bg3)] shrink-0 ic-footer">
        <span className="font-serif italic text-[0.65rem] text-[var(--ink3)] truncate max-w-[150px] ic-note">
          {indicator.note || indicator.ticker || 'Market Data'}
        </span>
        <div className="flex items-center gap-1.5">
          {data.loading && <Loader2 size={8} className="animate-spin text-[var(--accent)]" />}
          <span className="font-mono text-[0.48rem] tracking-wider text-[var(--ink3)] uppercase">
            {timeAgoStr}
          </span>
        </div>
      </div>
    </div>
  );
};
