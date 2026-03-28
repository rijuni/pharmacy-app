import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAgu2aZyN0wo1qTU9eAY55mwzpAAntgI8c",
  authDomain: "pharmacy-app-21285.firebaseapp.com",
  projectId: "pharmacy-app-21285",
  storageBucket: "pharmacy-app-21285.firebasestorage.app",
  messagingSenderId: "995877836813",
  appId: "1:995877836813:web:47927acff095fff3419d44",
  measurementId: "G-4F4MTJFGDQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


// Analytics (optional — only works in production, silently skipped in dev)
try {
  getAnalytics(app);
} catch (_) {
  // Analytics not supported in this environment
}

export default app;
