import type { Condition, ConditionKey } from '@/lib/types';

export const CONDITIONS: Record<ConditionKey, Condition> = {
  new: {
    label: 'New',
    emoji: '✨',
    color: '#10B981',
    description: 'Brand new, never used',
    badgeText: 'NEW',
  },
  likenew: {
    label: 'Like New',
    emoji: '⭐',
    color: '#3B82F6',
    description: 'Used once or twice, looks brand new',
    badgeText: 'LIKE NEW',
  },
  good: {
    label: 'Good',
    emoji: '👍',
    color: '#8B5CF6',
    description: 'Some signs of use but fully functional',
    badgeText: 'GOOD',
  },
  used: {
    label: 'Used',
    emoji: '🔄',
    color: '#F59E0B',
    description: 'Well-used but still works great',
    badgeText: 'USED',
  },
  old: {
    label: 'Old',
    emoji: '⏰',
    color: '#EF4444',
    description: 'Vintage or antique condition',
    badgeText: 'OLD',
  },
};
