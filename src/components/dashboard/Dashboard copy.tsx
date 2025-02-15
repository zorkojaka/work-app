import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { formatTime, calculateDuration } from '../../utils/timeUtils';
import TravelForm from '../travel/TravelForm';
import { Timestamp, collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy, where, arrayUnion } from 'firebase/firestore';
import { calculateDistance, getAddressFromCoordinates } from '../../utils/locationUtils';

// =============== INTERFACES ===============
interface Location {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Timestamp;
}

interface TravelOrder {
  id?: string;
  userId: string;
  workSessionId: string;
  startLocation: Location;
  endLocation?: Location;
  startTime: Timestamp;
  endTime?: Timestamp;
  distance: number;
  duration: number;
  projectId?: string;
  purpose: string;
  routePoints: Location[];
}

interface WorkSession {
  id: string;
  startTimestamp: Timestamp;
  endTimestamp?: Timestamp;
  status: 'WORKING' | 'BREAK' | 'TRAVEL' | 'COMPLETED';
  actions: Action[];
}

interface Action {
  type: 'START_BREAK' | 'END_BREAK' | 'START_TRAVEL' | 'END_TRAVEL';
  timestamp: Timestamp;
  location?: Location;
}

// =============== MAIN COMPONENT ===============
const Dashboard: React.FC = () => {
  // =============== STATE ===============
  const [completedTravels, setCompletedTravels] = useState<TravelOrder[]>([]);
  const [currentTravel, setCurrentTravel] = useState<TravelOrder | null>(null);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [isStartTravel, setIsStartTravel] = useState(true);
  const [travelDistance, setTravelDistance] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Doma');
  const [workDuration, setWorkDuration] = useState<number>(0);
  const [breakTimeLeft, setBreakTimeLeft] = useState<number | null>(null);
  const [activeTravelTime, setActiveTravelTime] = useState<number>(0);

  const { user, logout, roles } = useAuth();
  const navigate = useNavigate();
  const BREAK_DURATION = 35 * 60; // 35 minut v sekundah

  // =============== LOCATION TRACKING ===============
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const address = await getAddressFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );

          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: address.address,
            timestamp: Timestamp.now()
          };

          setCurrentLocation(newLocation);

          if (currentTravel) {
            const newDistance = calculateDistance(
              currentTravel.startLocation.latitude,
              currentTravel.startLocation.longitude,
              position.coords.latitude,
              position.coords.longitude
            );
            setTravelDistance(newDistance);
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentTravel]);

  // =============== TIME TRACKING ===============
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const startTime = currentSession.startTimestamp.toDate().getTime();
      const now = Date.now();
      let totalDuration = Math.floor((now - startTime) / 1000);

      // Subtract break times
      const breakDurations = currentSession.actions.reduce((total, action, index, arr) => {
        if (action.type === 'START_BREAK') {
          const endBreak = arr.find(a => 
            a.type === 'END_BREAK' && 
            a.timestamp.toDate() > action.timestamp.toDate()
          );
          if (endBreak) {
            return total + (endBreak.timestamp.toDate().getTime() - action.timestamp.toDate().getTime()) / 1000;
          }
          return total + (now - action.timestamp.toDate().getTime()) / 1000;
        }
        return total;
      }, 0);

      totalDuration -= breakDurations;
      setWorkDuration(totalDuration);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Break time tracking
  useEffect(() => {
    if (currentSession?.status !== 'BREAK') {
      setBreakTimeLeft(null);
      return;
    }

    const lastBreakStart = currentSession.actions
      .filter(action => action.type === 'START_BREAK')
      .pop();

    if (!lastBreakStart) return;

    const interval = setInterval(() => {
      const breakStartTime = lastBreakStart.timestamp.toDate().getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - breakStartTime) / 1000);
      const remaining = Math.max(0, BREAK_DURATION - elapsed);
      
      setBreakTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Travel time tracking
  useEffect(() => {
    if (!currentTravel) {
      setActiveTravelTime(0);
      return;
    }

    const interval = setInterval(() => {
      const startTimeMs = currentTravel.startTime.toDate().getTime();
      const currentTimeMs = Date.now();
      const diffInSeconds = Math.floor((currentTimeMs - startTimeMs) / 1000);
      setActiveTravelTime(diffInSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTravel]);

  // =============== WORK SESSION FUNCTIONS ===============
  const startWork = async () => {
    if (!user || currentSession) return;

    setLoading(true);
    try {
      const sessionsRef = collection(db, `users/${user.uid}/workSessions`);
      const newSession = {
        startTimestamp: serverTimestamp(),
        status: 'WORKING',
        actions: [],
      };

      const docRef = await addDoc(sessionsRef, newSession);
      const newDoc = await getDoc(docRef);

      if (newDoc.exists()) {
        const newSessionData = {
          id: docRef.id,
          ...newDoc.data()
        } as WorkSession;

        setWorkSessions(prev => [newSessionData, ...prev]);
        setCurrentSession(newSessionData);
        setStatus('Delo');
      }
    } catch (err) {
      console.error('Error starting work:', err);
    } finally {
      setLoading(false);
    }
  };

  const endWork = async () => {
    if (!user || !currentSession) return;

    setLoading(true);
    try {
      const sessionRef = doc(db, `users/${user.uid}/workSessions/${currentSession.id}`);
      await updateDoc(sessionRef, {
        endTimestamp: serverTimestamp(),
        status: 'COMPLETED'
      });

      setWorkSessions(prev =>
        prev.map(session =>
          session.id === currentSession.id
            ? { ...session, endTimestamp: Timestamp.now(), status: 'COMPLETED' }
            : session
        )
      );
      setCurrentSession(null);
      setStatus('Doma');
    } catch (err) {
      console.error('Error ending work:', err);
    } finally {
      setLoading(false);
    }
  };

  const startBreak = async () => {
    if (!user || !currentSession) return;
    setLoading(true);
    try {
      const sessionRef = doc(db, `users/${user.uid}/workSessions/${currentSession.id}`);
      const timestamp = Timestamp.now();
      await updateDoc(sessionRef, {
        status: 'BREAK',
        actions: arrayUnion({
          type: 'START_BREAK',
          timestamp
        })
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'BREAK',
        actions: [...prev.actions, { type: 'START_BREAK', timestamp }]
      } : null);
      setStatus('Malica');
    } catch (err) {
      console.error('Error starting break:', err);
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    if (!user || !currentSession) return;
    setLoading(true);
    try {
      const sessionRef = doc(db, `users/${user.uid}/workSessions/${currentSession.id}`);
      const timestamp = Timestamp.now();
      await updateDoc(sessionRef, {
        status: 'WORKING',
        actions: arrayUnion({
          type: 'END_BREAK',
          timestamp
        })
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'WORKING',
        actions: [...prev.actions, { type: 'END_BREAK', timestamp }]
      } : null);
      setStatus('Delo');
    } catch (err) {
      console.error('Error ending break:', err);
    } finally {
      setLoading(false);
    }
  };

  // =============== TRAVEL FUNCTIONS ===============
  const handleStartTravel = async (formData: { address: string }) => {
    if (!user || !currentSession || !currentLocation) return;

    setLoading(true);
    try {
      const newTravel = {
        userId: user.uid,
        workSessionId: currentSession.id,
        startLocation: {
          ...currentLocation,
          address: formData.address
        },
        startTime: Timestamp.now(),
        distance: 0,
        duration: 0,
        purpose: '',
        routePoints: []
      } as TravelOrder;

      const travelsRef = collection(db, `users/${user.uid}/workSessions/${currentSession.id}/travels`);
      const docRef = await addDoc(travelsRef, newTravel);
      setCurrentTravel({ ...newTravel, id: docRef.id });
      setShowTravelForm(false);
    } catch (err) {
      console.error('Error starting travel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTravel = async (formData: {
    address: string;
    projectId?: string;
    purpose?: string;
  }) => {
    if (!user || !currentSession || !currentTravel || !currentLocation || !formData.projectId || !formData.purpose) return;

    setLoading(true);
    try {
      const endLocation = {
        ...currentLocation,
        address: formData.address
      };

      const distance = calculateDistance(
        currentTravel.startLocation.latitude,
        currentTravel.startLocation.longitude,
        endLocation.latitude,
        endLocation.longitude
      );

      const endTime = Timestamp.now();
      const duration = Math.round(
        (endTime.toDate().getTime() - currentTravel.startTime.toDate().getTime()) / 60000
      );

      const travelRef = doc(db, `users/${user.uid}/workSessions/${currentSession.id}/travels/${currentTravel.id}`);
      await updateDoc(travelRef, {
        endLocation,
        endTime,
        distance,
        duration,
        projectId: formData.projectId,
        purpose: formData.purpose
      });

      const completedTravel = {
        ...currentTravel,
        endLocation,
        endTime,
        distance,
        duration,
        projectId: formData.projectId,
        purpose: formData.purpose
      };
      setCompletedTravels(prev => [...prev, completedTravel]);

      setCurrentTravel(null);
      setShowTravelForm(false);
      setTravelDistance(0);
    } catch (err) {
      console.error('Error ending travel:', err);
    } finally {
      setLoading(false);
    }
  };

  // =============== DATE NAVIGATION ===============
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

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

  // =============== MENU SETUP ===============
  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(roles.includes('Organizator') 
      ? [{ label: 'Organizator', onClick: () => navigate('/projects') }] 
      : []),
    { label: 'Odjava', onClick: logout },
  ];

  // =============== RENDER ===============
  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Dashboard" menuItems={menuItems} />
      
      {/* Date Navigation */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <span className="material-icons">chevron_left</span>
            </button>

            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold">{formatDate(selectedDate)}</h2>
              {!isToday(selectedDate) && (
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Pojdi na današnji dan
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 text-gray-600 hover:text-gray-900"
              disabled={isToday(selectedDate)}
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Status and Work Duration */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          {currentSession && (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Začetek dela:</span>{' '}
                {formatTime(currentSession.startTimestamp)}
              </div>
              <div>
                <span className="font-medium">Skupni čas dela:</span>{' '}
                <span className="font-mono">
                  {calculateDuration(new Date(0), new Date(workDuration * 1000))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Break Timer */}
        {breakTimeLeft !== null && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Preostali čas malice</h2>
            <div className="text-3xl font-mono text-yellow-600">
              {Math.floor(breakTimeLeft / 60)}:
              {String(breakTimeLeft % 60).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Travel Information */}
        {currentTravel && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Aktivna pot</h2>
            <div className="space-y-2">
              <div>Začetni naslov: {currentTravel.startLocation.address}</div>
              <div>Trajanje: {Math.floor(activeTravelTime / 3600)}:
                {String(Math.floor((activeTravelTime % 3600) / 60)).padStart(2, '0')}:
                {String(activeTravelTime % 60).padStart(2, '0')}</div>
              <div>Razdalja: {travelDistance.toFixed(2)} km</div>
            </div>
          </div>
        )}

        {/* Action Buttons - Only show on today */}
        {isToday(selectedDate) && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              {!currentSession && (
                <button
                  onClick={startWork}
                  className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 disabled:opacity-50"
                  disabled={loading}
                >
                  Začni delo
                </button>
              )}

              {currentSession?.status === 'WORKING' && (
                <>
                  <button
                    onClick={startBreak}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    Začni malico
                  </button>

                  {!currentTravel && (
                    <button
                      onClick={() => {
                        setIsStartTravel(true);
                        setShowTravelForm(true);
                      }}
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
                  onClick={endBreak}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Zaključi malico
                </button>
              )}

              {currentTravel && (
                <button
                  onClick={() => {
                    setIsStartTravel(false);
                    setShowTravelForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Zaključi pot
                </button>
              )}

              {currentSession && (
                <button
                  onClick={endWork}
                  className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 disabled:opacity-50"
                  disabled={loading}
                >
                  Zaključi delo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Travel Form Modal */}
        {showTravelForm && currentLocation && (
          <TravelForm
            isStart={isStartTravel}
            currentLocation={currentLocation}
            onSubmit={isStartTravel ? handleStartTravel : handleEndTravel}
            onCancel={() => setShowTravelForm(false)}
          />
        )}

        {/* Completed Travels */}
        {completedTravels.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Zaključene poti</h2>
            <div className="space-y-4">
              {completedTravels.map((travel) => (
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 