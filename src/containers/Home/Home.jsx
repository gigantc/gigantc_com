import { lazy, Suspense } from 'react';
import Header from '../../containers/Header/Header.jsx';
import Weather from '../../containers/Weather/Weather.jsx';
import Today from '../../containers/Today/Today.jsx';
import { feeds } from '../../containers/Feed/FeedList.jsx';
import './Home.scss';

// Lazy load Feed component
const Feed = lazy(() => import('../../containers/Feed/Feed.jsx'));

const Home = () => {
  return (
    <>
      <Header />
      <div className="homeContainer">
        <div className="wrap">
          <Weather />
          <Today />
          <Suspense fallback={<div>Loading feeds...</div>}>
            {feeds.map((feed, index) => (
              <Feed key={index} feedTitle={feed.feedTitle} feedUrl={feed.feedUrl} />
            ))}
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default Home;

