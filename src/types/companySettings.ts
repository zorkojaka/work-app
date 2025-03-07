// types/companySettings.ts
import { Timestamp } from 'firebase/firestore';

// 1. OSNOVNE NASTAVITVE PODJETJA
export interface CompanySettings {
  id?: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  // 1.1 Nastavitve za odmore in malice
  breakSettings: {
    lunchBreakDuration: number; // trajanje malice v minutah
    shortBreakDuration: number; // trajanje kratke pavze v minutah
    totalBreakAllowance: number; // skupno dovoljeno trajanje odmorov v minutah
  };
  // 1.2 Nastavitve za uporabniške pravice
  userPermissions: {
    trackBreaks: boolean; // ali se beležijo odmori za vse uporabnike
    exemptedUsers: string[]; // seznam ID-jev uporabnikov, ki so izvzeti iz beleženja odmorov
    exemptedRoles: string[]; // seznam vlog, ki so izvzete iz beleženja odmorov
  };
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}
