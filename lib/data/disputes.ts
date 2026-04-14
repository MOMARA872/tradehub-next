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
  {
    id: 'dispute004', listingId: 'a45499b9-ae1f-4f86-9a1a-2074a86b4aa6', buyerId: 'user005', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', blindReviewId: null,
    listedCondition: 'good', claimedCondition: 'used',
    reason: 'Item has noticeable wear marks on the surface that were not mentioned in the listing. One corner is chipped.',
    evidencePhotos: ['https://placehold.co/400x300/1E2330/EF4444?text=Wear+Marks', 'https://placehold.co/400x300/1E2330/EF4444?text=Chipped+Corner'],
    status: 'under_review', resolution: null, createdAt: '2024-04-10T14:30:00Z', updatedAt: '2024-04-10T14:30:00Z',
    adminNotes: 'Buyer submitted 2 photos as evidence. Awaiting seller response.',
    timeline: [
      { action: 'opened', by: 'user005', at: '2024-04-10T14:30:00Z', note: 'Dispute filed: condition listed as Good but shows significant wear' },
      { action: 'evidence_submitted', by: 'user005', at: '2024-04-10T14:35:00Z', note: '2 photos uploaded showing wear marks and chipped corner' },
      { action: 'seller_notified', by: 'system', at: '2024-04-10T14:40:00Z', note: 'Seller Mara Mos notified via message' },
    ],
  },
  {
    id: 'dispute005', listingId: 'e1b4c75f-0071-45a8-a6d8-56620b8b5921', buyerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', sellerId: 'user003', blindReviewId: null,
    listedCondition: 'likenew', claimedCondition: 'good',
    reason: 'Item was listed as Like New but has visible scratches on the front panel and a small dent near the bottom edge.',
    evidencePhotos: ['https://placehold.co/400x300/1E2330/EF4444?text=Scratches', 'https://placehold.co/400x300/1E2330/EF4444?text=Dent'],
    status: 'resolved_full_refund', resolution: 'Full refund issued. Seller agreed the item was misrepresented.',
    createdAt: '2024-04-05T10:00:00Z', updatedAt: '2024-04-07T16:00:00Z',
    adminNotes: 'Clear evidence of condition mismatch. Seller cooperative.',
    timeline: [
      { action: 'opened', by: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', at: '2024-04-05T10:00:00Z', note: 'Dispute filed: item listed as Like New but has scratches and dent' },
      { action: 'evidence_submitted', by: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', at: '2024-04-05T10:10:00Z', note: '2 photos uploaded showing scratches and dent' },
      { action: 'seller_responded', by: 'user003', at: '2024-04-06T09:00:00Z', note: 'Seller acknowledged the damage and agreed to full refund' },
      { action: 'resolved', by: 'system', at: '2024-04-07T16:00:00Z', note: 'Full refund processed' },
    ],
  },
  {
    id: 'dispute006', listingId: 'bdabd210-6ae5-4994-8aa8-146c18aa9a60', buyerId: 'user008', sellerId: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', blindReviewId: null,
    listedCondition: 'good', claimedCondition: 'good',
    reason: 'Buyer claims item was not as described in the photos. Color appears different in person.',
    evidencePhotos: ['https://placehold.co/400x300/1E2330/EF4444?text=Color+Difference'],
    status: 'dismissed', resolution: 'Dismissed — color variance is within normal range due to screen differences. No condition mismatch found.',
    createdAt: '2024-04-02T18:00:00Z', updatedAt: '2024-04-03T11:00:00Z',
    adminNotes: 'Color difference attributed to monitor calibration. No actionable issue.',
    timeline: [
      { action: 'opened', by: 'user008', at: '2024-04-02T18:00:00Z', note: 'Dispute filed: color looks different than in photos' },
      { action: 'seller_responded', by: 'a8edc1be-8a7d-4116-88fd-571d7aae6e92', at: '2024-04-03T08:00:00Z', note: 'Seller explained color may vary due to lighting and screen settings' },
      { action: 'dismissed', by: 'system', at: '2024-04-03T11:00:00Z', note: 'Dispute dismissed — no condition mismatch found' },
    ],
  },
];
