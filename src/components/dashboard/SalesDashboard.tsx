// components/dashboard/SalesDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Doughnut, Bar } from 'react-chartjs-2';
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

interface Opportunity {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: 'open' | 'won' | 'lost';
  value: number;
  source: string;
  createdAt: Date;
  closedAt: Date | null;
}

// 1. GLAVNA KOMPONENTA
const SalesDashboard: React.FC = () => {
  // 1.1 State spremenljivke
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    newClientsThisMonth: 0,
    totalOpportunities: 0,
    openOpportunities: 0,
    wonOpportunities: 0,
    lostOpportunities: 0,
    potentialRevenue: 0,
    conversionRate: 0
  });
  const [opportunityStatusData, setOpportunityStatusData] = useState({
    labels: ['Odprte', 'Dobljene', 'Izgubljene'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#FFC107', '#4CAF50', '#F44336']
    }]
  });
  const [revenueBySourceData, setRevenueBySourceData] = useState({
    labels: ['Priporočila', 'Spletna stran', 'Oglasi', 'Hladni klici', 'Drugo'],
    datasets: [{
      label: 'Potencialni prihodki',
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722']
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
        
        // 1.2.1 Pridobivanje strank
        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(
          clientsRef,
          orderBy('basicInfo.name', 'asc')
        );
        
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsList: Client[] = [];
        clientsSnapshot.forEach((doc) => {
          clientsList.push({ id: doc.id, ...doc.data() } as Client);
        });
        setClients(clientsList);
        
        // 1.2.2 Simulacija prodajnih priložnosti (v pravi aplikaciji bi to prišlo iz baze)
        // Ustvarimo nekaj naključnih priložnosti za demonstracijo
        const statuses = ['open', 'won', 'lost'] as const;
        type OpportunityStatus = typeof statuses[number];
        
        const sources = ['Spletna stran', 'Priporočilo', 'Telefonski klic', 'Email', 'Sejem'];
        
        const mockOpportunities: Opportunity[] = [];
        
        for (let i = 0; i < 20; i++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const value = Math.floor(Math.random() * 10000) + 1000;
          const source = sources[Math.floor(Math.random() * sources.length)];
          const createdAt = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
          
          mockOpportunities.push({
            id: `opp-${i}`,
            clientName: clientsList.length > 0 ? clientsList[Math.floor(Math.random() * clientsList.length)].basicInfo.name : 'Neznana stranka',
            status,
            value,
            source,
            createdAt,
            closedAt: status !== 'open' ? new Date(createdAt.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null
          });
        }
        
        setOpportunities(mockOpportunities);
        
        // 1.2.3 Izračun statistike
        const totalClients = clientsList.length;
        const newClientsThisMonth = clientsList.filter(client => 
          client.createdAt && new Date(client.createdAt.seconds * 1000) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        const totalOpportunities = mockOpportunities.length;
        const openOpportunities = mockOpportunities.filter(opp => opp.status === 'open').length;
        const wonOpportunities = mockOpportunities.filter(opp => opp.status === 'won').length;
        const lostOpportunities = mockOpportunities.filter(opp => opp.status === 'lost').length;
        
        const potentialRevenue = mockOpportunities
          .filter(opp => opp.status === 'open')
          .reduce((sum, opp) => sum + opp.value, 0);
        
        const conversionRate = totalOpportunities > 0 ? 
          (wonOpportunities / (wonOpportunities + lostOpportunities)) * 100 : 0;
        
        setStats({
          totalClients,
          newClientsThisMonth,
          totalOpportunities,
          openOpportunities,
          wonOpportunities,
          lostOpportunities,
          potentialRevenue,
          conversionRate
        });
        
        // 1.2.4 Nastavitev podatkov za grafe
        setOpportunityStatusData({
          labels: ['Odprte', 'Dobljene', 'Izgubljene'],
          datasets: [{
            data: [openOpportunities, wonOpportunities, lostOpportunities],
            backgroundColor: ['#FFC107', '#4CAF50', '#F44336']
          }]
        });
        
        // 1.2.5 Izračun prihodkov po virih
        const revenueBySource: Record<string, number> = {};
        sources.forEach(source => revenueBySource[source] = 0);
        
        mockOpportunities
          .filter(opp => opp.status === 'open' || opp.status === 'won')
          .forEach(opp => {
            revenueBySource[opp.source] = (revenueBySource[opp.source] || 0) + opp.value;
          });
        
        setRevenueBySourceData({
          labels: Object.keys(revenueBySource),
          datasets: [{
            label: 'Potencialni prihodki',
            data: Object.values(revenueBySource),
            backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722']
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
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sl-SI');
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
          <h3 className="text-lg font-semibold text-gray-700">Skupno strank</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalClients}</p>
          <p className="text-sm text-gray-500">+{stats.newClientsThisMonth} v tem mesecu</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Odprte priložnosti</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.openOpportunities}</p>
          <p className="text-sm text-gray-500">od {stats.totalOpportunities} skupno</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Potencialni prihodki</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.potentialRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Stopnja pretvorbe</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* 1.5.2 Grafični prikazi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Priložnosti po statusu</h2>
          <div className="h-64">
            <Doughnut data={opportunityStatusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Prihodki po virih</h2>
          <div className="h-64">
            <Bar 
              data={revenueBySourceData} 
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

      {/* 1.5.3 Nedavne priložnosti */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Nedavne priložnosti</h2>
          <button 
            onClick={() => navigate('/opportunities')}
            className="text-blue-600 hover:text-blue-800"
          >
            Vse priložnosti
          </button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naslov</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stranka</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vrednost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ustvarjeno</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.slice(0, 5).map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opportunity.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(opportunity.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        opportunity.status === 'won' ? 'bg-green-100 text-green-800' : 
                        opportunity.status === 'lost' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {opportunity.status === 'won' ? 'Dobljena' : 
                         opportunity.status === 'lost' ? 'Izgubljena' : 
                         'Odprta'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(opportunity.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              onClick={() => navigate('/clients/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Nova stranka
            </button>
            <button 
              onClick={() => navigate('/opportunities/new')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Nova priložnost
            </button>
            <button 
              onClick={() => navigate('/contacts')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Kontakti
            </button>
            <button 
              onClick={() => navigate('/reports/sales')}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Prodajna poročila
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
