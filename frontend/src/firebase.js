// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDjAc9lHSzwBcPG0drtPUzkVCbMvAvdsk",
  authDomain: "pharmacy-app-ed68f.firebaseapp.com",
  projectId: "pharmacy-app-ed68f",
  storageBucket: "pharmacy-app-ed68f.firebasestorage.app",
  messagingSenderId: "834620940680",
  appId: "1:834620940680:web:9a875cb68aea8cc252da3d",
  measurementId: "G-3MXZTDC63J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth for Phone Verification
export const auth = getAuth(app);
auth.languageCode = 'en'; // Force English
