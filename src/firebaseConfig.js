// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVSfCoOFcwlraWutFJOaqg4R28EmtYKjw",
  authDomain: "courtconnect-9e07f.firebaseapp.com",
  projectId: "courtconnect-9e07f",
  storageBucket: "courtconnect-9e07f.firebasestorage.app",
  messagingSenderId: "918439814998",
  appId: "1:918439814998:web:adc15d0ba0bb152f7c58f7",
  measurementId: "G-5ETTB2P3GZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const auth=getAuth();
export const db = getFirestore(app);
export default app;