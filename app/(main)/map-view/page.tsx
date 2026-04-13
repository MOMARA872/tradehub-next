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
import { searchAddress, type GeocodeResult } from "@/lib/helpers/geocoding";
import { MapPin, Loader2, Search, X } from "lucide-react";

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

  // Location search — fly to any place, not just the 5 region chips.
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<GeocodeResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const found = await searchAddress(locationQuery, controller.signal);
        setLocationResults(found);
        setLocationOpen(true);
      } catch {
        // Abort or network error — ignore
      } finally {
        setLocationSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [locationQuery]);

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

  // Fly-to target from the location search box.
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  function handleLocationSelect(result: GeocodeResult) {
    // Determine zoom: city/town → 11 (local), state/admin → 7 (state), else 13 (street).
    const zoom = result.type === "administrative" || result.type === "city" || result.type === "town"
      ? 11
      : 13;
    setMapFlyTo({ lat: result.lat, lng: result.lng, zoom });
    setLocationQuery(result.displayName.split(",")[0]);
    setLocationResults([]);
    setLocationOpen(false);
  }

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

      {/* Location search — jump to any area */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          onFocus={() => locationResults.length > 0 && setLocationOpen(true)}
          placeholder="Search a city, address, or area..."
          className="w-full pl-9 pr-9 py-2 rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
        {locationSearching ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
        ) : locationQuery ? (
          <button
            onClick={() => { setLocationQuery(""); setLocationResults([]); setLocationOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {locationOpen && locationResults.length > 0 && (
          <ul className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-card border border-border rounded-[var(--radius-md)] shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {locationResults.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => handleLocationSelect(r)}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface3 flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                  <span className="leading-snug">{r.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
            flyTo={mapFlyTo}
            onRegionClick={(regionId) => setRegion(regionId)}
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
