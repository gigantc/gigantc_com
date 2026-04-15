import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/containers/Header/Header';
import Loader from '@/components/Loader/Loader';
import DoomscrollStory from '@/components/DoomscrollStory/DoomscrollStory';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, isCacheValid, setCachedFeeds } from '@/utils/feedCache';
import { clearStoryCache, getCachedStories, isStoryCacheValid, setCachedStories } from '@/utils/doomscrollCache';
import { fetchParsedFeed, formatStoryTimestamp } from '@/utils/rss';
import './Doomscroll.scss';

const INITIAL_BATCH = 25;
const BATCH_SIZE = 20;
const PULL_THRESHOLD = 90;
const MAX_PULL_DISTANCE = 140;

const sortStories = (stories) => {
  return [...stories].sort((a, b) => {
    if (a.pubTimestamp === null && b.pubTimestamp === null) {
      return 0;
    }

    if (a.pubTimestamp === null) {
      return 1;
    }

    if (b.pubTimestamp === null) {
      return -1;
    }

    return b.pubTimestamp - a.pubTimestamp;
  });
};

const Doomscroll = () => {
  const [stories, setStories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const loadMoreRef = useRef(null);
  const touchStartYRef = useRef(null);
  const pullingRef = useRef(false);

  const visibleStories = useMemo(() => {
    return stories.slice(0, visibleCount);
  }, [stories, visibleCount]);

  const loadStories = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
      setStories([]);
      setVisibleCount(INITIAL_BATCH);
      setLoading(true);
      clearStoryCache();
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      if (!forceRefresh && isStoryCacheValid()) {
        const cachedStories = getCachedStories();
        if (cachedStories?.length) {
          const sortedStories = sortStories(cachedStories);
          setStories(sortedStories);
          setVisibleCount(INITIAL_BATCH);
          return;
        }
      }

      let feeds;
      if (!forceRefresh && isCacheValid()) {
        feeds = getCachedFeeds();
      }

      if (!feeds?.length) {
        feeds = await fetchFeeds();
        setCachedFeeds(feeds);
      }

      const results = await Promise.allSettled(
        feeds.map(async (feed) => {
          const { items } = await fetchParsedFeed(feed.feedUrl);
          return items.map((item) => ({
            id: item.id,
            sourceTitle: feed.feedTitle,
            sourceFeedUrl: feed.feedUrl,
            storyTitle: item.title,
            storyUrl: item.link,
            pubDateRaw: item.pubDate,
            pubTimestamp: item.pubTimestamp,
            displayTime: formatStoryTimestamp(item.pubTimestamp),
            excerpt: item.excerpt,
          }));
        })
      );

      const mergedStories = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value);

      if (mergedStories.length === 0) {
        throw new Error('Failed to load stories.');
      }

      const sortedStories = sortStories(mergedStories);
      setStories(sortedStories);
      setCachedStories(sortedStories);
      setVisibleCount(INITIAL_BATCH);

      if (results.some((result) => result.status === 'rejected')) {
        console.warn('Some feeds failed to load for doomscroll.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load stories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || loading || refreshing || visibleCount >= stories.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + BATCH_SIZE, stories.length));
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, refreshing, stories.length, visibleCount]);

  const handleTouchStart = (event) => {
    if (window.scrollY > 0 || refreshing) {
      touchStartYRef.current = null;
      pullingRef.current = false;
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    pullingRef.current = true;
  };

  const handleTouchMove = (event) => {
    if (!pullingRef.current || touchStartYRef.current === null || window.scrollY > 0) {
      return;
    }

    const currentY = event.touches[0].clientY;
    const delta = currentY - touchStartYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    event.preventDefault();
    setPullDistance(Math.min(delta * 0.55, MAX_PULL_DISTANCE));
  };

  const handleTouchEnd = async () => {
    pullingRef.current = false;
    touchStartYRef.current = null;

    if (pullDistance >= PULL_THRESHOLD) {
      setPullDistance(0);
      await loadStories(true);
      return;
    }

    setPullDistance(0);
  };

  return (
    <>
      <Header />
      <main
        className="doomscrollPage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="wrap">
          <section className="doomscrollList" style={{ transform: `translateY(${pullDistance}px)` }}>
            {loading ? (
              <div className="doomscrollLoader">
                <Loader />
              </div>
            ) : error ? (
              <div className="doomscrollMessage">
                <p>{error}</p>
                <button onClick={() => loadStories(true)}>Retry</button>
              </div>
            ) : (
              <>
                {visibleStories.map((story) => (
                  <DoomscrollStory key={story.id} story={story} />
                ))}

                <div ref={loadMoreRef} className="scrollSentinel">
                  {visibleCount < stories.length ? 'Loading more stories...' : 'End of feed'}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default Doomscroll;
