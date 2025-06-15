import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpJSZ5txzoDBgV5yrUonmsWkskf3HV0Gg",
  authDomain: "yonseimi-b2bb0.firebaseapp.com",
  projectId: "yonseimi-b2bb0",
  storageBucket: "yonseimi-b2bb0.firebasestorage.app",
  messagingSenderId: "753368457878",
  appId: "1:753368457878:web:1a2ae8e5254029b9db98b7",
  measurementId: "G-99G86FVZK7",
  databaseURL: "https://yonseimi-b2bb0-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

export { app, db, analytics, rtdb, auth };