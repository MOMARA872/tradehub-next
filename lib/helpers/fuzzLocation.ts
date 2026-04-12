// Deterministic per-listing jitter for the buyer-facing map.
//
// We store EXACT coordinates server-side (the pin the seller dropped), but on
// the public map we display a fuzzed point so buyers see an approximate area,
// not the seller's front door. Seeding the RNG with the listing id keeps the
// fuzzed point STABLE across re-renders — pins don't jiggle every render, they
// just land somewhere plausible.

function hashString(s: string): number {
  // xmur3 hash — small, fast, good enough for seeding.
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Offset (lat, lng) by 300–800 m in a random direction, deterministically
 * seeded by `seedId` (use the listing id).
 */
export function fuzzCoord(
  lat: number,
  lng: number,
  seedId: string,
): { lat: number; lng: number } {
  const rand = mulberry32(hashString(seedId));
  const radiusMeters = 300 + rand() * 500; // 300-800 m
  const angle = rand() * Math.PI * 2;

  const dLat = (radiusMeters / METERS_PER_DEGREE_LAT) * Math.cos(angle);
  // Longitude degrees shrink as you move away from the equator.
  const dLng =
    (radiusMeters / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180))) *
    Math.sin(angle);

  return { lat: lat + dLat, lng: lng + dLng };
}
