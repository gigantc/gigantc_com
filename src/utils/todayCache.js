// localStorage service for Today events caching
// Reduces API calls by caching historical events for current day

const CACHE_KEY = 'gigantc_today_events';
const DATE_KEY = 'gigantc_today_date';


//////////////////////////////////////
// GET CACHED EVENTS
export const getCachedEvents = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading today events from cache:', error);
    return null;
  }
};


//////////////////////////////////////
// SAVE EVENTS TO CACHE
export const setCachedEvents = (events, month, day) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(events));
    localStorage.setItem(DATE_KEY, `${month}-${day}`);
    return true;
  } catch (error) {
    console.error('Error saving today events to cache:', error);
    return false;
  }
};


//////////////////////////////////////
// CHECK IF CACHE IS FOR TODAY
export const isCacheForToday = (month, day) => {
  try {
    const cachedDate = localStorage.getItem(DATE_KEY);
    if (!cachedDate) return false;

    const todayDate = `${month}-${day}`;
    return cachedDate === todayDate;
  } catch (error) {
    console.error('Error checking today cache date:', error);
    return false;
  }
};


//////////////////////////////////////
// CLEAR CACHE
export const clearTodayCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(DATE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing today cache:', error);
    return false;
  }
};


//////////////////////////////////////
// GET CACHE INFO (for debugging)
export const getTodayCacheInfo = () => {
  try {
    const cachedDate = localStorage.getItem(DATE_KEY);
    const cached = getCachedEvents();

    return {
      hasCache: !!cached,
      eventCount: cached ? cached.length : 0,
      cachedDate: cachedDate || 'Never',
      isValid: cached && cachedDate
    };
  } catch (error) {
    console.error('Error getting today cache info:', error);
    return null;
  }
};
