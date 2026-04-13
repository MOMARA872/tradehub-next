export interface BoostPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  multiplier: string;
  color: string;
  icon: string;
  popular?: boolean;
}

export interface BoostedListing {
  listingId: string;
  boostPlan: string;
  startedAt: string;
  expiresAt: string;
  impressions: number;
  clicks: number;
}

export const BOOST_PLANS: BoostPlan[] = [
  { id: 'boost_basic', name: 'Basic Boost', duration: '3 days', price: 2.99, multiplier: '2x', color: '#3B82F6', icon: 'Zap' },
  { id: 'boost_pro', name: 'Pro Boost', duration: '7 days', price: 6.99, multiplier: '5x', color: '#8B5CF6', icon: 'Flame', popular: true },
  { id: 'boost_ultra', name: 'Ultra Boost', duration: '14 days', price: 11.99, multiplier: '10x', color: '#F59E0B', icon: 'Rocket' },
];

export const BOOSTED_LISTINGS: BoostedListing[] = [
  { listingId: 'listing001', boostPlan: 'boost_pro', startedAt: '2024-03-20', expiresAt: '2024-03-27', impressions: 1240, clicks: 87 },
  { listingId: 'listing007', boostPlan: 'boost_basic', startedAt: '2024-03-22', expiresAt: '2024-03-25', impressions: 430, clicks: 28 },
  { listingId: 'listing023', boostPlan: 'boost_ultra', startedAt: '2024-03-18', expiresAt: '2024-04-01', impressions: 3200, clicks: 210 },
];
