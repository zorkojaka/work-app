import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user?.uid) return;

      try {
        const q = query(collection(db, 'projects'), where('users', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error('Napaka pri pridobivanju projektov uporabnika:', error);
      }
    };

    fetchUserProjects();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-semibold">Vaši Projekti</h1>
      </header>
      <section className="p-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white shadow p-4 mb-4 rounded-lg">
            <h2 className="text-lg font-bold">{project.name}</h2>
            <p>{project.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default UserDashboard;
