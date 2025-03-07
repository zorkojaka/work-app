import React, { useState } from 'react';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { UIConfig, UIProjectIndustry, UIProjectBudgetRange } from '../../types/ui';
import { PencilIcon, ChevronDownIcon, ChevronUpIcon, CurrencyDollarIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface ProjectCardProps {
    project: Project;
    client?: Client;
    uiConfig: UIConfig;
    onClick?: () => void;
    expanded?: boolean;
    onToggleExpand?: () => void;
    isProjectManager?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    client,
    uiConfig,
    onClick,
    expanded = false,
    onToggleExpand,
    isProjectManager = false
}) => {
    // Lokalno stanje za razširitev, če ni podano od zunaj
    const [isExpanded, setIsExpanded] = useState(expanded);
    
    // Uporabimo zunanje stanje, če je podano, sicer lokalno
    const isCardExpanded = onToggleExpand ? expanded : isExpanded;
    
    // Get industries with their colors and icons
    const industries = (
        project.industryIds?.map(id =>
            uiConfig.industries.find((i: UIProjectIndustry) => i.id === id)
        ).filter((i): i is UIProjectIndustry => i !== undefined) || []
    );
    
    // Najdi finančni rang projekta
    const budgetRange = project.budgetRangeId ? 
        uiConfig.budgetRanges?.find((range: UIProjectBudgetRange) => range.id === project.budgetRangeId) : 
        undefined;

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.();
    };
    
    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpand) {
            onToggleExpand();
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Industry Color Bars with Icons */}
            <div className="flex relative">
                {industries.length > 0 ? (
                    <div className="flex flex-grow" style={{ width: 'calc(100% - 24px)' }}>
                        {industries.map((industry) => (
                            <div
                                key={industry.id}
                                className="relative h-6 grow"
                                style={{ backgroundColor: industry.color }}
                            >
                                <div 
                                    className="absolute inset-0 flex items-center justify-center text-white"
                                    title={industry.name}
                                >
                                    {industry.icon}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-2 bg-gray-200 w-full" />
                )}
                
                {/* Ikona finančnega ranga na desni strani vrstice z ikonami panog */}
                {(project.value !== undefined || budgetRange) && (
                    <div 
                        className="h-6 px-2 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: budgetRange?.color || '#3B82F6' }}
                        title={project.value !== undefined ? 
                            `Vrednost projekta: ${project.value.toLocaleString()} €` : 
                            budgetRange ? `Finančni rang: ${budgetRange.title || 'Finančni rang'} (${budgetRange.min || 0} - ${budgetRange.max || 0} €)` : ''}
                    >
                        {project.value !== undefined ? 
                            (project.value >= 1000 ? 
                                `${(project.value / 1000).toFixed(project.value % 1000 === 0 ? 0 : 1)}k` : 
                                `${project.value}€`) : 
                            budgetRange?.id === 'xs' ? '0.5k' : 
                            budgetRange?.id === 'sm' ? '1k' : 
                            budgetRange?.id === 'md' ? '2.5k' : 
                            budgetRange?.id === 'lg' ? '5k' : 
                            budgetRange?.id === 'xl' ? '10k+' : 
                            budgetRange?.icon === '⭐' ? '0€ ⭐' :
                            budgetRange?.max ? `${Math.floor((budgetRange.max) / 1000)}k` : '0€'}
                    </div>
                )}
            </div>

            {/* Project Content */}
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center">
                            {/* Številka projekta */}
                            {project.projectId && (
                                <span className="text-sm font-semibold text-blue-600 mr-2">
                                    #{project.projectId}
                                </span>
                            )}
                            <h3 className="text-sm font-medium text-gray-900 truncate mr-2">
                                {project.name}
                            </h3>
                        </div>
                        
                        {client && (
                            <p className="text-sm text-gray-500 truncate">
                                {client.basicInfo.name}
                            </p>
                        )}
                        {project.location?.city && (
                            <p className="text-sm text-gray-500">
                                {project.location.city}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center">
                        {/* Gumb za urejanje */}
                        <button
                            onClick={handleEditClick}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 mr-1"
                            title="Uredi projekt"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Gumb za razširitev */}
                        <button
                            onClick={handleToggleExpand}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            title={isCardExpanded ? "Skrij podrobnosti" : "Prikaži podrobnosti"}
                        >
                            {isCardExpanded ? (
                                <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                                <ChevronDownIcon className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Razširjen prikaz */}
                {isCardExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            {project.description && (
                                <div className="col-span-2">
                                    <h4 className="text-xs font-medium text-gray-500">Opis</h4>
                                    <p className="text-sm text-gray-700">{project.description}</p>
                                </div>
                            )}
                            
                            {project.value !== undefined && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Vrednost</h4>
                                    <p className="text-sm text-gray-700">{project.value.toLocaleString()} €</p>
                                </div>
                            )}
                            
                            {budgetRange && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Finančni rang</h4>
                                    <p className="text-sm text-gray-700">{budgetRange.title}</p>
                                </div>
                            )}
                            
                            {project.executionDate?.date && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Rok izvedbe</h4>
                                    <p className="text-sm text-gray-700 flex items-center">
                                        {new Date(project.executionDate.date).toLocaleDateString('sl-SI')}
                                        {project.executionDate.time && ` ob ${project.executionDate.time}`}
                                        {project.executionDate.confirmed && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Potrjeno
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                            
                            {project.deadline && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Rok</h4>
                                    <p className="text-sm text-gray-700">
                                        {typeof project.deadline === 'object' && project.deadline.toDate 
                                            ? project.deadline.toDate().toLocaleDateString('sl-SI')
                                            : new Date(project.deadline).toLocaleDateString('sl-SI')}
                                    </p>
                                </div>
                            )}
                            
                            {project.clientId && client && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Kontakt</h4>
                                    <p className="text-sm text-gray-700 flex items-center">
                                        {client.basicInfo.name} 
                                        {client.basicInfo.email && ` (${client.basicInfo.email})`}
                                    </p>
                                </div>
                            )}
                            
                            {project.clientId && client && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Stranka</h4>
                                    <p className="text-sm text-gray-700">
                                        {client.name}
                                    </p>
                                </div>
                            )}
                            
                            {/* Gumb za dostop do strani za izvedbo projekta - viden samo za vodje projektov */}
                            {isProjectManager && (
                                <div className="mt-3">
                                    <a 
                                        href={`/project-execution/${project.id}`}
                                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Izvedba projekta
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;