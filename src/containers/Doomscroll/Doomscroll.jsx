/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/containers/Header/Header';
import Loader from '@/components/Loader/Loader';
import DoomscrollStory from '@/components/DoomscrollStory/DoomscrollStory';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, isCacheValid, setCachedFeeds } from '@/utils/feedCache';
import { clearStoryCache, getCachedStories, isStoryCacheValid, setCachedStories } from '@/utils/doomscrollCache';
import { fetchParsedFeed, formatStoryTimestamp } from '@/utils/rss';
import { getSavedStories, subscribeToSavedStories } from '@/utils/savedStories';
import { getViewedStories, subscribeToViewedStories } from '@/utils/viewedStories';
import { DISPLAY } from '@/config';
import './Doomscroll.scss';

const PAGE_SIZE = DISPLAY.DOOMSCROLL_MAX_ITEMS_PER_SOURCE;
const PULL_THRESHOLD = 90;
const MAX_PULL_DISTANCE = 140;


//////////////////////////////////////
// SORT STORIES BY TIMESTAMP (DESC)
// Stories with no timestamp sort to the bottom
const sortByTimestampDesc = (stories) => [...stories].sort((a, b) => {
  if (a.pubTimestamp === null && b.pubTimestamp === null) return 0;
  if (a.pubTimestamp === null) return 1;
  if (b.pubTimestamp === null) return -1;
  return b.pubTimestamp - a.pubTimestamp;
});


//////////////////////////////////////
// EMPTY STATE + LIST HELPERS
const EmptyMessage = ({ children }) => (
  <div className="doomscrollMessage">
    <p>{children}</p>
    <Link to="/doomscroll">Back to feed</Link>
  </div>
);

const StoryList = ({ stories, endLabel }) => (
  <>
    {stories.map((story) => (
      <DoomscrollStory key={story.id} story={story} />
    ))}
    <div className="scrollSentinel">{endLabel}</div>
  </>
);

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// MAIN DOOMSCROLL COMPONENT
const Doomscroll = () => {
  const [searchParams] = useSearchParams();
  const upvotedView = searchParams.get('view') === 'upvoted';
  const viewedView = searchParams.get('view') === 'viewed';
  const sourceId = searchParams.get('source');

  const [savedStories, setSavedStories] = useState(() => getSavedStories());
  const [viewedStories, setViewedStories] = useState(() => getViewedStories());
  const [feeds, setFeeds] = useState([]);
  const [itemsBySource, setItemsBySource] = useState({});
  const [perSourcePage, setPerSourcePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const loadMoreRef = useRef(null);
  const touchStartYRef = useRef(null);
  const pullingRef = useRef(false);

  //////////////////////////////////////
  // SUBSCRIBE TO LOCALSTORAGE EVENTS
  useEffect(() => subscribeToSavedStories(() => setSavedStories(getSavedStories())), []);
  useEffect(() => subscribeToViewedStories(() => setViewedStories(getViewedStories())), []);

  //////////////////////////////////////
  // DERIVED STORY LISTS
  // Saved & viewed sorted newest-first by their timestamp
  const sortedSavedStories = useMemo(
    () => [...savedStories].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)),
    [savedStories]
  );

  const sortedViewedStories = useMemo(
    () => [...viewedStories].sort((a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0)),
    [viewedStories]
  );

  //////////////////////////////////////
  // SINGLE-SOURCE VIEW
  // When ?source=<id> is set, only show stories from that feed
  const sourceFeed = sourceId ? feeds.find((f) => f.id === sourceId) : null;
  const sourceView = Boolean(sourceId);
  const sourceStories = useMemo(() => {
    if (!sourceFeed) return [];
    return itemsBySource[sourceFeed.feedUrl] ?? [];
  }, [sourceFeed, itemsBySource]);


  //////////////////////////////////////
  // PAGINATED ROUND-ROBIN FEED
  // Walks each source in rounds of PAGE_SIZE so no single feed dominates
  const visibleStories = useMemo(() => {
    const sources = Object.values(itemsBySource);
    const out = [];
    for (let round = 0; round < perSourcePage; round += 1) {
      const start = round * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const roundItems = sources.flatMap((items) => items.slice(start, end));
      if (roundItems.length === 0) continue;
      out.push(...sortByTimestampDesc(roundItems));
    }
    return out;
  }, [itemsBySource, perSourcePage]);

  const hasMoreRounds = useMemo(() => {
    const cutoff = perSourcePage * PAGE_SIZE;
    return Object.values(itemsBySource).some((items) => items.length > cutoff);
  }, [itemsBySource, perSourcePage]);


  //////////////////////////////////////
  // LOAD STORIES
  // forceRefresh = true bypasses cache (used by pull-to-refresh)
  const loadStories = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
      setItemsBySource({});
      setPerSourcePage(1);
      clearStoryCache();
    }
    setLoading(true);
    setError(null);

    try {
      if (!forceRefresh && isStoryCacheValid()) {
        const cached = getCachedStories();
        if (cached && typeof cached === 'object' && !Array.isArray(cached) && Object.keys(cached).length) {
          if (isCacheValid()) {
            const cachedFeeds = getCachedFeeds();
            if (cachedFeeds?.length) setFeeds(cachedFeeds);
          }
          setItemsBySource(cached);
          setPerSourcePage(1);
          return;
        }
      }

      let loadedFeeds = !forceRefresh && isCacheValid() ? getCachedFeeds() : null;
      if (!loadedFeeds?.length) {
        loadedFeeds = await fetchFeeds();
        setCachedFeeds(loadedFeeds);
      }
      setFeeds(loadedFeeds);

      const results = await Promise.allSettled(
        loadedFeeds.map(async (feed) => {
          const { items } = await fetchParsedFeed(feed.feedUrl);
          const sortedItems = sortByTimestampDesc(items).map((item) => ({
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

  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Infinite scroll: load more rounds when the sentinel enters viewport
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || loading || refreshing || !hasMoreRounds || upvotedView || viewedView || sourceView) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPerSourcePage((current) => current + 1);
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, refreshing, hasMoreRounds, upvotedView, viewedView, sourceView]);

  //////////////////////////////////////
  // PULL-TO-REFRESH (TOUCH HANDLERS)
  const handleTouchStart = (event) => {
    if (window.scrollY > 0 || refreshing || upvotedView || viewedView || sourceView) {
      touchStartYRef.current = null;
      pullingRef.current = false;
      return;
    }
    touchStartYRef.current = event.touches[0].clientY;
    pullingRef.current = true;
  };

  const handleTouchMove = (event) => {
    if (!pullingRef.current || touchStartYRef.current === null || window.scrollY > 0) return;

    const delta = event.touches[0].clientY - touchStartYRef.current;
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

  //////////////////////////////////////
  // RENDER CONTENT
  // Branches on the current view (upvoted / viewed / single-source / default feed)
  const renderContent = () => {
    if (upvotedView) {
      return sortedSavedStories.length === 0
        ? <EmptyMessage>No saved stories yet.</EmptyMessage>
        : <StoryList stories={sortedSavedStories} endLabel="End of saved stories" />;
    }

    if (viewedView) {
      return sortedViewedStories.length === 0
        ? <EmptyMessage>No viewed stories yet.</EmptyMessage>
        : <StoryList stories={sortedViewedStories} endLabel="End of viewed stories" />;
    }

    if (sourceView) {
      if (loading) return <div className="doomscrollLoader"><Loader /></div>;
      return sourceStories.length === 0
        ? <EmptyMessage>No stories from this source.</EmptyMessage>
        : <StoryList stories={sourceStories} endLabel="End of feed" />;
    }

    if (loading) return <div className="doomscrollLoader"><Loader /></div>;

    if (error) {
      return (
        <div className="doomscrollMessage">
          <p>{error}</p>
          <button onClick={() => loadStories(true)}>Retry</button>
        </div>
      );
    }

    return (
      <>
        {visibleStories.map((story) => (
          <DoomscrollStory key={story.id} story={story} />
        ))}
        <div ref={loadMoreRef} className="scrollSentinel">
          {hasMoreRounds ? 'Loading more stories...' : 'End of feed'}
        </div>
      </>
    );
  };

  //////////////////////////////////////
  // RENDER
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
            {renderContent()}
          </section>
        </div>
      </main>
    </>
  );
};

export default Doomscroll;
