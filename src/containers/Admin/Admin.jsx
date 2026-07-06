import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
import { fetchFeeds, addFeed, updateFeed, deleteFeed, updateFeedOrder, addSection, updateSection } from '@/firebase/feedService';
import { invalidateCache } from '@/utils/feedCache';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/containers/Header/Header';
import Loader from '@/components/Loader/Loader';
import AddFeedForm from '@/components/AddFeedForm/AddFeedForm';
import AddSectionForm from '@/components/AddSectionForm/AddSectionForm';
import FeedsList from '@/components/FeedsList/FeedsList';
import './Admin.scss';


//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// MAIN ADMIN COMPONENT
const Admin = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  //////////////////////////////////////
  // FETCH FEEDS ON MOUNT
  // Admin always fetches fresh data from Firebase (bypasses cache)
  const loadFeeds = async () => {
    try {
      setLoading(true);
      const data = await fetchFeeds();
      setFeeds(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);


  //////////////////////////////////////
  // HANDLE ADD FEED
  const handleAddFeed = async (feedData) => {
    const newFeed = await addFeed(feedData);
    setFeeds([...feeds, newFeed]);
    // Invalidate cache so home page refreshes on next load
    invalidateCache();
  };


  //////////////////////////////////////
  // HANDLE ADD SECTION
  const handleAddSection = async (sectionData) => {
    const newSection = await addSection(sectionData);
    setFeeds([...feeds, newSection]);
    invalidateCache();
  };


  //////////////////////////////////////
  // HANDLE EDIT (routes to feed or section based on item type)
  const handleEditFeed = async (id, itemData) => {
    const target = feeds.find((f) => f.id === id);
    if (target?.type === 'section') {
      await updateSection(id, itemData);
    } else {
      await updateFeed(id, itemData);
    }
    setFeeds(feeds.map((f) => (f.id === id ? { ...f, ...itemData } : f)));
    invalidateCache();
  };


  //////////////////////////////////////
  // HANDLE DELETE FEED
  const handleDeleteFeed = async (id) => {
    await deleteFeed(id);
    const newFeeds = feeds.filter((f) => f.id !== id);
    setFeeds(newFeeds);
    // Update order after deletion
    await updateFeedOrder(newFeeds);
    invalidateCache();
  };


  //////////////////////////////////////
  // HANDLE DRAG END
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = feeds.findIndex((feed) => feed.id === active.id);
    const newIndex = feeds.findIndex((feed) => feed.id === over.id);
    const newFeeds = arrayMove(feeds, oldIndex, newIndex);
    setFeeds(newFeeds);

    // Update order in Firestore
    try {
      await updateFeedOrder(newFeeds);
      invalidateCache();
    } catch (err) {
      alert('Failed to save new order: ' + err.message);
      // Revert on error
      setFeeds(feeds);
    }
  };


  //////////////////////////////////////
  // HANDLE SIGN OUT
  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
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
                <div className="admin-header">
                  <h1>Feed Management</h1>
                  <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
                </div>

                {error && (
                  <div className="error">
                    <p>{error}</p>
                    <button onClick={loadFeeds}>Retry</button>
                  </div>
                )}

                <AddFeedForm onAddFeed={handleAddFeed} />
                <AddSectionForm onAddSection={handleAddSection} />

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
