import React from 'react';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { UIConfig } from '../../types/ui';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ProjectListProps {
    projects: Project[];
    clients: Client[];
    uiConfig: UIConfig;
    onProjectClick: (project: Project) => void;
    expandedProjects?: Record<string, boolean>;
    onToggleExpand?: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
    projects,
    clients,
    uiConfig,
    onProjectClick,
    expandedProjects = {},
    onToggleExpand
}) => {
    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: Project['status']) => {
        switch (status) {
            case 'DRAFT':
                return 'V pripravi';
            case 'IN_PROGRESS':
                return 'V izvajanju';
            case 'COMPLETED':
                return 'Zaključeno';
            case 'CANCELLED':
                return 'Preklicano';
            default:
                return status;
        }
    };
    
    const handleToggleExpand = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (onToggleExpand) {
            onToggleExpand(projectId);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projekt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stranka
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lokacija
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Izvedba
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akcije
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => {
                        const client = clients.find(c => c.id === project.clientId);
                        const isExpanded = expandedProjects[project.id] || false;
                        
                        return (
                            <React.Fragment key={project.id}>
                                <tr
                                    onClick={() => onProjectClick(project)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {project.name}
                                        </div>
                                        {project.description && !isExpanded && (
                                            <div className="text-sm text-gray-500 line-clamp-2">
                                                {project.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {client?.basicInfo?.name || project.client || 'Neznan naročnik'}
                                        </div>
                                        {client?.basicInfo?.address?.city && (
                                            <div className="text-sm text-gray-500">
                                                {client.basicInfo.address.city}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {project.location?.city || '-'}
                                        </div>
                                        {project.location?.street && (
                                            <div className="text-sm text-gray-500">
                                                {project.location.street}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                                            {getStatusText(project.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.executionDate ? (
                                            <div>
                                                <div className="text-sm text-gray-900">
                                                    {project.executionDate.date ? 
                                                        format(new Date(project.executionDate.date), 'dd.MM.yyyy') :
                                                        '-'
                                                    }
                                                </div>
                                                {project.executionDate.time && (
                                                    <div className="text-sm text-gray-500">
                                                        {project.executionDate.time}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => handleToggleExpand(e, project.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                            title={isExpanded ? "Skrij podrobnosti" : "Prikaži podrobnosti"}
                                        >
                                            {isExpanded ? (
                                                <ChevronUpIcon className="w-4 h-4" />
                                            ) : (
                                                <ChevronDownIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                                
                                {/* Razširjen prikaz */}
                                {isExpanded && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={6} className="px-6 py-4">
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
                                                
                                                {project.budgetRangeId && uiConfig.budgetRanges && (
                                                    <div>
                                                        <h4 className="text-xs font-medium text-gray-500">Finančni rang</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {uiConfig.budgetRanges.find(range => range.id === project.budgetRangeId)?.title || '-'}
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
                                                
                                                {project.contact && (
                                                    <div>
                                                        <h4 className="text-xs font-medium text-gray-500">Kontakt</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {project.contact.firstName} {project.contact.lastName}
                                                            {project.contact.email && ` (${project.contact.email})`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ProjectList;
