import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { useTheme as useThemeHook } from './hooks/useTheme';
import { MoonBar } from './components/MoonBar';
import { ClockCard } from './components/ClockCard';
import { MarketCard } from './components/MarketCard';
import { ClockConfig, MarketIndicator } from './types';
import { Plus, Sun, Moon, Clock, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchCities, searchTickers } from './services/marketService';
import { cn } from './lib/utils';

function useContainerSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

const QUOTES = [
  { t: 'La disciplina es el puente entre las metas y los logros.', a: 'Jim Rohn' },
  { t: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', a: 'R. Collier' },
  { t: 'No cuentes los días; haz que los días cuenten.', a: 'Muhammad Ali' },
  { t: 'La paciencia no es la capacidad de esperar, sino cómo te comportas mientras esperas.', a: 'Joyce Meyer' },
  { t: 'Primero, resuelve el problema. Luego, escribe el código.', a: 'John Johnson' },
  { t: 'El único modo de hacer un gran trabajo es amar lo que haces.', a: 'Steve Jobs' },
  { t: 'En medio de la dificultad reside la oportunidad.', a: 'Albert Einstein' },
  { t: 'Lo que no se mide, no se puede mejorar.', a: 'Peter Drucker' },
  { t: 'La simplicidad es la sofisticación máxima.', a: 'Leonardo da Vinci' },
  { t: 'El mercado es una máquina de transferir dinero del impaciente al paciente.', a: 'Warren Buffett' },
];

export default function App() {
  const { theme, toggleTheme } = useThemeHook();
  const [clocks, setClocks] = useState<ClockConfig[]>(() => JSON.parse(localStorage.getItem('cm_clocks') || '[]'));
  const [indicators, setIndicators] = useState<MarketIndicator[]>(() => JSON.parse(localStorage.getItem('cm_indicators') || '[]'));
  const [globalInterval, setGlobalInterval] = useState(() => localStorage.getItem('cm_global_interval') || '5m');
  const [now, setNow] = useState(new Date());
  const [quote, setQuote] = useState(QUOTES[0]);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isIndModalOpen, setIsIndModalOpen] = useState(false);
  const [editingIndId, setEditingIndId] = useState<string | null>(null);

  const clockContainerRef = useRef<HTMLDivElement>(null);
  const indContainerRef = useRef<HTMLDivElement>(null);
  const clockSize = useContainerSize(clockContainerRef);
  const indSize = useContainerSize(indContainerRef);

  // Modal states
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [tickerQuery, setTickerQuery] = useState('');
  const [tickerResults, setTickerResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSearch = () => {
    setCityQuery('');
    setCityResults([]);
    setTickerQuery('');
    setTickerResults([]);
    setIsSearching(false);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  };

  useEffect(() => {
    if (!isClockModalOpen && !isIndModalOpen) {
      clearSearch();
    }
  }, [isClockModalOpen, isIndModalOpen]);
  const [indForm, setIndForm] = useState<Partial<MarketIndicator>>({
    type: 'ticker',
    interval: '5m',
    refreshSec: 30,
    prefix: '',
    suffix: '',
    note: ''
  });

  useEffect(() => {
    localStorage.setItem('cm_clocks', JSON.stringify(clocks));
  }, [clocks]);

  useEffect(() => {
    localStorage.setItem('cm_indicators', JSON.stringify(indicators));
  }, [indicators]);

  useEffect(() => {
    localStorage.setItem('cm_global_interval', globalInterval);
  }, [globalInterval]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const idx = (new Date().getDate() + new Date().getMonth() * 31) % QUOTES.length;
    setQuote(QUOTES[idx]);
    return () => clearInterval(timer);
  }, []);

  // Grid calculations for Clocks
  const clockGrid = useMemo(() => {
    const n = clocks.length;
    if (n === 0) return { cols: 1, rows: 1 };
    const minW = 140, minH = 160;
    let bestCols = 1;
    for (let c = 1; c <= n; c++) {
      const rows = Math.ceil(n / c);
      if (clockSize.width / c >= minW && clockSize.height / rows >= minH) {
        bestCols = c;
      }
    }
    return { cols: bestCols, rows: Math.ceil(n / bestCols) };
  }, [clocks.length, clockSize]);

  // Grid calculations for Indicators
  const indGrid = useMemo(() => {
    const n = indicators.length;
    if (n === 0) return { cols: 1, rows: 1, density: 'xl' };
    const minW = 155, minH = 88;
    let bestCols = 1;
    for (let c = 1; c <= Math.min(n, 12); c++) {
      const rows = Math.ceil(n / c);
      if (indSize.width / c >= minW && indSize.height / rows >= minH) {
        bestCols = c;
      }
    }
    const density = n <= 2 ? 'xl' : n <= 4 ? 'lg' : n <= 6 ? 'md' : n <= 9 ? 'sm' : 'xs';
    return { cols: bestCols, rows: Math.ceil(n / bestCols), density };
  }, [indicators.length, indSize]);

  const handleAddClock = (city: any) => {
    const newClock: ClockConfig = {
      id: 'c' + Date.now(),
      city: city.name,
      tz: city.timezone || 'UTC',
      lat: city.latitude,
      lng: city.longitude,
      country: city.country,
    };
    setClocks([...clocks, newClock]);
    setIsClockModalOpen(false);
    setCityQuery('');
    setCityResults([]);
  };

  const handleRemoveClock = (id: string) => {
    setClocks(clocks.filter(c => c.id !== id));
  };

  const handleSaveIndicator = () => {
    if (!indForm.name) return;
    
    if (editingIndId) {
      setIndicators(indicators.map(ind => ind.id === editingIndId ? { ...ind, ...indForm } as MarketIndicator : ind));
    } else {
      const newInd: MarketIndicator = {
        id: 'i' + Date.now(),
        ...indForm
      } as MarketIndicator;
      setIndicators([...indicators, newInd]);
    }
    setIsIndModalOpen(false);
    setEditingIndId(null);
    setIndForm({ type: 'ticker', interval: globalInterval, refreshSec: 30 });
  };

  const handleEditInd = (id: string) => {
    const ind = indicators.find(i => i.id === id);
    if (ind) {
      setIndForm(ind);
      setEditingIndId(id);
      setIsIndModalOpen(true);
    }
  };

  const handleRemoveInd = (id: string) => {
    setIndicators(indicators.filter(i => i.id !== id));
    localStorage.removeItem(`cm_data_${id}`);
  };

  const searchCitiesDebounced = (q: string) => {
    setCityQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.length < 2) {
      setCityResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(q);
        setCityResults(results || []);
      } catch (e) {
        setCityResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const searchTickersDebounced = (q: string) => {
    setTickerQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.length < 2) {
      setTickerResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTickers(q);
        setTickerResults(results || []);
      } catch (e) {
        setTickerResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--ink)] font-mono overflow-hidden">
      {/* TOPBAR */}
      <header className="h-9 shrink-0 bg-[var(--panel)] border-b border-[var(--border)] flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-[var(--ink2)]">
            Chronos · Market
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-1 bg-none border border-[var(--border2)] text-[var(--ink3)] text-[0.5rem] tracking-widest uppercase px-2 py-1 rounded-sm hover:border-[var(--ink2)] hover:text-[var(--ink2)] transition-all"
          >
            {theme === 'dark' ? <Sun size={8} /> : <Moon size={8} />}
            {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </button>
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--up)] animate-pulse" />
          <span className="text-[0.56rem] tracking-wider text-[var(--ink3)]">
            {format(now, 'eee, d MMM HH:mm:ss')}
          </span>
        </div>
      </header>

      {/* QUOTE BAR */}
      <div className="h-7 shrink-0 bg-[var(--bg3)] border-b border-[var(--border)] flex items-center justify-center gap-3 px-5 overflow-hidden">
        <span className="font-serif italic text-[0.82rem] text-[var(--ink2)] truncate text-center">
          "{quote.t}"
        </span>
        <span className="text-[0.48rem] tracking-widest text-[var(--ink3)] shrink-0">
          — {quote.a}
        </span>
      </div>

      {/* MOON BAR */}
      <MoonBar />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* CLOCKS SECTION */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 py-1.5 bg-[var(--panel)] border-b border-[var(--border)] shrink-0">
            <span className="text-[0.5rem] tracking-[0.2em] uppercase text-[var(--ink3)] font-semibold">Relojes</span>
            <button 
              onClick={() => setIsClockModalOpen(true)}
              className="flex items-center gap-1 bg-none border border-[var(--border2)] text-[var(--ink3)] text-[0.5rem] tracking-widest uppercase px-2.5 py-1 rounded-sm hover:border-[var(--ink2)] hover:text-[var(--ink2)] transition-all"
            >
              <Plus size={8} /> Agregar
            </button>
          </div>
          <div 
            ref={clockContainerRef}
            className={cn(
              "flex-1 overflow-hidden bg-[var(--bg2)]",
              clocks.length === 0 ? "flex items-center justify-center" : "grid"
            )}
            style={clocks.length > 0 ? {
              gridTemplateColumns: `repeat(${clockGrid.cols}, 1fr)`,
              gridTemplateRows: `repeat(${clockGrid.rows}, 1fr)`
            } : {}}
          >
            {clocks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-[var(--ink3)]">
                <Clock size={32} className="opacity-20" />
                <span className="font-serif italic text-[0.82rem]">Agrega relojes de ciudades del mundo</span>
              </div>
            ) : (
              clocks.map(clock => (
                <ClockCard key={clock.id} config={clock} now={now} onRemove={handleRemoveClock} />
              ))
            )}
          </div>
        </section>

        <div className="h-px bg-[var(--border)] shrink-0" />

        {/* MARKETS SECTION */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 py-1.5 bg-[var(--panel)] border-b border-[var(--border)] shrink-0">
            <span className="text-[0.5rem] tracking-[0.2em] uppercase text-[var(--ink3)] font-semibold">Mercados</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.46rem] tracking-widest uppercase text-[var(--ink3)]">Gráfico</span>
                <select 
                  className="bg-[var(--bg)] border border-[var(--border)] text-[var(--ink2)] text-[0.52rem] px-1.5 py-0.5 rounded-sm outline-none"
                  value={globalInterval}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGlobalInterval(val);
                    setIndicators(indicators.map(i => ({ ...i, interval: val })));
                  }}
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1d</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  setEditingIndId(null);
                  setIndForm({ type: 'ticker', interval: globalInterval, refreshSec: 30 });
                  setIsIndModalOpen(true);
                }}
                className="flex items-center gap-1 bg-none border border-[var(--border2)] text-[var(--ink3)] text-[0.5rem] tracking-widest uppercase px-2.5 py-1 rounded-sm hover:border-[var(--ink2)] hover:text-[var(--ink2)] transition-all"
              >
                <Plus size={8} /> Agregar
              </button>
            </div>
          </div>
          <div 
            ref={indContainerRef}
            className={cn(
              "flex-1 overflow-hidden bg-[var(--bg)] ind-grid",
              indicators.length === 0 ? "flex items-center justify-center" : "grid"
            )}
            data-d={indGrid.density}
            style={indicators.length > 0 ? {
              gridTemplateColumns: `repeat(${indGrid.cols}, 1fr)`,
              gridTemplateRows: `repeat(${indGrid.rows}, 1fr)`
            } : {}}
          >
            {indicators.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-[var(--ink3)]">
                <BarChart2 size={32} className="opacity-20" />
                <span className="font-serif italic text-[0.82rem]">Añade indicadores para seguimiento en tiempo real</span>
              </div>
            ) : (
              indicators.map(ind => (
                <MarketCard 
                  key={ind.id} 
                  indicator={ind} 
                  onEdit={handleEditInd} 
                  onRemove={handleRemoveInd} 
                />
              ))
            )}
          </div>
        </section>
      </main>

      {/* MODAL: CLOCK */}
      <AnimatePresence>
        {isClockModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--panel)] border border-[var(--border2)] rounded-sm p-6 w-full max-w-[500px] shadow-2xl"
            >
              <h2 className="font-serif text-[1.1rem] text-[var(--ink)] mb-4">Agregar Reloj</h2>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Buscar ciudad</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cityQuery}
                      onChange={(e) => searchCitiesDebounced(e.target.value)}
                      placeholder="ej. Bogotá, Tokyo, New York…"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none focus:border-[var(--ink2)] transition-colors"
                    />
                    {cityResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[var(--panel)] border border-[var(--border2)] border-top-0 rounded-b-sm max-h-[180px] overflow-y-auto z-[300] shadow-xl">
                        {cityResults.map((city, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleAddClock(city)}
                            className="p-3 cursor-pointer flex items-center gap-3 hover:bg-[var(--bg3)] border-b border-[var(--border)] last:border-0"
                          >
                            <span className="font-mono text-[0.68rem] font-semibold text-[var(--ink)] min-w-[65px]">{city.name}</span>
                            <span className="font-serif text-[0.78rem] text-[var(--ink2)] truncate">{city.country}{city.admin1 ? `, ${city.admin1}` : ''}</span>
                            <span className="font-mono text-[0.48rem] text-[var(--ink3)] ml-auto shrink-0">{city.timezone?.split('/')[1] || city.timezone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[0.65rem] font-serif italic text-[var(--ink3)] mt-1">Busca y selecciona para autocompletar</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setIsClockModalOpen(false)} className="px-4 py-2 border border-[var(--border)] text-[var(--ink3)] text-[0.56rem] tracking-widest uppercase rounded-sm hover:border-[var(--border2)] hover:text-[var(--ink)] transition-all">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INDICATOR */}
      <AnimatePresence>
        {isIndModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--panel)] border border-[var(--border2)] rounded-sm p-6 w-full max-w-[500px] shadow-2xl"
            >
              <h2 className="font-serif text-[1.1rem] text-[var(--ink)] mb-4">{editingIndId ? 'Editar Indicador' : 'Nuevo Indicador'}</h2>
              
              <div className="flex border border-[var(--border)] rounded-sm overflow-hidden mb-4">
                <button 
                  onClick={() => setIndForm({ ...indForm, type: 'ticker' })}
                  className={cn("flex-1 text-[0.5rem] tracking-widest uppercase py-2 transition-all", indForm.type === 'ticker' ? "bg-[var(--panel)] text-[var(--ink)]" : "bg-[var(--bg)] text-[var(--ink3)]")}
                >
                  🔍 Buscar activo
                </button>
                <button 
                  onClick={() => setIndForm({ ...indForm, type: 'url' })}
                  className={cn("flex-1 text-[0.5rem] tracking-widest uppercase py-2 transition-all", indForm.type === 'url' ? "bg-[var(--panel)] text-[var(--ink)]" : "bg-[var(--bg)] text-[var(--ink3)]")}
                >
                  🔗 URL personalizada
                </button>
              </div>

              <div className="space-y-4">
                {indForm.type === 'ticker' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Buscar por nombre o símbolo</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={tickerQuery}
                          onChange={(e) => searchTickersDebounced(e.target.value)}
                          placeholder="ej. Apple, Bitcoin, Euro…"
                          className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none focus:border-[var(--ink2)] transition-colors"
                        />
                        {tickerResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-[var(--panel)] border border-[var(--border2)] border-top-0 rounded-b-sm max-h-[180px] overflow-y-auto z-[300] shadow-xl">
                            {tickerResults.map((res, idx) => (
                              <div 
                                key={idx}
                                onClick={() => {
                                  setIndForm({ ...indForm, ticker: res.symbol, name: res.shortname || res.longname || res.symbol });
                                  setTickerQuery(res.symbol);
                                  setTickerResults([]);
                                }}
                                className="p-3 cursor-pointer flex items-center gap-3 hover:bg-[var(--bg3)] border-b border-[var(--border)] last:border-0"
                              >
                                <span className="font-mono text-[0.68rem] font-semibold text-[var(--ink)] min-w-[65px]">{res.symbol}</span>
                                <span className="font-serif text-[0.78rem] text-[var(--ink2)] truncate">{res.shortname || res.longname}</span>
                                <span className="font-mono text-[0.48rem] text-[var(--ink3)] ml-auto shrink-0">{res.exchDisp || res.exchange}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Símbolo</label>
                        <input type="text" value={indForm.ticker || ''} readOnly className="w-full bg-[var(--bg3)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm cursor-default" />
                      </div>
                      <div>
                        <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Intervalo</label>
                        <select 
                          value={indForm.interval}
                          onChange={(e) => setIndForm({ ...indForm, interval: e.target.value })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                        >
                          <option value="1m">1 minuto</option>
                          <option value="5m">5 minutos</option>
                          <option value="15m">15 minutos</option>
                          <option value="1h">1 hora</option>
                          <option value="1d">1 día</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">URL del endpoint JSON</label>
                      <input 
                        type="text" 
                        value={indForm.url || ''}
                        onChange={(e) => setIndForm({ ...indForm, url: e.target.value })}
                        placeholder="https://api.ejemplo.com/precio"
                        className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Ruta al valor</label>
                        <input 
                          type="text" 
                          value={indForm.valuePath || ''}
                          onChange={(e) => setIndForm({ ...indForm, valuePath: e.target.value })}
                          placeholder="ej. data.price"
                          className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Ruta al cambio %</label>
                        <input 
                          type="text" 
                          value={indForm.changePath || ''}
                          onChange={(e) => setIndForm({ ...indForm, changePath: e.target.value })}
                          placeholder="ej. data.change"
                          className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Nombre visible</label>
                    <input 
                      type="text" 
                      value={indForm.name || ''}
                      onChange={(e) => setIndForm({ ...indForm, name: e.target.value })}
                      placeholder="ej. Dólar Colombiano"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Actualizar cada</label>
                    <select 
                      value={indForm.refreshSec}
                      onChange={(e) => setIndForm({ ...indForm, refreshSec: parseInt(e.target.value) })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                    >
                      <option value="15">15 segundos</option>
                      <option value="30">30 segundos</option>
                      <option value="60">1 minuto</option>
                      <option value="300">5 minutos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Prefijo</label>
                    <input 
                      type="text" 
                      value={indForm.prefix || ''}
                      onChange={(e) => setIndForm({ ...indForm, prefix: e.target.value })}
                      placeholder="$ € ¥"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Sufijo</label>
                    <input 
                      type="text" 
                      value={indForm.suffix || ''}
                      onChange={(e) => setIndForm({ ...indForm, suffix: e.target.value })}
                      placeholder="pts bps %"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.76rem] px-3 py-2 rounded-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.47rem] tracking-[0.18em] uppercase text-[var(--ink3)] mb-1.5">Nota / Fuente</label>
                  <textarea 
                    value={indForm.note || ''}
                    onChange={(e) => setIndForm({ ...indForm, note: e.target.value })}
                    placeholder="Descripción, fuente o referencia…"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-[0.7rem] px-3 py-2 rounded-sm outline-none min-h-[45px] resize-vertical"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setIsIndModalOpen(false)} className="px-4 py-2 border border-[var(--border)] text-[var(--ink3)] text-[0.56rem] tracking-widest uppercase rounded-sm hover:border-[var(--border2)] hover:text-[var(--ink)] transition-all">Cancelar</button>
                <button onClick={handleSaveIndicator} className="px-5 py-2 bg-[var(--ink)] text-[var(--panel)] text-[0.56rem] font-semibold tracking-widest uppercase rounded-sm hover:bg-[var(--ink2)] transition-all">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
