//// types/workSession.ts
import { Timestamp } from 'firebase/firestore';

export interface WorkSession {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  onBreak: boolean;
  breakStartTime?: Timestamp;
  breakEndTime?: Timestamp;
  breakDuration: number; // v sekundah
  onShortBreak: boolean; // za 5-minutni odmor
  shortBreakStartTime?: Timestamp;
  shortBreakEndTime?: Timestamp;
  shortBreakDuration: number; // v sekundah
  totalBreakTimeUsed: number; // skupni čas odmorov v sekundah (malica + kratki odmori)
  status?: 'WORKING' | 'BREAK' | 'SHORT_BREAK' | 'TRAVEL' | 'COMPLETED';
}

//// types/location.ts
import { Timestamp } from 'firebase/firestore';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Timestamp;
}

//// types/travel.ts
import { Timestamp } from 'firebase/firestore';
import { Location } from './location';

export interface TravelOrder {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  startLocation?: Location;
  endLocation?: Location;
  distance?: number;
  destination?: string;
  purpose?: string;
}