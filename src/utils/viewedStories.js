const STORAGE_KEY = 'hello-again-viewed-stories';
const EVENT_NAME = 'hello-again-viewed-stories-changed';
const MAX_ENTRIES = 200;

export const getViewedStories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading viewed stories:', error);
    return [];
  }
};

export const markViewed = (story) => {
  const current = getViewedStories();
  const withoutThis = current.filter((s) => s.id !== story.id);
  const next = [{ ...story, viewedAt: Date.now() }, ...withoutThis].slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error('Error writing viewed stories:', error);
  }
};

export const subscribeToViewedStories = (callback) => {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
};
