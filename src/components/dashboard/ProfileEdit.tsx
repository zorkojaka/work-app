// ProfileEdit.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';

export const ProfileEdit: React.FC = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
    },
    phone: '',
    email1: '',
    email2: '',
    profilePicture: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setFormData(docSnap.data() as any);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    try {
      let profilePictureUrl = formData.profilePicture;

      if (imageFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        profilePicture: profilePictureUrl,
      });

      navigate('/profile');
    } catch (error) {
      console.error('Napaka pri shranjevanju:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(roles.includes('Organizator') 
      ? [{ label: 'Organizator', onClick: () => navigate('/projects') }] 
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Urejanje profila" menuItems={menuItems} />
      
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Urejanje profila</h2>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div>
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : formData.profilePicture || '/default-avatar.png'}
                  alt="Profilna slika"
                  className="w-32 h-32 object-cover rounded-full"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ime</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priimek</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ulica</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, street: e.target.value}
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Poštna številka</label>
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, postalCode: e.target.value}
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mesto</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, city: e.target.value}
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email 1</label>
                <input
                  type="email"
                  value={formData.email1}
                  onChange={(e) => setFormData({...formData, email1: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email 2</label>
                <input
                  type="email"
                  value={formData.email2}
                  onChange={(e) => setFormData({...formData, email2: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Prekliči
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Shranjevanje...' : 'Shrani'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};