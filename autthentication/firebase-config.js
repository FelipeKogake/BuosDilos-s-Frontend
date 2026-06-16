// JS/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBliN8uzYafzvY0Wwnz_YsXZSxigcOJr_Q",
    authDomain: "buosdilo-s.firebaseapp.com",
    projectId: "buosdilo-s",
    storageBucket: "buosdilo-s.firebasestorage.app",
    messagingSenderId: "642687370352",
    appId: "1:642687370352:web:d0239f84b2a2969be5e0b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);