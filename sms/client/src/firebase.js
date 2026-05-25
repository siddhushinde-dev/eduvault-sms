// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmkzYa0adxcH059fCQyBrRWUtgCIXS0",
  authDomain: "student-management-saas.firebaseapp.com",
  databaseURL: "https://student-management-saas-default-db.firebaseio.com",
  projectId: "student-management-saas",
  storageBucket: "student-management-saas.firebasestorage.app",
  messagingSenderId: "5142493147",
  appId: "1:514249316347:web:df76a9a41bede0b9dd5e",
  measurementId: "G-MG5GYQVZ"
};

// Initialize Firebase (handle hot reload / repeated imports safely)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // ignore analytics in non-browser or unsupported environments
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export const firebaseApp = app;
