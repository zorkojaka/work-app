// components/dashboard/WorkStatus.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';
import { formatTime } from '../../utils/timeUtils';

interface WorkStatusProps {
  currentSession: WorkSession | null;
  status: string;
  workDuration: number;
}

const WorkStatus: React.FC<WorkStatusProps> = ({
  currentSession,
  status,
  workDuration
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
      {currentSession && (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Začetek dela:</span>{' '}
            {formatTime(currentSession.startTimestamp)}
          </div>
          <div>
            <span className="font-medium">Skupni čas dela:</span>{' '}
            <span className="font-mono">{formatDuration(workDuration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkStatus;