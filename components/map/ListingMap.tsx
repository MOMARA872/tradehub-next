"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing, Region } from "@/lib/types";
import { fuzzCoord } from "@/lib/helpers/fuzzLocation";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ListingMapProps {
  listings: Listing[];
  selectedRegion: Region;
  hoveredId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerClick?: (id: string) => void;
}

function formatPriceTag(listing: Listing): string {
  if (listing.priceType === "free") return "Free";
  if (listing.priceType === "trade") return "Trade";
  if (listing.price >= 1000) return `$${(listing.price / 1000).toFixed(1)}k`;
  return `$${Math.round(listing.price)}`;
}

function makeDivIcon(priceTag: string, highlighted: boolean): L.DivIcon {
  // FB Marketplace-style price label pin.
  const bg = highlighted ? "#22c55e" : "#ffffff";
  const color = highlighted ? "#ffffff" : "#0f172a";
  const border = highlighted ? "#16a34a" : "#0f172a";
  const scale = highlighted ? "scale(1.15)" : "scale(1)";
  const shadow = highlighted
    ? "0 4px 12px rgba(34,197,94,0.5)"
    : "0 2px 6px rgba(0,0,0,0.25)";

  const html = `
    <div style="
      transform: ${scale};
      transition: transform 120ms ease, box-shadow 120ms ease;
      background: ${bg};
      color: ${color};
      border: 1.5px solid ${border};
      border-radius: 999px;
      padding: 3px 10px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: ${shadow};
    ">${priceTag}</div>
  `;

  return L.divIcon({
    html,
    className: "tradehub-price-pin",
    iconSize: [0, 0], // divIcon sizes from CSS
    iconAnchor: [20, 12],
  });
}

export function ListingMap({
  listings,
  selectedRegion,
  hoveredId,
  onMarkerHover,
  onBoundsChange,
  onMarkerClick,
}: ListingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const boundsChangeRef = useRef(onBoundsChange);
  const markerHoverRef = useRef(onMarkerHover);
  const markerClickRef = useRef(onMarkerClick);

  // Keep latest callbacks reachable from inside map event handlers
  // (so we don't have to re-bind every render).
  useEffect(() => {
    boundsChangeRef.current = onBoundsChange;
    markerHoverRef.current = onMarkerHover;
    markerClickRef.current = onMarkerClick;
  }, [onBoundsChange, onMarkerHover, onMarkerClick]);

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [selectedRegion.lat, selectedRegion.lng],
      zoom: selectedRegion.id === "all" ? 7 : 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Debounced viewport emission.
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const emitBounds = () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        const b = map.getBounds();
        boundsChangeRef.current?.({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      }, 200);
    };
    map.on("moveend", emitBounds);

    // Emit the initial viewport so the parent can do a first query if it wants.
    emitBounds();

    return () => {
      if (moveTimer) clearTimeout(moveTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      markerByIdRef.current.clear();
    };
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to the selected region when it changes.
  useEffect(() => {
    if (!mapRef.current) return;
    const zoom = selectedRegion.id === "all" ? 7 : 11;
    mapRef.current.flyTo([selectedRegion.lat, selectedRegion.lng], zoom, {
      duration: 0.8,
    });
  }, [selectedRegion]);

  // Rebuild markers whenever the listings change.
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();
    markerByIdRef.current.clear();

    for (const listing of listings) {
      if (listing.lat == null || listing.lng == null) continue;

      const { lat, lng } = fuzzCoord(listing.lat, listing.lng, listing.id);
      const marker = L.marker([lat, lng], {
        icon: makeDivIcon(formatPriceTag(listing), listing.id === hoveredId),
        riseOnHover: true,
      });

      marker.on("mouseover", () => markerHoverRef.current?.(listing.id));
      marker.on("mouseout", () => markerHoverRef.current?.(null));
      marker.on("click", () => markerClickRef.current?.(listing.id));

      marker.addTo(markersRef.current!);
      markerByIdRef.current.set(listing.id, marker);
    }
    // hoveredId intentionally not in deps — the separate effect below handles it
    // so we don't rebuild every marker on hover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings]);

  // When hoveredId changes, swap just the affected markers' icons.
  useEffect(() => {
    for (const [id, marker] of markerByIdRef.current.entries()) {
      const listing = listings.find((l) => l.id === id);
      if (!listing) continue;
      marker.setIcon(
        makeDivIcon(formatPriceTag(listing), id === hoveredId),
      );
    }
  }, [hoveredId, listings]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[500px] rounded-[var(--radius-md)] border border-border overflow-hidden"
    />
  );
}
