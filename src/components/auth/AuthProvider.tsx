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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface AuthContextType {
  user: User | null;
  roles: string[];
  activeRole: string;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcija za inicializacijo uporabnika v Firestore
  const initializeUser = async (userId: string, email: string | null) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Če uporabnik še ne obstaja, ustvarimo dokument z osnovnimi podatki in privzeto vlogo "INSTALLER"
        const initialData = {
          email: email || 'Unknown',
          roles: ['INSTALLER'],
          activeRole: 'INSTALLER',
          createdAt: serverTimestamp(),
          firstName: '',
          lastName: '',
          profilePicture: '',
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, initialData);
        setRoles(['INSTALLER']);
        setActiveRole('INSTALLER');
      } else {
        // Če uporabnik že obstaja, preberemo njegove vloge
        const data = userDoc.data();
        const userRoles = data?.roles || ['INSTALLER'];
        setRoles(userRoles);
        setActiveRole(data?.activeRole || userRoles[0] || 'INSTALLER');
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
          setActiveRole('');
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

  // Funkcija za preklop vloge
  const switchRole = async (newRole: string) => {
    if (!user || !roles.includes(newRole)) {
      setError('Izbrana vloga ni na voljo');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        activeRole: newRole,
        updatedAt: serverTimestamp()
      });
      setActiveRole(newRole);
    } catch (err) {
      console.error('Napaka pri preklopu vloge:', err);
      setError('Napaka pri preklopu vloge');
    }
  };

  // Odjava
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setRoles([]);
      setActiveRole('');
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
        activeRole,
        loading,
        signInWithEmail,
        signInWithGoogle,
        signUp,
        logout,
        switchRole,
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