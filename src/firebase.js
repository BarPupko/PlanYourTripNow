import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAriwME6CybqyDw1e3yNTwF6sHk4NUn7oY",
  authDomain: "planyourtrip-ed010.firebaseapp.com",
  databaseURL: "https://planyourtrip-ed010-default-rtdb.firebaseio.com",
  projectId: "planyourtrip-ed010",
  storageBucket: "planyourtrip-ed010.firebasestorage.app",
  messagingSenderId: "889865160214",
  appId: "1:889865160214:web:3cbe594765950e07609737",
  measurementId: "G-1TY4MKM2D9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

export default app;
