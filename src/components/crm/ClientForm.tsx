import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';

interface ClientFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL',
    basicInfo: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        postalCode: ''
      }
    },
    vatRate: 22,
    source: 'WEB'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const clientsRef = collection(db, 'clients');
      await addDoc(clientsRef, {
        ...formData,
        projects: []
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Nova stranka</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Tip stranke</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({
                  ...formData,
                  type: e.target.value as 'COMPANY' | 'INDIVIDUAL',
                  vatRate: e.target.value === 'COMPANY' ? 22 : 9.5
                })}
              >
                <option value="INDIVIDUAL">Fizična oseba</option>
                <option value="COMPANY">Podjetje</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Ime</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.basicInfo.name}
                onChange={(e) => setFormData({
                  ...formData,
                  basicInfo: {
                    ...formData.basicInfo,
                    name: e.target.value
                  }
                })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.basicInfo.email}
                onChange={(e) => setFormData({
                  ...formData,
                  basicInfo: {
                    ...formData.basicInfo,
                    email: e.target.value
                  }
                })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Telefon</label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.basicInfo.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  basicInfo: {
                    ...formData.basicInfo,
                    phone: e.target.value
                  }
                })}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                onClick={onClose}
              >
                Prekliči
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Shrani
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;