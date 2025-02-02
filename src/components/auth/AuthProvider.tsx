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
import { db } from '../../firebaseConfig';

interface AuthContextType {
  user: User | null;
  roles: string[]; // Seznam vlog uporabnika
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
  const [roles, setRoles] = useState<string[]>([]); // Dodano polje za vloge
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcija za inicializacijo uporabnika v Firestore
  const initializeUser = async (userId: string, email: string | null) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Če uporabnik še ne obstaja, ustvarimo dokument z osnovnimi podatki in privzeto vlogo "Monter"
        await setDoc(userDocRef, {
          email: email || 'Unknown',
          roles: ['Monter'], // Privzeta vloga
          createdAt: serverTimestamp(),
          firstName: '',
          lastName: '',
          profilePicture: '',
          updatedAt: serverTimestamp(),
        });
        setRoles(['Monter']); // Nastavimo lokalno stanje za vloge
      } else {
        // Če uporabnik že obstaja, preberemo njegove vloge
        const data = userDoc.data();
        setRoles(data?.roles || []);
      }
    } catch (err) {
      console.error('Napaka pri inicializaciji uporabnika:', err);
      throw err;
    }
  };

  // Pridobi podatke o prijavljenem uporabniku
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await initializeUser(firebaseUser.uid, firebaseUser.email);
        } else {
          setUser(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('Napaka pri spremljanju stanja prijave:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Prijava z emailom
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await initializeUser(credential.user.uid, credential.user.email);
    } catch (err) {
      setError('Napaka pri prijavi. Preverite email in geslo.');
      throw err;
    }
  };

  // Prijava z Google računom
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await initializeUser(credential.user.uid, credential.user.email);
    } catch (err) {
      setError('Napaka pri Google prijavi.');
      throw err;
    }
  };

  // Registracija uporabnika
  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await initializeUser(credential.user.uid, credential.user.email);
    } catch (err) {
      setError('Napaka pri registraciji.');
      throw err;
    }
  };

  // Odjava
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setRoles([]);
    } catch (err) {
      console.error('Napaka pri odjavi:', err);
      setError('Napaka pri odjavi.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
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
