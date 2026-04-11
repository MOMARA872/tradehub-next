"use client";

import { REGIONS } from "@/lib/data/regions";
import type { Listing } from "@/lib/types";

const LISTINGS: Listing[] = [];
import { ListingCard } from "@/components/listing/ListingCard";
import { useRegionStore } from "@/store/regionStore";
import { EmptyState } from "@/components/common/EmptyState";
import { MapPin } from "lucide-react";

export default function MapViewPage() {
  const { selectedRegion, setRegion } = useRegionStore();

  const filteredListings =
    selectedRegion.id === "all"
      ? LISTINGS
      : LISTINGS.filter((l) => l.city === selectedRegion.name);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-7 w-7 text-brand" />
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Map View
          </h1>
        </div>
        <p className="text-sm text-muted">
          Discover listings near you
        </p>
      </div>

      {/* Map Placeholder */}
      <div className="h-[500px] bg-surface2 rounded-[var(--radius-md)] flex flex-col items-center justify-center mb-10 border border-border">
        <div className="text-6xl mb-4">&#x1F5FA;&#xFE0F;</div>
        <p className="text-muted text-sm font-medium">
          Interactive map coming soon. Browse listings below.
        </p>
      </div>

      {/* Region Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => setRegion(region.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
              selectedRegion.id === region.id
                ? "bg-brand text-white border-brand"
                : "bg-card text-muted border-border hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>

      {/* Listing Count */}
      <p className="text-xs text-subtle mb-4">
        Showing {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}{" "}
        {selectedRegion.id !== "all" ? `in ${selectedRegion.name}` : "across all regions"}
      </p>

      {/* Listing Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          message={`No listings found in ${selectedRegion.name}.`}
          icon="&#x1F4CD;"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
