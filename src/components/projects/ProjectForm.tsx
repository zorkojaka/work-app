import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ProjectLocation, ProjectExecutionDate } from '../../types/project';
import { Client } from '../../types/client';
import { UIConfig } from '../../types/ui';
import { useProjectStages } from '../../hooks/useProjectStages';
import TagSelector from './TagSelector';
import IndustrySelector from './IndustrySelector';
import BudgetRangeSelector from './BudgetRangeSelector';
import ClientForm from '../crm/ClientForm';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectFormProps {
    project?: Project | null;
    onClose: () => void;
    onSave: (project: Project | Partial<Project>) => Promise<Project | null>;
    onDelete: (projectId: string) => Promise<void>;
    uiConfig: UIConfig;
    clients: Client[];
}

interface FormErrors {
    name?: string;
    client?: string;
    industry?: string;
    location?: string;
    submit?: string;
    exactPrice?: string;
    budgetRange?: string;
    projectId?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
    project,
    onClose,
    onSave,
    onDelete,
    uiConfig,
    clients
}) => {
    const { kanbanConfig } = useProjectStages();
    
    // 1. Pridobimo prvi stolpec in prvo fazo
    const firstColumn = kanbanConfig.columns[0] || { status: 'DRAFT' as ProjectStatus };
    const firstSubcategory = firstColumn.subcategories && firstColumn.subcategories.length > 0 
        ? firstColumn.subcategories[0].id 
        : undefined;
    
    // 1.1 Pridobimo ID številko projekta
    const getProjectId = () => {
        if (project?.projectId) return project.projectId;
        return ''; // Prazno, ker bo ID številka generirana v ProjectsPage.tsx
    };
    
    const [formData, setFormData] = useState<Partial<Project>>(() => ({
        // Odstranimo id pri novem projektu, saj ga bo generiral Firestore
        ...(project?.id ? { id: project.id } : {}),
        projectId: project?.projectId || getProjectId(),
        name: project?.name || '',
        description: project?.description || '',
        location: project?.location || {
            city: '',
            street: '',
            postalCode: ''
        },
        // Če gre za nov projekt, uporabimo prvi stolpec in prvo fazo
        status: project ? project.status : (firstColumn.status as ProjectStatus),
        subcategoryId: project ? project.subcategoryId : firstSubcategory,
        industryIds: project?.industryIds || [],
        budgetRangeId: project?.budgetRangeId || '',
        value: project?.value || 0,
        exactPrice: project?.exactPrice || 0,
        tags: project?.tags || [],
        clientId: project?.clientId || '',
        executionDate: project?.executionDate || {
            date: '',
            time: '',
            confirmed: false
        },
        createdAt: project?.createdAt,
        createdBy: project?.createdBy,
        lastUpdated: project?.lastUpdated
    }));

    const [errors, setErrors] = useState<FormErrors>({});
    const [useClientAddress, setUseClientAddress] = useState(true);
    const [showNewClientForm, setShowNewClientForm] = useState(false);

    const validateForm = () => {
        console.log('Preverjanje obrazca:', formData);
        const newErrors: FormErrors = {};

        if (!formData.industryIds?.length) {
            newErrors.industry = 'Izberite vsaj eno panogo';
        }

        if (!formData.clientId) {
            newErrors.client = 'Izberite stranko';
        }

        if (!formData.name) {
            newErrors.name = 'Vnesite naziv projekta';
        }

        if (formData.projectId && !/^\d{4}$/.test(formData.projectId)) {
            newErrors.projectId = 'ID številka mora vsebovati natanko 4 številke';
        }

        if (!formData.location?.city) {
            newErrors.location = 'Vnesite vse podatke o lokaciji';
        }

        console.log('Najdene napake:', newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClientChange = (clientId: string) => {
        console.log('Izbrana nova stranka:', clientId);
        const selectedClient = clients.find(c => c.id === clientId);
        
        setFormData(prev => ({
            ...prev,
            clientId,
            location: useClientAddress && selectedClient ? {
                city: selectedClient.basicInfo.address.city || '',
                street: selectedClient.basicInfo.address.street || '',
                postalCode: selectedClient.basicInfo.address.postalCode || ''
            } : prev.location || { city: '', street: '', postalCode: '' }
        }));
    };

    const getClientDisplayName = (client: Client) => {
        return `${client.basicInfo.name} ${client.type === 'COMPANY' ? '(Podjetje)' : '(Fizična oseba)'}`;
    };

    const handleLocationChange = (field: keyof ProjectLocation, value: string) => {
        console.log('Sprememba lokacije:', { polje: field, vrednost: value });
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location || { city: '', street: '', postalCode: '' },
                [field]: value
            }
        }));
    };

    const handleBudgetRangeChange = (id: string) => {
        console.log('Sprememba finančnega ranga:', id);
        const selectedRange = uiConfig.budgetRanges.find(range => range.id === id);
        
        // Določimo vrednost glede na ID ranga
        let rangeValue = 0;
        if (id === 'xs') {
            rangeValue = 500;
        } else if (id === 'sm') {
            rangeValue = 1000;
        } else if (id === 'md') {
            rangeValue = 2500;
        } else if (id === 'lg') {
            rangeValue = 5000;
        } else if (id === 'xl') {
            rangeValue = 10000;
        } else {
            const selectedRange = uiConfig.budgetRanges.find(range => range.id === id);
            rangeValue = selectedRange?.icon === '⭐' ? 0 : selectedRange?.max || 0;
        }
        
        console.log('Nastavljena vrednost iz ranga:', rangeValue);
        
        setFormData(prev => ({
            ...prev,
            budgetRangeId: id,
            // Če uporabnik ni ročno vnesel vrednosti, jo nastavimo iz ranga
            value: prev.exactPrice || rangeValue
        }));
    };

    const handleIndustryChange = (industryIds: string[]) => {
        console.log('Sprememba panog:', { stare: formData.industryIds, nove: industryIds });
        setFormData(prev => {
            const newData = {
                ...prev,
                industryIds: [...industryIds] // Naredimo kopijo array-a
            };
            console.log('Novo stanje:', newData);
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Poskus shranjevanja:', formData);
        
        if (!validateForm()) {
            return;
        }

        try {
            // Pripravimo podatke za shranjevanje
            const projectData: Partial<Project> = {
                ...formData,
                industryIds: [...(formData.industryIds || [])]
            };
            
            // Če je nov projekt in ni izbrana faza, uporabimo prvo fazo
            if (!projectData.id && !projectData.subcategoryId) {
                projectData.subcategoryId = firstSubcategory;
            }

            console.log('Shranjujem projekt:', projectData, 'Je nov projekt:', !projectData.id);
            await onSave(projectData);
            
            // Zapri obrazec po uspešnem shranjevanju
            onClose();
        } catch (error) {
            console.error('Napaka pri shranjevanju projekta:', error);
            setErrors({
                ...errors,
                submit: 'Napaka pri shranjevanju projekta. Poskusite znova.'
            });
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        
        try {
            await onDelete(formData.id);
            onClose();
        } catch (error) {
            console.error('Napaka pri brisanju:', error);
            setErrors(prev => ({
                ...prev,
                submit: 'Prišlo je do napake pri brisanju projekta.'
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        {project ? 'Uredi projekt' : 'Nov projekt'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 5.3 ID projekta in naziv */}
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ID številka
                            </label>
                            <input
                                type="text"
                                value={formData.projectId || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                placeholder={!formData.id ? "Samodejno generirano" : ""}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.projectId ? 'border-red-500' : ''}`}
                            />
                            {errors.projectId && (
                                <p className="mt-1 text-sm text-red-500">{errors.projectId}</p>
                            )}
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Naziv projekta
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Naziv projekta"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    {/* 5.1 Panoga */}
                    <div>
                        <IndustrySelector
                            selectedIds={formData.industryIds || []}
                            onChange={handleIndustryChange}
                            industries={uiConfig.industries}
                        />
                        {errors.industry && (
                            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                        )}
                    </div>

                    {/* 5.2 Stranka */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stranka
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={formData.clientId}
                                onChange={(e) => handleClientChange(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Izberite stranko</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {getClientDisplayName(client)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowNewClientForm(true)}
                                className="mt-1 px-4 py-2 text-sm text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                            >
                                Nova stranka
                            </button>
                        </div>
                        {errors.client && (
                            <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                        )}
                    </div>

                    {/* 5.4 Lokacija projekta */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            {formData.clientId && (
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={useClientAddress}
                                        onChange={(e) => {
                                            setUseClientAddress(e.target.checked);
                                            if (e.target.checked) {
                                                const selectedClient = clients.find(c => c.id === formData.clientId);
                                                if (selectedClient) {
                                                    handleLocationChange('city', selectedClient.basicInfo.address.city || '');
                                                    handleLocationChange('street', selectedClient.basicInfo.address.street || '');
                                                    handleLocationChange('postalCode', selectedClient.basicInfo.address.postalCode || '');
                                                }
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Uporabi naslov stranke</span>
                                </label>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    value={formData.location?.street || ''}
                                    onChange={(e) => handleLocationChange('street', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Ulica"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={formData.location?.postalCode || ''}
                                    onChange={(e) => handleLocationChange('postalCode', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Poštna številka"
                                />
                                <input
                                    type="text"
                                    value={formData.location?.city || ''}
                                    onChange={(e) => handleLocationChange('city', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Mesto"
                                />
                            </div>
                        </div>
                        {errors.location && (
                            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                        )}
                    </div>
                    
                    {/* 5.5 Opis projekta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opis projekta
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Opis projekta"
                        />
                    </div>

                    {/* 5.6 Finančni rang */}
                    <div>
                        <BudgetRangeSelector
                            selectedId={formData.budgetRangeId}
                            onChange={handleBudgetRangeChange}
                            budgetRanges={uiConfig.budgetRanges}
                        />
                        {errors.budgetRange && (
                            <p className="mt-1 text-sm text-red-600">{errors.budgetRange}</p>
                        )}
                    </div>

                    {/* 5.7 Točna končna cena */}
                    <div>
                        <label htmlFor="exactPrice" className="block text-sm font-medium text-gray-700">
                            Točna cena (€)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                id="exactPrice"
                                name="exactPrice"
                                value={formData.exactPrice || ''}
                                onChange={(e) => {
                                    const exactPrice = e.target.value ? parseFloat(e.target.value) : 0;
                                    setFormData(prev => ({
                                        ...prev,
                                        exactPrice,
                                        // Če je vnešena točna cena, posodobimo tudi vrednost projekta
                                        value: exactPrice
                                    }));
                                }}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Vnesite točno ceno"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Če vnesete točno ceno, bo ta imela prednost pred finančnim rangom
                            </p>
                        </div>
                        {errors.exactPrice && (
                            <p className="mt-1 text-sm text-red-600">{errors.exactPrice}</p>
                        )}
                    </div>

                    {/* 5.7.1 Datum in čas izvedbe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Datum in čas izvedbe
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Datum</label>
                                <input
                                    type="date"
                                    value={formData.executionDate?.date || ''}
                                    onChange={(e) => {
                                        const date = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            executionDate: {
                                                ...(prev.executionDate || { time: '', confirmed: false }),
                                                date
                                            }
                                        }));
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Čas</label>
                                <input
                                    type="time"
                                    value={formData.executionDate?.time || ''}
                                    onChange={(e) => {
                                        const time = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            executionDate: {
                                                ...(prev.executionDate || { date: '', confirmed: false }),
                                                time
                                            }
                                        }));
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.executionDate?.confirmed || false}
                                    onChange={(e) => {
                                        const confirmed = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            executionDate: {
                                                ...(prev.executionDate || { date: '', time: '' }),
                                                confirmed
                                            }
                                        }));
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Termin potrjen</span>
                            </label>
                        </div>
                    </div>

                    {/* 5.8 Oznake */}
                    <div>
                        <TagSelector
                            selectedTags={formData.tags || []}
                            availableTags={uiConfig.tags}
                            onChange={tags => setFormData(prev => ({ ...prev, tags }))}
                        />
                    </div>

                    {errors.submit && (
                        <p className="text-sm text-red-600">{errors.submit}</p>
                    )}

                    <div className="flex justify-between gap-4 mt-8">
                        {/* Gumb za brisanje se prikaže samo pri obstoječem projektu */}
                        {formData.id && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                            >
                                Izbriši projekt
                            </button>
                        )}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Prekliči
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                            >
                                {project ? 'Shrani' : 'Ustvari'}
                            </button>
                        </div>
                    </div>
                </form>

                {showNewClientForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg w-full max-w-2xl">
                            <ClientForm
                                onClose={() => setShowNewClientForm(false)}
                                onSuccess={() => {
                                    setShowNewClientForm(false);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectForm;