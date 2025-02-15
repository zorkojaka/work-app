// components/dashboard/DateNavigation.tsx
import React from 'react';

interface DateNavigationProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onTodayClick: () => void;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onTodayClick
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('sl-SI', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onPreviousDay}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <span className="material-icons">chevron_left</span>
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold">{formatDate(selectedDate)}</h2>
          {!isToday(selectedDate) && (
            <button
              onClick={onTodayClick}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Pojdi na današnji dan
            </button>
          )}
        </div>

        <button
          onClick={onNextDay}
          className="p-2 text-gray-600 hover:text-gray-900"
          disabled={isToday(selectedDate)}
        >
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default DateNavigation;