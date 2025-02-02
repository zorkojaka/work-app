import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Dodaj povezavo do Firestore

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcija za inicializacijo uporabnika v Firestore
  const initializeUser = async (userId: string, email: string | null) => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
  
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: email || 'Unknown',
        createdAt: serverTimestamp(),
        firstName: '', // Ime
        lastName: '', // Priimek
        address: {
          street: '', // Ulica
          postalCode: '', // Poštna številka
          city: '', // Mesto
          geoLocation: null, // Geo lokacija (lat, lng)
        },
        jobPosition: '', // Delovna pozicija
        profilePicture: '', // URL slike
        registrationNumber: '', // Registerska številka
      });
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await initializeUser(firebaseUser.uid, firebaseUser.email); // Inicializacija ob prijavi
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await initializeUser(credential.user.uid, credential.user.email); // Inicializacija ob prijavi
    } catch (err) {
      setError('Napaka pri prijavi. Preverite email in geslo.');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await initializeUser(credential.user.uid, credential.user.email); // Inicializacija ob prijavi
    } catch (err) {
      setError('Napaka pri Google prijavi.');
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await initializeUser(credential.user.uid, credential.user.email); // Inicializacija ob registraciji
    } catch (err) {
      setError('Napaka pri registraciji.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError('Napaka pri odjavi.');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signInWithGoogle,
        signUp,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth mora biti uporabljen znotraj AuthProvider');
  }
  return context;
};
