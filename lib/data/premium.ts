export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: string;
  color: string;
  popular?: boolean;
  features: string[];
  limits: { maxListings: number; boostCredits: number; analyticsAccess: boolean; prioritySupport: boolean; verifiedBadge: boolean };
}

export interface UserSubscription {
  userId: string;
  planId: string;
  startedAt: string;
  renewsAt: string;
  status: string;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever', icon: 'CircleDot', color: 'var(--text3)',
    features: ['5 active listings', 'Basic search', 'Standard profile', 'Community board access', 'Trade chain (Personal mode)'],
    limits: { maxListings: 5, boostCredits: 0, analyticsAccess: false, prioritySupport: false, verifiedBadge: false },
  },
  {
    id: 'plus', name: 'TradeHub Plus', price: 4.99, period: 'month', icon: 'Star', color: 'var(--accent2)', popular: true,
    features: ['25 active listings', 'Saved searches + SMS alerts', 'Listing analytics dashboard', '1 free boost per month', 'Priority in search results', 'Enhanced profile badge'],
    limits: { maxListings: 25, boostCredits: 1, analyticsAccess: true, prioritySupport: false, verifiedBadge: true },
  },
  {
    id: 'pro', name: 'TradeHub Pro', price: 12.99, period: 'month', icon: 'Gem', color: 'var(--accent1)',
    features: ['Unlimited listings', 'All Plus features', '3 free boosts per month', 'Advanced analytics & exports', 'Priority support', 'Featured seller badge', 'Resume builder access', 'Trade chain Project Mode'],
    limits: { maxListings: -1, boostCredits: 3, analyticsAccess: true, prioritySupport: true, verifiedBadge: true },
  },
];

export const USER_SUBSCRIPTIONS: UserSubscription[] = [
  { userId: 'user001', planId: 'plus', startedAt: '2024-01-15', renewsAt: '2024-04-15', status: 'active' },
  { userId: 'user002', planId: 'pro', startedAt: '2024-02-01', renewsAt: '2024-05-01', status: 'active' },
  { userId: 'user004', planId: 'plus', startedAt: '2024-03-01', renewsAt: '2024-06-01', status: 'active' },
  { userId: 'user005', planId: 'plus', startedAt: '2024-02-20', renewsAt: '2024-05-20', status: 'active' },
];
