// components/dashboard/BreakTimer.tsx
import React from 'react';

interface BreakTimerProps {
  breakTimeLeft: number | null;
}

const BreakTimer: React.FC<BreakTimerProps> = ({ breakTimeLeft }) => {
  if (breakTimeLeft === null) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Preostali čas malice</h2>
      <div className="text-3xl font-mono text-yellow-600">
        {Math.floor(breakTimeLeft / 60)}:
        {String(breakTimeLeft % 60).padStart(2, '0')}
      </div>
    </div>
  );
};

export default BreakTimer;