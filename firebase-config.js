// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD93YiLLyTx1IycnHcArDKbgxvK_se27eA",
  authDomain: "studyflow-6ed25.firebaseapp.com",
  projectId: "studyflow-6ed25",
  storageBucket: "studyflow-6ed25.firebasestorage.app",
  messagingSenderId: "562903369542",
  appId: "1:562903369542:web:3f8bceb14d749870fc0747",
  measurementId: "G-TD7DS8YKS8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics }; 