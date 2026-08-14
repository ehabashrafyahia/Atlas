// ============================================
// ATLAS PLATFORM 2.0
// Firebase Configuration
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ============================================
// Firebase Config (Atlas v2)
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDcBjJwu5paJHWQR75Ik6s6Q75gwbH8sjs",
    authDomain: "atlas-v2-571b9.firebaseapp.com",
    projectId: "atlas-v2-571b9",
    storageBucket: "atlas-v2-571b9.firebasestorage.app",
    messagingSenderId: "268268333963",
    appId: "1:268268333963:web:17725a076eae65d34add8e"
};

// ============================================
// Initialize Firebase (Primary App)
// ============================================

const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// ============================================
// تحديد persistence بشكل صريح (Local Storage).
// من غير السطر ده، بعض المتصفحات (خصوصًا لو
// third-party cookies محجوبة) بتحاول تعمل
// مزامنة عبر iframe مخفي من authDomain، وده
// بيسبب تأخير كبير قبل ما تسجيل الدخول يكتمل.
// ============================================

setPersistence(auth, browserLocalPersistence);

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// ============================================
// Secondary App
// ============================================
// يُستخدم فقط لإنشاء حسابات الطلاب (Auth) من صفحة
// students.html بدون التأثير على جلسة دخول الأدمن
// الحالية. لو أنشأنا الحساب بالـ auth الأساسي، فايربيز
// بيسجّل دخول تلقائي بالحساب الجديد ويطلع الأدمن.
// ============================================

const secondaryApp = initializeApp(firebaseConfig, "Secondary");

const secondaryAuth = getAuth(secondaryApp);

setPersistence(secondaryAuth, browserLocalPersistence);

// ============================================
// Export
// ============================================

export {
    app,
    auth,
    db,
    storage,
    secondaryAuth
};
