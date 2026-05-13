import { CACHE } from '@/config';

const CACHE_KEY = CACHE.KEYS.DOOMSCROLL_CACHE;
const TIMESTAMP_KEY = CACHE.KEYS.DOOMSCROLL_TIMESTAMP;
const VERSION_KEY = CACHE.KEYS.DOOMSCROLL_VERSION;
const NEEDS_REFRESH_KEY = CACHE.KEYS.FEEDS_NEEDS_REFRESH;
const CACHE_DURATION = CACHE.FEEDS_DURATION;
const CACHE_VERSION = '4';

export const getCachedStories = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading doomscroll cache:', error);
    return null;
  }
};

export const setCachedStories = (stories) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stories));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    return true;
  } catch (error) {
    console.error('Error saving doomscroll cache:', error);
    return false;
  }
};

export const isStoryCacheValid = () => {
  try {
    const needsRefresh = localStorage.getItem(NEEDS_REFRESH_KEY);
    if (needsRefresh === 'true') {
      return false;
    }

    const version = localStorage.getItem(VERSION_KEY);
    if (version !== CACHE_VERSION) {
      return false;
    }

    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (!timestamp) {
      return false;
    }

    return Date.now() - parseInt(timestamp, 10) < CACHE_DURATION;
  } catch (error) {
    console.error('Error checking doomscroll cache validity:', error);
    return false;
  }
};

export const clearStoryCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    localStorage.removeItem(VERSION_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing doomscroll cache:', error);
    return false;
  }
};
