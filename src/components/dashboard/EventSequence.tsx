import React from 'react';
import { WorkSession } from '../../types/workSession';
import { TravelOrder } from '../../types/travelOrder';
import { formatDuration } from '../../utils/formatters';
import { Timestamp } from 'firebase/firestore';

// 1. DEFINICIJA TIPOV
interface EventSequenceProps {
  workSessions: WorkSession[];
  completedTravels: TravelOrder[];
  selectedDate: Date;
}

// Definicija tipov za združene dogodke
interface WorkEvent {
  type: 'work';
  startTime: Timestamp;
  endTime?: Timestamp;
  data: WorkSession;
}

interface TravelEvent {
  type: 'travel';
  startTime: Timestamp;
  endTime?: Timestamp;
  data: TravelOrder;
}

type TimelineEvent = WorkEvent | TravelEvent;

// 2. KOMPONENTA ZA PRIKAZ ZAPOREDJA DOGODKOV
const EventSequence: React.FC<EventSequenceProps> = ({ 
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

  // 2.2 Preveri, če ni podatkov za prikaz
  const noWorkData = workSessions.length === 0;
  const noTravelData = completedTravels.length === 0;

  // 2.3 Prikaz zaporedja dogodkov
  return (
    <div>
      {noWorkData && noTravelData ? (
        <div className="text-gray-500 text-center py-3">
          Ni podatkov o dogodkih za izbrani dan
        </div>
      ) : (
        <div className="space-y-2">
          {/* Združimo vse dogodke v en seznam in jih sortiramo po času */}
          {[
            ...workSessions.map(session => ({
              type: 'work' as const,
              startTime: session.startTime,
              endTime: session.endTime,
              data: session
            })),
            ...completedTravels.map(travel => ({
              type: 'travel' as const,
              startTime: travel.startTime,
              endTime: travel.endTime,
              data: travel
            }))
          ]
          .sort((a, b) => {
            const timeA = a.startTime?.toDate().getTime() || 0;
            const timeB = b.startTime?.toDate().getTime() || 0;
            return timeA - timeB;
          })
          .map((event: TimelineEvent, index) => (
            <div 
              key={index} 
              className={`text-sm border-l-2 ${
                event.type === 'work' ? 'border-green-500' : 'border-blue-500'
              } pl-3 py-1`}
            >
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`font-medium ${
                    event.type === 'work' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {event.type === 'work' ? 'Delo' : 'Pot'}: 
                  </span>
                  <span className="ml-2">
                    {formatTime(event.startTime)} - {event.endTime ? formatTime(event.endTime) : 'V teku'}
                  </span>
                </div>
                
                {event.type === 'work' && (
                  <>
                    {(event.data.breakDuration > 0 || event.data.shortBreakDuration > 0) && (
                      <div className="text-gray-600 mt-1">
                        {event.data.breakDuration > 0 && (
                          <span className="mr-3">
                            <span className="font-medium text-yellow-600">Malica:</span> {formatDuration(event.data.breakDuration, true)}
                          </span>
                        )}
                        {event.data.shortBreakDuration > 0 && (
                          <span>
                            <span className="font-medium text-orange-600">Kratki odmori:</span> {formatDuration(event.data.shortBreakDuration, true)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center mt-1">
                      <span className="text-green-600 font-medium mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Efektivno delo: {formatDuration(event.data.endTime ? 
                          Math.max(0, (event.data.endTime.toDate().getTime() - event.data.startTime.toDate().getTime()) / 1000 - (event.data.breakDuration || 0) - (event.data.shortBreakDuration || 0)) : 
                          Math.max(0, (new Date().getTime() - event.data.startTime.toDate().getTime()) / 1000 - (event.data.breakDuration || 0) - (event.data.shortBreakDuration || 0)), 
                          true)}
                      </span>
                    </div>
                  </>
                )}
                
                {event.type === 'travel' && (
                  <>
                    <div className="text-gray-600 mt-1">
                      <span className="font-medium">Namen:</span> {event.data.purpose || event.data.destination || 'Ni določeno'}
                    </div>
                    
                    {event.data.distance && event.data.distance.value > 0 && (
                      <div className="flex items-center mt-1">
                        <span className="text-blue-600 font-medium mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          Razdalja: {event.data.distance.value} km
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center mt-1">
                      <span className="text-blue-600 font-medium mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Trajanje: {formatDuration(event.data.endTime ? 
                          (event.data.endTime.toDate().getTime() - event.data.startTime.toDate().getTime()) / 1000 : 
                          (new Date().getTime() - event.data.startTime.toDate().getTime()) / 1000, 
                          true)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventSequence;
