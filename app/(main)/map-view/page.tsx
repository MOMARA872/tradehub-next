"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { REGIONS } from "@/lib/data/regions";
import { createClient } from "@/lib/supabase/client";
import { dbListingToListing } from "@/lib/types";
import type { Listing } from "@/lib/types";
import { useRegionStore } from "@/store/regionStore";
import { ListingSidebar } from "@/components/map/ListingSidebar";
import type { MapBounds } from "@/components/map/ListingMap";
import { MapPin, Loader2, Search } from "lucide-react";

// Dynamic import — Leaflet touches `window`, so it can't be SSR'd.
const ListingMap = dynamic(
  () => import("@/components/map/ListingMap").then((m) => m.ListingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[500px] bg-surface2 rounded-[var(--radius-md)] flex items-center justify-center border border-border">
        <Loader2 className="h-6 w-6 text-muted animate-spin" />
      </div>
    ),
  },
);

export default function MapViewPage() {
  const { selectedRegion, setRegion } = useRegionStore();
  const supabase = createClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Viewport the user is currently looking at, and a dirty flag so we can
  // show a "Search this area" button when they pan.
  const [viewport, setViewport] = useState<MapBounds | null>(null);
  const [searchAreaDirty, setSearchAreaDirty] = useState(false);

  // Remember the bounds that produced the current `listings`, so we can tell
  // whether the user has moved since the last query.
  const queriedBoundsRef = useRef<MapBounds | null>(null);

  // Fetch listings inside a bounding box.
  const fetchListingsInBounds = useCallback(
    async (bounds: MapBounds) => {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .not("lat", "is", null)
        .gte("lat", bounds.south)
        .lte("lat", bounds.north)
        .gte("lng", bounds.west)
        .lte("lng", bounds.east)
        .order("created_at", { ascending: false })
        .limit(100);

      setListings((data ?? []).map(dbListingToListing));
      queriedBoundsRef.current = bounds;
      setSearchAreaDirty(false);
      setLoading(false);
    },
    [supabase],
  );

  // The map emits the initial viewport on mount — that's when we run the
  // first query.
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      setViewport(bounds);

      if (!queriedBoundsRef.current) {
        // First time — query immediately so the sidebar isn't empty.
        fetchListingsInBounds(bounds);
      } else {
        // User panned: show the "Search this area" button instead of
        // auto-querying on every mouse move.
        setSearchAreaDirty(true);
      }
    },
    [fetchListingsInBounds],
  );

  const handleSearchThisArea = useCallback(() => {
    if (viewport) fetchListingsInBounds(viewport);
  }, [viewport, fetchListingsInBounds]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-7 w-7 text-brand" />
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Map View
          </h1>
        </div>
        <p className="text-sm text-muted">Discover listings near you</p>
      </div>

      {/* Region chip filters — now re-center the map instead of filtering
          by city name. */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Split view: map on the left, sidebar on the right.
          Mobile: stacked. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Map column */}
        <div className="relative h-[400px] lg:h-full">
          <ListingMap
            listings={listings}
            selectedRegion={selectedRegion}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            onBoundsChange={handleBoundsChange}
          />

          {/* Floating "Search this area" button */}
          {searchAreaDirty && (
            <button
              onClick={handleSearchThisArea}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-lg text-sm font-semibold text-foreground hover:bg-surface3 animate-fade-in"
            >
              <Search className="h-4 w-4" />
              Search this area
            </button>
          )}

          {/* Listing count pill */}
          <div className="absolute bottom-4 left-4 z-[500] px-3 py-1.5 bg-card/95 backdrop-blur border border-border rounded-full text-xs text-muted">
            {loading
              ? "Loading..."
              : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="h-[500px] lg:h-full overflow-y-auto bg-card border border-border rounded-[var(--radius-md)]">
          {loading && listings.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 text-muted animate-spin" />
            </div>
          ) : (
            <ListingSidebar
              listings={listings}
              hoveredId={hoveredId}
              onCardHover={setHoveredId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
