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
    link: event.links?.[1]?.[1] || '#',
  };
};

// Strip HTML entities from the text string
const decodeHtmlEntities = (text) => {
  const parser = new DOMParser();
  return parser.parseFromString(`<!doctype html><body>${text}`, 'text/html').body.textContent;
};

const Today = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEvent, setCurrentEvent] = useState({ year: null, text: null, link: null });
  const [fade, setFade] = useState(false);
  const rotationTimeoutRef = useRef(null);

  //////////////////////////////////////
  // SELECT RANDOM EVENT
  const pickRandom = (list) => {
    if (list.length === 0) return FALLBACK_EVENT;
    const index = Math.floor(Math.random() * list.length);
    setCurrentIndex(index);
    return parseEvent(list[index]);
  };


  //////////////////////////////////////
  // START AUTO-ROTATION TIMER
  const startRotation = useCallback(() => {
    if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current);

    rotationTimeoutRef.current = setTimeout(async () => {
      setFade(true);
      await new Promise((resolve) => setTimeout(resolve, INTERVALS.FADE_DURATION));
      setCurrentEvent(pickRandom(events));
      setFade(false);
      startRotation();
    }, INTERVALS.TODAY_ROTATION);
  }, [events]);

  //////////////////////////////////////
  // NAVIGATE BY DELTA
  // delta = +1 for next, -1 for previous. Resets the auto-rotation timer.
  const advance = (delta) => {
    if (events.length === 0) return;
    setFade(true);
    setTimeout(() => {
      const nextIndex = (currentIndex + delta + events.length) % events.length;
      setCurrentIndex(nextIndex);
      setCurrentEvent(parseEvent(events[nextIndex]));
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
            setEvents(cached);
            setCurrentEvent(pickRandom(cached));
            setLoading(false);
            return;
          }
        }

        // Cache is invalid or empty - fetch from API
        const proxyUrl = getProxyUrl(`${API.TODAY}/${month}/${day}`);
        const response = await axios.get(proxyUrl);

        const fetched = response.data.data.Events || [];
        setEvents(fetched);
        setCachedEvents(fetched, month, day);
        setCurrentEvent(pickRandom(fetched));
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
            <button onClick={() => advance(-1)} className="navBtn" title="Previous fact">
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
