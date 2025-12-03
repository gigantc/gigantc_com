import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'feeds';


//////////////////////////////////////
// FETCH ALL FEEDS
export const fetchFeeds = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const feeds = [];

    querySnapshot.forEach((doc) => {
      feeds.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by order field, fallback to existing order if no order field
    feeds.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999999;
      const orderB = b.order !== undefined ? b.order : 999999;
      return orderA - orderB;
    });

    return feeds;
  } catch (error) {
    console.error('Error fetching feeds:', error);
    throw new Error('Failed to load feeds. Please try again.');
  }
};


//////////////////////////////////////
// ADD NEW FEED
export const addFeed = async (feedData) => {
  try {
    // Validate input
    if (!feedData.feedTitle || !feedData.feedUrl) {
      throw new Error('Feed title and URL are required');
    }

    // Get current count to set order for new feed
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const currentCount = querySnapshot.size;

    // Add to Firestore with order field
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      feedTitle: feedData.feedTitle.trim(),
      feedUrl: feedData.feedUrl.trim(),
      order: currentCount
    });

    return {
      id: docRef.id,
      feedTitle: feedData.feedTitle.trim(),
      feedUrl: feedData.feedUrl.trim(),
      order: currentCount
    };
  } catch (error) {
    console.error('Error adding feed:', error);
    throw new Error(error.message || 'Failed to add feed. Please try again.');
  }
};


//////////////////////////////////////
// UPDATE EXISTING FEED
export const updateFeed = async (id, feedData) => {
  try {
    // Validate input
    if (!feedData.feedTitle || !feedData.feedUrl) {
      throw new Error('Feed title and URL are required');
    }

    const feedRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(feedRef, {
      feedTitle: feedData.feedTitle.trim(),
      feedUrl: feedData.feedUrl.trim()
    });

    return {
      id,
      feedTitle: feedData.feedTitle.trim(),
      feedUrl: feedData.feedUrl.trim()
    };
  } catch (error) {
    console.error('Error updating feed:', error);
    throw new Error('Failed to update feed. Please try again.');
  }
};


//////////////////////////////////////
// DELETE FEED
export const deleteFeed = async (id) => {
  try {
    const feedRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(feedRef);
    return true;
  } catch (error) {
    console.error('Error deleting feed:', error);
    throw new Error('Failed to delete feed. Please try again.');
  }
};


//////////////////////////////////////
// UPDATE FEED ORDER (for drag and drop)
export const updateFeedOrder = async (feeds) => {
  try {
    // Update each feed's order field in Firestore
    const updatePromises = feeds.map((feed, index) => {
      const feedRef = doc(db, COLLECTION_NAME, feed.id);
      return updateDoc(feedRef, { order: index });
    });

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating feed order:', error);
    throw new Error('Failed to update feed order. Please try again.');
  }
};
