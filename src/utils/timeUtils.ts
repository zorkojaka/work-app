import { Timestamp } from 'firebase/firestore';

export const formatTime = (time: Date | Timestamp | null | undefined): string => {
  if (!time) return '--:--:--';
  const date = time instanceof Date ? time : new Date(time.seconds * 1000);
  return date.toLocaleTimeString('sl-SI', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const calculateDuration = (startTime: Date | Timestamp | null | undefined, endTime: Date | Timestamp | null | undefined): string => {
  if (!startTime || !endTime) return '00:00:00';
  
  const start = startTime instanceof Date ? startTime : new Date(startTime.seconds * 1000);
  const end = endTime instanceof Date ? endTime : new Date(endTime.seconds * 1000);
  
  const durationSeconds = (end.getTime() - start.getTime()) / 1000;
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = Math.floor(durationSeconds % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};