// components/dashboard/DailyWorkReport.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';
import { TravelOrder } from '../../types/travelOrder';
import { formatDuration } from '../../utils/formatters';
import { Timestamp } from 'firebase/firestore';

// 1. DEFINICIJA TIPOV
interface DailyWorkReportProps {
  workSessions: WorkSession[];
  completedTravels: TravelOrder[];
  selectedDate: Date;
}

// 2. KOMPONENTA ZA PRIKAZ DNEVNEGA POROČILA
const DailyWorkReport: React.FC<DailyWorkReportProps> = ({ 
  workSessions, 
  completedTravels, 
  selectedDate 
}) => {
  // 2.1 Pomožne funkcije
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'Neznan čas';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 2.2 Izračun skupnega delovnega časa in časa odmorov
  const calculateTotalWorkTime = (): { 
    totalWorkTime: number; 
    totalBreakTime: number; 
    firstStartTime: any; 
    lastEndTime: any;
  } => {
    let totalWorkTime = 0;
    let totalBreakTime = 0;
    let firstStartTime = null;
    let lastEndTime = null;

    // Razvrsti seje po začetnem času
    const sortedSessions = [...workSessions].sort((a, b) => {
      const timeA = a.startTime?.toDate().getTime() || 0;
      const timeB = b.startTime?.toDate().getTime() || 0;
      return timeA - timeB;
    });

    sortedSessions.forEach((session, index) => {
      // Določi začetni čas prve seje
      if (index === 0 && session.startTime) {
        firstStartTime = session.startTime;
      }

      // Določi končni čas zadnje seje
      if (session.endTime) {
        lastEndTime = session.endTime;
      } else if (index === sortedSessions.length - 1) {
        // Če je zadnja seja še aktivna, uporabimo trenutni čas
        lastEndTime = null;
      }

      // Izračunaj trajanje seje
      if (session.startTime) {
        const startTime = session.startTime.toDate();
        const endTime = session.endTime ? session.endTime.toDate() : new Date();
        const sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        // Prištej trajanje seje k skupnemu času
        totalWorkTime += sessionDuration;
        
        // Odštej čas odmorov
        const breakDuration = session.breakDuration || 0;
        const shortBreakDuration = session.shortBreakDuration || 0;
        totalWorkTime -= (breakDuration + shortBreakDuration);
        
        // Prištej čas odmorov k skupnemu času odmorov
        totalBreakTime += (breakDuration + shortBreakDuration);
      }
    });

    return { totalWorkTime, totalBreakTime, firstStartTime, lastEndTime };
  };

  // 2.3 Izračun skupnega časa potovanj
  const calculateTotalTravelTime = (): number => {
    let totalTravelTime = 0;

    completedTravels.forEach(travel => {
      if (travel.startTime && travel.endTime) {
        const startTime = travel.startTime.toDate();
        const endTime = travel.endTime.toDate();
        const travelDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        totalTravelTime += travelDuration;
      }
    });

    return totalTravelTime;
  };

  // 2.4 Pridobi podatke o delu
  const { totalWorkTime, totalBreakTime, firstStartTime, lastEndTime } = calculateTotalWorkTime();
  const totalTravelTime = calculateTotalTravelTime();

  // 2.5 Preveri, če ni podatkov za prikaz
  const noWorkData = workSessions.length === 0;
  const noTravelData = completedTravels.length === 0;

  // 2.6 Prikaz poročila
  return (
    <div>
      {noWorkData && noTravelData ? (
        <div className="text-gray-500 text-center py-3">
          Ni podatkov o delu za izbrani dan
        </div>
      ) : (
        <div className="space-y-4">
          {/* 2.6.1 Povzetek delovnega dne */}
          {!noWorkData && (
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">Povzetek delovnega dne</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">Začetek dela:</span>
                  <span className="ml-2 font-medium">{firstStartTime ? formatTime(firstStartTime) : 'Ni podatka'}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">Konec dela:</span>
                  <span className="ml-2 font-medium">{lastEndTime ? formatTime(lastEndTime) : 'V teku'}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">Delovni čas:</span>
                  <span className="ml-2 font-medium">{formatDuration(totalWorkTime, true)}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">Čas odmorov:</span>
                  <span className="ml-2 font-medium">{formatDuration(totalBreakTime, true)}</span>
                </div>
                
                {!noTravelData && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="text-gray-600">Čas na poti:</span>
                    <span className="ml-2 font-medium">{formatDuration(totalTravelTime, true)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyWorkReport;
