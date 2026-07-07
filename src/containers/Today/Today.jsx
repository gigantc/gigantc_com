import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Loader from '@/components/Loader/Loader';
import ArrowLeft from '@/assets/arrow-left.svg?react';
import ArrowRight from '@/assets/arrow-right.svg?react';
import { getCachedEvents, setCachedEvents, isCacheForToday } from '@/utils/todayCache';
import { API, INTERVALS, getProxyUrl } from '@/config';
import './Today.scss';

const FALLBACK_EVENT = { year: 'Year Zero', text: 'Uhhh. No factoid found.', link: '#' };


//////////////////////////////////////
// PARSE EVENT
// Splits an event's text into year + description
const parseEvent = (event) => {
  if (!event) return FALLBACK_EVENT;
  const parts = event.text?.split(/&#8211;|–/);
  return {
    year: parts?.[0]?.trim() || FALLBACK_EVENT.year,
    text: parts?.[1]?.trim() || FALLBACK_EVENT.text,
    link: event.links?.[1]?.url || '#',
  };
};

// Strip HTML entities from the text string
const decodeHtmlEntities = (text) => {
  const parser = new DOMParser();
  return parser.parseFromString(`<!doctype html><body>${text}`, 'text/html').body.textContent;
};

// Pick a random index into a list, or -1 if the list is empty
const pickRandomIndex = (list) => {
  if (list.length === 0) return -1;
  return Math.floor(Math.random() * list.length);
};

const Today = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  // history holds the sequence of event indices actually shown to the user,
  // so Back/Forward replay that sequence instead of walking the raw list.
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentEvent, setCurrentEvent] = useState({ year: null, text: null, link: null });
  const [fade, setFade] = useState(false);
  const rotationTimeoutRef = useRef(null);
  // Read fresh state from inside the recursive rotation timeout without
  // needing to tear down and recreate the timer on every state change.
  const stateRef = useRef({ events: [], history: [], historyIndex: 0 });

  useEffect(() => {
    stateRef.current = { events, history, historyIndex };
  }, [events, history, historyIndex]);


  //////////////////////////////////////
  // APPEND RANDOM FACT
  // Picks a new random fact, appends it to history, and displays it
  const appendRandomFact = () => {
    const { events: evts, history: hist } = stateRef.current;
    const index = pickRandomIndex(evts);
    const newHistory = [...hist, index];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentEvent(parseEvent(evts[index]));
  };


  //////////////////////////////////////
  // START AUTO-ROTATION TIMER
  const startRotation = useCallback(() => {
    if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current);

    rotationTimeoutRef.current = setTimeout(async () => {
      const { history: hist, historyIndex: idx } = stateRef.current;

      // Pause auto-rotation while the user is browsing back through history
      if (idx < hist.length - 1) {
        startRotation();
        return;
      }

      setFade(true);
      await new Promise((resolve) => setTimeout(resolve, INTERVALS.FADE_DURATION));
      appendRandomFact();
      setFade(false);
      startRotation();
    }, INTERVALS.TODAY_ROTATION);
  }, []);

  //////////////////////////////////////
  // NAVIGATE BY DELTA
  // delta = +1 for next, -1 for previous. Resets the auto-rotation timer.
  const advance = (delta) => {
    const { events: evts, history: hist, historyIndex: idx } = stateRef.current;
    if (evts.length === 0) return;

    setFade(true);
    setTimeout(() => {
      if (delta < 0) {
        const prevIndex = Math.max(0, idx - 1);
        setHistoryIndex(prevIndex);
        setCurrentEvent(parseEvent(evts[hist[prevIndex]]));
      } else if (idx < hist.length - 1) {
        const nextIndex = idx + 1;
        setHistoryIndex(nextIndex);
        setCurrentEvent(parseEvent(evts[hist[nextIndex]]));
      } else {
        appendRandomFact();
      }
      setFade(false);
      startRotation();
    }, INTERVALS.FADE_DURATION);
  };


  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    const initialize = async () => {
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Check if we have cached events for today
        if (isCacheForToday(month, day)) {
          const cached = getCachedEvents();
          if (cached?.length) {
            const index = pickRandomIndex(cached);
            setEvents(cached);
            setHistory([index]);
            setHistoryIndex(0);
            setCurrentEvent(parseEvent(cached[index]));
            setLoading(false);
            return;
          }
        }

        // Cache is invalid or empty - fetch from API
        const proxyUrl = getProxyUrl(`${API.TODAY}/${month}/${day}`);
        const response = await axios.get(proxyUrl);

        const fetched = response.data.data.Events || [];
        const index = pickRandomIndex(fetched);
        setEvents(fetched);
        setCachedEvents(fetched, month, day);
        setHistory([index]);
        setHistoryIndex(0);
        setCurrentEvent(parseEvent(fetched[index]));
      } catch (err) {
        setError('Failed to load the feed :(');
        console.error('Error fetching the feed:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup: clear timeout on unmount
    return () => {
      if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current);
    };
  }, []);

  // Start rotation when events are loaded
  useEffect(() => {
    if (events.length > 0) startRotation();
  }, [events, startRotation]);


  //////////////////////////////////////
  // RENDER
  return (
    <section className="today">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="navigation">
            <button onClick={() => advance(-1)} className="navBtn" title="Previous fact" disabled={historyIndex === 0}>
              <ArrowLeft />
            </button>
            <button onClick={() => advance(1)} className="navBtn" title="Next fact">
              <ArrowRight />
            </button>
          </div>
          <div className={`box ${fade ? 'fade' : ''}`}>
            <h2>On this day in <strong>{currentEvent.year}</strong></h2>
            <p>{decodeHtmlEntities(currentEvent.text)}</p>
            <a href={currentEvent.link} target="_blank" rel="noopener noreferrer">
              LEARN MORE
            </a>
          </div>
        </>
      )}
    </section>
  );
};

export default Today;
