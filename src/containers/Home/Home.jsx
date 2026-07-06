import { useState, useEffect, lazy, Suspense } from 'react';
import Header from '@/containers/Header/Header';
import Weather from '@/containers/Weather/Weather';
import Moon from '@/containers/Moon/Moon';
import Markets from '@/containers/Markets/Markets';
import Today from '@/containers/Today/Today';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, setCachedFeeds, isCacheValid } from '@/utils/feedCache';
import './Home.scss';

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
          const cached = getCachedFeeds();
          if (cached?.length) {
            setFeeds(cached);
            setLoading(false);
            return;
          }
        }

        // Cache is invalid or empty - fetch from Firebase
        const data = await fetchFeeds();
        setFeeds(data);
        setCachedFeeds(data);
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
          <Moon />
          <Markets />
          <Today />

          {loading ? (
            <div className="feedsLoading">Loading feeds...</div>
          ) : error ? (
            <div className="feedsError">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <Suspense fallback={<div className="feedsLoading">Loading feeds...</div>}>
              {feeds.map((feed) => (
                <Feed key={feed.id} feedTitle={feed.feedTitle} feedUrl={feed.feedUrl} />
              ))}
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
