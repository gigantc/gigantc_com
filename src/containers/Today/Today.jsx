import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/Loader/Loader.jsx';

import './Today.scss';

const Today = () => {

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState({ year: null, text: null, link: null });
  const [fade, setFade] = useState(false);




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
  // SELECT RANDOM EVENT
  const selectRandomEvent = (events) => {
    if (events.length === 0) return { year: "Year Zero", text: "Uhhh. No factoid found.", link: "#" };

    const randomIndex = Math.floor(Math.random() * events.length);
    const nextEvent = events[randomIndex];

    const parts = nextEvent.text?.split(/&#8211;|–/);
    const year = parts?.[0]?.trim() || "Year Zero";
    const text = parts?.[1]?.trim() || "Uhhh. No factoid found.";
    const link = nextEvent.links?.[1]?.[1] || "#";

    return { year, text, link };
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
        const url = `https://today.zenquotes.io/api/${date.month}/${date.day}`;
        const proxyUrl = `https://gigantc-com.dan-91d.workers.dev/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(proxyUrl);
  
        const fetchedEvents = response.data.data.Events || [];
        setEvents(fetchedEvents);
  
        // Immediately set the first random event
        setCurrentEvent(selectRandomEvent(fetchedEvents));
  
        // Start the event rotation
        const startRotation = async () => {
          // Trigger fade-out
          setFade(true);
          // Wait for the fade-out to complete
          // 0.5s matches CSS fade duration
          await new Promise((resolve) => setTimeout(resolve, 500)); 
          // Update the event
          setCurrentEvent(selectRandomEvent(fetchedEvents));
          // Trigger fade-in
          setFade(false); 
          // Wait for the next cycle (20 seconds total interval)
          setTimeout(startRotation, 19500); // Remaining time after fade transition
        };

        // Start the first rotation
        startRotation(); // Start the first rotation
      } catch (err) {
        setError(`Failed to load the feed :(`);
        console.error(`Error fetching the feed:`, err);
      } finally {
        setLoading(false);
      }
    };
  
    initialize();
  }, []);
  
  




  //////////////////////////////////////
  // RENDER
  return (
    <section className="today">
      {loading ? (
        <Loader /> 
      ) : error ? (
        <div className="error">{error}</div> 
      ) : (
        <div className={`box ${fade ? 'fade' : ''}`}>
          <h2>On this day in <strong>{currentEvent.year}</strong></h2>
          <p>{decodeHtmlEntities(currentEvent.text)}</p>
          <a href={currentEvent.link} target="_blank" rel="noopener noreferrer">
            LEARN MORE
          </a>
        </div>
      )}
    </section>
  );
};

export default Today;
