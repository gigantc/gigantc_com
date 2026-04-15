import { useState, useEffect } from 'react';
import Loader from '@/components/Loader/Loader';
import FeedBox from '@/components/FeedBox/FeedBox';
import { DISPLAY } from '@/config';
import { fetchParsedFeed, formatStoryTimestamp } from '@/utils/rss';
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
  // FETCH RSS FEED
  const fetchFeed = async (url) => {
    try {
      const { channelLink: link, items } = await fetchParsedFeed(url);
      setChannelLink(link);
      setFeedItems(items);
      setError(null);
    } catch (err) {
      setError(`Failed to load the feed :(`);
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setLoading(false);
    }
  };
  

  const formatDateTime = (pubDateString) => {
    const timestamp = Date.parse(pubDateString);
    return formatStoryTimestamp(Number.isNaN(timestamp) ? null : timestamp);
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
