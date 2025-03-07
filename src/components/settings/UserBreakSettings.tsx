// components/settings/UserBreakSettings.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { User } from '../../types/user';
import { useCompanySettings } from '../../hooks/useCompanySettings';

// 1. KOMPONENTA ZA NASTAVITVE ODMOROV ZA POSAMEZNE UPORABNIKE
const UserBreakSettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { settings, loading: settingsLoading } = useCompanySettings();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isExempt, setIsExempt] = useState(false);
  const [customAllowance, setCustomAllowance] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // 1.2 Nalaganje uporabnikov
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersList);
      } catch (error) {
        console.error('Napaka pri pridobivanju uporabnikov:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 1.3 Filtriranje uporabnikov po iskanju
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  // 1.4 Izbira uporabnika
  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setIsExempt(user.breakTracking?.isExempt || false);
    setCustomAllowance(user.breakTracking?.customBreakAllowance || null);
  };

  // 1.5 Spreminjanje nastavitev za izvzetje
  const handleExemptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsExempt(e.target.checked);
  };

  // 1.6 Spreminjanje nastavitev za posebno kvoto
  const handleCustomAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    setCustomAllowance(value);
  };

  // 1.7 Shranjevanje nastavitev za uporabnika
  const handleSaveUserSettings = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    setSaveStatus('saving');
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          'breakTracking.isExempt': isExempt,
          'breakTracking.customBreakAllowance': customAllowance
        });
        
        // Posodobi lokalno stanje
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id 
              ? {
                  ...user,
                  breakTracking: {
                    isExempt,
                    customBreakAllowance: customAllowance || undefined
                  }
                }
              : user
          )
        );
        
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Napaka pri shranjevanju nastavitev uporabnika:', error);
      setSaveStatus('error');
    }
  };

  // 1.8 Prikaz komponente
  if (loading || settingsLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Nastavitve odmorov za posamezne uporabnike</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1.8.1 Seznam uporabnikov */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium mb-3">Uporabniki</h3>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Išči uporabnike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => handleSelectUser(user)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500">Vloga: {user.activeRole}</div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">Ni najdenih uporabnikov</div>
            )}
          </div>
        </div>
        
        {/* 1.8.2 Nastavitve za izbranega uporabnika */}
        <div className="md:col-span-2">
          {selectedUser ? (
            <div>
              <h3 className="text-lg font-medium mb-3">
                Nastavitve za uporabnika: {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isExempt}
                    onChange={handleExemptChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Izvzet iz beleženja odmorov</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Če je ta možnost izbrana, se uporabniku ne bodo beležili odmori.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posebna kvota za odmore (minute)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={customAllowance !== null ? customAllowance : ''}
                    onChange={handleCustomAllowanceChange}
                    placeholder={`Privzeto: ${settings?.breakSettings?.totalBreakAllowance || 45}`}
                    min="1"
                    max="240"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setCustomAllowance(null)}
                    className="ml-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    title="Ponastavi na privzeto vrednost"
                  >
                    Ponastavi
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pusti prazno za uporabo privzete vrednosti ({settings?.breakSettings?.totalBreakAllowance || 45} minut).
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={saveStatus === 'saving'}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    saveStatus === 'saving' 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : saveStatus === 'success'
                        ? 'bg-green-500 hover:bg-green-600'
                        : saveStatus === 'error'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {saveStatus === 'saving' 
                    ? 'Shranjevanje...' 
                    : saveStatus === 'success'
                      ? 'Shranjeno!'
                      : saveStatus === 'error'
                        ? 'Napaka!'
                        : 'Shrani nastavitve'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <p>Izberi uporabnika za urejanje nastavitev</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBreakSettings;
