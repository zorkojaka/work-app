// components/dashboard/BreakTimer.tsx
import React, { useEffect } from 'react';

// 1. DEFINICIJA TIPOV
interface BreakTimerProps {
  breakTimeLeft: number;
  breakType?: 'lunch' | 'short'; // tip odmora
  totalBreakTimeLeft?: number; // skupni preostali čas za odmore
  onBreakEnd: () => void;
}

// 2. KOMPONENTA ZA PRIKAZ ODŠTEVALNIKA ODMORA
const BreakTimer: React.FC<BreakTimerProps> = ({ 
  breakTimeLeft, 
  breakType = 'lunch', 
  totalBreakTimeLeft,
  onBreakEnd 
}) => {
  // 2.1 Avtomatsko zaključi odmor, ko se čas izteče
  useEffect(() => {
    if (breakTimeLeft === 0) {
      onBreakEnd();
    }
  }, [breakTimeLeft, onBreakEnd]);

  // 2.2 Formatiranje časa
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // 2.3 Izračun odstotka preostalega časa
  const getProgressPercentage = () => {
    const maxDuration = breakType === 'lunch' ? 35 * 60 : 5 * 60; // 35 minut ali 5 minut v sekundah
    return (breakTimeLeft / maxDuration) * 100;
  };

  // 2.4 Določanje barve glede na tip odmora
  const getColorClass = () => {
    return breakType === 'lunch' ? 'bg-blue-500' : 'bg-orange-500';
  };

  // 2.5 Prikaz komponente
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">
        {breakType === 'lunch' ? 'Čas za malico' : '5-minutni odmor'}
      </h2>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`${getColorClass()} h-4 rounded-full`} 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-center text-2xl font-bold">
        {formatTime(breakTimeLeft)}
      </div>
      
      {totalBreakTimeLeft !== undefined && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Skupni preostali čas za odmore: {formatTime(totalBreakTimeLeft)}
        </div>
      )}
    </div>
  );
};

export default BreakTimer;