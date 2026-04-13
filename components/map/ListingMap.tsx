"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing, Region } from "@/lib/types";
import { REGIONS } from "@/lib/data/regions";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getRegionForListing(listing: Listing): Region | undefined {
  // Match by city field (handles both region IDs like "prescott-az"
  // and region names like "Prescott, AZ").
  return REGIONS.find(
    (r) =>
      r.id !== "all" &&
      (r.name === listing.city || r.id === listing.city),
  );
}

interface ListingMapProps {
  listings: Listing[];
  selectedRegion: Region;
  flyTo?: { lat: number; lng: number; zoom: number } | null;
  hoveredId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onRegionClick?: (regionId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
}

export function ListingMap({
  listings,
  selectedRegion,
  flyTo,
  onRegionClick,
  onBoundsChange,
}: ListingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const boundsChangeRef = useRef(onBoundsChange);
  const regionClickRef = useRef(onRegionClick);

  useEffect(() => {
    boundsChangeRef.current = onBoundsChange;
    regionClickRef.current = onRegionClick;
  }, [onBoundsChange, onRegionClick]);

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
    emitBounds();

    return () => {
      if (moveTimer) clearTimeout(moveTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to selected region.
  useEffect(() => {
    if (!mapRef.current) return;
    const zoom = selectedRegion.id === "all" ? 7 : 11;
    mapRef.current.flyTo([selectedRegion.lat, selectedRegion.lng], zoom, {
      duration: 0.8,
    });
  }, [selectedRegion]);

  // Ad-hoc fly-to from location search.
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, {
      duration: 0.8,
    });
  }, [flyTo]);

  // Region-level markers with listing counts.
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    // Group listings by region.
    const regionListings = new Map<string, Listing[]>();
    for (const listing of listings) {
      const region = getRegionForListing(listing);
      if (region) {
        const existing = regionListings.get(region.id) || [];
        existing.push(listing);
        regionListings.set(region.id, existing);
      }
    }

    // One marker per region.
    for (const region of REGIONS) {
      if (region.id === "all") continue;

      const regionItems = regionListings.get(region.id) || [];
      const count = regionItems.length;

      const marker = L.marker([region.lat, region.lng], {
        icon: defaultIcon,
      });

      const popupContent = `
        <div style="min-width: 160px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px;">${region.name}</strong>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            ${count} listing${count !== 1 ? "s" : ""} available
          </div>
          ${regionItems
            .slice(0, 3)
            .map(
              (l) =>
                `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee; font-size: 12px;">
                  <div style="font-weight: 500;">${l.title}</div>
                  <div style="color: #888;">${l.priceType === "free" ? "Free" : l.priceType === "trade" ? "Trade only" : "$" + l.price}</div>
                </div>`,
            )
            .join("")}
          ${count > 3 ? `<div style="margin-top: 6px; font-size: 11px; color: #888;">+${count - 3} more</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => regionClickRef.current?.(region.id));
      marker.addTo(markersRef.current!);
    }
  }, [listings]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[500px] rounded-[var(--radius-md)] border border-border overflow-hidden"
    />
  );
}
