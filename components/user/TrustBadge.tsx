export function TrustBadge({ score }: { score: number }) {
  let emoji = '🟢';
  let label = 'Trusted';

  if (score >= 90) { emoji = '🟢'; label = 'Highly Trusted'; }
  else if (score >= 75) { emoji = '🟡'; label = 'Trusted'; }
  else if (score >= 50) { emoji = '🟠'; label = 'New Member'; }
  else { emoji = '🔴'; label = 'Limited Trust'; }

  return (
    <span className="text-xs opacity-75" title={`Trust Score: ${score}%`}>
      {emoji} {label}
    </span>
  );
}
