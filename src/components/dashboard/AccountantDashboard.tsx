// components/dashboard/AccountantDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registracija komponent za grafe
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
import { Project } from '../../types/project';
import { Client } from '../../types/client';

// 1. GLAVNA KOMPONENTA
const AccountantDashboard: React.FC = () => {
  // 1.1 State spremenljivke
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    profit: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    overdueInvoices: 0,
    overdueAmount: 0
  });
  const [cashFlowData, setCashFlowData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Prihodki',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4
      },
      {
        label: 'Stroški',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        tension: 0.4
      }
    ]
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // 1.2 Pridobivanje podatkov
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // 1.2.1 Pridobivanje projektov za finančne podatke
        const projectsRef = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsRef);
        
        let totalRevenue = 0;
        let totalCosts = 0;
        
        const projectsData: Project[] = [];
        
        projectsSnapshot.forEach(doc => {
          const project = doc.data() as Project;
          totalRevenue += project.value || 0;
          totalCosts += project.costs ? 
            (project.costs.materials + project.costs.labor + project.costs.travel) : 0;
          projectsData.push(project);
        });
        
        setProjects(projectsData);
        
        // 1.2.2 Simulacija podatkov o računih (v pravi aplikaciji bi to prišlo iz baze)
        // Ustvarimo nekaj naključnih računov za demonstracijo
        const mockInvoices = [];
        const today = new Date();
        
        for (let i = 0; i < 10; i++) {
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 15);
          
          const amount = Math.floor(Math.random() * 5000) + 500;
          const isPaid = Math.random() > 0.4;
          const isOverdue = !isPaid && dueDate < today;
          
          mockInvoices.push({
            id: `INV-2023-${i + 100}`,
            client: `Stranka ${i + 1}`,
            amount,
            issueDate: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            dueDate,
            isPaid,
            isOverdue
          });
        }
        
        setInvoices(mockInvoices);
        
        // 1.2.3 Izračun statistike računov
        let pendingInvoices = 0;
        let pendingAmount = 0;
        let overdueInvoices = 0;
        let overdueAmount = 0;
        
        mockInvoices.forEach(invoice => {
          if (!invoice.isPaid) {
            pendingInvoices++;
            pendingAmount += invoice.amount;
            
            if (invoice.isOverdue) {
              overdueInvoices++;
              overdueAmount += invoice.amount;
            }
          }
        });
        
        setStats({
          totalRevenue,
          totalCosts,
          profit: totalRevenue - totalCosts,
          pendingInvoices,
          pendingAmount,
          overdueInvoices,
          overdueAmount
        });
        
        // 1.2.4 Simulacija podatkov denarnega toka po mesecih
        const currentMonth = today.getMonth();
        const monthlyRevenue = Array(12).fill(0);
        const monthlyCosts = Array(12).fill(0);
        
        // Naključni podatki za demonstracijo
        for (let i = 0; i < 12; i++) {
          if (i <= currentMonth) {
            monthlyRevenue[i] = Math.floor(Math.random() * 50000) + 10000;
            monthlyCosts[i] = Math.floor(Math.random() * 40000) + 8000;
          }
        }
        
        setCashFlowData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Prihodki',
              data: monthlyRevenue,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              tension: 0.4
            },
            {
              label: 'Stroški',
              data: monthlyCosts,
              borderColor: '#F44336',
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              tension: 0.4
            }
          ]
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

  const formatDateExecution = (executionDate: any) => {
    if (!executionDate || !executionDate.date) return '-';
    
    const date = new Date(executionDate.date);
    let result = date.toLocaleDateString('sl-SI');
    
    if (executionDate.time) {
      result += ` ob ${executionDate.time}`;
    }
    
    if (executionDate.confirmed) {
      result += ' (potrjeno)';
    }
    
    return result;
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
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Skupni stroški</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalCosts)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Dobiček</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.profit)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700">Zapadli računi</h3>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.overdueAmount)}</p>
          <p className="text-sm text-gray-500">{stats.overdueInvoices} računov</p>
        </div>
      </div>

      {/* 1.5.2 Grafični prikaz denarnega toka */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Denarni tok</h2>
        <div className="h-80">
          <Line 
            data={cashFlowData} 
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

      {/* 1.5.3 Računi */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Nedavni računi</h2>
          <button 
            onClick={() => navigate('/invoices')}
            className="text-blue-600 hover:text-blue-800"
          >
            Vsi računi
          </button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Številka</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stranka</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Znesek</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Izdan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rok plačila</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.isPaid ? 'bg-green-100 text-green-800' : 
                        invoice.isOverdue ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.isPaid ? 'Plačano' : 
                         invoice.isOverdue ? 'Zapadlo' : 
                         'Čaka plačilo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 1.5.4 Projekti */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Projekti</h2>
          <button 
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800"
          >
            Vsi projekti
          </button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naziv</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum izvedbe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project: Project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateExecution(project.executionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 1.5.5 Hitre povezave */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Hitre povezave</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/invoices/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Nov račun
            </button>
            <button 
              onClick={() => navigate('/expenses/new')}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Nov strošek
            </button>
            <button 
              onClick={() => navigate('/reports/financial')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Finančno poročilo
            </button>
            <button 
              onClick={() => navigate('/taxes')}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Davčne obveznosti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
