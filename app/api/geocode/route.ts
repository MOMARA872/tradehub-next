// Server-side proxy to OpenStreetMap Nominatim for address geocoding.
//
// Why a proxy?
//  - Nominatim's usage policy requires a descriptive User-Agent header.
//    Browsers won't let us override navigator.userAgent on client fetches,
//    so we proxy server-side and set it here.
//  - Keeps the Nominatim endpoint out of the client bundle.
//
// Nominatim rate limit: 1 req/sec per IP. Because every TradeHub user shares
// the server's IP, this will become a bottleneck if the site grows. Fix
// later by caching more aggressively, switching providers, or moving the
// fetch client-side.

import { NextRequest } from "next/server";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "TradeHub/1.0 (contact: hello@tradehub.app)";

// Address-like result types — filter out POIs like "Starbucks" so the
// address picker only shows actual places.
const ADDRESS_TYPES = new Set([
  "house",
  "residential",
  "road",
  "city",
  "town",
  "village",
  "suburb",
  "hamlet",
  "neighbourhood",
  "administrative",
]);

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
}

interface TrimmedResult {
  id: number;
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

function trim(results: NominatimResult[]): TrimmedResult[] {
  return results
    .filter((r) => ADDRESS_TYPES.has(r.type))
    .map((r) => ({
      id: r.place_id,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      type: r.type,
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    let url: string;

    if (q) {
      // Forward geocode: address string -> coordinates.
      const params = new URLSearchParams({
        format: "json",
        q,
        limit: "5",
        countrycodes: "us",
        addressdetails: "0",
      });
      url = `${NOMINATIM_BASE}/search?${params}`;
    } else if (lat && lng) {
      // Reverse geocode: coordinates -> address string.
      const params = new URLSearchParams({
        format: "json",
        lat,
        lon: lng,
        zoom: "18",
        addressdetails: "0",
      });
      url = `${NOMINATIM_BASE}/reverse?${params}`;
    } else {
      return Response.json(
        { error: "Provide ?q= or ?lat=&lng=" },
        { status: 400 },
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      // Cache identical queries for an hour — kinder to Nominatim and
      // fine for a search-box typeahead.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Nominatim returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Reverse geocode returns a single object; wrap in array for uniform shape.
    const raw: NominatimResult[] = Array.isArray(data) ? data : [data];
    const results = trim(raw);

    return Response.json({ results });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
