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
];
