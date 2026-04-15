/* eslint-disable react/prop-types */
import { useState } from 'react';

const DoomscrollStory = ({ story }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(story.imageUrl) && !imageFailed;

  return (
    <article className="doomscroll-story">
      <div className="meta">
        <span className="source">{story.sourceTitle}</span>
        <span className="timestamp">{story.displayTime}</span>
      </div>

      <div className={`storyBody ${showImage ? 'hasImage' : ''}`}>
        <div className="storyText">
          <a href={story.storyUrl} target="_blank" rel="noopener noreferrer" className="headline-link">
            <h2>{story.storyTitle}</h2>
          </a>

          {story.excerpt && <p>{story.excerpt}</p>}
        </div>

        {showImage && (
          <a href={story.storyUrl} target="_blank" rel="noopener noreferrer" className="storyThumb" aria-hidden="true" tabIndex="-1">
            <img src={story.imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
          </a>
        )}
      </div>
    </article>
  );
};

export default DoomscrollStory;
