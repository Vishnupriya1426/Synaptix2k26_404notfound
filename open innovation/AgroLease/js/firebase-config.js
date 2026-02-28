// js/firebase-config.js

// IMPORTANT: Replace these values with your actual Firebase project configuration
// To get these: Firebase Console -> Project Settings -> General -> Web App
const firebaseConfig = {
  apiKey: "AIzaSyCvmyeOl-7AbPzfstGSb9HADhztpwMOUck",
  authDomain: "agrolease-5ca41.firebaseapp.com",
  projectId: "agrolease-5ca41",
  storageBucket: "agrolease-5ca41.firebasestorage.app",
  messagingSenderId: "356347389434",
  appId: "1:356347389434:web:6a766fd2eb1a0a9e29f043"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
