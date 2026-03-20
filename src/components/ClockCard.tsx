import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { AnalogClock } from './AnalogClock';
import { ClockConfig } from '../types';
import { X } from 'lucide-react';

interface ClockCardProps {
  config: ClockConfig;
  now: Date;
  onRemove: (id: string) => void;
}

export const ClockCard: React.FC<ClockCardProps> = ({ config, now, onRemove }) => {

  const timeStr = formatInTimeZone(now, config.tz, 'HH:mm:ss');
  const dateStr = formatInTimeZone(now, config.tz, 'EEE, d MMM');
  
  // Calculate UTC offset
  const tzOffset = formatInTimeZone(now, config.tz, 'xxx');
  const utcLabel = `UTC${tzOffset.replace(':00', '')}`;

  return (
    <div className="group relative flex flex-col items-center justify-center border-r border-b border-[var(--border)] p-4 gap-0.5 bg-[var(--bg2)] hover:bg-[var(--panel)] transition-colors overflow-hidden">
      <button
        onClick={() => onRemove(config.id)}
        className="absolute top-1 right-1 p-1 text-[var(--ink3)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
      
      <AnalogClock date={now} className="mb-1" />
      
      <div className="font-mono text-[0.95rem] font-medium tracking-wider text-[var(--ink)] leading-none mt-0.5">
        {timeStr}
      </div>
      
      <div className="font-serif text-[1.15rem] text-[var(--ink)] text-center leading-tight mt-0.5">
        {config.city}
      </div>
      
      {config.country && (
        <div className="font-mono text-[0.5rem] tracking-[0.16em] text-[var(--ink3)] uppercase">
          {config.country}
        </div>
      )}
      
      <div className="font-mono text-[0.5rem] tracking-[0.14em] text-[var(--ink3)] uppercase">
        {utcLabel}
      </div>
      
      <div className="font-serif italic text-[0.74rem] text-[var(--ink3)]">
        {dateStr}
      </div>
      
      <div className="flex items-center gap-1 flex-wrap justify-center mt-1">
        {config.lastTemp !== undefined && (
          <span className="inline-flex items-center gap-1 font-mono text-[0.58rem] tracking-tight text-[var(--ink2)] px-1.5 py-0.5 bg-[var(--bg3)] rounded-sm border border-[var(--border)]">
            🌡 {config.lastTemp.toFixed(1)}°C
          </span>
        )}
      </div>
    </div>
  );
};
