import React from 'react';
import { cn } from '../lib/utils';

interface AnalogClockProps {
  date: Date;
  className?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({ date, className }) => {
  const R = 42;
  const cx = 50;
  const cy = 50;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

  const sTot = seconds + ms / 1000;
  const mTot = minutes + sTot / 60;
  const hTot = (hours % 12) + mTot / 60;

  const hrAngle = (hTot / 12) * 360;
  const minAngle = (mTot / 60) * 360;
  const secAngle = (sTot / 60) * 360;
  const tailAngle = (secAngle + 180) % 360;

  const getHandCoords = (deg: number, len: number) => {
    const a = (deg * Math.PI) / 180;
    return {
      x2: cx + len * Math.sin(a),
      y2: cy - len * Math.cos(a),
    };
  };

  const hrCoords = getHandCoords(hrAngle, 20);
  const minCoords = getHandCoords(minAngle, 30);
  const secCoords = getHandCoords(secAngle, 32);
  const tailCoords = getHandCoords(tailAngle, 10);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const maj = i % 5 === 0;
    const r1 = maj ? R - 7 : R - 3.5;
    const x1 = cx + r1 * Math.cos(a);
    const y1 = cy + r1 * Math.sin(a);
    const x2 = cx + (R - 1) * Math.cos(a);
    const y2 = cy + (R - 1) * Math.sin(a);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={cn(
          "stroke-[0.5px] stroke-[var(--border2)]",
          maj && "stroke-[1.2px] stroke-[var(--ink3)]"
        )}
      />
    );
  });

  return (
    <svg viewBox="0 0 100 100" className={cn("w-20 h-20", className)}>
      <circle cx={cx} cy={cy} r={R + 1} className="fill-none stroke-[var(--border)] stroke-[2.5px]" />
      <circle cx={cx} cy={cy} r={R} className="fill-[var(--panel)] stroke-[var(--border2)] stroke-[0.7px]" />
      {ticks}
      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={hrCoords.x2}
        y2={hrCoords.y2}
        className="stroke-[var(--ink)] stroke-[2.8px] stroke-round"
      />
      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={minCoords.x2}
        y2={minCoords.y2}
        className="stroke-[var(--ink2)] stroke-[1.6px] stroke-round"
      />
      {/* Second hand tail */}
      <line
        x1={cx}
        y1={cy}
        x2={tailCoords.x2}
        y2={tailCoords.y2}
        className="stroke-[var(--accent)] stroke-[1px] stroke-round opacity-30"
      />
      {/* Second hand */}
      <line
        x1={cx}
        y1={cy}
        x2={secCoords.x2}
        y2={secCoords.y2}
        className="stroke-[var(--accent)] stroke-[1px] stroke-round"
      />
      <circle cx={cx} cy={cy} r="3.2" className="fill-[var(--ink)]" />
      <circle cx={cx} cy={cy} r="1.4" className="fill-[var(--panel)]" />
    </svg>
  );
};
