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
  lat: number;
  lng: number;
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
  lastDisplayNameEditAt: string | null;
  coverImage?: string;
  tier: "free" | "pro";
  subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled";
  trialEndsAt: string | null;
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
  zipCode: string;
  lat: number | null;
  lng: number | null;
  locationConfirmed: boolean;
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
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: string;
  isRead: boolean;
}

export interface Thread {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  buyerUnread: number;
  sellerUnread: number;
  createdAt: string;
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

export type NotificationType = 'offer_received' | 'offer_accepted' | 'offer_declined' | 'offer_countered' | 'new_message_thread' | 'new_message' | 'review_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  icon: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  icon: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

export function dbNotificationToNotification(n: DbNotification): Notification {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    icon: n.icon,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.created_at,
  };
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
  last_display_name_edit_at: string | null;
  cover_image: string | null;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
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
  zip_code: string;
  lat: number | null;
  lng: number | null;
  location_confirmed: boolean;
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

// Only allow images hosted on our own Supabase storage or known safe domains.
// External OAuth provider images (Google, Facebook, etc.) are rejected to
// prevent Next.js Image optimisation errors from unregistered hostnames.
const SUPABASE_HOST = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try { return new URL(url).hostname; } catch { return null; }
})();

const ALLOWED_IMAGE_HOSTS = new Set(
  [SUPABASE_HOST, 'images.unsplash.com', 'plus.unsplash.com', 'placehold.co']
    .filter((h): h is string => Boolean(h))
);

function sanitizeProfileImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_IMAGE_HOSTS.has(hostname) ? url : undefined;
  } catch {
    return undefined;
  }
}

// Helper to convert DB row to frontend type
export function dbProfileToUser(p: DbProfile): User {
  return {
    id: p.id,
    displayName: p.display_name,
    avatarInitials: p.avatar_initials,
    profileImage: sanitizeProfileImage(p.profile_image),
    city: p.city,
    bio: p.bio,
    isVerified: p.is_verified,
    ratingAvg: p.rating_avg,
    reviewCount: p.review_count,
    trustScore: p.trust_score,
    joinedAt: p.created_at,
    responseRate: p.response_rate,
    listingCount: p.listing_count,
    lastDisplayNameEditAt: p.last_display_name_edit_at ?? null,
    coverImage: p.cover_image ?? undefined,
    tier: (p.tier as User["tier"]) || "free",
    subscriptionStatus: (p.subscription_status as User["subscriptionStatus"]) || "none",
    trialEndsAt: p.trial_ends_at ?? null,
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
    zipCode: l.zip_code ?? "",
    lat: l.lat === null || l.lat === undefined ? null : Number(l.lat),
    lng: l.lng === null || l.lng === undefined ? null : Number(l.lng),
    locationConfirmed: l.location_confirmed ?? false,
    photos: l.photos,
    status: l.status,
    createdAt: l.created_at,
    tags: l.tags,
  };
}

export interface DbThread {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  listing_title: string;
  last_message: string;
  last_message_at: string;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
}

export interface DbMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  sent_at: string;
}

export function dbThreadToThread(t: DbThread): Thread {
  return {
    id: t.id,
    listingId: t.listing_id,
    buyerId: t.buyer_id,
    sellerId: t.seller_id,
    listingTitle: t.listing_title,
    lastMessage: t.last_message,
    lastMessageAt: t.last_message_at,
    buyerUnread: t.buyer_unread,
    sellerUnread: t.seller_unread,
    createdAt: t.created_at,
  };
}

export function dbMessageToMessage(m: DbMessage): Message {
  return {
    id: m.id,
    threadId: m.thread_id,
    senderId: m.sender_id,
    body: m.body,
    sentAt: m.sent_at,
    isRead: m.is_read,
  };
}

// Blind reviews — DB row shape
import type { BlindReview } from '@/lib/data/blind-reviews';
export interface DbBlindReviewEntry {
  rating: number;
  comment: string;
  quickTags: string[];
  conditionMatch: string;
  submittedAt: string;
}

export interface DbBlindReview {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_review: DbBlindReviewEntry | null;
  seller_review: DbBlindReviewEntry | null;
  status: 'revealed' | 'awaiting_seller' | 'awaiting_buyer' | 'awaiting_both';
  revealed_at: string | null;
  created_at: string;
  // Joined fields (from select with profiles/listings)
  listings?: { title: string };
  buyer?: { display_name: string; avatar_initials: string; profile_image: string | null };
  seller?: { display_name: string; avatar_initials: string; profile_image: string | null };
}

export function dbBlindReviewToBlindReview(r: DbBlindReview): BlindReview {
  return {
    id: r.id,
    transactionId: r.id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    sellerId: r.seller_id,
    buyerReview: r.buyer_review,
    sellerReview: r.seller_review,
    status: r.status,
    revealedAt: r.revealed_at,
    listingTitle: r.listings?.title ?? null,
    buyerName: r.buyer?.display_name ?? null,
    buyerInitials: r.buyer?.avatar_initials ?? null,
    buyerImage: r.buyer?.profile_image ?? null,
    sellerName: r.seller?.display_name ?? null,
    sellerInitials: r.seller?.avatar_initials ?? null,
    sellerImage: r.seller?.profile_image ?? null,
  };
}
