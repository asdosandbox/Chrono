import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/src/hooks/useTheme';

export const MoonBar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const getMoonData = () => {
    const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);
    const SYNODIC = 29.53058867 * 86400 * 1000;
    const elapsed = Date.now() - REF_NEW_MOON;
    const phase = ((elapsed % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
    const age = phase * 29.53;
    const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

    const phases = [
      { min: 0, max: 0.033, name: 'Luna Nueva', emoji: '🌑' },
      { min: 0.033, max: 0.233, name: 'Creciente Cóncava', emoji: '🌒' },
      { min: 0.233, max: 0.283, name: 'Cuarto Creciente', emoji: '🌓' },
      { min: 0.283, max: 0.483, name: 'Creciente Gibosa', emoji: '🌔' },
      { min: 0.483, max: 0.533, name: 'Luna Llena', emoji: '🌕' },
      { min: 0.533, max: 0.733, name: 'Menguante Gibosa', emoji: '🌖' },
      { min: 0.733, max: 0.783, name: 'Cuarto Menguante', emoji: '🌗' },
      { min: 0.783, max: 0.967, name: 'Menguante Cóncava', emoji: '🌘' },
      { min: 0.967, max: 1, name: 'Luna Nueva', emoji: '🌑' },
    ];
    const info = phases.find(p => phase >= p.min && phase < p.max) || phases[0];
    const daysToFull = phase < 0.5 ? (0.5 - phase) * 29.53 : (1.5 - phase) * 29.53;
    const daysToNew = (1 - phase) * 29.53;

    return { phase, age, illum, ...info, daysToFull, daysToNew };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { phase } = getMoonData();
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = W / 2 - 2;
    const isDark = theme === 'dark';

    ctx.clearRect(0, 0, W, H);

    // Dark side
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#1a2035' : '#bcc8dc';
    ctx.fill();

    const waxing = phase < 0.5;
    const f = waxing ? phase * 2 : (phase - 0.5) * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(waxing ? cx : 0, 0, cx, H);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#dce8ff' : '#fff9e0';
    ctx.fill();
    ctx.restore();

    const ex = r * Math.abs(1 - 2 * f);
    ctx.save();
    ctx.beginPath();
    ctx.rect(waxing ? 0 : cx, 0, cx, H);
    ctx.clip();
    ctx.beginPath();
    if (f < 0.5) {
      ctx.ellipse(cx, cy, ex, r, 0, -Math.PI / 2, Math.PI / 2);
      ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2);
    } else {
      ctx.ellipse(cx, cy, ex, r, 0, Math.PI / 2, -Math.PI / 2);
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
    }
    ctx.fillStyle = isDark
      ? (f >= 0.5 ? '#dce8ff' : '#1a2035')
      : (f >= 0.5 ? '#fff9e0' : '#bcc8dc');
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(150,170,220,.3)' : 'rgba(100,120,160,.25)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }, [theme]);

  const data = getMoonData();

  return (
    <div className="flex items-center gap-4 px-5 py-2 bg-[var(--panel)] border-b border-[var(--border)] h-[42px] shrink-0">
      <div className="flex items-center gap-2.5 shrink-0">
        <canvas ref={canvasRef} width="34" height="34" className="rounded-full" />
        <div className="flex flex-col gap-px">
          <div className="font-mono text-[0.58rem] font-semibold tracking-wider uppercase text-[var(--ink2)]">
            {data.emoji} {data.name}
          </div>
          <div className="font-mono text-[0.46rem] tracking-wider text-[var(--ink3)] uppercase">
            Día {data.age.toFixed(1)} · {Math.round(data.illum * 100)}% iluminación
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="h-[3px] bg-[var(--bg3)] rounded-full relative border border-[var(--border)]">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-[var(--gold)] border-[1.5px] border-[var(--panel)] transition-all duration-500"
            style={{ left: `${data.phase * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[0.62rem] leading-none">
          <span>🌑</span><span>🌓</span><span>🌕</span><span>🌗</span><span>🌑</span>
        </div>
      </div>
      <div className="font-mono text-[0.47rem] tracking-tight text-[var(--ink3)] shrink-0 text-right whitespace-nowrap leading-relaxed">
        Llena en <b className="text-[var(--ink2)] font-semibold">{data.daysToFull.toFixed(0)}d</b><br />
        Nueva en <b className="text-[var(--ink2)] font-semibold">{data.daysToNew.toFixed(0)}d</b>
      </div>
    </div>
  );
};
