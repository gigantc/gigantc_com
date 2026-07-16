/**
 * Live market data:
 *  - Stocks (S&P 500, DOW, NASDAQ) via Yahoo Finance chart endpoint,
 *    routed through the existing Cloudflare Worker CORS proxy.
 *  - Crypto (BTC, ETH) via the CoinGecko public API (browser CORS enabled).
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

const CRYPTO_IDS = [
  { symbol: 'BTC', id: 'bitcoin' },
  { symbol: 'ETH', id: 'ethereum' },
];

const CACHE_KEY = 'hello-again-market-cache';
const CACHE_TIMESTAMP_KEY = 'hello-again-market-timestamp';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const fetchYahooQuote = async ({ symbol, ticker }) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
  const response = await axios.get(getProxyUrl(url));
  const meta = response.data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`No Yahoo meta for ${symbol}`);

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose;

  return {
    symbol,
    price,
    prevClose,
    dayLow: meta.regularMarketDayLow ?? price,
    dayHigh: meta.regularMarketDayHigh ?? price,
    changePercent: ((price - prevClose) / prevClose) * 100,
    marketState: meta.marketState,
  };
};

const fetchCryptoQuotes = async () => {
  const ids = CRYPTO_IDS.map((c) => c.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;
  const response = await axios.get(url);

  return CRYPTO_IDS.map(({ symbol, id }) => {
    const coin = response.data.find((c) => c.id === id);
    if (!coin) throw new Error(`No CoinGecko data for ${symbol}`);

    const price = coin.current_price;
    const changePercent = coin.price_change_percentage_24h ?? 0;
    // 24h-ago price = current / (1 + change%)
    const prevClose = price / (1 + changePercent / 100);

    return {
      symbol,
      price,
      prevClose,
      dayLow: coin.low_24h,
      dayHigh: coin.high_24h,
      changePercent,
      marketState: 'CRYPTO', // 24/7 — no closed state
    };
  });
};

const readCache = () => {
  try {
    const ts = Number(localStorage.getItem(CACHE_TIMESTAMP_KEY));
    if (!ts || Date.now() - ts > CACHE_TTL) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // ignore quota / private-mode errors
  }
};

export const fetchMarketData = async () => {
  const cached = readCache();
  if (cached) return cached;

  const [stocks, crypto] = await Promise.all([
    Promise.all(YAHOO_TICKERS.map(fetchYahooQuote)),
    fetchCryptoQuotes(),
  ]);
  const result = { stocks, crypto };
  writeCache(result);
  return result;
};
