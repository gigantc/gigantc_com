// localStorage service for feed caching
// Reduces Firebase reads by caching feeds locally

import { CACHE } from '@/config';

const CACHE_KEY = CACHE.KEYS.FEEDS_CACHE;
const TIMESTAMP_KEY = CACHE.KEYS.FEEDS_TIMESTAMP;
const NEEDS_REFRESH_KEY = CACHE.KEYS.FEEDS_NEEDS_REFRESH;
const CACHE_DURATION = CACHE.FEEDS_DURATION;


//////////////////////////////////////
// GET CACHED FEEDS
export const getCachedFeeds = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};


//////////////////////////////////////
// SAVE FEEDS TO CACHE
export const setCachedFeeds = (feeds) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(feeds));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(NEEDS_REFRESH_KEY, 'false');
    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
};


//////////////////////////////////////
// CHECK IF CACHE IS STILL VALID
export const isCacheValid = () => {
  try {
    // Check if needs refresh flag is set (admin made changes)
    const needsRefresh = localStorage.getItem(NEEDS_REFRESH_KEY);
    if (needsRefresh === 'true') {
      return false;
    }

    // Check if cache exists
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (!timestamp) {
      return false;
    }

    // Check if cache is older than 24 hours
    const age = Date.now() - parseInt(timestamp);
    return age < CACHE_DURATION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};


//////////////////////////////////////
// MARK CACHE AS NEEDING REFRESH (called from admin on changes)
export const invalidateCache = () => {
  try {
    localStorage.setItem(NEEDS_REFRESH_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
};


//////////////////////////////////////
// CLEAR ALL CACHE DATA
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    localStorage.removeItem(NEEDS_REFRESH_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};


//////////////////////////////////////
// GET CACHE INFO (for debugging)
export const getCacheInfo = () => {
  try {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    const needsRefresh = localStorage.getItem(NEEDS_REFRESH_KEY);
    const cached = getCachedFeeds();

    return {
      hasCache: !!cached,
      feedCount: cached ? cached.length : 0,
      lastFetch: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Never',
      age: timestamp ? Date.now() - parseInt(timestamp) : null,
      needsRefresh: needsRefresh === 'true',
      isValid: isCacheValid()
    };
  } catch (error) {
    console.error('Error getting cache info:', error);
    return null;
  }
};
