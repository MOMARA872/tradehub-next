export interface DisputeTimelineEntry {
  action: string;
  by: string;
  at: string;
  note: string;
}

export interface Dispute {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  blindReviewId: string | null;
  listedCondition: string;
  claimedCondition: string;
  reason: string;
  evidencePhotos: string[];
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  adminNotes: string;
  timeline: DisputeTimelineEntry[];
}

export const DISPUTES: Dispute[] = [
  {
    id: 'dispute001', listingId: 'listing016', buyerId: 'user001', sellerId: 'user003', blindReviewId: 'blindrev005',
    listedCondition: 'good', claimedCondition: 'used',
    reason: 'Thread tension mechanism requires repair. Several scratches on the body not shown in photos. Bobbin case rattles.',
    evidencePhotos: ['https://placehold.co/400x300/1E2330/EF4444?text=Evidence+1', 'https://placehold.co/400x300/1E2330/EF4444?text=Evidence+2'],
    status: 'under_review', resolution: null, createdAt: '2024-03-24T20:00:00Z', updatedAt: '2024-03-24T20:00:00Z',
    adminNotes: 'Buyer provided photo evidence. Awaiting seller response.',
    timeline: [
      { action: 'opened', by: 'user001', at: '2024-03-24T20:00:00Z', note: 'Dispute filed: condition listed as Good but appears Used' },
      { action: 'evidence_submitted', by: 'user001', at: '2024-03-24T20:05:00Z', note: '2 photos uploaded showing scratches and bobbin issues' },
      { action: 'seller_notified', by: 'system', at: '2024-03-24T20:10:00Z', note: 'Seller Emma Wilson notified via message' },
    ],
  },
  {
    id: 'dispute002', listingId: 'listing007', buyerId: 'user005', sellerId: 'user002', blindReviewId: null,
    listedCondition: 'good', claimedCondition: 'old',
    reason: 'Frame has a crack near the bottom bracket that was not disclosed. Brakes need replacement, not just adjustment as stated.',
    evidencePhotos: ['https://placehold.co/400x300/1E2330/EF4444?text=Frame+Crack'],
    status: 'resolved_partial_refund', resolution: 'Partial refund of $50 agreed upon. Seller acknowledged undisclosed frame issue.',
    createdAt: '2024-03-20T12:00:00Z', updatedAt: '2024-03-22T14:00:00Z',
    adminNotes: 'Resolved via mutual agreement.',
    timeline: [
      { action: 'opened', by: 'user005', at: '2024-03-20T12:00:00Z', note: 'Dispute filed: bike frame has undisclosed crack' },
      { action: 'seller_responded', by: 'user002', at: '2024-03-21T09:00:00Z', note: 'Seller offered $50 partial refund' },
      { action: 'resolved', by: 'system', at: '2024-03-22T14:00:00Z', note: 'Buyer accepted partial refund of $50' },
    ],
  },
  {
    id: 'dispute003', listingId: 'listing019', buyerId: 'user007', sellerId: 'user007', blindReviewId: null,
    listedCondition: 'good', claimedCondition: 'good',
    reason: 'Some books have water damage on pages that was not mentioned in the listing.',
    evidencePhotos: [],
    status: 'dismissed', resolution: 'Dismissed — buyer acknowledged damage was minor and within normal vintage range.',
    createdAt: '2024-03-19T08:00:00Z', updatedAt: '2024-03-19T15:00:00Z',
    adminNotes: 'Buyer withdrew dispute after further inspection.',
    timeline: [
      { action: 'opened', by: 'user007', at: '2024-03-19T08:00:00Z', note: 'Dispute filed about water damage' },
      { action: 'dismissed', by: 'user007', at: '2024-03-19T15:00:00Z', note: 'Buyer withdrew — damage was minor' },
    ],
  },
];
