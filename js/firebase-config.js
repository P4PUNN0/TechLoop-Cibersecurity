import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-ymTWMvzVotmhsk9CQ6jnT-KjOXn1QLc",
  authDomain: "techloop-dd0f9.firebaseapp.com",
  projectId: "techloop-dd0f9",
  storageBucket: "techloop-dd0f9.firebasestorage.app",
  messagingSenderId: "443466508957",
  appId: "1:443466508957:web:84d62a14013e2120878274",
  measurementId: "G-1K1J9W0L2H"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
