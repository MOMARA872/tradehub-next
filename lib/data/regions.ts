import type { Region } from '@/lib/types';

export const REGIONS: Region[] = [
  { id: 'prescott-az', name: 'Prescott, AZ', state: 'AZ', isDefault: true, lat: 34.54, lng: -112.4685 },
  { id: 'phoenix-az', name: 'Phoenix, AZ', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { id: 'tucson-az', name: 'Tucson, AZ', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { id: 'flagstaff-az', name: 'Flagstaff, AZ', state: 'AZ', lat: 35.1983, lng: -111.6513 },
  { id: 'sedona-az', name: 'Sedona, AZ', state: 'AZ', lat: 34.8697, lng: -111.7610 },
  { id: 'all', name: 'All Arizona', state: 'AZ', lat: 34.0, lng: -111.5 },
];
