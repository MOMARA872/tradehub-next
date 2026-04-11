import type { PriceType } from '@/lib/types';

export function PriceBadge({ price, priceType }: { price: number; priceType: PriceType }) {
  if (priceType === 'free') {
    return <span className="text-sm font-bold text-success">FREE</span>;
  }
  if (priceType === 'trade') {
    return <span className="text-sm font-bold text-purple">TRADE</span>;
  }
  return <span className="text-sm font-bold text-foreground">${price}</span>;
}
