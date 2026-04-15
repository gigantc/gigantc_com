/* eslint-disable react/prop-types */
const DoomscrollStory = ({ story }) => {
  return (
    <article className="doomscroll-story">
      <div className="meta">
        <span className="source">{story.sourceTitle}</span>
        <span className="timestamp">{story.displayTime}</span>
      </div>

      <a href={story.storyUrl} target="_blank" rel="noopener noreferrer" className="headline-link">
        <h2>{story.storyTitle}</h2>
      </a>

      {story.excerpt && <p>{story.excerpt}</p>}
    </article>
  );
};

export default DoomscrollStory;
