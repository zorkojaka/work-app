import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import ClientForm from './ClientForm';
import { Client } from '../../types/client';

const ClientList: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const { user } = useAuth();

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

    const handleDelete = async (clientId: string) => {
        if (window.confirm('Ali ste prepričani, da želite izbrisati to stranko?')) {
            try {
                await deleteDoc(doc(db, 'clients', clientId));
                fetchClients();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setEditingClient(null);
        setShowForm(false);
    };

    useEffect(() => {
        fetchClients();
    }, [user]);

    useEffect(() => {
        const filtered = clients.filter(client =>
            client.basicInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.basicInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.basicInfo.phone.includes(searchTerm) ||
            client.basicInfo.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.basicInfo.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.basicInfo.address.postalCode.includes(searchTerm)
        );
        setFilteredClients(filtered);
    }, [clients, searchTerm]);

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
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Nova stranka
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Išči stranke..."
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ime
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Naslov
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tip
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kontakt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    DDV
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Popust
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Akcije
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {client.basicInfo.name}
                                        {client.type === 'COMPANY' && client.basicInfo.taxNumber && (
                                            <div className="text-sm text-gray-500">
                                                ID za DDV: {client.basicInfo.taxNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{client.basicInfo.address.street}</div>
                                        <div>{client.basicInfo.address.postalCode} {client.basicInfo.address.city}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {client.type === 'COMPANY' ? 'Podjetje' : 'Fizična oseba'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{client.basicInfo.email}</div>
                                        <div>{client.basicInfo.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {client.vatRate}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {client.discountValue}%
                                        {client.discountLevel > 0 && (
                                            <span className="ml-2 text-sm text-gray-500">
                                                (Stopnja {client.discountLevel})
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            >
                                                Uredi
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                Izbriši
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showForm && (
      <ClientForm 
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm();
          fetchClients();
        }}
        editClient={editingClient}
      />
                )}
            </div>
        </div>
    );
};

export default ClientList;