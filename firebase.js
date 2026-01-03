import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiq3aNbZRfC2pxT27vkHG6uoDpEFd8BIw",
  authDomain: "todo-app-60bec.firebaseapp.com",
  projectId: "todo-app-60bec",
  storageBucket: "todo-app-60bec.firebasestorage.app",
  messagingSenderId: "654393459432",
  appId: "1:654393459432:web:efe0e4940069f18fae3f5d",
  measurementId: "G-BT91STYSMD"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
