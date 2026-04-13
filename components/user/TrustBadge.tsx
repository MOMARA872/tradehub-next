export function TrustBadge({ score }: { score: number }) {
  let dotClass = 'bg-green-500';
  let label = 'Trusted';

  if (score >= 90) { dotClass = 'bg-green-500'; label = 'Highly Trusted'; }
  else if (score >= 75) { dotClass = 'bg-yellow-400'; label = 'Trusted'; }
  else if (score >= 50) { dotClass = 'bg-orange-400'; label = 'New Member'; }
  else { dotClass = 'bg-red-500'; label = 'Limited Trust'; }

  return (
    <span className="inline-flex items-center gap-1 text-xs opacity-75" title={`Trust Score: ${score}%`}>
      <span className={`h-2 w-2 rounded-full ${dotClass} shrink-0`} />
      {label}
    </span>
  );
}
