// components/settings/BreakSettings.tsx
import React, { useState, useEffect } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { User } from '../../types/user';

// 1. KOMPONENTA ZA NASTAVITVE ODMOROV
const BreakSettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { settings, loading, error, updateSettings } = useCompanySettings();
  const [breakSettings, setBreakSettings] = useState({
    lunchBreakDuration: 35,
    shortBreakDuration: 5,
    totalBreakAllowance: 45,
  });
  const [trackBreaks, setTrackBreaks] = useState(true);
  const [exemptedRoles, setExemptedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    'ADMIN', 'DIRECTOR', 'MANAGER', 'INSTALLER', 'SALES', 'ACCOUNTANT', 'ORGANIZER'
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');

  // 1.2 Nalaganje nastavitev
  useEffect(() => {
    if (settings) {
      setBreakSettings({
        lunchBreakDuration: settings.breakSettings?.lunchBreakDuration || 35,
        shortBreakDuration: settings.breakSettings?.shortBreakDuration || 5,
        totalBreakAllowance: settings.breakSettings?.totalBreakAllowance || 45,
      });
      setTrackBreaks(settings.userPermissions?.trackBreaks ?? true);
      setExemptedRoles(settings.userPermissions?.exemptedRoles || []);
      setSelectedUsers(settings.userPermissions?.exemptedUsers || []);
    }
  }, [settings]);

  // 1.3 Nalaganje uporabnikov
  useEffect(() => {
    const fetchUsers = async () => {
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
      }
    };

    fetchUsers();
  }, []);

  // 1.4 Filtriranje uporabnikov po iskanju
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  // 1.5 Spreminjanje nastavitev za odmore
  const handleBreakSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBreakSettings(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };

  // 1.6 Spreminjanje nastavitev za beleženje odmorov
  const handleTrackBreaksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackBreaks(e.target.checked);
  };

  // 1.7 Spreminjanje izvzetih vlog
  const handleRoleExemptionChange = (role: string) => {
    setExemptedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // 1.8 Spreminjanje izvzetih uporabnikov
  const handleUserExemptionChange = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 1.9 Shranjevanje nastavitev
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Preveri, če je skupni čas večji ali enak vsoti malice in kratke pavze
      if (breakSettings.totalBreakAllowance < breakSettings.lunchBreakDuration + breakSettings.shortBreakDuration) {
        alert('Skupni čas za odmore mora biti večji ali enak vsoti časa za malico in kratko pavzo!');
        setSaveStatus('error');
        return;
      }

      await updateSettings({
        breakSettings: {
          lunchBreakDuration: breakSettings.lunchBreakDuration,
          shortBreakDuration: breakSettings.shortBreakDuration,
          totalBreakAllowance: breakSettings.totalBreakAllowance,
        },
        userPermissions: {
          trackBreaks,
          exemptedRoles,
          exemptedUsers: selectedUsers,
        }
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Napaka pri shranjevanju nastavitev:', error);
      setSaveStatus('error');
    }
  };

  // 1.10 Prikaz komponente
  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Nastavitve odmorov in malic</h2>
      
      {/* 1.10.1 Nastavitve trajanja odmorov */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Trajanje odmorov</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trajanje malice (minute)
            </label>
            <input
              type="number"
              name="lunchBreakDuration"
              value={breakSettings.lunchBreakDuration}
              onChange={handleBreakSettingChange}
              min="1"
              max="120"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trajanje kratke pavze (minute)
            </label>
            <input
              type="number"
              name="shortBreakDuration"
              value={breakSettings.shortBreakDuration}
              onChange={handleBreakSettingChange}
              min="1"
              max="30"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skupni čas za odmore (minute)
            </label>
            <input
              type="number"
              name="totalBreakAllowance"
              value={breakSettings.totalBreakAllowance}
              onChange={handleBreakSettingChange}
              min="1"
              max="240"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* 1.10.2 Nastavitve beleženja odmorov */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Beleženje odmorov</h3>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={trackBreaks}
              onChange={handleTrackBreaksChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Beleži odmore za vse uporabnike</span>
          </label>
        </div>
        
        {/* 1.10.3 Izvzete vloge */}
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Izvzete vloge</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableRoles.map(role => (
              <label key={role} className="flex items-center">
                <input
                  type="checkbox"
                  checked={exemptedRoles.includes(role)}
                  onChange={() => handleRoleExemptionChange(role)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* 1.10.4 Izvzeti uporabniki */}
        <div>
          <h4 className="text-md font-medium mb-2">Izvzeti uporabniki</h4>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Išči uporabnike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id || '')}
                    onChange={() => handleUserExemptionChange(user.id || '')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {user.firstName} {user.lastName} ({user.email})
                  </span>
                </label>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">Ni najdenih uporabnikov</div>
            )}
          </div>
        </div>
      </div>
      
      {/* 1.10.5 Gumbi za akcije */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
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
  );
};

export default BreakSettings;
