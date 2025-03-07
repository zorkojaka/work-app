// components/dashboard/MonthlyWorkStats.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { WorkSession } from '../../types/work';
import { formatDuration } from '../../utils/formatters';

// 1. DEFINICIJA TIPOV
interface DayStats {
  date: Date;
  totalWorkHours: number;
  isWorkDay: boolean;
}

interface MonthlyWorkStatsProps {
  hourlyRate?: number;
}

// 2. KOMPONENTA ZA PRIKAZ MESEČNE STATISTIKE DELA
const MonthlyWorkStats: React.FC<MonthlyWorkStatsProps> = ({ hourlyRate = 10 }) => {
  // 2.1 Stanje
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState<DayStats[]>([]);
  const [totalMonthlyHours, setTotalMonthlyHours] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  // 2.2 Nalaganje podatkov o delu za trenutni mesec
  useEffect(() => {
    if (!user) return;
    
    const fetchMonthlyWorkData = async () => {
      try {
        setLoading(true);
        
        // Določi začetek in konec meseca
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        
        // Pripravi tabelo dni v mesecu
        const days: DayStats[] = [];
        const totalDays = endOfMonth.getDate();
        
        for (let i = 1; i <= totalDays; i++) {
          const date = new Date(year, month, i);
          days.push({
            date,
            totalWorkHours: 0,
            isWorkDay: ![0, 6].includes(date.getDay()) // 0 = nedelja, 6 = sobota
          });
        }
        
        // Pridobi delovne seje za trenutni mesec
        const workSessionsRef = collection(db, 'users', user.uid, 'workSessions');
        const q = query(
          workSessionsRef,
          where('startTime', '>=', Timestamp.fromDate(startOfMonth)),
          where('startTime', '<=', Timestamp.fromDate(endOfMonth))
        );
        
        const querySnapshot = await getDocs(q);
        const workSessions: WorkSession[] = [];
        
        querySnapshot.forEach((doc) => {
          workSessions.push({
            ...doc.data(),
            id: doc.id
          } as WorkSession);
        });
        
        // Izračunaj delovne ure za vsak dan
        let totalHours = 0;
        
        workSessions.forEach(session => {
          if (session.startTime && session.endTime) {
            const startDate = session.startTime.toDate();
            const endDate = session.endTime.toDate();
            const dayIndex = startDate.getDate() - 1;
            
            // Izračunaj trajanje dela v urah
            const durationMs = endDate.getTime() - startDate.getTime();
            const durationSeconds = durationMs / 1000;
            const durationHours = durationSeconds / 3600;
            
            // Dodaj trajanje k ustreznemu dnevu
            if (days[dayIndex]) {
              days[dayIndex].totalWorkHours += durationHours;
              totalHours += durationHours;
            }
          }
        });
        
        // Posodobi stanje
        setDaysInMonth(days);
        setTotalMonthlyHours(totalHours);
        setTotalEarnings(totalHours * hourlyRate);
        setLoading(false);
      } catch (error) {
        console.error('Napaka pri pridobivanju mesečnih podatkov o delu:', error);
        setLoading(false);
      }
    };
    
    fetchMonthlyWorkData();
  }, [user, currentMonth, hourlyRate]);
  
  // 2.3 Pomožne funkcije
  const formatMonthName = (date: Date): string => {
    return date.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
  };
  
  const getBarColor = (hours: number): string => {
    if (hours === 0) return 'bg-gray-200';
    if (hours < 6) return 'bg-red-400';
    if (hours < 8) return 'bg-yellow-400';
    if (hours <= 10) return 'bg-green-400';
    return 'bg-blue-400';
  };
  
  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };
  
  // 2.4 Prikaz nalaganja
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">Mesečna statistika dela</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // 2.5 Prikaz statistike
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Mesečna statistika dela</h2>
        <div className="flex items-center">
          <button 
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={() => changeMonth(-1)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span className="mx-2 font-medium">{formatMonthName(currentMonth)}</span>
          <button 
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={() => changeMonth(1)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Grafični prikaz delovnih ur po dnevih */}
      <div className="mb-4">
        <div className="flex h-24 items-end space-x-1">
          {daysInMonth.map((day, index) => (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center"
              title={`${day.date.getDate()}. ${day.date.toLocaleDateString('sl-SI', { month: 'short' })}: ${day.totalWorkHours.toFixed(1)} ur`}
            >
              <div 
                className={`w-full ${getBarColor(day.totalWorkHours)} rounded-t`}
                style={{ 
                  height: `${Math.min(day.totalWorkHours * 10, 100)}%`,
                  opacity: day.isWorkDay ? 1 : 0.5
                }}
              ></div>
              <span className="text-xs mt-1">{day.date.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <div>Delovni dan</div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 bg-red-400 rounded"></span>
            <span>&lt;6h</span>
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded"></span>
            <span>&lt;8h</span>
            <span className="inline-block w-3 h-3 bg-green-400 rounded"></span>
            <span>8-10h</span>
            <span className="inline-block w-3 h-3 bg-blue-400 rounded"></span>
            <span>&gt;10h</span>
          </div>
        </div>
      </div>
      
      {/* Povzetek mesečnega dela */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Skupaj opravljenih ur</p>
          <p className="text-2xl font-bold text-blue-600">{totalMonthlyHours.toFixed(1)}h</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Zaslužek v tem mesecu</p>
          <p className="text-2xl font-bold text-green-600">{totalEarnings.toFixed(2)} €</p>
          <p className="text-xs text-gray-500">(urna postavka: {hourlyRate.toFixed(2)} €/h)</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyWorkStats;
