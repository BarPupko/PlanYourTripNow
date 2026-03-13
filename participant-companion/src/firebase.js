import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// This is the same Firebase project as the main PlanYourTrip admin app.
// Both apps share the same Firestore database — the participant-companion
// only has READ access (enforced by Firestore security rules).
const firebaseConfig = {
  apiKey: "AIzaSyAriwME6CybqyDw1e3yNTwF6sHk4NUn7oY",
  authDomain: "planyourtrip-ed010.firebaseapp.com",
  projectId: "planyourtrip-ed010",
  storageBucket: "planyourtrip-ed010.firebasestorage.app",
  messagingSenderId: "889865160214",
  appId: "1:889865160214:web:3cbe594765950e07609737",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
