// components/dashboard/ManagerDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Types
import { Project } from '../../types/project';
import { Client } from '../../types/client';

const ManagerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalClients: 0
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch projects
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(
          projectsRef,
          orderBy('createdAt', 'desc')
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList: Project[] = [];
        projectsSnapshot.forEach((doc) => {
          projectsList.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsList);
        
        // Fetch clients
        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(
          clientsRef,
          orderBy('createdAt', 'desc')
        );
        
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsList: Client[] = [];
        clientsSnapshot.forEach((doc) => {
          clientsList.push({ id: doc.id, ...doc.data() } as Client);
        });
        setClients(clientsList);
        
        // Calculate stats
        setStats({
          totalProjects: projectsList.length,
          activeProjects: projectsList.filter(p => p.status === 'IN_PROGRESS').length,
          completedProjects: projectsList.filter(p => p.status === 'COMPLETED').length,
          totalClients: clientsList.length
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filtriraj projekte glede na status
  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'IN_PROGRESS');
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects.filter(p => p.status === 'COMPLETED');
  }, [projects]);

  // Pridobi projekte, ki se bodo kmalu začeli
  const upcomingProjects = useMemo(() => {
    return projects.filter(p => 
      p.status === 'IN_PROGRESS' || 
      p.status === 'COMPLETED'
    ).slice(0, 5);
  }, [projects]);

  // Pridobi projekte z bližajočim se rokom
  const projectsWithDeadline = useMemo(() => {
    return projects
      .filter(p => p.executionDate?.date)
      .sort((a, b) => {
        const dateA = a.executionDate?.date ? new Date(a.executionDate.date).getTime() : 0;
        const dateB = b.executionDate?.date ? new Date(b.executionDate.date).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [projects]);

  // Pridobi kontaktne podatke strank
  const clientContacts = useMemo(() => {
    return clients.map(client => ({
      id: client.id,
      name: client.basicInfo.name,
      email: client.basicInfo.email,
      phone: client.basicInfo.phone
    })).slice(0, 5);
  }, [clients]);

  // Pomožna funkcija za formatiranje datuma
  const formatDate = (date: any) => {
    if (!date) return 'Ni določen';
    
    if (typeof date === 'object' && date.toDate) {
      return date.toDate().toLocaleDateString('sl-SI');
    } else if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('sl-SI');
    }
    
    return 'Ni določen';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Vsi projekti</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalProjects}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Aktivni projekti</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeProjects}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Zaključeni projekti</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.completedProjects}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Stranke</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.totalClients}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nedavni projekti */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Nedavni projekti</h2>
            <button 
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-800"
            >
              Vsi projekti
            </button>
          </div>
          <div className="p-4">
            {upcomingProjects.length > 0 ? (
              <div className="divide-y">
                {upcomingProjects.map(project => (
                  <div key={project.id} className="py-3">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{project.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : 
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'IN_PROGRESS' ? 'Aktiven' : 
                         project.status === 'COMPLETED' ? 'Zaključen' : 
                         'V pripravi'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Ustvarjen: {formatDate(project.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">Ni nedavnih projektov</p>
            )}
          </div>
        </div>

        {/* Aktivni projekti */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Aktivni projekti</h2>
            <button 
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-800"
            >
              Vsi projekti
            </button>
          </div>
          <div className="p-4">
            {activeProjects.length > 0 ? (
              <div className="divide-y">
                {activeProjects.map(project => (
                  <div key={project.id} className="py-3">
                    <h3 className="font-medium">{project.name}</h3>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-600">Rok: {formatDate(project.deadline)}</span>
                      <button 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Podrobnosti
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">Ni aktivnih projektov</p>
            )}
          </div>
        </div>

        {/* Stranke */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Nedavne stranke</h2>
            <button 
              onClick={() => navigate('/clients')}
              className="text-blue-600 hover:text-blue-800"
            >
              Vse stranke
            </button>
          </div>
          <div className="p-4">
            {clientContacts.length > 0 ? (
              <div className="divide-y">
                {clientContacts.map(client => (
                  <div key={client.id} className="py-3">
                    <h3 className="font-medium">{client.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">Ni nedavnih strank</p>
            )}
          </div>
        </div>

        {/* Hitre povezave */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Hitre povezave</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/projects/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Nov projekt
              </button>
              <button 
                onClick={() => navigate('/clients/new')}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Nova stranka
              </button>
              <button 
                onClick={() => navigate('/projects')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Pregled projektov
              </button>
              <button 
                onClick={() => navigate('/clients')}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Pregled strank
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
