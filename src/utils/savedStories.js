const STORAGE_KEY = 'hello-again-saved-stories';
const EVENT_NAME = 'hello-again-saved-stories-changed';

export const getSavedStories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading saved stories:', error);
    return [];
  }
};

export const isSaved = (storyId) => {
  return getSavedStories().some((story) => story.id === storyId);
};

export const toggleSaved = (story) => {
  const current = getSavedStories();
  const exists = current.some((s) => s.id === story.id);
  const next = exists
    ? current.filter((s) => s.id !== story.id)
    : [{ ...story, savedAt: Date.now() }, ...current];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error('Error writing saved stories:', error);
  }

  return !exists;
};

export const subscribeToSavedStories = (callback) => {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
};
