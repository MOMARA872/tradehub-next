"use client";

import { useEffect, useRef } from "react";
import type { Listing } from "@/lib/types";
import { ListingCard } from "@/components/listing/ListingCard";

interface ListingSidebarProps {
  listings: Listing[];
  hoveredId: string | null;
  onCardHover: (id: string | null) => void;
}

// Sidebar of ListingCards synced with the map.
//
// ListingCard is memoized and takes only `listing`, so we wrap each card in a
// div here that handles hover and highlight styling — we don't touch the card
// component itself.
export function ListingSidebar({
  listings,
  hoveredId,
  onCardHover,
}: ListingSidebarProps) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  // When the user hovers a pin on the map, scroll the matching card into view.
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
    <div className="flex flex-col gap-4 p-4">
      {listings.map((listing) => {
        const highlighted = listing.id === hoveredId;
        return (
          <div
            key={listing.id}
            ref={(el) => {
              if (el) refs.current.set(listing.id, el);
              else refs.current.delete(listing.id);
            }}
            onMouseEnter={() => onCardHover(listing.id)}
            onMouseLeave={() => onCardHover(null)}
            className={`rounded-[var(--radius-md)] transition-shadow ${
              highlighted
                ? "ring-2 ring-brand shadow-lg"
                : "ring-0"
            }`}
          >
            <ListingCard listing={listing} />
          </div>
        );
      })}
    </div>
  );
}
