import React from 'react';
import { Project } from '../../types/project';
import Statistics from '../statistics/Statistics';

interface ProjectStatsProps {
  projects: Project[];
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ projects = [] }) => {
  return (
    <div className="mb-6">
      <Statistics 
        projects={projects}
      />
    </div>
  );
};

export default ProjectStats;
