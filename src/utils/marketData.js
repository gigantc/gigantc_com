/**
 * Live market data:
 *  - Stocks (S&P 500, DOW, NASDAQ) via Yahoo Finance chart endpoint,
 *    routed through the existing Cloudflare Worker CORS proxy.
 *  - Crypto (BTC, ETH) via the same Yahoo endpoint (BTC-USD / ETH-USD).
 *    CoinGecko was dropped: it 403s requests from the worker and many clients.
 *
 * Results are cached in localStorage for 10 minutes to minimize API calls.
 */

import axios from 'axios';
import { getProxyUrl } from '@/config';

const YAHOO_TICKERS = [
  { symbol: 'S&P 500', ticker: '^GSPC' },
  { symbol: 'DOW', ticker: '^DJI' },
  { symbol: 'NASDAQ', ticker: '^IXIC' },
];

const CRYPTO_TICKERS = [
  { symbol: 'BTC', ticker: 'BTC-USD' },
  { symbol: 'ETH', ticker: 'ETH-USD' },
];

const CACHE_KEY = 'hello-again-market-cache-v3';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// The chart endpoint doesn't return marketState, so derive it from the
// current trading period windows (unix seconds).
const deriveMarketState = (periods) => {
  if (!periods) return undefined;
  const now = Date.now() / 1000;
  const within = (p) => p && now >= p.start && now < p.end;
  if (within(periods.regular)) return 'REGULAR';
  if (within(periods.pre)) return 'PRE';
  if (within(periods.post)) return 'POST';
  return 'CLOSED';
};

const fetchYahooQuote = async ({ symbol, ticker }, isCrypto = false) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
  const response = await axios.get(getProxyUrl(url));
  const meta = response.data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`No Yahoo meta for ${symbol}`);

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;

  return {
    symbol,
    price,
    prevClose,
    dayLow: meta.regularMarketDayLow ?? price,
    dayHigh: meta.regularMarketDayHigh ?? price,
    changePercent: ((price - prevClose) / prevClose) * 100,
    marketState: isCrypto ? 'CRYPTO' : deriveMarketState(meta.currentTradingPeriod),
  };
};

// Fetch a group of tickers, dropping any that fail so one bad quote
// doesn't blank the whole block.
const fetchGroup = async (tickers, isCrypto) => {
  const results = await Promise.allSettled(tickers.map((t) => fetchYahooQuote(t, isCrypto)));
  return results.flatMap((r) => {
    if (r.status === 'fulfilled') return [r.value];
    console.warn('Market quote failed:', r.reason);
    return [];
  });
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { cachedAt, data } = JSON.parse(raw);
    const age = Date.now() - cachedAt;
    if (!cachedAt || age < 0 || age > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // ignore quota / private-mode errors
  }
};

export const fetchMarketData = async () => {
  const cached = readCache();
  if (cached) return cached;

  const [stocks, crypto] = await Promise.all([
    fetchGroup(YAHOO_TICKERS, false),
    fetchGroup(CRYPTO_TICKERS, true),
  ]);
  if (!stocks.length && !crypto.length) throw new Error('All market quotes failed');

  const result = { stocks, crypto };
  // Only cache complete results so a partial failure retries on next load
  if (stocks.length === YAHOO_TICKERS.length && crypto.length === CRYPTO_TICKERS.length) {
    writeCache(result);
  }
  return result;
};
