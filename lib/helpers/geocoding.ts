// Client wrapper around /api/geocode (which proxies to Nominatim).
//
// Both functions accept an AbortSignal so callers can cancel in-flight
// requests on each keystroke (see LocationPicker typeahead).

export interface GeocodeResult {
  id: number;
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

interface GeocodeResponse {
  results: GeocodeResult[];
  error?: string;
}

async function call(url: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Geocode request failed: ${res.status}`);
  }
  const body = (await res.json()) as GeocodeResponse;
  if (body.error) throw new Error(body.error);
  return body.results ?? [];
}

export function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return Promise.resolve([]);
  return call(`/api/geocode?q=${encodeURIComponent(trimmed)}`, signal);
}

export function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  return call(`/api/geocode?lat=${lat}&lng=${lng}`, signal);
}
