import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import AppHeader from '../common/AppHeader';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    activeRole: string;
    phone?: string;
    address?: {
      street?: string;
      postalCode?: string;
      city?: string;
    };
    createdAt?: any;
  }

const AVAILABLE_ROLES = {
  'INSTALLER': 'Monter',
  'PROJECT_MANAGER': 'Vodja projektov',
  'ADMIN': 'Administrator',
  'DIRECTOR': 'Direktor',
  'ACCOUNTANT': 'Računovodja',
  'SALES': 'Prodaja'
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    roles: [] as string[]
  });
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Začenjam pridobivanje uporabnikov...');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      console.log('Število najdenih dokumentov:', snapshot.size);
      console.log('Raw dokumenti:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log('Processed user data:', userData);
      
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Ustvari uporabnika v Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUserData.email, 
        newUserData.password
      );
      const newUser = userCredential.user;

      // 2. Dodaj podatke v Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: newUserData.email,
        roles: newUserData.roles,
        createdAt: new Date(),
        firstName: '',
        lastName: '',
        activeRole: newUserData.roles[0]
      });

      // 3. Pošlji email za ponastavitev gesla
      await sendPasswordResetEmail(auth, newUserData.email);

      alert(`Uporabnik uspešno ustvarjen! Email s podatki za prijavo je bil poslan na naslov ${newUserData.email}`);
      
      // Počisti obrazec in osveži seznam
      setNewUserData({ email: '', password: '', roles: [] });
      setShowCreateForm(false);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Napaka pri ustvarjanju uporabnika:', error);
      alert(error.message || 'Prišlo je do napake pri ustvarjanju uporabnika.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, role: string, currentRoles: string[]) => {
    try {
      const userRef = doc(db, 'users', userId);
      let newRoles: string[];
      
      if (currentRoles.includes(role)) {
        newRoles = currentRoles.filter(r => r !== role);
      } else {
        newRoles = [...currentRoles, role];
      }
      
      if (newRoles.length === 0) {
        alert('Uporabnik mora imeti vsaj eno vlogo!');
        return;
      }
      
      const updates: any = { roles: newRoles };
      if (!newRoles.includes(users.find(u => u.id === userId)?.activeRole || '')) {
        updates.activeRole = newRoles[0];
      }
      
      await updateDoc(userRef, updates);
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            roles: newRoles,
            ...(updates.activeRole ? { activeRole: updates.activeRole } : {})
          };
        }
        return user;
      }));
    } catch (error) {
      console.error('Error updating user roles:', error);
      alert('Napaka pri posodabljanju vlog');
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }


const toggleUserExpansion = (userId: string) => {
  setExpandedUsers(prev => 
    prev.includes(userId) 
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
};

// Posodobite del s tabelo v return stavku:
  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showCreateForm ? 'Skrij obrazec' : 'Dodaj novega uporabnika'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ustvari novega uporabnika</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Začetno geslo</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vloge</label>
                <div className="mt-2 space-y-2">
                  {Object.entries(AVAILABLE_ROLES).map(([role, label]) => (
                    <label key={role} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={newUserData.roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserData({
                              ...newUserData,
                              roles: [...newUserData.roles, role]
                            });
                          } else {
                            setNewUserData({
                              ...newUserData,
                              roles: newUserData.roles.filter(r => r !== role)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newUserData.email || !newUserData.password || newUserData.roles.length === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Ustvarjanje...' : 'Ustvari uporabnika'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Uporabnik
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Email
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Vloge
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Aktivna vloga
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Akcije
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {users.map((user) => (
      <React.Fragment key={user.id}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap">
            {user.firstName} {user.lastName}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {user.email}
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(AVAILABLE_ROLES).map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => handleRoleToggle(user.id, role, user.roles)}
                  className={`px-2 py-1 rounded text-sm ${
                    user.roles.includes(role)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {AVAILABLE_ROLES[user.activeRole as keyof typeof AVAILABLE_ROLES]}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/profile/edit/${user.id}`)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Uredi
              </button>
              <button
                onClick={() => toggleUserExpansion(user.id)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                {expandedUsers.includes(user.id) ? 'Manj' : 'Več'}
              </button>
            </div>
          </td>
        </tr>
        {expandedUsers.includes(user.id) && (
          <tr>
            <td colSpan={5} className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Kontaktni podatki</h4>
                  <p><span className="font-medium">Telefon:</span> {user.phone || 'Ni podatka'}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Naslov</h4>
                  <p>{user.address?.street || 'Ni podatka'}</p>
                  <p>{user.address?.postalCode} {user.address?.city}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-semibold mb-2">Dodatni podatki</h4>
                  <p><span className="font-medium">Ustvarjen:</span> {user.createdAt?.toDate().toLocaleDateString('sl-SI') || 'Ni podatka'}</p>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    ))}
  </tbody>
</table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;