import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Region } from '@/lib/types';
import { REGIONS } from '@/lib/data/regions';

interface RegionState {
  selectedRegion: Region;
  setRegion: (regionId: string) => void;
  setZipRegion: (zip: string) => void;
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      selectedRegion: REGIONS.find(r => r.isDefault) || REGIONS[0],
      setRegion: (regionId: string) => {
        const region = REGIONS.find(r => r.id === regionId);
        if (region) set({ selectedRegion: region });
      },
      setZipRegion: (zip: string) => {
        set({
          selectedRegion: {
            id: `zip-${zip}`,
            name: zip,
            state: null,
            lat: 0,
            lng: 0,
          },
        });
      },
    }),
    {
      name: 'tradehub-region',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
    }
  )
);
