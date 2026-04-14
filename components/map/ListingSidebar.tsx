"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { PriceBadge } from "@/components/listing/PriceBadge";
import { CONDITIONS } from "@/lib/data/conditions";
import { truncate } from "@/lib/helpers/format";
import { MapPin } from "lucide-react";

interface ListingSidebarProps {
  listings: Listing[];
  hoveredId: string | null;
  onCardHover: (id: string | null) => void;
}

export function ListingSidebar({
  listings,
  hoveredId,
  onCardHover,
}: ListingSidebarProps) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!hoveredId) return;
    const el = refs.current.get(hoveredId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hoveredId]);

  if (listings.length === 0) {
    return (
      <div className="p-6 text-center text-muted text-sm">
        No listings in this area. Try panning the map or picking a different
        region.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-[10px] font-medium text-subtle uppercase tracking-wider px-1">
        {listings.length} listing{listings.length !== 1 ? "s" : ""} nearby
      </p>
      {listings.map((listing) => {
        const highlighted = listing.id === hoveredId;
        const photo = listing.photos[0] || null;
        return (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            ref={(el) => {
              if (el) refs.current.set(listing.id, el as unknown as HTMLDivElement);
              else refs.current.delete(listing.id);
            }}
            onMouseEnter={() => onCardHover(listing.id)}
            onMouseLeave={() => onCardHover(null)}
            className={`flex gap-3 p-2 rounded-[var(--radius-md)] transition-all hover:bg-surface3 ${
              highlighted
                ? "ring-2 ring-brand bg-surface3"
                : "ring-0"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface3 flex-shrink-0">
              {photo ? (
                <Image
                  src={photo}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-subtle text-[9px] text-center leading-tight px-1">
                    {truncate(listing.title, 20)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="font-semibold text-foreground text-xs leading-tight mb-1 truncate">
                {truncate(listing.title, 28)}
              </h3>
              <p className="text-[10px] text-muted mb-1.5 truncate">{listing.subcategory}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <PriceBadge price={listing.price} priceType={listing.priceType} />
                  {CONDITIONS[listing.condition] && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CONDITIONS[listing.condition].color }}
                      title={CONDITIONS[listing.condition].label}
                    />
                  )}
                </div>
                <span className="flex items-center gap-0.5 text-[10px] text-subtle truncate">
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                  {listing.city}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
