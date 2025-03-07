// components/dashboard/WorkStatus.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';

// 1. DEFINICIJA TIPOV
interface WorkStatusProps {
  status: string;
  currentSession: WorkSession | null;
  workDuration: number;
}

// 2. KOMPONENTA ZA PRIKAZ STANJA DELA
const WorkStatus: React.FC<WorkStatusProps> = ({ status, currentSession, workDuration }) => {
  // 2.1 Pomožne funkcije
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 2.2 Določanje barve glede na status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Na lokaciji':
        return 'bg-green-500';
      case 'Na malici':
        return 'bg-yellow-500';
      case 'Na poti':
        return 'bg-blue-500';
      case 'Končano':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 2.3 Prikaz stanja dela
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Stanje dela</h2>
      <div className="flex items-center mb-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}></div>
        <span className="font-medium">{status}</span>
      </div>
      
      {currentSession && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Začetek dela:</span>
            <span className="font-medium">{formatTime(currentSession.startTime)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Trajanje:</span>
            <span className="font-medium">{formatDuration(workDuration)}</span>
          </div>
          
          {currentSession.breakDuration > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Čas malice:</span>
              <span className="font-medium">{formatDuration(currentSession.breakDuration)}</span>
            </div>
          )}
        </div>
      )}
      
      {!currentSession && (
        <p className="text-gray-500 py-2">Danes še niste začeli z delom.</p>
      )}
    </div>
  );
};

export default WorkStatus;