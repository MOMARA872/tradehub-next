import { CONDITIONS } from '@/lib/data/conditions';
import type { ConditionKey } from '@/lib/types';
import { Sparkles, Star, ThumbsUp, RefreshCw, Clock, type LucideIcon } from 'lucide-react';

const CONDITION_ICONS: Record<string, LucideIcon> = {
  Sparkles, Star, ThumbsUp, RefreshCw, Clock,
};

export function ConditionBadge({ condition }: { condition: ConditionKey }) {
  const cond = CONDITIONS[condition];
  if (!cond) return null;

  const Icon = CONDITION_ICONS[cond.emoji];

  return (
    <span
      className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
      style={{ backgroundColor: cond.color }}
      title={cond.description}
    >
      {Icon && <Icon className="h-3 w-3" />} {cond.badgeText}
    </span>
  );
}
