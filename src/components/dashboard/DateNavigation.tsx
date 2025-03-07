// components/dashboard/DateNavigation.tsx
import React, { useState } from 'react';

// 1. DEFINICIJA TIPOV
interface DateNavigationProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onTodayClick: () => void;
  onDateSelect?: (date: Date) => void;
  workDays?: Date[]; // Dodajamo seznam delovnih dni
}

// 2. KOMPONENTA ZA NAVIGACIJO MED DATUMI
const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onTodayClick,
  onDateSelect,
  workDays = []
}) => {
  // 2.1 Stanje komponente
  const [showCalendar, setShowCalendar] = useState(false);

  // 2.2 Pomožne funkcije
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('sl-SI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 2.3 Funkcija za preverjanje, ali je datum delovni dan
  const isWorkDay = (date: Date): boolean => {
    return workDays.some(workDay => 
      workDay.getDate() === date.getDate() &&
      workDay.getMonth() === date.getMonth() &&
      workDay.getFullYear() === date.getFullYear()
    );
  };

  // 2.4 Funkcija za generiranje koledarja
  const renderCalendar = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Ustvarimo prvi dan meseca
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Določimo dan v tednu za prvi dan (0 = nedelja, 1 = ponedeljek, ...)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Nedelja naj bo 7, ne 0
    
    // Ustvarimo tabelo dni
    const days = [];
    const totalDays = lastDayOfMonth.getDate();
    
    // Dodamo prazne celice za dni pred prvim dnem meseca
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Dodamo dneve v mesecu
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = day === selectedDate.getDate();
      const isCurrentDay = isToday(date);
      const isWorkingDay = isWorkDay(date);
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer
            ${isSelected ? 'bg-blue-500 text-white' : ''}
            ${isCurrentDay && !isSelected ? 'border border-blue-500 text-blue-500' : ''}
            ${isWorkingDay && !isSelected && !isCurrentDay ? 'bg-green-100 text-green-800' : ''}
            ${!isSelected && !isCurrentDay && !isWorkingDay ? 'hover:bg-gray-100' : ''}
          `}
          onClick={() => {
            if (onDateSelect) {
              onDateSelect(date);
            }
            setShowCalendar(false);
          }}
        >
          {day}
        </div>
      );
    }
    
    return (
      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">
            {selectedDate.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setShowCalendar(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          <div className="text-xs font-medium text-gray-500">PON</div>
          <div className="text-xs font-medium text-gray-500">TOR</div>
          <div className="text-xs font-medium text-gray-500">SRE</div>
          <div className="text-xs font-medium text-gray-500">ČET</div>
          <div className="text-xs font-medium text-gray-500">PET</div>
          <div className="text-xs font-medium text-gray-500">SOB</div>
          <div className="text-xs font-medium text-gray-500">NED</div>
          {days}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
            <span>Delovni dnevi</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-blue-500 rounded-full mr-2"></div>
            <span>Današnji dan</span>
          </div>
        </div>
      </div>
    );
  };

  // 2.5 Prikaz navigacije
  return (
    <div className="p-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onPreviousDay}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Prejšnji dan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center space-x-2 font-semibold text-lg hover:text-blue-600"
          >
            <span>{formatDate(selectedDate)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          {showCalendar && renderCalendar()}
        </div>
        
        <button
          onClick={onNextDay}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Naslednji dan"
          disabled={isToday(selectedDate)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isToday(selectedDate) ? 'text-gray-300' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {!isToday(selectedDate) && (
        <div className="mt-2 text-center">
          <button
            onClick={onTodayClick}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Prikaži današnji dan
          </button>
        </div>
      )}
    </div>
  );
};

export default DateNavigation;