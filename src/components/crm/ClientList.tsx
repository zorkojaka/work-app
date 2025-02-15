import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';

interface Client {
  id: string;
  type: 'COMPANY' | 'INDIVIDUAL';
  basicInfo: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
    };
  };
  vatRate: number;
  source: string;
  projects: string[];
}

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef);
        const querySnapshot = await getDocs(q);
        
        const clientData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Client[];
        
        setClients(clientData);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  if (loading) {
    return (
      <>
        <Header title="Stranke" />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Stranke" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stranke</h1>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Nova stranka
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DDV stopnja
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.basicInfo.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.type === 'COMPANY' ? 'Podjetje' : 'Fizična oseba'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.basicInfo.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.basicInfo.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.vatRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;