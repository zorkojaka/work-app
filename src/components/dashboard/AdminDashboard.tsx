// components/dashboard/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Types
import { User } from '../../types/user';

// 1. GLAVNA KOMPONENTA
const AdminDashboard: React.FC = () => {
  // 1.1 State spremenljivke
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    directors: 0,
    managers: 0,
    installers: 0,
    accountants: 0,
    salesReps: 0
  });
  
  // 1.2 Hooks
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1.3 Pridobivanje podatkov
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1.3.1 Pridobi nedavne uporabnike
        const usersRef = collection(db, 'users');
        const recentUsersQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const usersSnapshot = await getDocs(recentUsersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setRecentUsers(usersData);
        
        // 1.3.2 Pridobi statistiko uporabnikov
        const allUsersQuery = query(usersRef);
        const allUsersSnapshot = await getDocs(allUsersQuery);
        
        let admins = 0;
        let directors = 0;
        let managers = 0;
        let installers = 0;
        let accountants = 0;
        let salesReps = 0;
        
        allUsersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const roles = userData.roles || [];
          
          if (roles.includes('ADMIN')) admins++;
          if (roles.includes('DIRECTOR')) directors++;
          if (roles.includes('PROJECT_MANAGER')) managers++;
          if (roles.includes('INSTALLER')) installers++;
          if (roles.includes('ACCOUNTANT')) accountants++;
          if (roles.includes('SALES')) salesReps++;
        });
        
        setStats({
          totalUsers: allUsersSnapshot.size,
          activeUsers: allUsersSnapshot.size, // Predpostavljamo, da so vsi uporabniki aktivni
          admins,
          directors,
          managers,
          installers,
          accountants,
          salesReps
        });
        
      } catch (error) {
        console.error('Napaka pri pridobivanju podatkov:', error);
      }
    };
    
    fetchData();
  }, []);

  // 2. IZRIS KOMPONENTE
  return (
    <div className="space-y-6">
      {/* 2.1 Naslov */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administratorska nadzorna plošča</h1>
        <div className="text-sm text-gray-500">
          Dobrodošli, {user?.displayName || user?.email || 'Administrator'}
        </div>
      </div>
      
      {/* 2.2 Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Skupno uporabnikov</div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Aktivni uporabniki</div>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Administratorji</div>
          <div className="text-2xl font-bold">{stats.admins}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Direktorji</div>
          <div className="text-2xl font-bold">{stats.directors}</div>
        </div>
      </div>
      
      {/* 2.3 Pregled po vlogah */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Pregled po vlogah</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3">
              <div className="text-lg font-medium">Vodje projektov</div>
              <div className="text-3xl font-bold mt-2">{stats.managers}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-lg font-medium">Monterji</div>
              <div className="text-3xl font-bold mt-2">{stats.installers}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-lg font-medium">Računovodje</div>
              <div className="text-3xl font-bold mt-2">{stats.accountants}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-lg font-medium">Prodajniki</div>
              <div className="text-3xl font-bold mt-2">{stats.salesReps}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 2.4 Nedavni uporabniki */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Nedavni uporabniki</h2>
        </div>
        <div className="p-4">
          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vloge</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ustvarjen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span key={role} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.createdAt instanceof Timestamp 
                            ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/profile/edit/${user.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Uredi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">Ni nedavnih uporabnikov</p>
          )}
        </div>
      </div>
      
      {/* 2.5 Hitre povezave */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Hitre povezave</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Uporabniki
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
            <button 
              onClick={() => navigate('/logs')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Sistemski dnevniki
            </button>
            <button 
              onClick={() => navigate('/backup')}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Varnostne kopije
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
