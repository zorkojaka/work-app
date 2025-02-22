// components/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../../firebaseConfig';
import { Timestamp, collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { calculateDistance, getAddressFromCoordinates } from '../../utils/locationUtils';

// Components
import Header from '../common/Header';
import DateNavigation from './DateNavigation';
import WorkStatus from './WorkStatus';
import BreakTimer from './BreakTimer';
import TravelInfo from './TravelInfo';
import ActionButtons from './ActionButtons';
import CompletedTravels from './CompletedTravels';
import TravelForm from '../travel/TravelForm';

// Types
import { WorkSession } from '../../types/workSession';
import { TravelOrder, Location } from '../../types/travelOrder';

const BREAK_DURATION = 35 * 60; // 35 minut v sekundah

const Dashboard: React.FC = () => {
  // State
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [status, setStatus] = useState('Doma');
  const [loading, setLoading] = useState(false);
  const [workDuration, setWorkDuration] = useState<number>(0);
  const [breakTimeLeft, setBreakTimeLeft] = useState<number | null>(null);

  // Travel related state
  const [currentTravel, setCurrentTravel] = useState<TravelOrder | null>(null);
  const [completedTravels, setCompletedTravels] = useState<TravelOrder[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [travelDistance, setTravelDistance] = useState(0);
  const [activeTravelTime, setActiveTravelTime] = useState<number>(0);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [isStartTravel, setIsStartTravel] = useState(true);

  const { user, logout, roles } = useAuth();
  const navigate = useNavigate();

  // Location tracking
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

  // Time tracking
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

  // Break timer
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

  // Session handlers
  const handleStartWork = async () => {
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

  const handleEndWork = async () => {
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

  const handleStartBreak = async () => {
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

  const handleEndBreak = async () => {
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

  // Travel handlers
  const handleStartTravelClick = () => {
    setIsStartTravel(true);
    setShowTravelForm(true);
  };

  const handleEndTravelClick = () => {
    setIsStartTravel(false);
    setShowTravelForm(true);
  };

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

  // Navigation handlers
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Menu items
  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(roles.includes('Organizator') 
      ? [{ label: 'Organizator', onClick: () => navigate('/projects') }] 
      : []),
    { label: 'Odjava', onClick: logout },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Dashboard" menuItems={menuItems} />
      
      <div className="p-4">
        <DateNavigation
          selectedDate={selectedDate}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          onTodayClick={handleTodayClick}
        />

        <WorkStatus
          currentSession={currentSession}
          status={status}
          workDuration={workDuration}
        />

        <BreakTimer breakTimeLeft={breakTimeLeft} />

        <TravelInfo
          currentTravel={currentTravel}
          activeTravelTime={activeTravelTime}
          travelDistance={travelDistance}
        />

        <ActionButtons
          currentSession={currentSession}
          isToday={isToday(selectedDate)}
          loading={loading}
          currentTravel={!!currentTravel}
          onStartWork={handleStartWork}
          onEndWork={handleEndWork}
          onStartBreak={handleStartBreak}
          onEndBreak={handleEndBreak}
          onStartTravel={handleStartTravelClick}
          onEndTravel={handleEndTravelClick}
        />

        <CompletedTravels travels={completedTravels} />

        {showTravelForm && currentLocation && (
          <TravelForm
            isStart={isStartTravel}
            currentLocation={currentLocation}
            onSubmit={isStartTravel ? handleStartTravel : handleEndTravel}
            onCancel={() => setShowTravelForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;