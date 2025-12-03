import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

//////////////////////////////////////
// TODO: Copy this file to config.js and replace with your Firebase project config
// Get this from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


//////////////////////////////////////
// Initialize Firebase
const app = initializeApp(firebaseConfig);


//////////////////////////////////////
// Initialize Firestore
export const db = getFirestore(app);
