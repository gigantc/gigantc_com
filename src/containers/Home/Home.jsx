import { useState, useEffect, lazy, Suspense } from 'react';
import Header from '@/containers/Header/Header';
import Weather from '@/containers/Weather/Weather';
import Today from '@/containers/Today/Today';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, setCachedFeeds, isCacheValid } from '@/utils/feedCache';
import './Home.scss';

// Lazy load Feed component
const Feed = lazy(() => import('@/containers/Feed/Feed'));

const Home = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  //////////////////////////////////////
  // FETCH FEEDS (with localStorage caching)
  useEffect(() => {
    const loadFeeds = async () => {
      try {
        // Check if we have valid cached data
        if (isCacheValid()) {
          const cachedData = getCachedFeeds();
          if (cachedData && cachedData.length > 0) {
            console.log('Using cached feeds (last fetch within 24 hours)');
            setFeeds(cachedData);
            setLoading(false);
            return;
          }
        }

        // Cache is invalid or empty - fetch from Firebase
        console.log('Fetching feeds from Firebase...');
        const data = await fetchFeeds();
        setFeeds(data);
        setCachedFeeds(data); // Save to cache
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadFeeds();
  }, []);


  //////////////////////////////////////
  // RENDER
  return (
    <>
      <Header />
      <div className="homeContainer">
        <div className="wrap">
          <Weather />
          <Today />

          {loading ? (
            <div className="feedsLoading">Loading feeds...</div>
          ) : error ? (
            <div className="feedsError">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <Suspense fallback={<div>Loading feeds...</div>}>
              {feeds.map((feed, index) => (
                <Feed key={feed.id || index} feedTitle={feed.feedTitle} feedUrl={feed.feedUrl} />
              ))}
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;

