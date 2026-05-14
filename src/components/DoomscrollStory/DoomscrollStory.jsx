/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import UpvoteIcon from '@/assets/upvote.svg?react';
import ShareIcon from '@/assets/share.svg?react';
import { isSaved, subscribeToSavedStories, toggleSaved } from '@/utils/savedStories';
import { markViewed } from '@/utils/viewedStories';

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';


// Build the payload shape used by savedStories / viewedStories utilities
const buildPayload = (story) => ({
  id: story.id,
  sourceTitle: story.sourceTitle,
  sourceFeedUrl: story.sourceFeedUrl,
  storyTitle: story.storyTitle,
  storyUrl: story.storyUrl,
  pubDateRaw: story.pubDateRaw,
  pubTimestamp: story.pubTimestamp,
  displayTime: story.displayTime,
  excerpt: story.excerpt,
  imageUrl: story.imageUrl,
});

const DoomscrollStory = ({ story }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [saved, setSaved] = useState(() => isSaved(story.id));
  const showImage = Boolean(story.imageUrl) && !imageFailed;

  // Keep local saved state in sync with localStorage changes from other instances
  useEffect(() => {
    return subscribeToSavedStories(() => setSaved(isSaved(story.id)));
  }, [story.id]);


  //////////////////////////////////////
  // HANDLERS
  const handleSave = () => setSaved(toggleSaved(buildPayload(story)));
  const handleView = () => markViewed(buildPayload(story));

  const handleShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({ title: story.storyTitle, url: story.storyUrl });
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };


  //////////////////////////////////////
  // RENDER
  return (
    <article className="doomscroll-story">
      <div className="meta">
        <span className="source">{story.sourceTitle}</span>
        <span className="timestamp">{story.displayTime}</span>
      </div>

      <div className={`storyBody ${showImage ? 'hasImage' : ''}`}>
        <div className="storyText">
          <a
            href={story.storyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="headline-link"
            onClick={handleView}
          >
            <h2>{story.storyTitle}</h2>
          </a>

          {story.excerpt && <p>{story.excerpt}</p>}
        </div>

        {showImage && (
          <a
            href={story.storyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="storyThumb"
            aria-hidden="true"
            tabIndex="-1"
            onClick={handleView}
          >
            <img src={story.imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
          </a>
        )}
      </div>

      <div className="storyActions">
        <button
          type="button"
          className={`storyAction storyAction--upvote ${saved ? 'isActive' : ''}`}
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved' : 'Save for later'}
        >
          <UpvoteIcon />
        </button>

        {canShare && (
          <button
            type="button"
            className="storyAction"
            onClick={handleShare}
            aria-label="Share story"
          >
            <ShareIcon />
          </button>
        )}
      </div>
    </article>
  );
};

export default DoomscrollStory;
