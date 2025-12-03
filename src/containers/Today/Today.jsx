import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Loader from '@/components/Loader/Loader';
import ArrowLeft from '@/assets/arrow-left.svg?react';
import ArrowRight from '@/assets/arrow-right.svg?react';
import { getCachedEvents, setCachedEvents, isCacheForToday } from '@/utils/todayCache';
import './Today.scss';

const Today = () => {

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEvent, setCurrentEvent] = useState({ year: null, text: null, link: null });
  const [fade, setFade] = useState(false);
  const rotationTimeoutRef = useRef(null);




  //////////////////////////////////////
  // GET TODAY'S DATE
  const getDate = async () => {
    const today = new Date();
     // Get month as a number (1-12)
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return { month, day };
  };




  //////////////////////////////////////
  // SELECT EVENT BY INDEX
  const selectEventByIndex = (events, index) => {
    if (events.length === 0) return { year: "Year Zero", text: "Uhhh. No factoid found.", link: "#" };

    const nextEvent = events[index];

    const parts = nextEvent.text?.split(/&#8211;|–/);
    const year = parts?.[0]?.trim() || "Year Zero";
    const text = parts?.[1]?.trim() || "Uhhh. No factoid found.";
    const link = nextEvent.links?.[1]?.[1] || "#";

    return { year, text, link };
  };

  //////////////////////////////////////
  // SELECT RANDOM EVENT
  const selectRandomEvent = (events) => {
    if (events.length === 0) return { year: "Year Zero", text: "Uhhh. No factoid found.", link: "#" };
    const randomIndex = Math.floor(Math.random() * events.length);
    setCurrentIndex(randomIndex);
    return selectEventByIndex(events, randomIndex);
  };

  //////////////////////////////////////
  // START AUTO-ROTATION TIMER
  const startRotation = useCallback(() => {
    // Clear any existing timeout
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }

    // Set new timeout for next rotation
    rotationTimeoutRef.current = setTimeout(async () => {
      // Trigger fade-out
      setFade(true);
      // Wait for the fade-out to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Update the event with random selection
      setCurrentEvent(selectRandomEvent(events));
      // Trigger fade-in
      setFade(false);
      // Continue rotation
      startRotation();
    }, 19500); // 19.5s + 0.5s fade = 20s total
  }, [events]);

  //////////////////////////////////////
  // NAVIGATE TO NEXT EVENT
  const handleNext = () => {
    if (events.length === 0) return;

    setFade(true);
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % events.length;
      setCurrentIndex(nextIndex);
      setCurrentEvent(selectEventByIndex(events, nextIndex));
      setFade(false);
      startRotation(); // Reset rotation timer
    }, 500);
  };

  //////////////////////////////////////
  // NAVIGATE TO PREVIOUS EVENT
  const handlePrevious = () => {
    if (events.length === 0) return;

    setFade(true);
    setTimeout(() => {
      const prevIndex = currentIndex === 0 ? events.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentEvent(selectEventByIndex(events, prevIndex));
      setFade(false);
      startRotation(); // Reset rotation timer
    }, 500);
  };

  //removes HTML codes from the text string
  const decodeHtmlEntities = (text) => {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html').body.textContent;
    return decodedString;
  };

  

  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    const initialize = async () => {
      try {
        const date = await getDate();

        // Check if we have cached events for today
        if (isCacheForToday(date.month, date.day)) {
          const cachedEvents = getCachedEvents();
          if (cachedEvents && cachedEvents.length > 0) {
            console.log('Using cached today events');
            setEvents(cachedEvents);
            setCurrentEvent(selectRandomEvent(cachedEvents));
            setLoading(false);
            return;
          }
        }

        // Cache is invalid or empty - fetch from API
        console.log('Fetching today events from API...');
        const url = `https://today.zenquotes.io/api/${date.month}/${date.day}`;
        const proxyUrl = `https://gigantc-com.dan-91d.workers.dev/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(proxyUrl);

        const fetchedEvents = response.data.data.Events || [];
        setEvents(fetchedEvents);
        setCachedEvents(fetchedEvents, date.month, date.day); // Save to cache

        // Immediately set the first random event
        setCurrentEvent(selectRandomEvent(fetchedEvents));
      } catch (err) {
        setError(`Failed to load the feed :(`);
        console.error(`Error fetching the feed:`, err);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup: clear timeout on unmount
    return () => {
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current);
      }
    };
  }, []);

  // Start rotation when events are loaded
  useEffect(() => {
    if (events.length > 0) {
      startRotation();
    }
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
            <button onClick={handlePrevious} className="navBtn" title="Previous fact">
              <ArrowLeft />
            </button>
            <button onClick={handleNext} className="navBtn" title="Next fact">
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
