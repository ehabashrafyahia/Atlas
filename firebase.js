// ============================================
// ATLAS PLATFORM 2.0
// Firebase Configuration
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ============================================
// Firebase Config
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBguTToeOjPcK4YwGXNO8fktKaprdVmua4",
    authDomain: "atlas-platform-3a016.firebaseapp.com",
    projectId: "atlas-platform-3a016",
    storageBucket: "atlas-platform-3a016.firebasestorage.app",
    messagingSenderId: "573638488129",
    appId: "1:573638488129:web:7d55e610452f38287856c0"
};

// ============================================
// Initialize Firebase
// ============================================

const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// ============================================
// Export
// ============================================

export {
    app,
    auth,
    db,
    storage
};
