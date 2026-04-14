export interface BlindReviewEntry {
  rating: number;
  comment: string;
  quickTags: string[];
  conditionMatch: string;
  submittedAt: string;
}

export interface BlindReview {
  id: string;
  transactionId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyerReview: BlindReviewEntry | null;
  sellerReview: BlindReviewEntry | null;
  status: 'revealed' | 'awaiting_seller' | 'awaiting_buyer' | 'awaiting_both';
  revealedAt: string | null;
  // Joined display fields from Supabase query
  listingTitle?: string | null;
  buyerName?: string | null;
  buyerInitials?: string | null;
  buyerImage?: string | null;
  sellerName?: string | null;
  sellerInitials?: string | null;
  sellerImage?: string | null;
}

export const BLIND_REVIEWS: BlindReview[] = [
  {
    id: 'blindrev001', transactionId: 'txn001', listingId: 'listing001', buyerId: 'user002', sellerId: 'user001',
    buyerReview: { rating: 5, comment: 'Beautiful vase! Exactly as described. Very responsive seller.', quickTags: ['Fast Shipping', 'As Described', 'Great Communication'], conditionMatch: 'yes', submittedAt: '2024-03-20T10:00:00Z' },
    sellerReview: { rating: 5, comment: 'Great buyer! Quick to respond and ready to pick up.', quickTags: ['Quick Responder', 'Easy to Work With', 'Reliable'], conditionMatch: 'yes', submittedAt: '2024-03-20T14:30:00Z' },
    status: 'revealed', revealedAt: '2024-03-20T14:30:00Z'
  },
  {
    id: 'blindrev002', transactionId: 'txn002', listingId: 'listing002', buyerId: 'user006', sellerId: 'user002',
    buyerReview: { rating: 5, comment: 'Amazing website! James is a talented designer.', quickTags: ['Quality Work', 'Professional', 'Great Communication'], conditionMatch: 'yes', submittedAt: '2024-03-23T09:00:00Z' },
    sellerReview: null,
    status: 'awaiting_seller', revealedAt: null
  },
  {
    id: 'blindrev003', transactionId: 'txn003', listingId: 'listing009', buyerId: 'user002', sellerId: 'user003',
    buyerReview: null,
    sellerReview: { rating: 4, comment: 'Good buyer, picked up on time.', quickTags: ['Punctual', 'Friendly'], conditionMatch: 'yes', submittedAt: '2024-03-18T11:00:00Z' },
    status: 'awaiting_buyer', revealedAt: null
  },
  {
    id: 'blindrev004', transactionId: 'txn004', listingId: 'listing011', buyerId: 'user003', sellerId: 'user004',
    buyerReview: null, sellerReview: null,
    status: 'awaiting_both', revealedAt: null
  },
  {
    id: 'blindrev005', transactionId: 'txn005', listingId: 'listing016', buyerId: 'user001', sellerId: 'user003',
    buyerReview: { rating: 3, comment: 'Machine works but condition was worse than described. Thread tension needs adjustment.', quickTags: ['Condition Mismatch', 'Needs Repair'], conditionMatch: 'no', submittedAt: '2024-03-24T16:00:00Z' },
    sellerReview: { rating: 4, comment: 'Good buyer, no issues with pickup.', quickTags: ['Easy Pickup', 'Friendly'], conditionMatch: 'yes', submittedAt: '2024-03-24T18:00:00Z' },
    status: 'revealed', revealedAt: '2024-03-24T18:00:00Z'
  },
  {
    id: 'blindrev006', transactionId: 'txn006', listingId: 'e1b4c75f-0071-45a8-a6d8-56620b8b5921', buyerId: 'user001', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    buyerReview: { rating: 5, comment: 'Mara was super responsive and the item was exactly as described. Smooth trade!', quickTags: ['As Described', 'Fast Shipping', 'Great Communication'], conditionMatch: 'yes', submittedAt: '2024-04-08T10:00:00Z' },
    sellerReview: { rating: 5, comment: 'Great buyer! Quick payment and easy to coordinate with.', quickTags: ['Quick Responder', 'Reliable', 'Friendly'], conditionMatch: 'yes', submittedAt: '2024-04-08T14:00:00Z' },
    status: 'revealed', revealedAt: '2024-04-08T14:00:00Z',
    listingTitle: 'skyz', buyerName: 'Sarah Johnson', buyerInitials: 'SJ', sellerName: 'Mara Mos', sellerInitials: 'MA',
  },
  {
    id: 'blindrev007', transactionId: 'txn007', listingId: 'bdabd210-6ae5-4994-8aa8-146c18aa9a60', buyerId: 'user003', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    buyerReview: { rating: 4, comment: 'Good item, fair price. Took a bit longer to arrange but overall positive.', quickTags: ['Fair Prices', 'Good Condition'], conditionMatch: 'yes', submittedAt: '2024-04-06T11:00:00Z' },
    sellerReview: { rating: 4, comment: 'Nice buyer, patient with scheduling.', quickTags: ['Patient', 'Easy to Work With'], conditionMatch: 'yes', submittedAt: '2024-04-06T15:00:00Z' },
    status: 'revealed', revealedAt: '2024-04-06T15:00:00Z',
    listingTitle: 'kokok', buyerName: 'Emma Wilson', buyerInitials: 'EW', sellerName: 'Mara Mos', sellerInitials: 'MA',
  },
  {
    id: 'blindrev008', transactionId: 'txn008', listingId: '62e2d351-6980-405d-ab58-1892b3cbbd88', buyerId: 'user005', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    buyerReview: { rating: 5, comment: 'Amazing trade deal! Mara was honest about condition and very flexible.', quickTags: ['Honest', 'Flexible', 'Great Trade'], conditionMatch: 'yes', submittedAt: '2024-04-04T09:00:00Z' },
    sellerReview: null,
    status: 'awaiting_seller', revealedAt: null,
    listingTitle: '23e4', buyerName: 'Lisa Zhang', buyerInitials: 'LZ', sellerName: 'Mara Mos', sellerInitials: 'MA',
  },
  {
    id: 'blindrev009', transactionId: 'txn009', listingId: 'a45499b9-ae1f-4f86-9a1a-2074a86b4aa6', buyerId: 'user008', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92',
    buyerReview: null, sellerReview: null,
    status: 'awaiting_both', revealedAt: null,
    listingTitle: 'ijojiji', buyerName: 'Thomas Kelly', buyerInitials: 'TK', sellerName: 'Mara Mos', sellerInitials: 'MA',
  },
];
