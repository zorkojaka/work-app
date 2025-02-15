// components/dashboard/TravelInfo.tsx
import React from 'react';
import { TravelOrder } from '../../types/travelOrder';

interface TravelInfoProps {
  currentTravel: TravelOrder | null;
  activeTravelTime: number;
  travelDistance: number;
}

const TravelInfo: React.FC<TravelInfoProps> = ({
  currentTravel,
  activeTravelTime,
  travelDistance
}) => {
  if (!currentTravel) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Aktivna pot</h2>
      <div className="space-y-2">
        <div>Začetni naslov: {currentTravel.startLocation.address}</div>
        <div>
          Trajanje: {Math.floor(activeTravelTime / 3600)}:
          {String(Math.floor((activeTravelTime % 3600) / 60)).padStart(2, '0')}:
          {String(activeTravelTime % 60).padStart(2, '0')}
        </div>
        <div>Razdalja: {travelDistance.toFixed(2)} km</div>
      </div>
    </div>
  );
};

export default TravelInfo;