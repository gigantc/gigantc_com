/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { fetchFeeds } from '@/firebase/feedService';
import { getCachedFeeds, isCacheValid, setCachedFeeds } from '@/utils/feedCache';
import './Sidebar.scss';

const SWIPE_CLOSE_THRESHOLD = 80;

const Sidebar = ({ open, onClose }) => {
  const [dragX, setDragX] = useState(0);
  const dragStartXRef = useRef(null);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const sourceId = searchParams.get('source');
  const onDoomscroll = location.pathname === '/doomscroll';

  const isHomeActive = onDoomscroll && !view && !sourceId;
  const isUpvotedActive = onDoomscroll && view === 'upvoted';
  const isViewedActive = onDoomscroll && view === 'viewed';

  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadFeeds = async () => {
      if (isCacheValid()) {
        const cached = getCachedFeeds();
        if (cached?.length) {
          if (!cancelled) setFeeds(cached);
          return;
        }
      }
      try {
        const fresh = await fetchFeeds();
        if (!cancelled) {
          setFeeds(fresh);
          setCachedFeeds(fresh);
        }
      } catch (err) {
        console.error('Sidebar feeds load failed:', err);
      }
    };

    loadFeeds();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setDragX(0);
  }, [open]);

  useEffect(() => {
    if (open && sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleTouchStart = (event) => {
    if (!open) return;
    dragStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    if (dragStartXRef.current === null) return;
    const delta = event.touches[0].clientX - dragStartXRef.current;
    setDragX(delta < 0 ? delta : 0);
  };

  const handleTouchEnd = () => {
    if (dragStartXRef.current === null) return;
    dragStartXRef.current = null;
    const shouldClose = dragX <= -SWIPE_CLOSE_THRESHOLD;
    setDragX(0);
    if (shouldClose) onClose();
  };

  const dragStyle = dragX < 0
    ? { transform: `translateX(${dragX}px)`, transition: 'none' }
    : undefined;

  return (
    <>
      <div
        className={`sidebarBackdrop ${open ? 'isOpen' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={sidebarRef}
        className={`sidebar ${open ? 'isOpen' : ''}`}
        aria-hidden={!open}
        style={dragStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebarInner">
          <nav className="sidebarNav">
            <h3 className="sidebarSection">Main</h3>
            <Link
              to="/doomscroll"
              className={`sidebarNavItem ${isHomeActive ? 'isActive' : ''}`}
              onClick={onClose}
            >
              Home
            </Link>
            <Link
              to="/doomscroll?view=upvoted"
              className={`sidebarNavItem ${isUpvotedActive ? 'isActive' : ''}`}
              onClick={onClose}
            >
              Upvoted
            </Link>
            <Link
              to="/doomscroll?view=viewed"
              className={`sidebarNavItem ${isViewedActive ? 'isActive' : ''}`}
              onClick={onClose}
            >
              Viewed
            </Link>

            <h3 className="sidebarSection">Feeds</h3>
            {feeds.map((feed) => {
              const isActive = onDoomscroll && sourceId === feed.id;
              return (
                <Link
                  key={feed.id}
                  to={`/doomscroll?source=${encodeURIComponent(feed.id)}`}
                  className={`sidebarNavItem ${isActive ? 'isActive' : ''}`}
                  onClick={onClose}
                >
                  {feed.feedTitle}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
