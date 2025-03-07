// components/dashboard/InstallerProjects.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../../types/project';

// 1. DEFINICIJA TIPOV
interface InstallerProjectsProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

// 2. KOMPONENTA ZA PRIKAZ PROJEKTOV MONTERJA
const InstallerProjects: React.FC<InstallerProjectsProps> = ({ projects = [], onProjectClick }) => {
  const navigate = useNavigate();
  
  // 2.1 Pomožne funkcije
  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case 'DRAFT':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: ProjectStatus): string => {
    switch (status) {
      case 'DRAFT':
        return 'V pripravi';
      case 'IN_PROGRESS':
        return 'V izvajanju';
      case 'COMPLETED':
        return 'Zaključen';
      case 'CANCELLED':
        return 'Preklican';
      default:
        return 'Neznan status';
    }
  };
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Ni datuma';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric'
    });
  };

  // 2.2 Prikaz projektov
  return (
    <div>
      {!projects || projects.length === 0 ? (
        <div className="text-gray-500 text-center py-3">
          Trenutno niste dodeljeni nobenemu projektu
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onProjectClick(project.id || '')}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                <div>
                  <span className="font-medium">Datum izvedbe:</span>{' '}
                  {project.executionDate ? formatDate(project.executionDate.date) : 'Ni določen'}
                </div>
                
                <div>
                  <span className="font-medium">Lokacija:</span>{' '}
                  {project.location?.city || 'Ni določena'}
                </div>
                
                <div>
                  <span className="font-medium">Vodja:</span>{' '}
                  {project.projectManager?.name || 'Ni določen'}
                </div>
                
                <div>
                  <span className="font-medium">Naročnik:</span>{' '}
                  {project.client?.name || 'Ni določen'}
                </div>
              </div>
              
              {project.description && (
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Opis:</span>{' '}
                  <span className="line-clamp-2">{project.description}</span>
                </div>
              )}
              
              {/* Prikaz števila nalog */}
              {project.tasks && project.tasks.length > 0 && (
                <div className="flex justify-end">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {project.tasks.length} {project.tasks.length === 1 ? 'naloga' : 'naloge'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstallerProjects;
