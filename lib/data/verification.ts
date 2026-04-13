export interface VerificationLevel {
  label: string;
  icon: string;
  color: string;
  weight: number;
}

export const VERIFICATION_LEVELS: Record<string, VerificationLevel> = {
  phone: { label: 'Phone Verified', icon: 'Phone', color: '#3B82F6', weight: 20 },
  email: { label: 'Email Verified', icon: 'Mail', color: '#8B5CF6', weight: 15 },
  id: { label: 'ID Verified', icon: 'IdCard', color: '#10B981', weight: 30 },
  address: { label: 'Address Verified', icon: 'MapPin', color: '#F59E0B', weight: 20 },
  social: { label: 'Social Linked', icon: 'Link', color: '#EC4899', weight: 15 },
};

export interface VerificationRequest {
  id: string;
  userId: string;
  verifications: string[];
  status: string;
  verifiedAt: string | null;
  badgeLevel: 'platinum' | 'gold' | 'silver' | 'bronze';
}

export const VERIFICATION_REQUESTS: VerificationRequest[] = [
  { id: 'vreq001', userId: 'user001', verifications: ['phone', 'email', 'id', 'address'], status: 'verified', verifiedAt: '2023-07-01', badgeLevel: 'gold' },
  { id: 'vreq002', userId: 'user002', verifications: ['phone', 'email', 'id'], status: 'verified', verifiedAt: '2023-09-15', badgeLevel: 'gold' },
  { id: 'vreq003', userId: 'user003', verifications: ['phone'], status: 'partial', verifiedAt: null, badgeLevel: 'bronze' },
  { id: 'vreq004', userId: 'user004', verifications: ['phone', 'email', 'id', 'address', 'social'], status: 'verified', verifiedAt: '2023-01-15', badgeLevel: 'platinum' },
  { id: 'vreq005', userId: 'user005', verifications: ['phone', 'email', 'id'], status: 'verified', verifiedAt: '2023-06-01', badgeLevel: 'gold' },
  { id: 'vreq006', userId: 'user006', verifications: ['phone', 'email'], status: 'partial', verifiedAt: null, badgeLevel: 'silver' },
  { id: 'vreq007', userId: 'user007', verifications: ['phone', 'email', 'id'], status: 'verified', verifiedAt: '2023-10-20', badgeLevel: 'gold' },
  { id: 'vreq008', userId: 'user008', verifications: ['phone'], status: 'partial', verifiedAt: null, badgeLevel: 'bronze' },
];
