// utils/locationUtils.ts

// 1. FUNKCIJA ZA IZRAČUN RAZDALJE MED DVEMA TOČKAMA
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius zemlje v kilometrih
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Razdalja v kilometrih
  return Math.round(d * 100) / 100; // Zaokrožimo na 2 decimalni mesti
}

// 1.1 Pretvorba stopinj v radiane
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// 2. FUNKCIJA ZA PRIDOBIVANJE NASLOVA IZ KOORDINAT
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${lat}, ${lng}`;
  }
}