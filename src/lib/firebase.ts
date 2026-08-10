import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase web config is publishable by design.
export const firebaseConfig = {
  apiKey: "AIzaSyAwM3pxWArfz5X2zbdYvVcXl7JfIakLa4o",
  authDomain: "dcems-f06be.firebaseapp.com",
  projectId: "dcems-f06be",
  storageBucket: "dcems-f06be.firebasestorage.app",
  messagingSenderId: "980997749711",
  appId: "1:980997749711:web:10c075fc03dbd9e62630ba",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
