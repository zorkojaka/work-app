// components/dashboard/ActionButtons.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';
import { TravelOrder } from '../../types/travelOrder';

// 1. DEFINICIJA TIPOV
interface ActionButtonsProps {
  currentSession: WorkSession | null;
  status: string;
  breakTimeLeft: number | null;
  shortBreakTimeLeft: number | null;
  currentTravel: TravelOrder | null;
  isToday: boolean;
  loading: boolean;
  onStartWork: () => void;
  onEndWork: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  onStartShortBreak: () => void;
  onEndShortBreak: () => void;
  onStartTravel: () => void;
  onEndTravel: () => void;
}

// 2. KOMPONENTA ZA AKCIJSKE GUMBE
const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentSession,
  status,
  breakTimeLeft,
  shortBreakTimeLeft,
  currentTravel,
  isToday,
  loading,
  onStartWork,
  onEndWork,
  onStartBreak,
  onEndBreak,
  onStartShortBreak,
  onEndShortBreak,
  onStartTravel,
  onEndTravel
}) => {
  // 2.1 Če ni današnji dan, ne prikazujemo gumbov
  if (!isToday) return null;

  // 2.2 Debug funkcije za klice
  const handleStartWorkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Začni delo'");
    onStartWork();
  };

  const handleEndWorkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Zaključi delo'");
    onEndWork();
  };

  const handleStartBreakClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Začni malico'");
    onStartBreak();
  };

  const handleEndBreakClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Zaključi malico'");
    onEndBreak();
  };

  const handleStartShortBreakClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb '5 min pavza'");
    onStartShortBreak();
  };

  const handleEndShortBreakClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Zaključi pavzo'");
    onEndShortBreak();
  };

  const handleStartTravelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Začni pot'");
    onStartTravel();
  };

  const handleEndTravelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Klik na gumb 'Zaključi pot'");
    onEndTravel();
  };

  console.log("ActionButtons render:", { currentSession, status, breakTimeLeft, shortBreakTimeLeft, currentTravel, isToday, loading });

  // 2.3 Prikaz gumbov glede na stanje
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {/* 2.3.1 Gumb za začetek dela */}
        {!currentSession && (
          <button
            onClick={handleStartWorkClick}
            className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 disabled:opacity-50"
            disabled={loading}
          >
            Začni delo
          </button>
        )}

        {/* 2.3.2 Gumbi med delom */}
        {currentSession && status === 'Na lokaciji' && (
          <>
            <button
              onClick={handleStartBreakClick}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 disabled:opacity-50"
              disabled={loading}
            >
              Začni malico
            </button>

            <button
              onClick={handleStartShortBreakClick}
              className="px-4 py-2 bg-orange-500 text-white rounded-md shadow hover:bg-orange-600 disabled:opacity-50"
              disabled={loading}
            >
              5 min pavza
            </button>

            {!currentTravel && (
              <button
                onClick={handleStartTravelClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                Začni pot
              </button>
            )}
          </>
        )}

        {/* 2.3.3 Gumb za zaključek malice */}
        {currentSession && status === 'Na malici' && (
          <button
            onClick={handleEndBreakClick}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi malico
          </button>
        )}

        {/* 2.3.4 Gumb za zaključek kratke pavze */}
        {currentSession && status === 'Na kratki malici' && (
          <button
            onClick={handleEndShortBreakClick}
            className="px-4 py-2 bg-orange-600 text-white rounded-md shadow hover:bg-orange-700 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi pavzo
          </button>
        )}

        {/* 2.3.5 Gumb za zaključek poti */}
        {currentTravel && (
          <button
            onClick={handleEndTravelClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi pot
          </button>
        )}

        {/* 2.3.6 Gumb za zaključek dela */}
        {currentSession && (
          <button
            onClick={handleEndWorkClick}
            className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 disabled:opacity-50"
            disabled={loading || status === 'Na malici' || status === 'Na kratki malici' || currentTravel !== null}
          >
            Zaključi delo
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;