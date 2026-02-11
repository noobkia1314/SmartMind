
// DO NOT use namespaced imports for Firebase v9+ modular SDK
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Note: Ensure these environment variables are set in your Vercel/hosting provider dashboard
// These are standard Firebase configuration values
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smartmind-coach.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "smartmind-coach",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smartmind-coach.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Re-exporting functions and types to bypass potential module resolution issues in App.tsx
export { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
};

export type { User };
