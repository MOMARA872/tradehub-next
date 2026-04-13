import { Star } from "lucide-react";

export function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
      ))}
      {hasHalf && (
        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
      )}
      {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted" />
      ))}
    </span>
  );
}
