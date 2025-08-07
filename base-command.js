import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsDQ8AzInwgdA8gO9XOTIiqVUtOH5FYNQ",
  authDomain: "biblioteca-souza-nilo.firebaseapp.com",
  projectId: "biblioteca-souza-nilo",
  storageBucket: "biblioteca-souza-nilo.firebasestorage.app",
  messagingSenderId: "927105626349",
  appId: "1:927105626349:web:58b89b3fc32438bdde1ce4",
  measurementId: "G-HYC39S6B8W"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
