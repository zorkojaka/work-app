// components/dashboard/DirectorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Registracija komponent za grafe
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Types
import { Project } from '../../types/project';
import { Client } from '../../types/client';

// 1. GLAVNA KOMPONENTA
const DirectorDashboard: React.FC = () => {
  // 1.1 State spremenljivke
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalClients: 0,
    totalEmployees: 0,
    revenue: 0,
    costs: 0,
    profit: 0
  });
  const [projectsByStatus, setProjectsByStatus] = useState({
    labels: ['Aktivni', 'Zaključeni', 'V pripravi'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4CAF50', '#2196F3', '#FFC107']
    }]
  });
  const [revenueData, setRevenueData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
    datasets: [{
      label: 'Prihodki',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: '#4CAF50'
    }]
  });
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // 1.2 Pridobivanje podatkov
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // 1.2.1 Pridobivanje projektov
        const projectsRef = collection(db, 'projects');
        const recentProjectsQuery = query(
          projectsRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const projectsSnapshot = await getDocs(recentProjectsQuery);
        const projectsList: Project[] = [];
        projectsSnapshot.forEach((doc) => {
          projectsList.push({ id: doc.id, ...doc.data() } as Project);
        });
        setRecentProjects(projectsList);
        
        // 1.2.2 Pridobivanje statistike
        const allProjectsSnapshot = await getDocs(projectsRef);
        const totalProjects = allProjectsSnapshot.size;
        
        let activeCount = 0;
        let completedCount = 0;
        let plannedCount = 0;
        let totalRevenue = 0;
        let totalCosts = 0;
        
        allProjectsSnapshot.forEach(doc => {
          const project = doc.data() as Project;
          if (project.status === 'IN_PROGRESS') activeCount++;
          else if (project.status === 'COMPLETED') completedCount++;
          else plannedCount++;
          
          totalRevenue += project.value || 0;
          totalCosts += project.costs ? 
            (project.costs.materials + project.costs.labor + project.costs.travel) : 0;
        });
        
        // 1.2.3 Pridobivanje strank
        const clientsRef = collection(db, 'clients');
        const clientsSnapshot = await getDocs(clientsRef);
        const totalClients = clientsSnapshot.size;
        
        // 1.2.4 Pridobivanje zaposlenih
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalEmployees = usersSnapshot.size;
        
        // 1.2.5 Nastavitev statistike
        setStats({
          totalProjects,
          activeProjects: activeCount,
          completedProjects: completedCount,
          totalClients,
          totalEmployees,
          revenue: totalRevenue,
          costs: totalCosts,
          profit: totalRevenue - totalCosts
        });
        
        // 1.2.6 Nastavitev podatkov za grafe
        setProjectsByStatus({
          labels: ['Aktivni', 'Zaključeni', 'V pripravi'],
          datasets: [{
            data: [activeCount, completedCount, plannedCount],
            backgroundColor: ['#4CAF50', '#2196F3', '#FFC107']
          }]
        });
        
        // 1.2.7 Simulacija prihodkov po mesecih (v pravi aplikaciji bi to prišlo iz baze)
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = Array(12).fill(0);
        
        // Naključni podatki za demonstracijo
        for (let i = 0; i < 12; i++) {
          if (i <= currentMonth) {
            monthlyRevenue[i] = Math.floor(Math.random() * 50000) + 10000;
          }
        }
        
        setRevenueData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
          datasets: [{
            label: 'Prihodki',
            data: monthlyRevenue,
            backgroundColor: '#4CAF50'
          }]
        });
        
      } catch (error) {
        console.error('Napaka pri pridobivanju podatkov:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 1.3 Pomožne funkcije
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Neznan datum';
    return timestamp.toDate().toLocaleDateString('sl-SI');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // 1.4 Prikaz nalaganja
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 1.5 Prikaz nadzorne plošče
  return (
    <div className="p-6">
      {/* 1.5.1 Statistični pregled */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Skupni prihodki</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Dobiček</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.profit)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Aktivni projekti</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.activeProjects}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Zaposleni</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalEmployees}</p>
        </div>
      </div>

      {/* 1.5.2 Grafični prikazi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Projekti po statusu</h2>
          <div className="h-64">
            <Pie data={projectsByStatus} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Prihodki po mesecih</h2>
          <div className="h-64">
            <Bar 
              data={revenueData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* 1.5.3 Nedavni projekti */}
      <div className="bg-white rounded-lg shadow mb-8">
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
          {recentProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ime projekta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vrednost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ustvarjen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dejanja</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProjects.map(project => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : 
                          project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status === 'IN_PROGRESS' ? 'Aktiven' : 
                           project.status === 'COMPLETED' ? 'Zaključen' : 
                           'V pripravi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(project.value || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Podrobnosti
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">Ni nedavnih projektov</p>
          )}
        </div>
      </div>

      {/* 1.5.4 Hitre povezave */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Hitre povezave</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Projekti
            </button>
            <button 
              onClick={() => navigate('/clients')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Stranke
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Zaposleni
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Poročila
            </button>
            <button 
              onClick={() => navigate('/settings/company')}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Nastavitve podjetja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
