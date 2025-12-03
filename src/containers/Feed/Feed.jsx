import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '@/components/Loader/Loader';
import FeedBox from '@/components/FeedBox/FeedBox';
import { DISPLAY, getProxyUrl } from '@/config';
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
  // HANDLE LOAD MORE
  const handleLoadMore = () => {
    setStartIndex((prevIndex) => {
      const nextIndex = prevIndex + DISPLAY.FEED_ITEMS_PER_PAGE;
      return nextIndex >= feedItems.length ? 0 : nextIndex;
    });
  };


  //////////////////////////////////////
  // HANDLE REFRESH
  const handleRefresh = () => {
    // console.log('--refreshing--');
    fetchFeed(feedUrl);
    setStartIndex(0);
  }


  //////////////////////////////////////
  // FILTERS FOR PROBLEMATIC FEEDS
  //special parsing for ATOM feeds
  const getEntryLink = (entry) => {
    const links = entry.getElementsByTagName("link");
    for (let i = 0; i < links.length; i++) {
      const rel = links[i].getAttribute("rel");
      if (!rel || rel === "alternate") {
        return links[i].getAttribute("href");
      }
    }
    return "#";
  };
  // special parsing for non-atom feeds
  const getItemLink = (item) => {
  const links = item.getElementsByTagName("link");
  for (let i = 0; i < links.length; i++) {
    if (links[i].namespaceURI === null || links[i].namespaceURI === "") {
      return links[i].textContent;
    }
  }
  return "#";
};


  //////////////////////////////////////
  // FETCH RSS FEED
  const fetchFeed = async (url) => {
    try {
      const proxyUrl = getProxyUrl(url);
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
            link: getEntryLink(entry),
            pubDate: entry.querySelector("updated")?.textContent || "No Date",
          }))
        : Array.from(xml.querySelectorAll("item")).map((item) => {
            const contentNamespace = "http://purl.org/rss/1.0/modules/content/";
            return {
              title: item.querySelector("title")?.textContent || "No Title",
              link: getItemLink(item),
              pubDate: item.querySelector("pubDate")?.textContent || "No Date",
            };
          });
      
      // console.log(items);
  
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
  // RENDER
  const visibleItems = feedItems.slice(startIndex, startIndex + DISPLAY.FEED_ITEMS_PER_PAGE);

  return (
    <section className="feed">
      {loading ? (
        // Show loader while waiting for feed data
        <Loader /> 

      ) : error ? (
        <div className="box">
          <div className="head">
            <h2><a href={channelLink} target="_blank" rel="noopener noreferrer">{feedTitle}</a></h2>
          </div>
          <div className="items"><div className="error">{error}</div></div>
        </div>


      ) : (
        <FeedBox 
          feedTitle={feedTitle}
          channelLink={channelLink}
          visibleItems={visibleItems}
          handleLoadMore={handleLoadMore}
          handleRefresh={handleRefresh}
          formatDateTime={formatDateTime}
        />
      )}
    </section>
  );
};

export default Feed;
