import React from "react";
import More from '@/assets/forward.svg?react';
import Refresh from '@/assets/refresh.svg?react';
import './FeedBox.scss';

const FeedBox = ({ 
  feedTitle,
  channelLink,
  visibleItems,
  handleLoadMore,
  handleRefresh,
  formatDateTime, 
}) => {


  return (
    <div className="box">
      <div className="head">
        <h2><a href={channelLink} target="_blank" rel="noopener noreferrer">{feedTitle}</a></h2>
        <More 
          className="more"
          onClick={handleLoadMore}
        />
        <Refresh 
          className="refresh"
          onClick={handleRefresh}
        />
      </div> 
      <div className="items">
      {visibleItems.map((item, index) => (
        <div key={index} className="feed-item">
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            <h3>{new DOMParser().parseFromString(item.title, "text/html").body.textContent}</h3>
          </a>
          <p>{formatDateTime(item.pubDate)}</p>
        </div>
      ))}
      </div>
    </div>
  );
}


export default FeedBox;
