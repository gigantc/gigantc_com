import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/containers/Header/Header';
import Loader from '@/components/Loader/Loader';
import DoomscrollStory from '@/components/DoomscrollStory/DoomscrollStory';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, isCacheValid, setCachedFeeds } from '@/utils/feedCache';
import { clearStoryCache, getCachedStories, isStoryCacheValid, setCachedStories } from '@/utils/doomscrollCache';
import { fetchParsedFeed, formatStoryTimestamp } from '@/utils/rss';
import { DISPLAY } from '@/config';
import './Doomscroll.scss';

const PAGE_SIZE = DISPLAY.DOOMSCROLL_MAX_ITEMS_PER_SOURCE;
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
  const [itemsBySource, setItemsBySource] = useState({});
  const [perSourcePage, setPerSourcePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const loadMoreRef = useRef(null);
  const touchStartYRef = useRef(null);
  const pullingRef = useRef(false);

  const visibleStories = useMemo(() => {
    const sources = Object.values(itemsBySource);
    const out = [];
    for (let round = 0; round < perSourcePage; round += 1) {
      const start = round * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const roundItems = sources.flatMap((items) => items.slice(start, end));
      if (roundItems.length === 0) continue;
      out.push(...sortStories(roundItems));
    }
    return out;
  }, [itemsBySource, perSourcePage]);

  const hasMoreRounds = useMemo(() => {
    const cutoff = perSourcePage * PAGE_SIZE;
    return Object.values(itemsBySource).some((items) => items.length > cutoff);
  }, [itemsBySource, perSourcePage]);

  const loadStories = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
      setItemsBySource({});
      setPerSourcePage(1);
      setLoading(true);
      clearStoryCache();
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      if (!forceRefresh && isStoryCacheValid()) {
        const cached = getCachedStories();
        if (cached && typeof cached === 'object' && !Array.isArray(cached) && Object.keys(cached).length) {
          setItemsBySource(cached);
          setPerSourcePage(1);
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
          const sortedItems = sortStories(items).map((item) => ({
            id: item.id,
            sourceTitle: feed.feedTitle,
            sourceFeedUrl: feed.feedUrl,
            storyTitle: item.title,
            storyUrl: item.link,
            pubDateRaw: item.pubDate,
            pubTimestamp: item.pubTimestamp,
            displayTime: formatStoryTimestamp(item.pubTimestamp),
            excerpt: item.excerpt,
            imageUrl: item.imageUrl,
          }));
          return { feedUrl: feed.feedUrl, items: sortedItems };
        })
      );

      const merged = {};
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.items.length) {
          merged[result.value.feedUrl] = result.value.items;
        }
      }

      if (Object.keys(merged).length === 0) {
        throw new Error('Failed to load stories.');
      }

      setItemsBySource(merged);
      setCachedStories(merged);
      setPerSourcePage(1);

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
    if (!node || loading || refreshing || !hasMoreRounds) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPerSourcePage((current) => current + 1);
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, refreshing, hasMoreRounds]);

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
                  {hasMoreRounds ? 'Loading more stories...' : 'End of feed'}
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
