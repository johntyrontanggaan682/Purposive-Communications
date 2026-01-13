// firebase.js (ONLY the Firebase linking/connector)
// Put your config here, then include this file as: <script type="module" src="firebase.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZ0b3RzS8OqIxZBv9JSsV8zlEsncAf_LQ",
  authDomain: "purposivecommunication-2e5e9.firebaseapp.com",
  projectId: "purposivecommunication-2e5e9",
  storageBucket: "purposivecommunication-2e5e9.firebasestorage.app",
  messagingSenderId: "316292729628",
  appId: "1:316292729628:web:7c241575863ddbf45fc8d9",
  measurementId: "G-YEHW55GE4S"
};

export const app = initializeApp(firebaseConfig);

// Analytics can fail on file:// or blocked environments; keep non-fatal.
try { getAnalytics(app); } catch (_) {}

export const auth = getAuth(app);
export const db = getFirestore(app);
