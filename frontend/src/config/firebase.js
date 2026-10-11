import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// EHBVS Solutions / Employee Management Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAfR5XX9hSYbsqjF72J5leNTyv73mbNiRo",
  authDomain: "employee-management-e9961.firebaseapp.com",
  projectId: "employee-management-e9961",
  storageBucket: "employee-management-e9961.firebasestorage.app",
  messagingSenderId: "35549686013",
  appId: "1:35549686013:web:cb05a29b74f3ea58cfb694",
  measurementId: "G-3BVDKQXGEB"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
