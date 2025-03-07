// types/user.ts
import { Timestamp } from 'firebase/firestore';

// 1. UPORABNIŠKI PODATKI
export interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  activeRole: string;
  profilePicture?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  department?: string;
  position?: string;
  // 1.1 Nastavitve za beleženje odmorov
  breakTracking?: {
    isExempt: boolean; // ali je uporabnik izvzet iz beleženja odmorov
    customBreakAllowance?: number; // posebna kvota za odmore v minutah (če je različna od globalne)
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
