
import { initializeApp, getApp, getApps } from 'firebase/app';
// Using namespace imports to avoid "no exported member" errors in some environments
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';

// 安全地獲取環境變數
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key] || "";
    }
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key] || "";
    }
  } catch (e) {}
  return "";
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

// 即使配置不完全也嘗試初始化，以保證 auth/db 物件存在（雖然 API 調用會失敗，但不會導致前端 crash）
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

// Initialize Firebase services using namespace methods to avoid resolution issues
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Accessing methods through the namespace to satisfy the compiler
  auth = firebaseAuth.getAuth(app);
  db = firebaseFirestore.getFirestore(app);
  googleProvider = new firebaseAuth.GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization partial warning:", error);
}

// Extracting methods from the namespace for named re-exporting
const onAuthStateChanged = firebaseAuth.onAuthStateChanged;
const signInWithPopup = firebaseAuth.signInWithPopup;
const signInAnonymously = firebaseAuth.signInAnonymously;
const signOut = firebaseAuth.signOut;

const doc = firebaseFirestore.doc;
const getDoc = firebaseFirestore.getDoc;
const setDoc = firebaseFirestore.setDoc;
const updateDoc = firebaseFirestore.updateDoc;

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
