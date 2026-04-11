import { CONDITIONS } from '@/lib/data/conditions';
import type { ConditionKey } from '@/lib/types';

export function ConditionBadge({ condition }: { condition: ConditionKey }) {
  const cond = CONDITIONS[condition];
  if (!cond) return null;

  return (
    <span
      className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
      style={{ backgroundColor: cond.color }}
      title={cond.description}
    >
      {cond.emoji} {cond.badgeText}
    </span>
  );
}
