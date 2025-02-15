//// types/workSession.ts
import { Timestamp } from 'firebase/firestore';

export interface WorkSession {
  id: string;
  startTimestamp: Timestamp;
  endTimestamp?: Timestamp;
  status: 'WORKING' | 'BREAK' | 'TRAVEL' | 'COMPLETED';
  actions: Action[];
}

export interface Action {
  type: 'START_BREAK' | 'END_BREAK' | 'START_TRAVEL' | 'END_TRAVEL';
  timestamp: Timestamp;
  location?: Location;
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