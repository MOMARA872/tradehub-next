import type { Region } from '@/lib/types';

export const REGIONS: Region[] = [
  { id: 'prescott-az', name: 'Prescott, AZ', state: 'AZ', isDefault: true },
  { id: 'phoenix-az', name: 'Phoenix, AZ', state: 'AZ' },
  { id: 'tucson-az', name: 'Tucson, AZ', state: 'AZ' },
  { id: 'flagstaff-az', name: 'Flagstaff, AZ', state: 'AZ' },
  { id: 'sedona-az', name: 'Sedona, AZ', state: 'AZ' },
  { id: 'all', name: 'All Regions', state: null },
];
