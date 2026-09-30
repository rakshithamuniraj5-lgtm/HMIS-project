import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDMwuUwZTf84dIZPmN-h4ZNjPHFCGZCdlg",
  authDomain: "dental-clinic-40a20.firebaseapp.com",
  projectId: "dental-clinic-40a20",
  storageBucket: "dental-clinic-40a20.firebasestorage.app",
  messagingSenderId: "691532303172",
  appId: "1:691532303172:web:604a4faf75a947a7ee6511",
};

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] || DEFAULT_FIREBASE_CONFIG.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "your-project-id"
);

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  // Initialize with config (or dummy placeholder for graceful dev/SSR execution if keys are not yet pasted)
  return initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : {
          apiKey: "AIzaSyFakeKeyForLocalFallback123456789",
          authDomain: "hmis-project-local.firebaseapp.com",
          projectId: "hmis-project-local",
          storageBucket: "hmis-project-local.appspot.com",
          messagingSenderId: "123456789012",
          appId: "1:123456789012:web:abcdef1234567890",
        }
  );
}

export const app: FirebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
