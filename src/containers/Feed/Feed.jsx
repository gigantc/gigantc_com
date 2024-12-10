import { useState, useEffect } from 'react';
import axios from 'axios';

import Loader from '../../components/Loader/Loader.jsx';
import More from '../../assets/forward.svg?react';

import './Feed.scss';

const Feed = ({ feedTitle, feedUrl }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  //all feed items
  const [feedItems, setFeedItems] = useState([]);
   // Tracks the starting index for displayed items
  const [startIndex, setStartIndex] = useState(0);
  //the url of the feed
  const [channelLink, setChannelLink] = useState(null);





  //////////////////////////////////////
  // FETCH RSS FEED
  const fetchFeed = async (url) => {
    try {
      const proxyUrl = `https://gigantc-com.dan-91d.workers.dev/?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl);
  
      const parser = new DOMParser();
      const xml = parser.parseFromString(response.data, "text/xml");
  
      // Check for parsing errors
      const parseError = xml.querySelector("parsererror");
      if (parseError) {
        throw new Error("Invalid XML structure.");
      }
  
      const isAtom = xml.documentElement.nodeName === "feed";
  
      const channel = xml.querySelector("channel");
      const link = isAtom
        ? xml.querySelector("link")?.getAttribute("href") || null
        : channel?.getElementsByTagName("link")[0]?.textContent || null;
  
      setChannelLink(link);
  
      const items = isAtom
        ? Array.from(xml.querySelectorAll("entry")).map((entry) => ({
            title: entry.querySelector("title")?.textContent || "No Title",
            link: entry.querySelector("link")?.getAttribute("href") || "#",
            pubDate: entry.querySelector("updated")?.textContent || "No Date",
          }))
        : Array.from(xml.querySelectorAll("item")).map((item) => {
            const contentNamespace = "http://purl.org/rss/1.0/modules/content/";
            return {
              title: item.querySelector("title")?.textContent || "No Title",
              link: item.querySelector("link")?.textContent || "#",
              pubDate: item.querySelector("pubDate")?.textContent || "No Date",
            };
          });
  
      setFeedItems(items);
    } catch (err) {
      setError(`Failed to load the feed :(`);
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setLoading(false);
    }
  };
  

  const formatDateTime = (pubDateString) => {
    const pubDate = new Date(pubDateString);
    const formattedDate = `${pubDate.getMonth() + 1}/${pubDate.getDate()}`;
    const formattedTime = pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate} at ${formattedTime}`;
  };




  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    if (feedUrl) {
      fetchFeed(feedUrl);
    } else {
      setError('Feed URL is missing.');
      setLoading(false);
    }
  }, [feedUrl]);




  //////////////////////////////////////
  // HANDLE LOAD MORE
  const handleLoadMore = () => {
    setStartIndex((prevIndex) => {
      const nextIndex = prevIndex + 6;
      return nextIndex >= feedItems.length ? 0 : nextIndex;
    });
  };




  //////////////////////////////////////
  // RENDER
  const visibleItems = feedItems.slice(startIndex, startIndex + 6);

  return (
    <section className="feed">
      {loading ? (
        <Loader /> // Show loader while waiting for feed data

      ) : error ? (
        <div className="box">
           <div className="head"> <h2>{feedTitle}</h2></div>
           <div className="items"><div className="error">{error}</div></div>
        </div>


      ) : (
        <div className="box">
          <div className="head">
            <h2><a href={channelLink} target="_blank" rel="noopener noreferrer">{feedTitle}</a></h2>
            <More 
              className="more"
              onClick={handleLoadMore}
            />
          </div> 
          <div className="items">
          {visibleItems.map((item, index) => (
            <div key={index} className="feed-item">
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <h3>{item.title}</h3>
              </a>
              <p>{formatDateTime(item.pubDate)}</p>
            </div>
          ))}
         </div>
        </div>
      )}
    </section>
  );
};

export default Feed;
