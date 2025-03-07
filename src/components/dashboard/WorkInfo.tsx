// components/dashboard/WorkInfo.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';

// 1. TIPI
interface WorkInfoProps {
  currentSession: WorkSession | null;
  onBreak: boolean;
  onShortBreak: boolean;
  breakTimeLeft: number | null;
  shortBreakTimeLeft: number | null;
}

// 2. KOMPONENTA ZA PRIKAZ INFORMACIJ O DELU
const WorkInfo: React.FC<WorkInfoProps> = ({ 
  currentSession, 
  onBreak, 
  onShortBreak,
  breakTimeLeft,
  shortBreakTimeLeft
}) => {
  if (!currentSession) {
    return null;
  }

  // 2.1 Pomožne funkcije
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsRemaining = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secondsRemaining}s`;
    } else {
      return `${secondsRemaining}s`;
    }
  };

  // 2.2 Izračun trajanja dela
  const calculateWorkDuration = (): number => {
    if (!currentSession || !currentSession.startTime) return 0;
    
    const startTime = currentSession.startTime.toDate();
    const now = new Date();
    const totalSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    // Odštejemo čas odmorov
    const breakDuration = currentSession.breakDuration || 0;
    const shortBreakDuration = currentSession.shortBreakDuration || 0;
    
    return totalSeconds - breakDuration - shortBreakDuration;
  };

  // 2.3 Izračun preostalega časa za odmore
  const calculateTotalBreakTimeLeft = (): number => {
    const TOTAL_BREAK_ALLOWANCE = 45 * 60; // 45 minut v sekundah
    const usedBreakTime = (currentSession.breakDuration || 0) + (currentSession.shortBreakDuration || 0);
    return Math.max(0, TOTAL_BREAK_ALLOWANCE - usedBreakTime);
  };

  // 2.4 Prikaz informacij o delu
  return (
    <div className="space-y-4">
      {currentSession && currentSession.startTime && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Začetek dela:</div>
            <div className="font-medium">{formatTime(currentSession.startTime.toDate())}</div>
            
            <div className="text-gray-600">Trajanje dela:</div>
            <div className="font-medium">{formatDuration(calculateWorkDuration())}</div>
          </div>
          
          {/* Grafični prikaz delovnega časa */}
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Delovni čas</span>
              <span className="text-sm font-medium text-gray-700">{formatDuration(calculateWorkDuration())}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (calculateWorkDuration() / (8 * 3600)) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">8-urni delovnik</div>
          </div>
          
          {/* Prikaz časa za odmore */}
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Čas za odmore</span>
              <span className="text-sm font-medium text-gray-700">{formatDuration(calculateTotalBreakTimeLeft())}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (calculateTotalBreakTimeLeft() / (45 * 60)) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">45 minut za odmore</div>
          </div>
          
          {/* Podrobnosti o odmorih */}
          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
            {(currentSession.breakDuration && currentSession.breakDuration > 0) && (
              <>
                <div className="text-gray-600">Čas malice:</div>
                <div className="font-medium">{formatDuration(currentSession.breakDuration)}</div>
              </>
            )}
            
            {(currentSession.shortBreakDuration && currentSession.shortBreakDuration > 0) && (
              <>
                <div className="text-gray-600">Čas kratkih odmorov:</div>
                <div className="font-medium">{formatDuration(currentSession.shortBreakDuration)}</div>
              </>
            )}
          </div>
        </>
      )}
      
      {/* Prikaz odštevalnika za odmore */}
      {onBreak && breakTimeLeft !== null && (
        <div className="mt-2 p-3 bg-blue-100 rounded">
          <div className="font-medium text-blue-800 mb-1">Na malici</div>
          <div className="text-sm mb-2">Preostali čas: {formatDuration(breakTimeLeft)}</div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (breakTimeLeft / (30 * 60)) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {onShortBreak && shortBreakTimeLeft !== null && (
        <div className="mt-2 p-3 bg-teal-100 rounded">
          <div className="font-medium text-teal-800 mb-1">Na kratkem odmoru</div>
          <div className="text-sm mb-2">Preostali čas: {formatDuration(shortBreakTimeLeft)}</div>
          <div className="w-full bg-teal-200 rounded-full h-2.5">
            <div 
              className="bg-teal-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (shortBreakTimeLeft / (5 * 60)) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkInfo;
