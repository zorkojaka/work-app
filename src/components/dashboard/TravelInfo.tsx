// components/dashboard/TravelInfo.tsx
import React from 'react';
import { TravelOrder } from '../../types/travelOrder';

// 1. DEFINICIJA TIPOV
interface TravelInfoProps {
  travel: TravelOrder;
  distance: number;
  duration: number;
}

// 2. KOMPONENTA ZA PRIKAZ INFORMACIJ O POTOVANJU
const TravelInfo: React.FC<TravelInfoProps> = ({ travel, distance, duration }) => {
  // 2.1 Pomožne funkcije
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const formatDistance = (km: number): string => {
    return `${km.toFixed(1)} km`;
  };

  // 2.2 Prikaz informacij
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Trenutna pot</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Izhodišče:</span>
          <span className="font-medium">{travel.startLocation?.address || 'Neznana lokacija'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cilj:</span>
          <span className="font-medium">{travel.destination || 'Ni določeno'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Trajanje:</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Razdalja:</span>
          <span className="font-medium">{formatDistance(distance)}</span>
        </div>
      </div>
    </div>
  );
};

export default TravelInfo;