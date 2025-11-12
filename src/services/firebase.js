import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaek-Pufqs-PPAkR-Vq86XMqSHkJCHeqA",
  authDomain: "personal-budget-planner-64d97.firebaseapp.com",
  projectId: "personal-budget-planner-64d97",
  storageBucket: "personal-budget-planner-64d97.firebasestorage.app",
  messagingSenderId: "674773457915",
  appId: "1:674773457915:web:ee410b6d6f2a6efaea495e",
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
