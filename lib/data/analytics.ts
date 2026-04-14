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
  {
    listingId: 'bdabd210-6ae5-4994-8aa8-146c18aa9a60', userId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    views: [8, 15, 22, 34, 41, 38, 29, 33, 45, 52, 48, 36, 27, 19],
    uniqueVisitors: [5, 10, 16, 24, 30, 28, 20, 24, 33, 40, 35, 26, 19, 13],
    saves: 18, shares: 9, offerRate: 11.4, avgTimeOnPage: 47,
    topReferrers: ['Search', 'Browse', 'Direct Link', 'Community Board'],
    demographics: { mobile: 58, desktop: 42 },
  },
  {
    listingId: 'a45499b9-ae1f-4f86-9a1a-2074a86b4aa6', userId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    views: [14, 28, 35, 50, 62, 55, 40, 48, 58, 72, 65, 50, 38, 30],
    uniqueVisitors: [10, 20, 26, 38, 46, 40, 30, 36, 44, 55, 48, 37, 28, 22],
    saves: 32, shares: 15, offerRate: 14.8, avgTimeOnPage: 62,
    topReferrers: ['Boost', 'Search', 'Browse', 'Trade Chain'],
    demographics: { mobile: 51, desktop: 49 },
  },
  {
    listingId: '62e2d351-6980-405d-ab58-1892b3cbbd88', userId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    views: [5, 10, 18, 25, 22, 16, 12, 20, 28, 32, 26, 18, 14, 9],
    uniqueVisitors: [3, 7, 12, 18, 16, 11, 8, 14, 20, 24, 19, 13, 10, 6],
    saves: 8, shares: 3, offerRate: 6.2, avgTimeOnPage: 35,
    topReferrers: ['Browse', 'Search', 'Direct Link'],
    demographics: { mobile: 65, desktop: 35 },
  },
  {
    listingId: 'e1b4c75f-0071-45a8-a6d8-56620b8b5921', userId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    views: [10, 20, 30, 42, 38, 28, 22, 35, 44, 55, 42, 30, 24, 16],
    uniqueVisitors: [7, 14, 22, 30, 28, 20, 15, 25, 32, 42, 30, 22, 17, 11],
    saves: 24, shares: 12, offerRate: 10.6, avgTimeOnPage: 51,
    topReferrers: ['Search', 'Community Board', 'Browse', 'SMS Alert'],
    demographics: { mobile: 54, desktop: 46 },
  },
];
