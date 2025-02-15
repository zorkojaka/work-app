import React, { useState, useEffect } from 'react';
import { Location } from '../../types/travelOrder';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface TravelFormProps {
  isStart: boolean;
  currentLocation: Location;
  onSubmit: (data: { 
    address: string; 
    projectId?: string; 
    purpose?: string;
  }) => void;
  onCancel: () => void;
}

const TravelForm: React.FC<TravelFormProps> = ({
  isStart,
  currentLocation,
  onSubmit,
  onCancel
}) => {
  const [address, setAddress] = useState(currentLocation.address);
  const [projectId, setProjectId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Naloži projekte
  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setProjects(projectsData);
    };

    fetchProjects();
  }, []);

  //VALIDACIJA OBRAZCA
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStart && (!projectId || !purpose)) {
      // Dodajte ustrezno obravnavo napake, npr. prikaz sporočila
      return;
    }
    onSubmit({
      address,
      ...(isStart ? {} : { projectId, purpose })
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {isStart ? 'Začetek poti' : 'Zaključek poti'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Naslov</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          {!isStart && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Projekt</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="">Izberi projekt</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Namen poti</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Prekliči
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Potrdi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravelForm;