export function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className="text-sm" title={`${rating.toFixed(1)} out of 5`}>
      {'⭐'.repeat(fullStars)}
      {hasHalf ? '⭐' : ''}
      {'☆'.repeat(Math.max(0, emptyStars))}
    </span>
  );
}
