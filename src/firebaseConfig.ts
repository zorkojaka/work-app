import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCPVxeRbtqTVPkFEO3POW6tOEjh_kR_Ps4",
  authDomain: "work-94635.firebaseapp.com",
  projectId: "work-94635",
  storageBucket: "work-94635.firebasestorage.app",
  messagingSenderId: "360293112843",
  appId: "1:360293112843:web:7f808a8beeb18cce3efb0e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);