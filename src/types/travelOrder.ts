import { Timestamp } from 'firebase/firestore';

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
}

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
  projectName?: string;
  purpose: string;
  routePoints: Location[];
}