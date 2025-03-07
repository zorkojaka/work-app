// components/dashboard/TravelOrders.tsx
import React, { useState } from 'react';
import { TravelOrder } from '../../types/travel';
import { formatDistance, formatDuration } from '../../utils/formatters';

// 1. DEFINICIJA TIPOV
interface CompletedTravelsProps {
  travels: TravelOrder[];
}

// 2. KOMPONENTA ZA PRIKAZ POTNIH NALOGOV
const TravelOrders: React.FC<CompletedTravelsProps> = ({ travels }) => {
  // 2.1 Pomožne funkcije
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'Neznan čas';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: any, endTime: any): string => {
    if (!startTime || !endTime) return 'Neznano trajanje';
    
    const start = startTime.toDate();
    const end = endTime.toDate();
    const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}min`;
  };

  // 2.2 Izračun razdalje med začetno in končno točko
  const getRouteDistance = (travel: TravelOrder): string => {
    // Če imamo že izračunano razdaljo iz podatkov
    if (travel.distance) {
      return `${travel.distance.toFixed(1)} km`;
    }
    
    // Če imamo začetno in končno lokacijo, izračunamo razdaljo
    if (travel.startLocation && travel.endLocation && 
        travel.startLocation.latitude && travel.startLocation.longitude && 
        travel.endLocation.latitude && travel.endLocation.longitude) {
      
      const distance = calculateDistance(
        travel.startLocation.latitude,
        travel.startLocation.longitude,
        travel.endLocation.latitude,
        travel.endLocation.longitude
      );
      
      return `${distance.toFixed(1)} km`;
    }
    
    return 'Ni podatka';
  };

  // 2.3 Pridobi naslov lokacije
  const getLocationAddress = (location: any): string => {
    if (!location) return 'Neznana lokacija';
    
    if (location.address) {
      // Skrajšamo naslov - odstranimo državo, poštno številko in druge nepotrebne podatke
      const address = location.address;
      
      // Razdelimo naslov po vejicah
      const parts = address.split(',');
      
      // Vzamemo samo prva dva dela (ulica in mesto)
      if (parts.length > 1) {
        return `${parts[0].trim()}${parts.length > 1 ? ', ' + parts[1].trim() : ''}`;
      }
      
      return address;
    }
    
    // Če nimamo naslova, prikažemo koordinate z manj decimalkami
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  // 2.4 Prikaz zaključenih potovanj
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Potni nalogi</h2>
      <div className="space-y-3">
        {travels.map((travel) => (
          <div key={travel.id} className="border-l-4 border-blue-500 pl-3 py-2">
            <div className="flex justify-between">
              <span className="font-medium">{travel.destination || 'Brez cilja'}</span>
              <span className="text-sm text-gray-600">
                {formatTime(travel.startTime)} - {formatTime(travel.endTime)}
              </span>
            </div>
            
            {/* Začetna in končna lokacija */}
            <div className="text-sm text-gray-700 mt-1 grid grid-cols-1 gap-1">
              <div className="flex">
                <span className="font-medium w-16">Začetek:</span>
                <span className="truncate">{getLocationAddress(travel.startLocation)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-16">Konec:</span>
                <span className="truncate">{getLocationAddress(travel.endLocation)}</span>
              </div>
            </div>
            
            {/* Trajanje in razdalja */}
            <div className="flex justify-between text-sm text-gray-600 mt-2 border-t border-gray-100 pt-1">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{formatDuration(travel.startTime, travel.endTime)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                <span>{getRouteDistance(travel)}</span>
              </div>
            </div>
            
            {travel.purpose && (
              <div className="text-sm text-gray-600 mt-1 italic">
                "{travel.purpose}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelOrders;