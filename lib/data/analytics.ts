export interface ListingAnalytics {
  listingId: string;
  userId: string;
  views: number[];
  uniqueVisitors: number[];
  saves: number;
  shares: number;
  offerRate: number;
  avgTimeOnPage: number;
  topReferrers: string[];
  demographics: { mobile: number; desktop: number };
}

export const LISTING_ANALYTICS: ListingAnalytics[] = [
  {
    listingId: 'listing001', userId: 'user001',
    views: [12, 18, 25, 32, 28, 15, 10, 22, 30, 35, 28, 20, 18, 15],
    uniqueVisitors: [8, 12, 18, 22, 20, 10, 7, 16, 22, 26, 20, 14, 12, 10],
    saves: 14, shares: 6, offerRate: 8.5, avgTimeOnPage: 42,
    topReferrers: ['Search', 'Browse', 'Direct Link', 'Trade Chain'],
    demographics: { mobile: 62, desktop: 38 },
  },
  {
    listingId: 'listing007', userId: 'user002',
    views: [20, 35, 42, 38, 30, 25, 18, 28, 40, 45, 32, 22, 15, 12],
    uniqueVisitors: [14, 25, 30, 28, 22, 18, 12, 20, 30, 34, 24, 16, 10, 8],
    saves: 22, shares: 11, offerRate: 12.3, avgTimeOnPage: 55,
    topReferrers: ['Search', 'Browse', 'Community Board', 'SMS Alert'],
    demographics: { mobile: 55, desktop: 45 },
  },
  {
    listingId: 'listing023', userId: 'user001',
    views: [30, 45, 60, 55, 48, 35, 28, 40, 52, 65, 50, 38, 30, 25],
    uniqueVisitors: [22, 32, 44, 40, 35, 25, 20, 30, 38, 48, 36, 28, 22, 18],
    saves: 35, shares: 18, offerRate: 15.2, avgTimeOnPage: 68,
    topReferrers: ['Boost', 'Search', 'Browse', 'Direct Link'],
    demographics: { mobile: 48, desktop: 52 },
  },
];
