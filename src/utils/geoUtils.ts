/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LatLng } from '../types/game';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points in kilometers
 * using the Haversine formula.
 */
export function calculateDistanceKm(pos1: LatLng, pos2: LatLng): number {
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const lat1 = (pos1.lat * Math.PI) / 180;
  const lat2 = (pos2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates initial bearing from point A to point B in degrees (0°-360°).
 */
export function calculateBearingDeg(start: LatLng, end: LatLng): number {
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brngRad = Math.atan2(y, x);
  const brngDeg = (brngRad * 180) / Math.PI;

  return (brngDeg + 360) % 360;
}

/**
 * Calculates score from 0 to 5000 based on distance error in km.
 * For Austrian alpine distances:
 * Within 100m => 5000 pts
 * Within 1km => ~4800 pts
 * Within 5km => ~3500 pts
 * Within 15km => ~1800 pts
 * Within 35km => ~300 pts
 */
export function calculateScore(distanceKm: number): number {
  if (distanceKm <= 0.08) return 5000; // Under 80m is perfect
  // Half-score distance is ~7.5km
  const score = Math.round(5000 * Math.exp(-distanceKm / 7.5));
  return Math.max(0, Math.min(5000, score));
}

/**
 * Format distance in human-friendly Austrian cartographic format.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Converts degree heading to 16-point cardinal direction.
 */
export function headingToCardinal(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const points = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return points[index];
}

/**
 * Format lat/lng into cartographic DMS (Degrees Minutes Seconds).
 */
export function formatCoordinates(pos: LatLng): string {
  const formatCoord = (coord: number, isLat: boolean) => {
    const dir = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    const abs = Math.abs(coord);
    const deg = Math.floor(abs);
    const min = Math.floor((abs - deg) * 60);
    const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
    return `${deg}°${min}'${sec}" ${dir}`;
  };
  return `${formatCoord(pos.lat, true)} · ${formatCoord(pos.lng, false)}`;
}
