// File: src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Optional: Import other Firebase services if needed (e.g., getStorage)

// --- CONFIGURATION FROM FIREBASE CONSOLE (Web App Config) ---
const firebaseConfig = {
  apiKey: "AIzaSyDAQOvuirAKbbMsh4e2RF9yOO2MmIhol9Q", // From screenshot
  authDomain: "hh-mobile-d441a.firebaseapp.com",   // From screenshot
  projectId: "hh-mobile-d441a",                 // From screenshot
  storageBucket: "hh-mobile-d441a.firebasestorage.app", // From screenshot
  messagingSenderId: "801498505630",           // From screenshot
  appId: "1:801498505630:web:731aea51a3675feec2768f" // From screenshot
};
// --- END OF CONFIG ---


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Optional: Initialize other services like Storage
// import { getStorage } from 'firebase/storage';
// const storage = getStorage(app);

// Export the initialized services so they can be used elsewhere in the app
export { auth, db }; // Add 'storage' here if you initialize and export it