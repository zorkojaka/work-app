import React, { useState, useEffect } from 'react';
import { Location } from '../../types/travelOrder';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface TravelFormProps {
  isStart: boolean;
  currentLocation: Location | null;
  onSubmit: (destination: string, purpose: string, projectId?: string) => void;
  onCancel: () => void;
}

const TravelForm: React.FC<TravelFormProps> = ({
  isStart,
  currentLocation,
  onSubmit,
  onCancel
}) => {
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error('Napaka pri nalaganju projektov:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isStart && (!projectId || !purpose)) {
      alert('Prosimo, izpolnite vsa obvezna polja');
      return;
    }
    
    onSubmit(
      destination || (currentLocation?.address || ''), 
      purpose,
      projectId || undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {isStart ? 'Začetek poti' : 'Zaključek poti'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Destinacija</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={currentLocation?.address || 'Vnesite destinacijo'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {!isStart && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Projekt</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-2">
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
              disabled={loading}
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