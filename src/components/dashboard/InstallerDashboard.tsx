// components/dashboard/InstallerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { useAuth } from '../../components/auth/AuthProvider';
import ActionButtons from './ActionButtons';
import WorkdayTimeline from './WorkdayTimeline';
import TravelOrders from './TravelOrders';
import DateNavigation from './DateNavigation';
import InstallerProjects from './InstallerProjects';
import MonthlyWorkStats from './MonthlyWorkStats';
import DailyWorkReport from './DailyWorkReport';
import EventSequence from './EventSequence';
import { WorkSession } from '../../types/workSession';
import { TravelOrder, Location } from '../../types/travelOrder';
import { calculateDistance, getAddressFromCoordinates } from '../../utils/locationUtils';
import { Project } from '../../types/project';

// 1. KONSTANTE ZA ODMORE
const LUNCH_BREAK_DURATION = 35 * 60; // 35 minut v sekundah
const SHORT_BREAK_DURATION = 5 * 60; // 5 minut v sekundah
const TOTAL_BREAK_ALLOWANCE = 45 * 60; // 45 minut v sekundah (skupni čas za vse odmore)

const InstallerDashboard: React.FC = () => {
  // State
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stanje za delo in potovanja
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [status, setStatus] = useState('Doma');
  const [loading, setLoading] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState<number | null>(null);
  const [shortBreakTimeLeft, setShortBreakTimeLeft] = useState<number | null>(null);
  const [totalBreakTimeLeft, setTotalBreakTimeLeft] = useState<number>(TOTAL_BREAK_ALLOWANCE);
  const [workDuration, setWorkDuration] = useState<number>(0);

  // Dodamo stanje za delovne dni
  const [workDays, setWorkDays] = useState<Date[]>([]);

  // Stanje za potovanja
  const [currentTravel, setCurrentTravel] = useState<TravelOrder | null>(null);
  const [completedTravels, setCompletedTravels] = useState<TravelOrder[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [isStartTravel, setIsStartTravel] = useState(true);
  const [activeTravelTime, setActiveTravelTime] = useState<number>(0);
  const [travelDistance, setTravelDistance] = useState<number>(0);

  // Stanje za projekte
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [thisWeekProjects, setThisWeekProjects] = useState<Project[]>([]);
  const [nextWeekProjects, setNextWeekProjects] = useState<Project[]>([]);
  const [upcomingProjects, setUpcomingProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState({
    draft: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });

  // 1.1 Inicializacija stanja
  useEffect(() => {
    // Preveri, če je uporabnik prijavljen
    if (!user) {
      navigate('/login');
      return;
    }

    console.log("Inicializacija InstallerDashboard komponente");
    console.log("Trenutni uporabnik:", user.uid);
    
    // Naloži podatke
    const loadData = async () => {
      try {
        await fetchWorkSessions();
        await fetchTravelOrders();
        await fetchProjects();
      } catch (error) {
        console.error("Napaka pri nalaganju podatkov:", error);
      }
    };
    
    loadData();
    
    // Nastavi začetno stanje samo, če še ni nastavljeno
    if (status === 'Doma' && !currentSession && !currentTravel) {
      setSelectedDate(new Date());
      setWorkDuration(0);
      setBreakTimeLeft(null);
      setShortBreakTimeLeft(null);
    }
  }, [user]);

  // Location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Load work sessions for selected date
  useEffect(() => {
    if (user && selectedDate) {
      console.log(`Nalagam podatke za datum: ${selectedDate.toLocaleDateString()}`);
      const loadData = async () => {
        try {
          setLoading(true);
          await fetchWorkSessions(selectedDate);
          await fetchTravelOrders(selectedDate);
          setLoading(false);
        } catch (error) {
          console.error("Napaka pri nalaganju podatkov:", error);
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [user, selectedDate]);

  // Naložimo delovne dni samo enkrat ob inicializaciji
  useEffect(() => {
    if (user) {
      const loadWorkDays = async () => {
        try {
          await fetchWorkDays();
        } catch (error) {
          console.error("Napaka pri nalaganju delovnih dni:", error);
        }
      };
      
      loadWorkDays();
    }
  }, [user]);

  // Naložimo projekte, na katerih je monter dodeljen
  useEffect(() => {
    if (user) {
      const fetchAssignedProjects = async () => {
        try {
          console.log('Pridobivam dodeljene projekte...');
          const projectsRef = collection(db, 'projects');
          const q = query(
            projectsRef,
            where('assignedUsers', 'array-contains', user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          const assignedProjectsList: Project[] = [];
          
          querySnapshot.forEach((doc) => {
            const projectData = doc.data() as Project;
            assignedProjectsList.push({
              ...projectData,
              id: doc.id
            });
          });
          
          console.log(`Pridobljenih ${assignedProjectsList.length} dodeljenih projektov`);
          setAssignedProjects(assignedProjectsList);
        } catch (error) {
          console.error('Napaka pri pridobivanju dodeljenih projektov:', error);
        }
      };
      
      fetchAssignedProjects();
    }
  }, [user]);

  // 1.2 Pomožne funkcije za pridobivanje podatkov
  const fetchWorkSessions = async (date: Date = selectedDate) => {
    if (!user) return;

    try {
      setLoading(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Pridobivam delovne seje za dan: ${startOfDay.toLocaleDateString()} - ${endOfDay.toLocaleDateString()}`);

      const sessionsRef = collection(db, 'users', user.uid, 'workSessions');
      const querySnapshot = await getDocs(
        query(
          sessionsRef,
          where('startTime', '>=', Timestamp.fromDate(startOfDay)),
          where('startTime', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('startTime', 'asc')
        )
      );
      
      const sessions: WorkSession[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as WorkSession;
        sessions.push({
          ...data,
          id: doc.id
        });
      });

      console.log(`Pridobljenih ${sessions.length} delovnih sej`);
      setWorkSessions(sessions);
      
      // Find current session if it exists
      const activeSession = sessions.find(s => !s.endTime);
      setCurrentSession(activeSession || null);
      
      if (activeSession) {
        if (activeSession.onBreak) {
          setStatus('Na malici');
          
          // Calculate remaining break time
          const breakStartTime = activeSession.breakStartTime?.toDate() || new Date();
          const elapsedBreakTime = Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
          const remainingBreakTime = Math.max(0, LUNCH_BREAK_DURATION - elapsedBreakTime);
          
          setBreakTimeLeft(remainingBreakTime);
        } else if (activeSession.onShortBreak) {
          setStatus('Na kratki malici');
          
          // Calculate remaining short break time
          const shortBreakStartTime = activeSession.shortBreakStartTime?.toDate() || new Date();
          const elapsedShortBreakTime = Math.floor((new Date().getTime() - shortBreakStartTime.getTime()) / 1000);
          const remainingShortBreakTime = Math.max(0, SHORT_BREAK_DURATION - elapsedShortBreakTime);
          
          setShortBreakTimeLeft(remainingShortBreakTime);
        } else {
          setStatus('Na lokaciji');
        }
        
        // Calculate work duration
        const startTime = activeSession.startTime?.toDate() || new Date();
        const breakDuration = activeSession.breakDuration || 0;
        const shortBreakDuration = activeSession.shortBreakDuration || 0;
        const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000) - breakDuration - shortBreakDuration;
        
        setWorkDuration(elapsedTime);
      } else {
        setStatus('Doma');
        setWorkDuration(0);
        setBreakTimeLeft(null);
        setShortBreakTimeLeft(null);
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTravelOrders = async (date: Date = selectedDate) => {
    if (!user) return;
    
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Pridobivam potovanja za dan: ${startOfDay.toLocaleDateString()} - ${endOfDay.toLocaleDateString()}`);

      const travelsRef = collection(db, 'users', user.uid, 'travelOrders');
      const querySnapshot = await getDocs(
        query(
          travelsRef,
          where('startTime', '>=', Timestamp.fromDate(startOfDay)),
          where('startTime', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('startTime', 'asc')
        )
      );
      
      const travels: TravelOrder[] = [];
      let activeTravel: TravelOrder | null = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as TravelOrder;
        const travel = {
          ...data,
          id: doc.id
        };
        
        travels.push(travel);
        
        if (!travel.endTime) {
          activeTravel = travel;
        }
      });

      console.log(`Pridobljenih ${travels.length} potovanj, aktivnih: ${activeTravel ? 1 : 0}`);
      setCompletedTravels(travels.filter(t => t.endTime));
      setCurrentTravel(activeTravel);
      
      if (activeTravel) {
        setStatus('Na poti');
        
        // Calculate travel duration and distance
        if (activeTravel.startTime) {
          const startTime = activeTravel.startTime.toDate();
          const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          setActiveTravelTime(elapsedTime);
        }
        
        if (activeTravel.distance) {
          setTravelDistance(activeTravel.distance.value || 0);
        } else {
          setTravelDistance(0);
        }
      }
    } catch (error) {
      console.error('Error fetching travel orders:', error);
    }
  };

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const projectsRef = collection(db, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);
      
      const projectsList: Project[] = [];
      projectsSnapshot.forEach((doc) => {
        projectsList.push({ id: doc.id, ...doc.data() } as Project);
      });
      
      setProjects(projectsList);
      
      // Izračun statistike projektov
      let draftCount = 0;
      let inProgressCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      
      projectsList.forEach(project => {
        if (project.status === 'DRAFT') draftCount++;
        else if (project.status === 'IN_PROGRESS') inProgressCount++;
        else if (project.status === 'COMPLETED') completedCount++;
        else if (project.status === 'CANCELLED') cancelledCount++;
      });
      
      setProjectStats({
        draft: draftCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount
      });
      
      // Pridobivanje prihajajočih projektov
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const upcoming = projectsList.filter(project => 
        project.executionDate && 
        new Date(project.executionDate.date) >= today && 
        new Date(project.executionDate.date) <= nextMonth
      );
      
      setUpcomingProjects(upcoming);
      
      // Projekti za ta teden
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Ponedeljek
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Nedelja
      endOfWeek.setHours(23, 59, 59, 999);
      
      const thisWeek = upcoming.filter(project => 
        project.executionDate && 
        new Date(project.executionDate.date) >= startOfWeek && 
        new Date(project.executionDate.date) <= endOfWeek
      );
      
      setThisWeekProjects(thisWeek);
      
      // Projekti za naslednji teden
      const startOfNextWeek = new Date(endOfWeek);
      startOfNextWeek.setDate(startOfNextWeek.getDate() + 1);
      
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
      endOfNextWeek.setHours(23, 59, 59, 999);
      
      const nextWeek = upcoming.filter(project => 
        project.executionDate && 
        new Date(project.executionDate.date) >= startOfNextWeek && 
        new Date(project.executionDate.date) <= endOfNextWeek
      );
      
      setNextWeekProjects(nextWeek);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchWorkDays = async () => {
    if (!user) return;

    try {
      console.log('Pridobivam delovne dni...');
      const workDaysRef = collection(db, 'users', user.uid, 'workDays');
      const querySnapshot = await getDocs(workDaysRef);
      
      const workDaysList: Date[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Pretvorimo datum iz ISO stringa v Date objekt
        if (data.date) {
          const date = new Date(data.date);
          
          // Preverimo, če je datum veljaven
          if (!isNaN(date.getTime())) {
            // Nastavimo uro na polnoč, da primerjava datumov deluje pravilno
            date.setHours(0, 0, 0, 0);
            workDaysList.push(date);
          }
        }
      });
      
      console.log(`Pridobljenih ${workDaysList.length} delovnih dni`);
      setWorkDays(workDaysList);
    } catch (error) {
      console.error('Napaka pri pridobivanju delovnih dni:', error);
    }
  };

  // Set up timer for updating durations
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentSession) {
        const startTime = currentSession.startTime?.toDate() || new Date();
        const breakDuration = currentSession.breakDuration || 0;
        const shortBreakDuration = currentSession.shortBreakDuration || 0;
        const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000) - breakDuration - shortBreakDuration;
        
        setWorkDuration(elapsedTime);
        
        // Posodobi preostali čas za malico
        if (currentSession.onBreak && breakTimeLeft !== null) {
          const newBreakTimeLeft = Math.max(0, breakTimeLeft - 1);
          setBreakTimeLeft(newBreakTimeLeft);
          
          // Če se je čas iztekel, avtomatsko zaključi malico
          if (newBreakTimeLeft === 0) {
            handleEndBreak();
          }
        }
        
        // Posodobi preostali čas za kratko pavzo
        if (currentSession.onShortBreak && shortBreakTimeLeft !== null) {
          const newShortBreakTimeLeft = Math.max(0, shortBreakTimeLeft - 1);
          setShortBreakTimeLeft(newShortBreakTimeLeft);
          
          // Če se je čas iztekel, avtomatsko zaključi kratko pavzo
          if (newShortBreakTimeLeft === 0) {
            handleEndShortBreak();
          }
        }
        
        // Posodobi skupni preostali čas za odmore
        const totalUsed = (currentSession.breakDuration || 0) + (currentSession.shortBreakDuration || 0);
        const remaining = Math.max(0, TOTAL_BREAK_ALLOWANCE - totalUsed);
        setTotalBreakTimeLeft(remaining);
      }
      
      if (currentTravel) {
        const startTime = currentTravel.startTime?.toDate() || new Date();
        const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        
        setActiveTravelTime(elapsedTime);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentSession, currentTravel, breakTimeLeft, shortBreakTimeLeft]);

  // Action handlers
  const handleStartWork = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Ustvarimo nov delovni dan
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Preverimo, če današnji dan že obstaja v workDays
      const todayExists = workDays.some(date => 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
      
      // Če današnji dan še ne obstaja, ga dodamo
      if (!todayExists) {
        // Dodamo današnji dan v kolekcijo workDays
        const workDaysRef = collection(db, 'users', user.uid, 'workDays');
        await addDoc(workDaysRef, {
          date: today.toISOString(),
          createdAt: Timestamp.now()
        });
        
        // Posodobimo lokalno stanje
        setWorkDays([...workDays, today]);
        
        console.log('Dodan nov delovni dan:', today);
      }
      
      // Ustvarimo novo delovno sejo
      const workSessionRef = collection(db, 'users', user.uid, 'workSessions');
      const newSession = {
        userId: user.uid,
        startTime: Timestamp.now(),
        breakDuration: 0,
        shortBreakDuration: 0,
        onBreak: false,
        onShortBreak: false,
        location: currentLocation,
        totalBreakTimeUsed: 0
      };
      
      const docRef = await addDoc(workSessionRef, newSession);
      
      // Posodobimo stanje
      setCurrentSession({
        ...newSession,
        id: docRef.id,
        userId: user.uid,
        totalBreakTimeUsed: 0
      });
      
      setStatus('Na lokaciji');
      console.log('Začetek dela:', newSession);
    } catch (error) {
      console.error('Error starting work:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndWork = async () => {
    if (!currentSession || !user || loading) return;
    
    console.log("handleEndWork se kliče");
    setLoading(true);
    
    try {
      // Preveri, če ima currentSession id
      if (!currentSession.id) {
        console.error("Trenutna seja nima ID-ja");
        setLoading(false);
        return;
      }
      
      const sessionRef = doc(db, 'users', user?.uid || '', 'workSessions', currentSession.id || '');
      console.log("Zaključujem sejo z ID:", currentSession.id);
      
      await updateDoc(sessionRef, {
        endTime: Timestamp.now(),
        onBreak: false,
        onShortBreak: false,
      });
      console.log("Seja uspešno zaključena");
      
      setCurrentSession(null);
      setStatus('Končano');
      setBreakTimeLeft(null);
      setShortBreakTimeLeft(null);
    } catch (error) {
      console.error('Error ending work:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartBreak = async () => {
    if (!currentSession || !user || loading) return;
    
    console.log("handleStartBreak se kliče");
    setLoading(true);
    
    try {
      // Preveri, če je na voljo dovolj časa za malico
      if (totalBreakTimeLeft < LUNCH_BREAK_DURATION) {
        console.warn("Ni dovolj časa za malico! Na voljo je samo", totalBreakTimeLeft, "sekund.");
        alert(`Na voljo imate samo še ${Math.floor(totalBreakTimeLeft / 60)} minut za odmor!`);
        return;
      }
      
      const sessionRef = doc(db, 'users', user?.uid || '', 'workSessions', currentSession.id || '');
      console.log("Začenjam malico za sejo z ID:", currentSession.id);
      
      await updateDoc(sessionRef, {
        onBreak: true,
        breakStartTime: Timestamp.now(),
      });
      console.log("Malica uspešno začeta");
      
      setCurrentSession({
        ...currentSession,
        onBreak: true,
        breakStartTime: Timestamp.now(),
      });
      
      setStatus('Na malici');
      setBreakTimeLeft(LUNCH_BREAK_DURATION);
    } catch (error) {
      console.error('Error starting break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndBreak = async () => {
    if (!currentSession || !user || loading) return;
    
    console.log("handleEndBreak se kliče");
    setLoading(true);
    
    try {
      // Preveri, če ima currentSession id
      if (!currentSession.id) {
        console.error("Trenutna seja nima ID-ja");
        setLoading(false);
        return;
      }
      
      const sessionRef = doc(db, 'users', user?.uid || '', 'workSessions', currentSession.id || '');
      console.log("Zaključujem odmor za sejo z ID:", currentSession.id);
      
      const breakStartTime = currentSession.breakStartTime?.toDate() || new Date();
      const breakEndTime = new Date();
      const breakDurationSeconds = Math.floor((breakEndTime.getTime() - breakStartTime.getTime()) / 1000);
      const totalBreakDuration = (currentSession.breakDuration || 0) + breakDurationSeconds;
      const totalUsed = totalBreakDuration + (currentSession.shortBreakDuration || 0);
      
      console.log("Trajanje malice:", breakDurationSeconds, "s, skupno trajanje:", totalBreakDuration, "s");
      
      await updateDoc(sessionRef, {
        onBreak: false,
        breakEndTime: Timestamp.now(),
        breakDuration: totalBreakDuration,
        totalBreakTimeUsed: totalUsed
      });
      console.log("Malica uspešno zaključena");
      
      setCurrentSession({
        ...currentSession,
        onBreak: false,
        breakEndTime: Timestamp.now(),
        breakDuration: totalBreakDuration,
        totalBreakTimeUsed: totalUsed
      });
      
      setStatus('Na lokaciji');
      setBreakTimeLeft(null);
      setTotalBreakTimeLeft(Math.max(0, TOTAL_BREAK_ALLOWANCE - totalUsed));
    } catch (error) {
      console.error('Error ending break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartShortBreak = async () => {
    if (!currentSession || !user || loading) return;
    
    console.log("handleStartShortBreak se kliče");
    setLoading(true);
    
    try {
      // Preveri, če je na voljo dovolj časa za kratko pavzo
      if (totalBreakTimeLeft < SHORT_BREAK_DURATION) {
        console.warn("Ni dovolj časa za kratko pavzo! Na voljo je samo", totalBreakTimeLeft, "sekund.");
        alert(`Na voljo imate samo še ${Math.floor(totalBreakTimeLeft / 60)} minut za odmor!`);
        return;
      }
      
      const sessionRef = doc(db, 'users', user?.uid || '', 'workSessions', currentSession.id || '');
      console.log("Začenjam kratko malico za sejo z ID:", currentSession.id);
      
      await updateDoc(sessionRef, {
        onShortBreak: true,
        shortBreakStartTime: Timestamp.now(),
      });
      console.log("Kratka malica uspešno začeta");
      
      setCurrentSession({
        ...currentSession,
        onShortBreak: true,
        shortBreakStartTime: Timestamp.now(),
      });
      
      setStatus('Na kratki malici');
      setShortBreakTimeLeft(SHORT_BREAK_DURATION);
    } catch (error) {
      console.error('Error starting short break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndShortBreak = async () => {
    if (!currentSession || !user || loading) return;
    
    console.log("handleEndShortBreak se kliče");
    setLoading(true);
    
    try {
      // Preveri, če ima currentSession id
      if (!currentSession.id) {
        console.error("Trenutna seja nima ID-ja");
        setLoading(false);
        return;
      }
      
      const sessionRef = doc(db, 'users', user?.uid || '', 'workSessions', currentSession.id || '');
      console.log("Zaključujem kratko malico za sejo z ID:", currentSession.id);
      
      const shortBreakStartTime = currentSession.shortBreakStartTime?.toDate() || new Date();
      const shortBreakEndTime = new Date();
      const shortBreakDurationSeconds = Math.floor((shortBreakEndTime.getTime() - shortBreakStartTime.getTime()) / 1000);
      const totalShortBreakDuration = (currentSession.shortBreakDuration || 0) + shortBreakDurationSeconds;
      const totalUsed = (currentSession.breakDuration || 0) + totalShortBreakDuration;
      
      console.log("Trajanje kratke malice:", shortBreakDurationSeconds, "s, skupno trajanje:", totalShortBreakDuration, "s");
      
      await updateDoc(sessionRef, {
        onShortBreak: false,
        shortBreakEndTime: Timestamp.now(),
        shortBreakDuration: totalShortBreakDuration,
        totalBreakTimeUsed: totalUsed
      });
      console.log("Kratka malica uspešno zaključena");
      
      setCurrentSession({
        ...currentSession,
        onShortBreak: false,
        shortBreakEndTime: Timestamp.now(),
        shortBreakDuration: totalShortBreakDuration,
        totalBreakTimeUsed: totalUsed
      });
      
      setStatus('Na lokaciji');
      setShortBreakTimeLeft(null);
      setTotalBreakTimeLeft(Math.max(0, TOTAL_BREAK_ALLOWANCE - totalUsed));
    } catch (error) {
      console.error('Error ending short break:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartTravelClick = () => {
    console.log("handleStartTravelClick se kliče");
    setIsStartTravel(true);
    setShowTravelForm(true);
  };
  
  const handleEndTravelClick = () => {
    console.log("handleEndTravelClick se kliče");
    setIsStartTravel(false);
    setShowTravelForm(true);
  };
  
  const handleStartTravel = async (destination: string, purpose: string, projectId?: string) => {
    if (!user || !currentLocation || loading) return;
    
    console.log("handleStartTravel se kliče");
    setLoading(true);
    
    try {
      // Pridobimo trenutno lokacijo
      const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      };
      
      const { coords } = await getCurrentPositionPromise();
      const { latitude, longitude } = coords;
      
      // Pridobimo naslov iz koordinat
      const startAddress = await fetchAddress(latitude, longitude);
      
      // Ustvarimo nov potni nalog
      const newTravel: Omit<TravelOrder, 'id'> = {
        userId: user.uid,
        startTime: Timestamp.now(),
        startLocation: {
          latitude,
          longitude,
          address: startAddress,
          timestamp: new Date().toISOString()
        },
        destination,
        purpose,
        projectId: projectId
      };
      
      // Shranimo potni nalog v Firestore
      const travelRef = collection(db, 'users', user.uid, 'travelOrders');
      const docRef = await addDoc(travelRef, newTravel);
      
      // Posodobimo stanje
      setCurrentTravel({
        ...newTravel,
        id: docRef.id
      });
      
      setStatus('Na poti');
      setShowTravelForm(false);
    } catch (error) {
      console.error('Error starting travel:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndTravel = async (destination: string, purpose: string, projectId?: string) => {
    if (!currentTravel || !user || !currentLocation || loading) return;
    
    console.log("handleEndTravel se kliče");
    setLoading(true);
    
    try {
      // Pridobimo trenutno lokacijo
      const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      };
      
      const { coords } = await getCurrentPositionPromise();
      const { latitude, longitude } = coords;
      
      // Pridobimo naslov iz koordinat
      const endAddress = await fetchAddress(latitude, longitude);
      
      // Izračunamo razdaljo
      const startLat = currentTravel.startLocation?.latitude || 0;
      const startLng = currentTravel.startLocation?.longitude || 0;
      const distance = calculateDistance(startLat, startLng, latitude, longitude);
      
      // Posodobimo potni nalog
      if (!user?.uid || !currentTravel.id) {
        console.error("Manjkajoči podatki za posodobitev potnega naloga");
        setLoading(false);
        return;
      }
      
      const travelRef = doc(db, 'users', user.uid, 'travelOrders', currentTravel.id);
      const updatedTravel = {
        endTime: Timestamp.now(),
        endLocation: {
          latitude,
          longitude,
          address: endAddress,
          timestamp: new Date().toISOString()
        },
        distance: { value: distance },
        destination: destination || currentTravel.destination,
        purpose: purpose || currentTravel.purpose,
        projectId: projectId || currentTravel.projectId
      };
      
      await updateDoc(travelRef, updatedTravel);
      
      const updatedTravelWithId = {
        ...updatedTravel,
        id: currentTravel.id
      };
      
      setCompletedTravels([...completedTravels, updatedTravelWithId as TravelOrder]);
      setCurrentTravel(null);
      setStatus('Na lokaciji');
      setShowTravelForm(false);
      
      // If there's no active work session, start one
      if (!currentSession) {
        handleStartWork();
      }
    } catch (error) {
      console.error('Error ending travel:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
    fetchWorkSessions(prevDay);
    fetchTravelOrders(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    fetchWorkSessions(nextDay);
    fetchTravelOrders(nextDay);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    fetchWorkSessions(today);
    fetchTravelOrders(today);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchWorkSessions(date);
    fetchTravelOrders(date);
  };

  const isToday = (date: Date): boolean => {
    if (!date) return false;
    
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Helpers
  const formatTime = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return '--:--';
    return timestamp.toDate().toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const address = await getAddressFromCoordinates(lat, lng);
      return address;
    } catch (error) {
      console.error('Napaka pri pridobivanju naslova:', error);
      return 'Neznana lokacija';
    }
  };

  const statusColors: Record<string, string> = {
    'Doma': 'bg-gray-500',
    'Na poti': 'bg-yellow-500',
    'Na lokaciji': 'bg-green-500',
    'Na malici': 'bg-blue-500',
    'Na kratki malici': 'bg-orange-500',
    'Končano': 'bg-red-500'
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nadzorna plošča monterja</h1>
      
      {/* Glavna vsebina - razdeljena v tri stolpce */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Prvi stolpec - Dnevni pregled in akcije */}
        <div className="space-y-4">
          {/* Navigacija po datumih - prestavljena v prvi stolpec */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <DateNavigation 
              selectedDate={selectedDate}
              onPreviousDay={handlePreviousDay}
              onNextDay={handleNextDay}
              onTodayClick={handleTodayClick}
              onDateSelect={handleDateSelect}
              workDays={workDays}
            />
          </div>
          
          {/* Status dela, časovnica in akcijski gumbi - združeno */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Stanje dela</h2>
            
            {/* Status dela */}
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status === 'Končano' ? 'bg-red-500' : 
                status === 'Na lokaciji' ? 'bg-green-500' : 
                status === 'Na malici' ? 'bg-yellow-500' : 
                status === 'Na kratki malici' ? 'bg-orange-500' : 
                status === 'Na poti' ? 'bg-blue-500' : 
                'bg-gray-500'}`}></div>
              <span className="font-medium">{status}</span>
            </div>
            
            <DailyWorkReport 
              workSessions={workSessions} 
              completedTravels={completedTravels}
              selectedDate={selectedDate}
            />
            
            {/* Časovnica dneva - vedno prikazana */}
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Časovnica dneva</h3>
              <WorkdayTimeline 
                workSessions={workSessions} 
                travelOrders={completedTravels}
                selectedDate={selectedDate}
                compact={true}
                currentSession={currentSession}
              />
            </div>
            
            {/* Akcijski gumbi - premaknjeni ven iz notranjega okna */}
            <ActionButtons 
              currentSession={currentSession}
              status={status}
              breakTimeLeft={breakTimeLeft}
              shortBreakTimeLeft={shortBreakTimeLeft}
              currentTravel={currentTravel}
              isToday={isToday(selectedDate)}
              loading={loading}
              onStartWork={handleStartWork}
              onEndWork={handleEndWork}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
              onStartShortBreak={handleStartShortBreak}
              onEndShortBreak={handleEndShortBreak}
              onStartTravel={handleStartTravelClick}
              onEndTravel={handleEndTravelClick}
            />
          </div>
          
          {/* Zaporedje dogodkov */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Zaporedje dogodkov</h2>
            <EventSequence 
              workSessions={workSessions} 
              completedTravels={completedTravels}
              selectedDate={selectedDate}
            />
          </div>
          
          {/* Potni nalogi */}
          <TravelOrders 
            completedTravels={completedTravels} 
            currentTravel={currentTravel}
            showTravelForm={showTravelForm}
            setShowTravelForm={setShowTravelForm}
            isStartTravel={isStartTravel}
            setIsStartTravel={setIsStartTravel}
            handleStartTravel={(purpose, projectId) => handleStartTravel(purpose, purpose, projectId)}
            handleEndTravel={(purpose, projectId) => handleEndTravel(purpose, purpose, projectId)}
            activeTravelTime={activeTravelTime}
            travelDistance={travelDistance}
            projects={assignedProjects}
            user={user}
          />
        </div>
        
        {/* Drugi stolpec - Tedenski pregled in projekti */}
        <div className="space-y-4">
          {/* Tedenski pregled */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Tedenski pregled</h2>
            <div className="text-center text-gray-500 py-4">
              Prihaja kmalu...
            </div>
          </div>
          
          {/* Prihajajoči dogodki */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Prihajajoči dogodki</h2>
            <div className="text-center text-gray-500 py-4">
              Prihaja kmalu...
            </div>
          </div>
          
          {/* Projekti */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Moji projekti</h2>
            {assignedProjects && assignedProjects.length > 0 ? (
              <InstallerProjects 
                projects={assignedProjects}
                onProjectClick={(projectId) => navigate(`/projects/${projectId}`)}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                Trenutno niste dodeljeni nobenemu projektu
              </div>
            )}
          </div>
        </div>
        
        {/* Tretji stolpec - Statistika in poročila */}
        <div className="space-y-4">
          {/* Statistika projektov */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Statistika projektov</h2>
            <div className="text-center text-gray-500 py-4">
              Prihaja kmalu...
            </div>
          </div>
          
          {/* Mesečna statistika dela */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Mesečna statistika dela</h2>
            <MonthlyWorkStats hourlyRate={12.5} />
          </div>
        </div>
      </div>
      
      {/* Obrazec za potni nalog */}
      {showTravelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isStartTravel ? "Začetek potovanja" : "Zaključek potovanja"}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const purposeInput = document.getElementById('travelPurpose') as HTMLInputElement;
              const projectInput = document.getElementById('travelProject') as HTMLSelectElement;
              
              if (isStartTravel) {
                handleStartTravel(purposeInput.value, purposeInput.value, projectInput.value || undefined);
              } else {
                handleEndTravel(purposeInput.value, purposeInput.value, projectInput.value || undefined);
              }
            }}>
              {isStartTravel && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Namen potovanja</label>
                    <input
                      type="text"
                      id="travelPurpose"
                      className="w-full px-3 py-2 border rounded"
                      value={""}
                      onChange={(e) => {}}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Destinacija</label>
                    <input
                      type="text"
                      id="travelDestination"
                      className="w-full px-3 py-2 border rounded"
                      value={""}
                      onChange={(e) => {}}
                      required
                    />
                  </div>
                  
                  {projects.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Povezan projekt (opcijsko)</label>
                      <select
                        id="travelProject"
                        className="w-full px-3 py-2 border rounded"
                        value={""}
                        onChange={(e) => {}}
                      >
                        <option value="">Izberi projekt</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setShowTravelForm(false)}
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  disabled={loading}
                >
                  {loading ? "Nalaganje..." : isStartTravel ? "Začni potovanje" : "Zaključi potovanje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Obrazec za izbiro projekta */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Izberi projekt</h2>
            
            <div className="max-h-96 overflow-y-auto">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // setSelectedProjectId(project.id);
                    // setShowProjectModal(false);
                  }}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-600">{project.description}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {}}
              >
                Zapri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerDashboard;
