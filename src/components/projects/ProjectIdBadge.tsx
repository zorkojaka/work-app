// 1. KOMPONENTA ZA PRIKAZ ID ŠTEVILKE PROJEKTA
import React from 'react';

// 1.1 Definicija tipov
interface ProjectIdBadgeProps {
  projectId: string;
  className?: string;
}

// 1.2 Komponenta za prikaz ID številke projekta
const ProjectIdBadge: React.FC<ProjectIdBadgeProps> = ({ projectId, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
      #{projectId}
    </span>
  );
};

export default ProjectIdBadge;
