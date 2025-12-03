import { useState, useEffect } from 'react';
import { fetchFeeds, addFeed, updateFeed, deleteFeed, updateFeedOrder } from '@/firebase/feedService';
import { invalidateCache } from '@/utils/feedCache';
import { arrayMove } from '@dnd-kit/sortable';
import Header from '@/containers/Header/Header';
import Loader from '@/components/Loader/Loader';
import AddFeedForm from '@/components/AddFeedForm/AddFeedForm';
import FeedsList from '@/components/FeedsList/FeedsList';
import './Admin.scss';


//////////////////////////////////////
// MAIN ADMIN COMPONENT
const Admin = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  //////////////////////////////////////
  // FETCH FEEDS ON MOUNT
  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      // Admin always fetches fresh data from Firebase (bypasses cache)
      const data = await fetchFeeds();
      setFeeds(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  //////////////////////////////////////
  // HANDLE ADD FEED
  const handleAddFeed = async (feedData) => {
    const newFeed = await addFeed(feedData);
    setFeeds([...feeds, newFeed]);
    invalidateCache(); // Invalidate cache so home page refreshes on next load
  };


  //////////////////////////////////////
  // HANDLE EDIT FEED
  const handleEditFeed = async (id, feedData) => {
    await updateFeed(id, feedData);
    setFeeds(feeds.map(f =>
      f.id === id ? { ...f, ...feedData } : f
    ));
    invalidateCache(); // Invalidate cache so home page shows updated feed
  };


  //////////////////////////////////////
  // HANDLE DELETE FEED
  const handleDeleteFeed = async (id) => {
    await deleteFeed(id);
    const newFeeds = feeds.filter(f => f.id !== id);
    setFeeds(newFeeds);
    // Update order after deletion
    await updateFeedOrder(newFeeds);
    invalidateCache(); // Invalidate cache so home page shows feed removal
  };


  //////////////////////////////////////
  // HANDLE DRAG END
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = feeds.findIndex((feed) => feed.id === active.id);
    const newIndex = feeds.findIndex((feed) => feed.id === over.id);

    const newFeeds = arrayMove(feeds, oldIndex, newIndex);
    setFeeds(newFeeds);

    // Update order in Firestore
    try {
      await updateFeedOrder(newFeeds);
      invalidateCache(); // Invalidate cache so home page shows new order
    } catch (err) {
      alert('Failed to save new order: ' + err.message);
      // Revert on error
      setFeeds(feeds);
    }
  };


  //////////////////////////////////////
  // RENDER
  return (
    <>
      <Header />
      <div className="adminContainer">
        <div className="wrap">
          <section className="admin">
            {loading ? (
              <Loader />
            ) : (
              <div className="box">
                {error && (
                  <div className="error">
                    <p>{error}</p>
                    <button onClick={loadFeeds}>Retry</button>
                  </div>
                )}

                <AddFeedForm onAddFeed={handleAddFeed} />

                <FeedsList
                  feeds={feeds}
                  onDragEnd={handleDragEnd}
                  onEditFeed={handleEditFeed}
                  onDeleteFeed={handleDeleteFeed}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Admin;
