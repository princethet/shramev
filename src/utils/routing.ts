import { calculateDistance } from './geo';

export interface RouteResult {
  coordinates: [number, number][]; // [latitude, longitude] array for Leaflet
  distanceKm: number;
  durationMinutes: number;
  source: 'OSRM_API' | 'FALLBACK_INTERPOLATION';
}

/**
 * Generates intermediate road-like interpolated waypoints between two GPS coordinates
 * if OSRM is offline or rate-limited.
 */
export function generateInterpolatedPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 24
): [number, number][] {
  const points: [number, number][] = [];
  
  // Perpendicular vector for realistic rural road curve perturbation
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;
  const perpLat = -dLng * 0.15;
  const perpLng = dLat * 0.15;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Base linear position
    let lat = startLat + dLat * t;
    let lng = startLng + dLng * t;

    // Add gentle sinusoidal road curve wave
    const wave = Math.sin(t * Math.PI) * Math.cos(t * Math.PI * 2);
    lat += perpLat * wave;
    lng += perpLng * wave;

    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  return points;
}

/**
 * Calculates a point along a coordinate route given a progress ratio (0.0 to 1.0)
 */
export function getPositionAlongRoute(
  coordinates: [number, number][],
  progress: number
): { lat: number; lng: number; index: number } {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 0, lng: 0, index: 0 };
  }
  if (coordinates.length === 1 || progress <= 0) {
    return { lat: coordinates[0][0], lng: coordinates[0][1], index: 0 };
  }
  if (progress >= 1) {
    const last = coordinates[coordinates.length - 1];
    return { lat: last[0], lng: last[1], index: coordinates.length - 1 };
  }

  const totalSegments = coordinates.length - 1;
  const scaledIndex = progress * totalSegments;
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(lowerIndex + 1, totalSegments);
  const segmentT = scaledIndex - lowerIndex;

  const p1 = coordinates[lowerIndex];
  const p2 = coordinates[upperIndex];

  const lat = p1[0] + (p2[0] - p1[0]) * segmentT;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentT;

  return { lat, lng, index: lowerIndex };
}

/**
 * Fetches driving routing path from OpenStreetMap OSRM public API with resilient fallback
 */
export async function fetchOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult> {
  // Direct distance as baseline reference
  const directDistance = calculateDistance(startLat, startLng, endLat, endLng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // OSRM format: {startLng},{startLat};{endLng},{endLat}
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // GeoJSON gives [lng, lat], convert to Leaflet [lat, lng]
        const leafCoords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const distanceKm = Number((route.distance / 1000).toFixed(2));
        // Average rural Indian road travel time (mins)
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        return {
          coordinates: leafCoords,
          distanceKm: distanceKm > 0 ? distanceKm : directDistance,
          durationMinutes: durationMinutes,
          source: 'OSRM_API'
        };
      }
    }
  } catch (err) {
    // Network failure, rate limit, or timeout -> seamlessly proceed to fallback
    console.info('OSRM public router unreachable, activating rural road route interpolator:', err);
  }

  // Realistic fallback with curved road coordinates
  const fallbackCoords = generateInterpolatedPath(startLat, startLng, endLat, endLng, 24);
  const roadAdjustedDistance = Number((directDistance * 1.22).toFixed(2));
  // Rural speed ~22 km/h average
  const fallbackDuration = Math.max(2, Math.round((roadAdjustedDistance / 22) * 60));

  return {
    coordinates: fallbackCoords,
    distanceKm: roadAdjustedDistance,
    durationMinutes: fallbackDuration,
    source: 'FALLBACK_INTERPOLATION'
  };
}
