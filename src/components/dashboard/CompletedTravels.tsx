// components/dashboard/CompletedTravels.tsx
import React from 'react';
import { TravelOrder } from '../../types/travelOrder';
import { formatTime } from '../../utils/timeUtils';

interface CompletedTravelsProps {
  travels: TravelOrder[];
}

const CompletedTravels: React.FC<CompletedTravelsProps> = ({ travels }) => {
  if (travels.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Zaključene poti</h2>
      <div className="space-y-4">
        {travels.map((travel) => (
          <div key={travel.id} className="border-l-4 border-green-400 pl-4">
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <p className="font-medium">Začetek:</p>
                <p>{travel.startLocation.address}</p>
                <p>{formatTime(travel.startTime)}</p>
              </div>
              <div>
                <p className="font-medium">Konec:</p>
                <p>{travel.endLocation?.address}</p>
                <p>{travel.endTime ? formatTime(travel.endTime) : '-'}</p>
              </div>
              <div className="mt-2">
                <p className="font-medium">Razdalja:</p>
                <p>{travel.distance.toFixed(2)} km</p>
              </div>
              <div className="mt-2">
                <p className="font-medium">Namen:</p>
                <p>{travel.purpose}</p>
              </div>
              {travel.projectId && (
                <div className="col-span-2 mt-2">
                  <p className="font-medium">Projekt:</p>
                  <p>{travel.projectId}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedTravels;