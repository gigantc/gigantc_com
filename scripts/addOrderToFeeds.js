// Script to add 'order' field to existing feeds in Firestore
// Run this once with: node scripts/addOrderToFeeds.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Import your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB270fW6viattRCXOfLHR1tvgxqRNOKbR0",
  authDomain: "rss-reader-v3.firebaseapp.com",
  projectId: "rss-reader-v3",
  storageBucket: "rss-reader-v3.firebasestorage.app",
  messagingSenderId: "725503462619",
  appId: "1:725503462619:web:63447c24aa8df8a6a250fe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addOrderToExistingFeeds() {
  try {
    console.log('Fetching feeds...');
    const querySnapshot = await getDocs(collection(db, 'feeds'));

    if (querySnapshot.empty) {
      console.log('No feeds found in Firestore.');
      return;
    }

    console.log(`Found ${querySnapshot.size} feeds. Adding order field...`);

    let updated = 0;
    let skipped = 0;

    // Update each feed with an order field
    const promises = [];
    querySnapshot.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();

      // Only update if order field doesn't exist
      if (data.order === undefined) {
        const feedRef = doc(db, 'feeds', docSnapshot.id);
        promises.push(
          updateDoc(feedRef, { order: index })
            .then(() => {
              console.log(`✓ Updated ${data.feedTitle || 'Unnamed'} (order: ${index})`);
              updated++;
            })
        );
      } else {
        console.log(`- Skipped ${data.feedTitle || 'Unnamed'} (already has order: ${data.order})`);
        skipped++;
      }
    });

    await Promise.all(promises);

    console.log('\n✅ Done!');
    console.log(`Updated: ${updated} feeds`);
    console.log(`Skipped: ${skipped} feeds (already had order field)`);
    console.log('\nYou can now reorder feeds in the /admin page by dragging and dropping.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addOrderToExistingFeeds();
