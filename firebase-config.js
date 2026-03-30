import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCmRT-CtcnY4YJCF69qg2b6MG1s3f64xvI",
    authDomain: "espers-2a269.firebaseapp.com",
    projectId: "espers-2a269",
    storageBucket: "espers-2a269.firebasestorage.app",
    messagingSenderId: "566940631258",
    appId: "1:566940631258:web:7d78aeb9a78bfdaf0025e3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const ADMIN_EMAIL = "hong99899@gmail.com";

export { db, auth, provider, ADMIN_EMAIL };