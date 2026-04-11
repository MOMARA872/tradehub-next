export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isHot: boolean;
  subcategories: string[];
}

export interface Region {
  id: string;
  name: string;
  state: string | null;
  isDefault?: boolean;
}

export interface Condition {
  label: string;
  emoji: string;
  color: string;
  description: string;
  badgeText: string;
}

export type ConditionKey = 'new' | 'likenew' | 'good' | 'used' | 'old';

export interface User {
  id: string;
  displayName: string;
  avatarInitials: string;
  profileImage?: string;
  city: string;
  bio: string;
  isVerified: boolean;
  ratingAvg: number;
  reviewCount: number;
  trustScore: number;
  joinedAt: string;
  responseRate: number;
  listingCount: number;
}

export type PriceType = 'fixed' | 'free' | 'trade' | 'negotiable';

export interface Listing {
  id: string;
  userId: string;
  categoryId: string;
  subcategory: string;
  title: string;
  description: string;
  price: number;
  priceType: PriceType;
  condition: ConditionKey;
  conditionNotes: string;
  city: string;
  photos: string[];
  status: 'active' | 'sold' | 'expired';
  createdAt: string;
  tags: string[];
}

export type OfferStatus = 'pending' | 'accepted' | 'countered' | 'declined';

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  offerAmount: number;
  tradeDescription: string | null;
  status: OfferStatus;
  message: string;
  createdAt: string;
}

export interface Message {
  senderId: string;
  body: string;
  sentAt: string;
  isRead: boolean;
}

export interface Thread {
  id: string;
  participants: string[];
  listingId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  reviewerRole: 'buyer' | 'seller';
  rating: number;
  comment: string;
  quickTags: string[];
  conditionMatch: string;
  sellerReply: string | null;
  createdAt: string;
}

export interface TradeChainStep {
  item: string;
  emoji: string;
  tradedWith: string;
  value: number;
  date: string;
  description: string;
}

export interface TradeChain {
  id: string;
  userId: string;
  name: string;
  startItem: string;
  startEmoji: string;
  goalItem: string;
  goalEmoji: string;
  isPublic: boolean;
  steps: TradeChainStep[];
}

export interface Notification {
  id: string;
  userId: string;
  icon: string;
  text: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface SearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ConditionKey;
  priceType?: PriceType;
}

// Supabase row types (matches database columns)
export interface DbProfile {
  id: string;
  display_name: string;
  avatar_initials: string;
  profile_image: string | null;
  city: string;
  bio: string;
  is_verified: boolean;
  rating_avg: number;
  review_count: number;
  trust_score: number;
  response_rate: number;
  listing_count: number;
  created_at: string;
}

export interface DbListing {
  id: string;
  user_id: string;
  category_id: string;
  subcategory: string;
  title: string;
  description: string;
  price: number;
  price_type: PriceType;
  condition: ConditionKey;
  condition_notes: string;
  city: string;
  photos: string[];
  status: 'active' | 'sold' | 'expired';
  tags: string[];
  created_at: string;
}

export interface DbOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  trade_description: string | null;
  status: OfferStatus;
  message: string;
  created_at: string;
}

// Helper to convert DB row to frontend type
export function dbProfileToUser(p: DbProfile): User {
  return {
    id: p.id,
    displayName: p.display_name,
    avatarInitials: p.avatar_initials,
    profileImage: p.profile_image ?? undefined,
    city: p.city,
    bio: p.bio,
    isVerified: p.is_verified,
    ratingAvg: p.rating_avg,
    reviewCount: p.review_count,
    trustScore: p.trust_score,
    joinedAt: p.created_at,
    responseRate: p.response_rate,
    listingCount: p.listing_count,
  };
}

export function dbListingToListing(l: DbListing): Listing {
  return {
    id: l.id,
    userId: l.user_id,
    categoryId: l.category_id,
    subcategory: l.subcategory,
    title: l.title,
    description: l.description,
    price: l.price,
    priceType: l.price_type,
    condition: l.condition,
    conditionNotes: l.condition_notes,
    city: l.city,
    photos: l.photos,
    status: l.status,
    createdAt: l.created_at,
    tags: l.tags,
  };
}
