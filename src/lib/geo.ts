// Lightweight geo helpers for the Emergency Live Map feature.
// No external mapping/geocoding API is used — everything here is pure math
// on top of free OpenStreetMap tiles rendered via Leaflet.

export type LatLng = { lat: number; lng: number };

/** Distance between two coordinates in kilometers (Haversine formula). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/** Returns the nearest hospital to a given point from a list of hospitals. */
export function nearestHospital<T extends LatLng>(
  point: LatLng,
  hospitals: T[]
): T | null {
  if (!hospitals.length) return null;
  let best = hospitals[0];
  let bestDist = distanceKm(point, best);
  for (const h of hospitals.slice(1)) {
    const d = distanceKm(point, h);
    if (d < bestDist) {
      best = h;
      bestDist = d;
    }
  }
  return best;
}

/**
 * SIMULATED TRACKING ONLY.
 * Interpolates a position along a multi-point path (e.g. base -> incident -> hospital)
 * based on elapsed real time since a reference timestamp. This is a demo/visual
 * simulation, not live GPS — used to animate ambulance markers on the map so the
 * coordination workflow feels "live" without requiring real device tracking.
 */
export function simulatedPositionAlongPath(
  path: LatLng[],
  elapsedMs: number,
  totalTravelMs: number
): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (path.length === 1) return path[0];

  const progress = Math.max(0, Math.min(1, elapsedMs / totalTravelMs));
  const segments = path.length - 1;
  const segmentProgress = progress * segments;
  const segmentIndex = Math.min(segments - 1, Math.floor(segmentProgress));
  const localT = segmentProgress - segmentIndex;

  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];

  return {
    lat: start.lat + (end.lat - start.lat) * localT,
    lng: start.lng + (end.lng - start.lng) * localT,
  };
}
