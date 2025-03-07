import { Timestamp } from 'firebase/firestore';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

export interface TravelOrder {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  startLocation: Location;
  endLocation?: Location;
  distance?: { value: number };
  destination?: string;
  purpose?: string;
  projectId?: string;
  projectName?: string;
}