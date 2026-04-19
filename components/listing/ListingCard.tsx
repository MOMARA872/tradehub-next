import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConditionBadge } from './ConditionBadge';
import { PriceBadge } from './PriceBadge';
import { truncate } from '@/lib/helpers/format';
import type { Listing, User } from '@/lib/types';
import { MapPin } from 'lucide-react';

function ListingCard({ listing }: { listing: Listing }) {
  const user = null as (User | null); // TODO: fetch from Supabase
  const photo = listing.photos[0] || null;

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface3">
          {photo ? (
            <Image
              src={photo}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full px-3">
              <span className="text-muted text-xs font-medium text-center leading-tight">{listing.title}</span>
            </div>
          )}
          <ConditionBadge condition={listing.condition} />
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground text-sm leading-tight mb-1">
            {truncate(listing.title, 40)}
          </h3>
          <p className="text-xs text-muted mb-3">{listing.subcategory}</p>
          <div className="flex items-center justify-between">
            <PriceBadge price={listing.price} priceType={listing.priceType} />
            <span className="flex items-center gap-0.5 text-xs text-subtle"><MapPin className="h-3 w-3" /> {listing.city}</span>
          </div>
          {user && (
            <p className="text-xs text-subtle mt-2">By {user.displayName}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

const ListingCardMemo = React.memo(ListingCard);
export { ListingCardMemo as ListingCard };
export default ListingCardMemo;
