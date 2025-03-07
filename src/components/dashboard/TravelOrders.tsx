// components/dashboard/TravelOrders.tsx
import React, { useState } from 'react';
import { TravelOrder } from '../../types/travel';
import { formatDistance, formatDuration } from '../../utils/formatters';
import { User } from 'firebase/auth';
import { Project } from '../../types/project';

// 1. DEFINICIJA TIPOV
interface TravelOrdersProps {
  completedTravels: TravelOrder[];
  currentTravel: TravelOrder | null;
  showTravelForm: boolean;
  setShowTravelForm: (show: boolean) => void;
  isStartTravel: boolean;
  setIsStartTravel: (isStart: boolean) => void;
  handleStartTravel: (purpose: string, projectId?: string) => void;
  handleEndTravel: (purpose: string, projectId?: string) => void;
  activeTravelTime: number;
  travelDistance: number;
  projects: Project[];
  user: User | null;
}

// 2. KOMPONENTA ZA PRIKAZ POTNIH NALOGOV
const TravelOrders: React.FC<TravelOrdersProps> = ({ 
  completedTravels = [], 
  currentTravel,
  showTravelForm,
  setShowTravelForm,
  isStartTravel,
  setIsStartTravel,
  handleStartTravel,
  handleEndTravel,
  activeTravelTime,
  travelDistance,
  projects,
  user
}) => {
  // 2.1 Stanje za razširjene potne naloge
  const [expandedTravelId, setExpandedTravelId] = useState<string | null>(null);

  // 2.2 Pomožne funkcije
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'Neznan čas';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Neznan datum';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('sl-SI', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };
  
  const calculateDuration = (startTime: any, endTime: any): string => {
    if (!startTime || !endTime) return 'Neznano trajanje';
    
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}min`;
  };
  
  // 2.3 Razširjanje/skrčanje potnega naloga
  const toggleExpand = (travelId: string) => {
    if (expandedTravelId === travelId) {
      setExpandedTravelId(null);
    } else {
      setExpandedTravelId(travelId);
    }
  };
  
  // 2.4 Prikaz potnih nalogov
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Potni nalogi</h2>
      <div className="space-y-3">
        {completedTravels && completedTravels.map((travel) => (
          <div key={travel.id} className="border-l-4 border-blue-500 pl-3 py-2">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(travel.id || '')}
            >
              <div>
                <div className="font-medium">{travel.purpose}</div>
                <div className="text-sm text-gray-600">
                  {formatTime(travel.startTime)} - {formatTime(travel.endTime)}
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-3">
                  <div className="font-medium">{formatDistance(travel.distance?.value || 0)}</div>
                  <div className="text-sm text-gray-600">{calculateDuration(travel.startTime, travel.endTime)}</div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedTravelId === travel.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            
            {expandedTravelId === travel.id && (
              <div className="mt-3 text-sm border-t pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Datum:</span> {formatDate(travel.startTime)}
                  </div>
                  <div>
                    <span className="font-medium">Trajanje:</span> {calculateDuration(travel.startTime, travel.endTime)}
                  </div>
                  <div>
                    <span className="font-medium">Razdalja:</span> {formatDistance(travel.distance?.value || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Namen:</span> {travel.purpose}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Začetna lokacija:</span> {travel.startLocation?.address || 'Ni podatka'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Končna lokacija:</span> {travel.endLocation?.address || 'Ni podatka'}
                  </div>
                  {travel.projectId && (
                    <div className="col-span-2">
                      <span className="font-medium">Projekt:</span> {travel.projectName || travel.projectId}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {(!completedTravels || completedTravels.length === 0) && !currentTravel && (
          <div className="text-gray-500 text-center py-3">
            Ni potnih nalogov za izbrani dan
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelOrders;
