// components/dashboard/ActionButtons.tsx
import React from 'react';
import { WorkSession } from '../../types/workSession';

interface ActionButtonsProps {
  currentSession: WorkSession | null;
  isToday: boolean;
  loading: boolean;
  currentTravel: boolean;
  onStartWork: () => void;
  onEndWork: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  onStartTravel: () => void;
  onEndTravel: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentSession,
  isToday,
  loading,
  currentTravel,
  onStartWork,
  onEndWork,
  onStartBreak,
  onEndBreak,
  onStartTravel,
  onEndTravel
}) => {
  if (!isToday) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {!currentSession && (
          <button
            onClick={onStartWork}
            className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 disabled:opacity-50"
            disabled={loading}
          >
            Začni delo
          </button>
        )}

        {currentSession?.status === 'WORKING' && (
          <>
            <button
              onClick={onStartBreak}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 disabled:opacity-50"
              disabled={loading}
            >
              Začni malico
            </button>

            {!currentTravel && (
              <button
                onClick={onStartTravel}
                className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                Začni pot
              </button>
            )}
          </>
        )}

        {currentSession?.status === 'BREAK' && (
          <button
            onClick={onEndBreak}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi malico
          </button>
        )}

        {currentTravel && (
          <button
            onClick={onEndTravel}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi pot
          </button>
        )}

        {currentSession && (
          <button
            onClick={onEndWork}
            className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 disabled:opacity-50"
            disabled={loading}
          >
            Zaključi delo
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;