export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: { categories?: string[]; maxPrice?: number; priceType?: string };
  alertEnabled: boolean;
  frequency: string;
  matchCount: number;
  createdAt: string;
}

export const SAVED_SEARCHES: SavedSearch[] = [
  { id: 'saved001', userId: 'user001', name: 'Art Supplies Under $50', query: 'art supplies', filters: { categories: ['trade'], maxPrice: 50, priceType: 'fixed' }, alertEnabled: true, frequency: 'daily', matchCount: 3, createdAt: '2024-03-10' },
  { id: 'saved002', userId: 'user001', name: 'Free Furniture', query: 'furniture', filters: { categories: ['freestuff'], priceType: 'free' }, alertEnabled: true, frequency: 'instant', matchCount: 1, createdAt: '2024-03-15' },
  { id: 'saved003', userId: 'user002', name: 'Guitar Related', query: 'guitar', filters: { categories: [] }, alertEnabled: false, frequency: 'weekly', matchCount: 2, createdAt: '2024-03-18' },
  { id: 'saved004', userId: 'user005', name: 'Writing & Education Jobs', query: 'writing education', filters: { categories: ['jobs', 'services'] }, alertEnabled: true, frequency: 'daily', matchCount: 4, createdAt: '2024-03-12' },
];
