// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDo2ojdnwnfy62tGEGT4IkczELd8-1ZKFc",
    authDomain: "portfolio-manager-8e651.firebaseapp.com",
    projectId: "portfolio-manager-8e651",
    storageBucket: "portfolio-manager-8e651.appspot.com",
    messagingSenderId: "1003970737633",
    appId: "1:1003970737633:web:679234cbfcab2d4bc34ea0",
    measurementId: "G-YBR6WYR07G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;