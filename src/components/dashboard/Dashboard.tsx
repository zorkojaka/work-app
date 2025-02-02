import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import { useNavigate } from 'react-router-dom'; // Dodamo useNavigate za navigacijo
import { db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';

interface Action {
  type: 'START_BREAK' | 'END_BREAK' | 'START_TRAVEL' | 'RETURN_TRAVEL';
  timestamp: Timestamp;
  location?: { lat: number; lng: number };
}

interface WorkSession {
  id: string;
  startTimestamp: Timestamp;
  endTimestamp?: Timestamp;
  status: 'WORKING' | 'BREAK' | 'TRAVEL' | 'COMPLETED';
  actions: Action[];
}

const Dashboard: React.FC = () => {
  const { user, logout, roles } = useAuth();
  const navigate = useNavigate(); // Dodamo za navigacijo
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Doma'); // Trenutni status

  useEffect(() => {
    if (!user) return;

    const fetchWorkSessions = async () => {
      const sessionsRef = collection(db, `users/${user.uid}/workSessions`);
      const q = query(sessionsRef, orderBy('startTimestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const fetchedSessions: WorkSession[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<WorkSession, 'id'>),
      }));

      setWorkSessions(fetchedSessions);
      setCurrentSession(
        fetchedSessions.find((session) => session.status !== 'COMPLETED') || null
      );
    };

    fetchWorkSessions();
  }, [user]);

  const startWork = async () => {
    if (!user || currentSession) return; // Preprečimo začetek nove seje, če je aktivna

    setLoading(true);
    try {
      const sessionsRef = collection(db, `users/${user.uid}/workSessions`);
      const newSession = {
        startTimestamp: serverTimestamp(),
        status: 'WORKING',
        actions: [],
      };

      const docRef = await addDoc(sessionsRef, newSession);

      const newDoc = await getDoc(docRef);

      if (newDoc.exists()) {
        const newSessionData: WorkSession = {
          id: docRef.id,
          ...(newDoc.data() as Omit<WorkSession, 'id'>),
        };

        setWorkSessions((prev) => [newSessionData, ...prev]);
        setCurrentSession(newSessionData);
        setStatus('Delo');
      }
    } catch (err) {
      console.error('Napaka pri zagonu dela:', err);
    } finally {
      setLoading(false);
    }
  };

  const endWork = async () => {
    if (!user || !currentSession) return; // Preprečimo zaključek, če ni aktivne seje

    setLoading(true);
    try {
      const sessionRef = doc(db, `users/${user.uid}/workSessions/${currentSession.id}`);
      await updateDoc(sessionRef, { endTimestamp: serverTimestamp(), status: 'COMPLETED' });

      setWorkSessions((prev) =>
        prev.map((session) =>
          session.id === currentSession.id
            ? { ...session, endTimestamp: Timestamp.now(), status: 'COMPLETED' }
            : session
        )
      );
      setCurrentSession(null);
      setStatus('Doma');
    } catch (err) {
      console.error('Napaka pri zaključku dela:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    roles.includes('Organizator') && { label: 'Organizator', onClick: () => navigate('/projects') },
    { label: 'Odjava', onClick: logout },
  ].filter((item): item is { label: string; onClick: () => void } => item !== null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header komponenta */}
      <Header title="Dashboard" menuItems={menuItems} />

      {/* Status in nadzor */}
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-xl font-semibold">Status: {status}</h1>
      </div>

      {/* Gumbi za akcije */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {!currentSession && (
          <button
            onClick={startWork}
            className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600"
            disabled={loading}
          >
            Začni delo
          </button>
        )}
        {currentSession && (
          <button
            onClick={endWork}
            className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600"
            disabled={loading}
          >
            Zaključi delo
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
