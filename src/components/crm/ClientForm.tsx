import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import { Client } from '../../types/client';

// Define props interface
interface ClientFormProps {
    onClose: () => void;
    onSuccess: () => void;
    editClient?: Client | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ onClose, onSuccess, editClient }) => {
    // Hooks and state
    const { user } = useAuth();
    const [formData, setFormData] = useState<Omit<Client, 'id'>>({
        type: 'INDIVIDUAL',
        basicInfo: {
            name: '',
            email: '',
            phone: '',
            taxNumber: '',
            address: {
                street: '',
                postalCode: '',
                city: ''
            }
        },
        vatRate: 22,
        discountLevel: 0,
        discountValue: 0,
        source: 'WEB',
        projects: []
    });
    const [error, setError] = useState<string>('');

    // Effects
    useEffect(() => {
        if (editClient) {
            setFormData({
                ...editClient,
                basicInfo: {
                    ...editClient.basicInfo,
                    address: editClient.basicInfo.address || {
                        street: '',
                        postalCode: '',
                        city: ''
                    }
                }
            });
        }
    }, [editClient]);

    // Validation functions
    const validateForm = () => {
        if (!formData.basicInfo.name.trim()) {
            setError('Ime je obvezno');
            return false;
        }
        if (!formData.basicInfo.email.trim()) {
            setError('Email je obvezen');
            return false;
        }
        if (!formData.basicInfo.phone.trim()) {
            setError('Telefon je obvezen');
            return false;
        }
        if (formData.type === 'COMPANY' && !formData.basicInfo.taxNumber?.trim()) {
            setError('Davčna številka je obvezna za podjetja');
            return false;
        }
        if (!formData.basicInfo.address.street.trim()) {
            setError('Ulica je obvezna');
            return false;
        }
        if (!formData.basicInfo.address.postalCode.trim()) {
            setError('Poštna številka je obvezna');
            return false;
        }
        if (!formData.basicInfo.address.city.trim()) {
            setError('Mesto je obvezno');
            return false;
        }
        return true;
    };

    // Event handlers
    const handleDiscountLevelChange = (level: number) => {
        setFormData({
            ...formData,
            discountLevel: level,
            discountValue: level * 2
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        if (!validateForm()) return;

        try {
            if (editClient?.id) {
                // Updating existing client
                const clientRef = doc(db, 'clients', editClient.id);
                await updateDoc(clientRef, formData);
            } else {
                // Creating new client
                const clientsRef = collection(db, 'clients');
                await addDoc(clientsRef, {
                    ...formData,
                    projects: []
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            setError('Prišlo je do napake pri shranjevanju. Prosim poskusite ponovno.');
        }
    };

    // Render form
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {editClient ? 'Uredi stranko' : 'Nova stranka'}
                    </h3>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    
                    {/* Form section */}
                    <form onSubmit={handleSubmit}>
                        {/* Client type selection */}
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

                        {/* Basic information */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                {formData.type === 'COMPANY' ? 'Naziv podjetja' : 'Ime in priimek'}
                            </label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.basicInfo.name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    basicInfo: { ...formData.basicInfo, name: e.target.value }
                                })}
                                required
                            />
                        </div>

                        {/* Company specific fields */}
                        {formData.type === 'COMPANY' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Davčna številka</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.basicInfo.taxNumber}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        basicInfo: { ...formData.basicInfo, taxNumber: e.target.value }
                                    })}
                                    required
                                    placeholder="npr. SI12345678"
                                />
                            </div>
                        )}

                        {/* Contact information */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.basicInfo.email}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    basicInfo: { ...formData.basicInfo, email: e.target.value }
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
                                    basicInfo: { ...formData.basicInfo, phone: e.target.value }
                                })}
                                required
                            />
                        </div>

                        {/* Address information */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Ulica in številka</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.basicInfo.address.street}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    basicInfo: {
                                        ...formData.basicInfo,
                                        address: { ...formData.basicInfo.address, street: e.target.value }
                                    }
                                })}
                                required
                                placeholder="npr. Agrokombinatska cesta 12"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Poštna številka</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.basicInfo.address.postalCode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        basicInfo: {
                                            ...formData.basicInfo,
                                            address: { ...formData.basicInfo.address, postalCode: e.target.value }
                                        }
                                    })}
                                    required
                                    placeholder="1000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mesto</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.basicInfo.address.city}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        basicInfo: {
                                            ...formData.basicInfo,
                                            address: { ...formData.basicInfo.address, city: e.target.value }
                                        }
                                    })}
                                    required
                                    placeholder="Ljubljana"
                                />
                            </div>
                        </div>

                        {/* Discount selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Stopnja popusta</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.discountLevel}
                                onChange={(e) => handleDiscountLevelChange(Number(e.target.value))}
                            >
                                <option value="0">Brez popusta (0%)</option>
                                <option value="1">Stopnja 1 (2%)</option>
                                <option value="2">Stopnja 2 (4%)</option>
                                <option value="3">Stopnja 3 (6%)</option>
                                <option value="4">Stopnja 4 (8%)</option>
                                <option value="5">Stopnja 5 (10%)</option>
                            </select>
                        </div>

                        {/* Form actions */}
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
                                {editClient ? 'Posodobi' : 'Shrani'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClientForm;