
import { initializeApp, getApp, getApps } from 'firebase/app';
// Using namespace import to bypass 'no exported member' errors in specific TS/Vite environments
import * as firebaseAuth from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

// Destructure values from the auth namespace. Using 'as any' as a final fallback to suppress strict type errors 
// if the environment's module mapping for 'firebase/auth' is completely missing named export definitions.
const { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  GoogleAuthProvider 
} = firebaseAuth as any;

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

// Initialize Firebase services using direct function calls from the extracted members
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization partial warning:", error);
}

// Re-export methods for use in the app
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
