import { MarketIndicator } from "../types";

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

let proxyIdx = 0;

async function fetchWithProxy(url: string) {
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const proxyUrl = PROXIES[(proxyIdx + i) % PROXIES.length](url);
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      return await response.json();
    } catch (e) {
      continue;
    }
  }
  throw new Error('All proxies failed');
}

export async function fetchMarketData(indicator: MarketIndicator) {
  if (indicator.type === 'ticker' && indicator.ticker) {
    const range = indicator.interval === '1d' ? '1mo' : indicator.interval === '1h' ? '5d' : '1d';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(indicator.ticker)}?interval=${indicator.interval || '5m'}&range=${range}`;
    const data = await fetchWithProxy(url);
    
    const res = data?.chart?.result?.[0];
    if (!res) throw new Error('No result from Yahoo Finance');
    
    const meta = res.meta;
    const timestamps = res.timestamp || [];
    const quotes = res.indicators?.quote?.[0]?.close || [];
    
    const chartData = timestamps.map((t: number, i: number) => ({
      time: t * 1000,
      price: quotes[i]
    })).filter((d: any) => d.price !== null);

    const currentPrice = meta?.regularMarketPrice ?? chartData[chartData.length - 1]?.price;
    const prevClose = meta?.chartPreviousClose || meta?.previousClose || chartData[0]?.price;
    const currentChange = prevClose ? ((currentPrice - prevClose) / prevClose * 100) : 0;

    return {
      currentPrice,
      currentChange,
      chartData
    };
  } else if (indicator.type === 'url' && indicator.url) {
    const data = await fetchWithProxy(indicator.url);
    
    const getPath = (obj: any, path: string) => {
      return path.split('.').reduce((a, k) => a == null ? null : (isNaN(Number(k)) ? a[k] : a[parseInt(k)]), obj);
    };

    const currentPrice = indicator.valuePath ? getPath(data, indicator.valuePath) : null;
    const currentChange = indicator.changePath ? getPath(data, indicator.changePath) : 0;

    return {
      currentPrice,
      currentChange,
      chartData: [] // URL indicators might not have historical data in this simple implementation
    };
  }
  throw new Error('Invalid indicator configuration');
}

export async function searchTickers(query: string) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`;
  const data = await fetchWithProxy(url);
  return data?.quotes || [];
}

export async function searchCities(query: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=es&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data?.results || [];
}
