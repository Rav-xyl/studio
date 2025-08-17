// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'talentflow-ai-1lu7m',
  appId: '1:523888981631:web:5c5c7c439489b2206db14a',
  storageBucket: 'talentflow-ai-1lu7m.appspot.com',
  apiKey: 'AIzaSyDwwbVgb6ZpW3qhMz1dRe-3qey8gPvkz1o',
  authDomain: 'talentflow-ai-1lu7m.firebaseapp.com',
  messagingSenderId: '523888981631',
  measurementId: 'G-XXXXXXXXXX',
  // This is the critical addition for region-specific projects
  databaseURL: 'https://talentflow-ai-1lu7m-default-rtdb.asia-southeast1.firebasedatabase.app',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
