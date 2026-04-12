"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, Loader2, MapPin } from "lucide-react";
import {
  searchAddress,
  reverseGeocode,
  type GeocodeResult,
} from "@/lib/helpers/geocoding";

// Default Leaflet marker icons don't resolve correctly in bundlers.
// Pointing directly at the CDN matches the pattern used in ListingMap.tsx.
const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
  /** Map center used before the seller picks anything. Defaults to Prescott, AZ. */
  initialCenter?: { lat: number; lng: number };
}

// Arizona-centered default so the mini-map doesn't start in the middle of the ocean.
const DEFAULT_CENTER = { lat: 34.54, lng: -112.4685 };
const DEBOUNCE_MS = 350;

export function LocationPicker({
  value,
  onChange,
  initialCenter = DEFAULT_CENTER,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounce + abort on each keystroke so typeahead doesn't spam the API.
  useEffect(() => {
    if (!query.trim() || query === value?.address) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchAddress(query, controller.signal);
        setResults(found);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value?.address]);

  // Leaflet mini-map setup.
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start = value ?? initialCenter;
    const map = L.map(containerRef.current, {
      center: [start.lat, start.lng],
      zoom: value ? 15 : 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    if (value) {
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current.on("dragend", handleMarkerDragEnd);
    }

    // Click anywhere on the map to drop / move the pin.
    map.on("click", (e: L.LeafletMouseEvent) => {
      setPinFromLatLng(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intentionally run once — subsequent updates go through setPinFromLatLng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When value changes from the outside (e.g., picking a suggestion), fly the
  // map there and make sure the marker reflects it.
  useEffect(() => {
    if (!mapRef.current || !value) return;
    mapRef.current.flyTo([value.lat, value.lng], 15, { duration: 0.6 });

    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(mapRef.current);
      markerRef.current.on("dragend", handleMarkerDragEnd);
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  async function handleMarkerDragEnd() {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    await setPinFromLatLng(lat, lng);
  }

  async function setPinFromLatLng(lat: number, lng: number) {
    // Ensure the marker exists and sits at the clicked spot.
    if (!mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(mapRef.current);
      markerRef.current.on("dragend", handleMarkerDragEnd);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    // Optimistic update — show coords immediately, fill address when ready.
    const provisional: PickedLocation = {
      lat,
      lng,
      address: value?.address ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    onChange(provisional);
    setQuery(provisional.address);

    try {
      const found = await reverseGeocode(lat, lng);
      if (found[0]) {
        const next: PickedLocation = {
          lat,
          lng,
          address: found[0].displayName,
        };
        onChange(next);
        setQuery(next.address);
      }
    } catch {
      // Keep the provisional value — the drag still set real coords.
    }
  }

  function handleSuggestionClick(result: GeocodeResult) {
    onChange({
      lat: result.lat,
      lng: result.lng,
      address: result.displayName,
    });
    setQuery(result.displayName);
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {/* Typeahead input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search an address..."
            className="w-full pl-9 pr-9 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
          />
          {searching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-card border border-border rounded-[var(--radius-md)] shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(r)}
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

      {/* Mini preview map */}
      <div
        ref={containerRef}
        className="h-[280px] w-full rounded-[var(--radius-md)] border border-border overflow-hidden"
      />

      {value && (
        <p className="text-xs text-subtle flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Pin set. Drag it or click the map to fine-tune.
        </p>
      )}
    </div>
  );
}
