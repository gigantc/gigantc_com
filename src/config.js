/**
 * Centralized Configuration
 * All API endpoints, intervals, cache settings, and display constants
 */

//////////////////////////////////////
// API ENDPOINTS
export const API = {
  WEATHER: 'https://api.open-meteo.com/v1/forecast',
  TODAY: 'https://today.zenquotes.io/api',
};

//////////////////////////////////////
// UPDATE INTERVALS (in milliseconds)
export const INTERVALS = {
  WEATHER_REFRESH: 30 * 60 * 1000, // 30 minutes
  TODAY_ROTATION: 19500, // 19.5 seconds
  FADE_DURATION: 500, // 0.5 seconds
};

//////////////////////////////////////
// DISPLAY SETTINGS
export const DISPLAY = {
  FEED_ITEMS_PER_PAGE: 6,
};

//////////////////////////////////////
// CACHE SETTINGS
export const CACHE = {
  // Cache duration
  FEEDS_DURATION: 24 * 60 * 60 * 1000, // 24 hours

  // Cache keys for localStorage
  KEYS: {
    FEEDS_CACHE: 'hello-again-feeds-cache',
    FEEDS_TIMESTAMP: 'hello-again-feeds-timestamp',
    FEEDS_NEEDS_REFRESH: 'hello-again-feeds-needs-refresh',
    DOOMSCROLL_CACHE: 'hello-again-doomscroll-cache',
    DOOMSCROLL_TIMESTAMP: 'hello-again-doomscroll-timestamp',
    DOOMSCROLL_VERSION: 'hello-again-doomscroll-version',
    TODAY_CACHE: 'hello-again-today-cache',
    TODAY_EVENTS: 'hello-again-today-cache',
    TODAY_DATE: 'hello-again-today-date',
  },
};

//////////////////////////////////////
// RSS FEED PROXY
// Cloudflare Worker that handles CORS for RSS feeds
const PROXY_URL = 'https://gigantc-com.dan-91d.workers.dev/';

/**
 * Generate proxy URL for RSS feed
 * @param {string} feedUrl - The RSS feed URL to proxy
 * @returns {string} - The proxied URL
 */
export const getProxyUrl = (feedUrl) => {
  return `${PROXY_URL}?url=${encodeURIComponent(feedUrl)}`;
};
