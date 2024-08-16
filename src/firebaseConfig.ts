import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCYg5bko_Wu930QkSvbhY1RnnHjq3Tenu0",
    authDomain: "testtask-94a55.firebaseapp.com",
    projectId: "testtask-94a55",
    storageBucket: "testtask-94a55.appspot.com",
    messagingSenderId: "741426994842",
    appId: "1:741426994842:web:d78e2b561908e0b13f0923",
    measurementId: "G-TWB0FWSVC9"
  };

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
