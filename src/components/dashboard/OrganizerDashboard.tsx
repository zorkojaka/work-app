import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const OrganizerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error('Napaka pri pridobivanju projektov:', error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-semibold">Organizator - Pregled Projektov</h1>
      </header>
      <section className="p-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white shadow p-4 mb-4 rounded-lg">
            <h2 className="text-lg font-bold">{project.name}</h2>
            <p>{project.description}</p>
            <p><strong>Status:</strong> {project.status}</p>
            <p><strong>Kontakt:</strong> {project.contact.firstName} {project.contact.lastName}</p>
            <p><strong>Naslov:</strong> {project.address.street}, {project.address.city} {project.address.postalCode}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default OrganizerDashboard;
