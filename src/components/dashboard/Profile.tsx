import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';


interface UserProfile {
  firstName?: string;
  lastName?: string;
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
  };
  phone?: string;
  email1?: string;
  email2?: string;
  profilePicture?: string;
  roles?: string[];
}

export const Profile: React.FC = () => {
  const { user, logout, roles } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Če profil še ne obstaja, nastavimo prazen objekt
        setProfile({});
      }
    };

    fetchProfile();
  }, [user]);

  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(roles.includes('Organizator') 
      ? [{ label: 'Organizator', onClick: () => navigate('/projects') }] 
      : []),
    { label: 'Odjava', onClick: logout },
  ];

  if (!profile) {
    return <div>Nalaganje...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Profil" menuItems={menuItems} />
      
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold">Profil uporabnika</h2>
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              
              Uredi
            </button>
          </div>

          {/* Če še ni podatkov, prikažemo sporočilo */}
          {!profile.firstName && !profile.lastName && (
            <div className="text-center py-8 text-gray-500">
              <p>Profil še ni izpolnjen</p>
              <p>Kliknite "Uredi" za vnos podatkov</p>
            </div>
          )}

          {/* Če so podatki, jih prikažemo */}
          {(profile.firstName || profile.lastName) && (
            <div className="flex items-start space-x-6">
              <div className="w-32 h-32">
                <img
                  src={profile.profilePicture || '/default-avatar.png'}
                  alt="Profilna slika"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {(profile.firstName || profile.lastName) && (
                    <div>
                      <label className="text-sm text-gray-500">Ime in priimek</label>
                      <p className="font-medium">
                        {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '-'}
                      </p>
                    </div>
                  )}
                  
                  {roles.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-500">Vloge</label>
                      <p className="font-medium">{roles.join(', ')}</p>
                    </div>
                  )}

                  {profile.address && (
                    <div>
                      <label className="text-sm text-gray-500">Naslov</label>
                      <p className="font-medium">{profile.address.street || '-'}</p>
                      <p className="font-medium">
                        {[profile.address.postalCode, profile.address.city].filter(Boolean).join(' ') || '-'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-500">Kontakt</label>
                    <p className="font-medium">{profile.phone || '-'}</p>
                    <p className="font-medium">{profile.email1 || '-'}</p>
                    {profile.email2 && <p className="font-medium">{profile.email2}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};