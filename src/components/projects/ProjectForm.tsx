// Imports section - dodajte nove importe
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { Timestamp } from 'firebase/firestore';
import ClientForm from '../crm/ClientForm';

// Posodobite interface za ProjectFormProps - ni sprememb
interface ProjectFormProps {
    onClose: () => void;
    onSuccess: () => void;
    editProject?: Project | null;
}

// Dodajte novo stanje za stranke
const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSuccess, editProject }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [useClientAddress, setUseClientAddress] = useState(true);
    
    // ... obstoječa koda za formData ...

    // Dodajte funkcijo za nalaganje strank
    const fetchClients = async () => {
        try {
            const clientsRef = collection(db, 'clients');
            const snapshot = await getDocs(clientsRef);
            const clientData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[];
            setClients(clientData);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    // Posodobite useEffect
    useEffect(() => {
        fetchClients();
        if (editProject) {
            setFormData({
                ...editProject,
                location: editProject.location || {
                    street: '',
                    city: '',
                    postalCode: ''
                }
            });
            const client = clients.find(c => c.id === editProject.clientId);
            if (client) {
                setSelectedClient(client);
            }
        }
    }, [editProject]);

    // Dodajte funkcijo za handling izbire stranke
    const handleClientSelect = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setSelectedClient(client);
            if (useClientAddress) {
                setFormData(prev => ({
                    ...prev,
                    clientId: client.id,
                    location: {
                        street: client.basicInfo.address.street,
                        city: client.basicInfo.address.city,
                        postalCode: client.basicInfo.address.postalCode
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    clientId: client.id
                }));
            }
        }
    };

    // Posodobite obrazec - dodajte izbiro stranke in naslov takoj za poljem za opis
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
                {/* ... obstoječa koda za header ... */}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Izbira stranke */}
                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Stranka *</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={selectedClient?.id || ''}
                                onChange={(e) => handleClientSelect(e.target.value)}
                                required
                            >
                                <option value="">Izberi stranko</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.basicInfo.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowClientForm(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Nova stranka
                        </button>
                    </div>

                    {/* Ime in opis projekta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ime projekta *</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    {/* ... obstoječa polja za opis in status ... */}

                    {/* Lokacija projekta */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <label className="block text-sm font-medium text-gray-700">Lokacija projekta</label>
                            {selectedClient && (
                                <label className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={useClientAddress}
                                        onChange={(e) => {
                                            setUseClientAddress(e.target.checked);
                                            if (e.target.checked && selectedClient) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    location: {
                                                        street: selectedClient.basicInfo.address.street,
                                                        city: selectedClient.basicInfo.address.city,
                                                        postalCode: selectedClient.basicInfo.address.postalCode
                                                    }
                                                }));
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    Uporabi naslov stranke
                                </label>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Ulica"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.location.street}
                            onChange={(e) => setFormData({
                                ...formData,
                                location: { ...formData.location, street: e.target.value }
                            })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                                type="text"
                                placeholder="Poštna številka"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.location.postalCode}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    location: { ...formData.location, postalCode: e.target.value }
                                })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Mesto"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.location.city}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    location: { ...formData.location, city: e.target.value }
                                })}
                                required
                            />
                        </div>
                    </div>

                    {/* ... obstoječa koda za gumbe ... */}
                </form>

                {/* Modal za novo stranko */}
                {showClientForm && (
                    <ClientForm
                        onClose={() => setShowClientForm(false)}
                        onSuccess={() => {
                            setShowClientForm(false);
                            fetchClients();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectForm;