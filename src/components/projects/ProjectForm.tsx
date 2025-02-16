// src/components/projects/ProjectForm.tsx

/**** začetek razdelka 1 - imports ****/
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { Timestamp } from 'firebase/firestore';
import ClientForm from '../crm/ClientForm';
import ProjectTeamMembers from './ProjectTeamMembers';
/**** konec razdelka 1 ****/

/**** začetek razdelka 2 - interfaces ****/
interface ProjectFormProps {
    onClose: () => void;
    onSuccess: () => void;
    editProject?: Project | null;
}
/**** konec razdelka 2 ****/

/**** začetek razdelka 3 - component & state ****/
/**** začetek razdelka 3.1 - component initialization ****/
const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSuccess, editProject }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [useClientAddress, setUseClientAddress] = useState(true);
/**** konec razdelka 3.1 ****/

/**** začetek razdelka 3.2 - form state ****/    
    const [formData, setFormData] = useState<Omit<Project, 'id'>>({
        clientId: '',
        name: '',
        description: '',
        status: 'DRAFT',
        startDate: Timestamp.now(),
        location: {
            street: '',
            city: '',
            postalCode: ''
        },
        team: {},
        equipment: {
            cameras: [],
            materials: []
        },
        costs: {
            materials: 0,
            labor: 0,
            travel: 0
        },
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now(),
        createdBy: user?.uid || ''
    });
/**** konec razdelka 3.2 ****/
/**** konec razdelka 3 ****/

/**** začetek razdelka 4 - handlers & effects ****/
   /**** začetek razdelka 4.1 - data fetching ****/
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
}, [editProject, clients]);
/**** konec razdelka 4.1 ****/

/**** začetek razdelka 4.2 - event handlers ****/
const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
        setSelectedClient(client);
        setFormData(prevData => ({
            ...prevData,
            clientId: client.id,
            name: `Projekt ${client.basicInfo.name}`,
            location: useClientAddress ? {
                street: client.basicInfo.address.street,
                city: client.basicInfo.address.city,
                postalCode: client.basicInfo.address.postalCode
            } : prevData.location
        }));
    }
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
        if (editProject?.id) {
            const projectRef = doc(db, 'projects', editProject.id);
            await updateDoc(projectRef, {
                ...formData,
                lastUpdated: Timestamp.now(),
                team: {
                    ...formData.team,
                    [user.uid]: {
                        userId: user.uid,
                        role: 'PROJECT_MANAGER',
                        tasks: []
                    }
                }
            });
        } else {
            const projectsRef = collection(db, 'projects');
            await addDoc(projectsRef, {
                ...formData,
                createdBy: user.uid,
                createdAt: Timestamp.now(),
                lastUpdated: Timestamp.now(),
                team: {
                    [user.uid]: {
                        userId: user.uid,
                        role: 'PROJECT_MANAGER',
                        tasks: []
                    },
                    ...formData.team
                }
            });
        }
        onSuccess();
        onClose();
    } catch (error) {
        console.error('Error saving project:', error);
    }
};
/**** konec razdelka 4.2 ****/
/**** konec razdelka 4 ****/

/**** začetek razdelka 5 - render ****/
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Opis</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                        />
                    </div>

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

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Prekliči
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            {editProject ? 'Posodobi' : 'Shrani'}
                        </button>
                    </div>
                </form>

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
/**** konec razdelka 5 ****/