import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Replace this with your exact config object from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCQnsZXjOEhbZ-HmDV6MSynHG4PXDdeNtI",
  authDomain: "matrimony-app-e78da.firebaseapp.com",
  projectId: "matrimony-app-e78da",
  storageBucket: "matrimony-app-e78da.firebasestorage.app",
  messagingSenderId: "316012332323",
  appId: "1:316012332323:web:6378bda7a3a5603a3e3896",
  measurementId: "G-CYBD39FY4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth instance so we can use it in our Login component
export const auth = getAuth(app);