
import { initializeApp, getApp, getApps } from 'firebase/app';
// Fix: Use namespace import for auth to resolve "no exported member" errors in certain module resolution contexts
import * as authModule from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

// Fix: Destructure from authModule to fix import errors while keeping existing logic intact
const { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut 
} = authModule;

// Helper function to safely access environment variables
const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key];
    }
  } catch (e) {
    // Silent fail
  }
  return undefined;
};

// Initialize Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

// Check if Firebase configuration is complete
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase app or retrieve the existing one
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      googleProvider = new GoogleAuthProvider();
      console.log("Firebase auth initialized");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is missing or incomplete. Cloud Sync features will be unavailable.");
}

export { 
  auth, 
  db, 
  googleProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc 
};
