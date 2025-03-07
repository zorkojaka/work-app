// components/dashboard/WorkdayTimeline.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WorkSession } from '../../types/workSession';
import { TravelOrder } from '../../types/travelOrder';
import { formatDuration } from '../../utils/formatters';

// 1. DEFINICIJA TIPOV
interface WorkdayTimelineProps {
  workSessions: WorkSession[];
  travelOrders: TravelOrder[];
  selectedDate: Date;
  compact?: boolean; // Dodana opcija za kompakten prikaz
  currentSession?: WorkSession | null; // Dodana trenutna seja
}

interface TimelineItem {
  id: string;
  type: 'work' | 'break' | 'shortBreak' | 'travel' | 'currentTime';
  startTime: Date;
  endTime: Date;
  duration: number; // v sekundah
  travelPurpose?: string;
  sessionId?: string;
  travelId?: string;
  isActive?: boolean;
}

// 2. KOMPONENTA ZA PRIKAZ ČASOVNICE DELOVNEGA DNE
const WorkdayTimeline: React.FC<WorkdayTimelineProps> = ({ 
  workSessions, 
  travelOrders, 
  selectedDate,
  compact = false, // Dodana privzeta vrednost za compact
  currentSession = null // Dodana privzeta vrednost za currentSession
}) => {
  // 2.1 Stanje
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [dayStartTime, setDayStartTime] = useState<Date | null>(null);
  const [dayEndTime, setDayEndTime] = useState<Date | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // 2.2 Reference za intervale
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 2.3 Posodabljanje trenutnega časa
  useEffect(() => {
    // Posodobi trenutni čas vsako sekundo
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Počisti interval ob unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // 2.4 Priprava podatkov za časovnico
  useEffect(() => {
    const items: TimelineItem[] = [];
    let minTime: Date | null = null;
    let maxTime: Date | null = null;
    
    // Dodaj delovne seje
    workSessions.forEach(session => {
      if (!session.startTime) return;
      
      const startTime = session.startTime.toDate();
      const endTime = session.endTime ? session.endTime.toDate() : new Date();
      
      // Posodobi začetni in končni čas dneva
      if (!minTime || startTime < minTime) minTime = startTime;
      if (!maxTime || endTime > maxTime) maxTime = endTime;
      
      // Izračunaj trajanje seje
      const sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) - (session.breakDuration || 0) - (session.shortBreakDuration || 0);
      
      // Dodaj delovno sejo
      items.push({
        id: `work-${session.id}`,
        type: 'work',
        startTime,
        endTime,
        duration: sessionDuration,
        sessionId: session.id,
        isActive: currentSession?.id === session.id && !session.onBreak && !session.onShortBreak
      });
      
      // Dodaj malico, če obstaja
      if (session.breakDuration && session.breakDuration > 0 && session.breakStartTime) {
        const breakStartTime = session.breakStartTime.toDate();
        const breakEndTime = session.breakEndTime 
          ? session.breakEndTime.toDate() 
          : new Date(breakStartTime.getTime() + session.breakDuration * 1000);
        
        items.push({
          id: `break-${session.id}`,
          type: 'break',
          startTime: breakStartTime,
          endTime: breakEndTime,
          duration: session.breakDuration,
          sessionId: session.id,
          isActive: currentSession?.id === session.id && session.onBreak
        });
      }
      
      // Dodaj kratke odmore, če obstajajo
      if (session.shortBreakDuration && session.shortBreakDuration > 0 && session.shortBreakStartTime) {
        const shortBreakStartTime = session.shortBreakStartTime.toDate();
        const shortBreakEndTime = session.shortBreakEndTime 
          ? session.shortBreakEndTime.toDate() 
          : new Date(shortBreakStartTime.getTime() + session.shortBreakDuration * 1000);
        
        items.push({
          id: `shortBreak-${session.id}`,
          type: 'shortBreak',
          startTime: shortBreakStartTime,
          endTime: shortBreakEndTime,
          duration: session.shortBreakDuration,
          sessionId: session.id,
          isActive: currentSession?.id === session.id && session.onShortBreak
        });
      }
    });
    
    // Dodaj potne naloge
    travelOrders.forEach(travel => {
      if (!travel.startTime || !travel.endTime) return;
      
      const startTime = travel.startTime.toDate();
      const endTime = travel.endTime.toDate();
      
      // Posodobi začetni in končni čas dneva
      if (!minTime || startTime < minTime) minTime = startTime;
      if (!maxTime || endTime > maxTime) maxTime = endTime;
      
      // Dodaj potni nalog
      const travelDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      items.push({
        id: `travel-${travel.id}`,
        type: 'travel',
        startTime,
        endTime,
        duration: travelDuration,
        travelPurpose: travel.purpose,
        travelId: travel.id
      });
    });
    
    // Nastavi začetni in končni čas dneva na cel dan (00:00 - 24:00)
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    
    setDayStartTime(start);
    setDayEndTime(end);
    setTotalDuration(24 * 60 * 60); // 24 ur v sekundah
    
    // Razvrsti elemente po začetnem času
    items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    setTimelineItems(items);
  }, [workSessions, travelOrders, currentSession, selectedDate, currentTime]);
  
  // 2.5 Pomožne funkcije
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getItemColor = (type: string, isActive: boolean = false): string => {
    switch (type) {
      case 'work':
        return isActive ? 'bg-green-600 border-2 border-green-800' : 'bg-green-500';
      case 'break':
        return isActive ? 'bg-yellow-600 border-2 border-yellow-800' : 'bg-yellow-500';
      case 'shortBreak':
        return isActive ? 'bg-orange-600 border-2 border-orange-800' : 'bg-orange-500';
      case 'travel':
        return isActive ? 'bg-blue-600 border-2 border-blue-800' : 'bg-blue-500';
      case 'currentTime':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getItemWidth = (startTime: Date, endTime: Date): string => {
    if (!dayStartTime || !dayEndTime || totalDuration === 0) return '0%';
    
    const start = Math.max(startTime.getTime(), dayStartTime.getTime());
    const end = Math.min(endTime.getTime(), dayEndTime.getTime());
    const duration = end - start;
    
    const percentage = (duration / (dayEndTime.getTime() - dayStartTime.getTime())) * 100;
    return `${percentage}%`;
  };
  
  const getItemPosition = (startTime: Date): string => {
    if (!dayStartTime || !dayEndTime) return '0%';
    
    const position = ((startTime.getTime() - dayStartTime.getTime()) / (dayEndTime.getTime() - dayStartTime.getTime())) * 100;
    return `${Math.max(0, Math.min(100, position))}%`;
  };
  
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'work':
        return 'Delo';
      case 'break':
        return 'Malica';
      case 'shortBreak':
        return 'Odmor';
      case 'travel':
        return 'Pot';
      case 'currentTime':
        return 'Trenutni čas';
      default:
        return type;
    }
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // 2.6 Prikaz časovnice
  if (!dayStartTime || !dayEndTime) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 mb-4 ${compact ? 'compact' : ''}`}>
        <h2 className="text-lg font-semibold mb-3">Časovnica delovnega dne</h2>
        <div className="text-center text-gray-500 py-4">
          Ni podatkov za prikaz časovnice
        </div>
      </div>
    );
  }
  
  // 2.7 Priprava časovnih oznak
  const timeMarkers = [];
  const hourInterval = 2; // Interval v urah
  let currentHour = new Date(dayStartTime);
  currentHour.setMinutes(0, 0, 0); // Zaokroži na celo uro
  
  while (currentHour <= dayEndTime) {
    timeMarkers.push({
      time: new Date(currentHour),
      position: getItemPosition(currentHour)
    });
    
    currentHour.setHours(currentHour.getHours() + hourInterval);
  }
  
  // 2.8 Izračun položaja trenutnega časa
  const showCurrentTimeLine = isToday(selectedDate) && 
                              currentTime >= dayStartTime && 
                              currentTime <= dayEndTime;
  
  const currentTimePosition = showCurrentTimeLine ? getItemPosition(currentTime) : null;
  
  return (
    <div className={`bg-white ${!compact ? 'rounded-lg shadow-md p-4 mb-4' : ''}`}>
      {!compact && <h2 className="text-lg font-semibold mb-3">Časovnica delovnega dne</h2>}
      
      {!compact && (
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <div>Začetek: {formatTime(dayStartTime)}</div>
          <div>Konec: {formatTime(dayEndTime)}</div>
          <div>Skupno trajanje: {formatDuration(totalDuration, true)}</div>
        </div>
      )}
      
      {/* Legenda */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Delo</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>Malica</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
          <span>Odmor</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span>Pot</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span>Zdaj</span>
        </div>
      </div>
      
      {/* Časovnica */}
      <div className={`relative ${compact ? 'h-12' : 'h-20'} bg-gray-100 rounded mb-12 mt-12`}>
        {/* Časovne oznake */}
        {timeMarkers.map((marker, index) => (
          <div 
            key={index}
            className="absolute top-0 bottom-0 border-l border-gray-300"
            style={{ left: marker.position }}
          >
            <div className="absolute -top-8 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
              {marker.time.getHours()}:00
            </div>
          </div>
        ))}
        
        {/* Začetni in končni čas časovnice */}
        <div className="absolute -bottom-8 left-0 text-xs text-gray-500">
          {formatTime(dayStartTime)}
        </div>
        <div className="absolute -bottom-8 right-0 text-xs text-gray-500">
          {formatTime(dayEndTime)}
        </div>
        
        {/* Elementi časovnice */}
        {timelineItems.map(item => (
          <div
            key={item.id}
            className={`absolute top-0 bottom-0 h-full rounded ${getItemColor(item.type, item.isActive)} hover:opacity-90 cursor-pointer transition-opacity group`}
            style={{
              left: getItemPosition(item.startTime),
              width: getItemWidth(item.startTime, item.endTime),
              minWidth: '4px'
            }}
            title={`${getTypeLabel(item.type)}: ${formatTime(item.startTime)} - ${item.isActive ? 'v teku' : formatTime(item.endTime)} (${formatDuration(item.duration, true)})`}
          >
            {parseFloat(getItemWidth(item.startTime, item.endTime)) > 5 && !compact && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium overflow-hidden px-1">
                {getTypeLabel(item.type)}
              </div>
            )}
            
            {/* Prikaz časa za označen dogodek */}
            <div className="absolute opacity-0 group-hover:opacity-100 -bottom-12 left-0 right-0 text-xs text-gray-800 bg-white p-1 rounded shadow-md z-20 transition-opacity">
              {formatTime(item.startTime)} - {item.isActive ? 'v teku' : formatTime(item.endTime)}
            </div>
          </div>
        ))}
        
        {/* Oznaka trenutnega časa */}
        {showCurrentTimeLine && (
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
            style={{ left: currentTimePosition || '0%' }}
          >
            <div className="absolute -bottom-8 -translate-x-1/2 text-xs text-red-500 font-bold whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        )}
      </div>
      
      {/* Seznam aktivnosti - samo če ni kompakten način */}
      {!compact && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Podrobnosti aktivnosti</h3>
          <div className="space-y-2">
            {timelineItems.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center p-2 rounded ${item.isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${getItemColor(item.type, item.isActive)}`}></div>
                <div className="flex-1">
                  <div className="font-medium">
                    {getTypeLabel(item.type)}
                    {item.travelPurpose && `: ${item.travelPurpose}`}
                    {item.isActive && ' (aktivno)'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(item.startTime)} - {item.isActive ? 'v teku' : formatTime(item.endTime)} ({formatDuration(item.duration, true)})
                  </div>
                </div>
                {item.type === 'work' && (
                  <div className="text-sm text-green-600 font-medium">
                    {formatDuration(item.duration, true)} dela
                  </div>
                )}
                {item.type === 'break' && (
                  <div className="text-sm text-yellow-600 font-medium">
                    {formatDuration(item.duration, true)} odmora
                  </div>
                )}
                {item.type === 'shortBreak' && (
                  <div className="text-sm text-orange-600 font-medium">
                    {formatDuration(item.duration, true)} kratkega odmora
                  </div>
                )}
                {item.type === 'travel' && (
                  <div className="text-sm text-blue-600 font-medium">
                    {formatDuration(item.duration, true)} potovanja
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkdayTimeline;
