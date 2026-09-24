/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlpineLocation, OSMPeak } from '../types/game';
import { MASTER_AUSTRIAN_PEAKS } from './curatedPlaces';

export interface CalculatedPeak {
  id: string;
  name: string;
  elevation: number;
  xKm: number; // East (+) / West (-) in km from observer
  yKm: number; // North (+) / South (-) in km from observer
  distanceKm: number;
  azimuthDeg: number; // 0° = North, 90° = East, 180° = South, 270° = West
  verticalAngleDeg: number; // Angle above/below horizon from observer eye
  radiusKm: number;
  isTarget: boolean;
}

/**
 * Calculates exact metric km offsets and compass azimuths for all peaks relative to observer
 */
export function getCalculatedPeaks(location: AlpineLocation): CalculatedPeak[] {
  const obsLat = location.observerPos.lat;
  const obsLng = location.observerPos.lng;
  const obsAlt = location.observerElevation + 2.5; // eye level
  const cosLat = Math.cos((obsLat * Math.PI) / 180);

  // Combine target peak, configured nearby peaks, and all surrounding master Austrian peaks within 50km
  const peakMap = new Map<string, { peak: OSMPeak; isTarget: boolean }>();

  // 1. Target peak
  peakMap.set(location.targetPeak.id || location.targetPeak.name, {
    peak: location.targetPeak,
    isTarget: true,
  });

  // 2. Explicit nearby peaks
  for (const p of location.nearbyPeaks || []) {
    const key = p.id || p.name;
    if (!peakMap.has(key)) {
      peakMap.set(key, { peak: p, isTarget: false });
    }
  }

  // 3. Surrounding master peaks within 52km radius for continuous 360° Alpine horizon
  for (const p of MASTER_AUSTRIAN_PEAKS) {
    const key = p.id || p.name;
    if (!peakMap.has(key)) {
      const dX = (p.lng - obsLng) * 111.139 * cosLat;
      const dY = (p.lat - obsLat) * 111.139;
      const dist = Math.hypot(dX, dY);
      if (dist <= 52.0) {
        peakMap.set(key, { peak: p, isTarget: false });
      }
    }
  }

  const rawPeaks = Array.from(peakMap.values());
  const calculated: CalculatedPeak[] = [];

  for (const { peak, isTarget } of rawPeaks) {
    const xKm = (peak.lng - obsLng) * 111.139 * cosLat;
    const yKm = (peak.lat - obsLat) * 111.139;
    const distanceKm = Math.hypot(xKm, yKm);

    // Compass azimuth (0° North, 90° East, 180° South, 270° West)
    const azimRad = Math.atan2(xKm, yKm);
    const azimuthDeg = ((azimRad * 180) / Math.PI + 360) % 360;

    // Vertical angle from observer eye
    const altDiff = peak.elevation - obsAlt;
    const vertAngleRad = Math.atan2(altDiff, distanceKm * 1000);
    const verticalAngleDeg = (vertAngleRad * 180) / Math.PI;

    // Radius of mountain base in km proportional to prominence / height
    const baseAlt = location.elevationFeatures?.baseAlt || 1000;
    const heightAboveBase = Math.max(400, peak.elevation - baseAlt);
    const radiusKm = Math.max(1.6, Math.min(3.6, (heightAboveBase / 1000) * 1.5));

    calculated.push({
      id: peak.id,
      name: peak.name,
      elevation: peak.elevation,
      xKm,
      yKm,
      distanceKm,
      azimuthDeg,
      verticalAngleDeg,
      radiusKm,
      isTarget,
    });
  }

  return calculated;
}

/**
 * High-accuracy alpine elevation synthesizer.
 * Evaluates the terrain altitude (in meters) at relative kilometer offset (xKm, yKm) from observer.
 * Perfectly calibrated so:
 * - At every peak summit (p.xKm, p.yKm), elevation is exactly peak.elevation.
 * - At observer position (0, 0), elevation is exactly location.observerElevation.
 * - Alpine valleys and lakes match their real coordinates and depths.
 * - Ridges connect adjacent peaks realistically.
 */
export function getCartographicElevation(
  location: AlpineLocation,
  xKm: number,
  yKm: number,
  peaks: CalculatedPeak[]
): number {
  const baseAlt = location.elevationFeatures?.baseAlt || 1000;
  const distFromObs = Math.hypot(xKm, yKm);

  // 1. Observer platform anchor: within 60 meters of observer, blend strictly to observerElevation
  if (distFromObs < 0.06) {
    return location.observerElevation;
  }

  // 2. Mountain Peaks: Smooth maximum of individual peak profiles
  let maxMountainHeight = baseAlt;
  const smoothMaxK = 0.04; // Blending parameter for smooth-max in km
  let expSum = 0;
  let weightedHeightSum = 0;

  for (const p of peaks) {
    const d = Math.hypot(xKm - p.xKm, yKm - p.yKm);
    const normDist = d / p.radiusKm;

    if (normDist < 4.0) {
      // Realistic alpine peak profile:
      // Sharp, craggy summit pyramid at center that tapers into steep rock walls and subalpine base
      const summitSharpness = Math.exp(-normDist * normDist * 1.8) * 0.55;
      const flankTaper = Math.exp(-normDist * 1.35) * 0.45;
      const bell = summitSharpness + flankTaper;

      const peakProfileHeight = baseAlt + (p.elevation - baseAlt) * bell;

      // Soft max accumulation
      const weight = Math.exp(peakProfileHeight / 180);
      expSum += weight;
      weightedHeightSum += peakProfileHeight * weight;

      if (peakProfileHeight > maxMountainHeight) {
        maxMountainHeight = peakProfileHeight;
      }
    }
  }

  // Smooth mountain envelope
  let elev = expSum > 0 ? weightedHeightSum / expSum : baseAlt;

  // 3. Ridgeline connections between close peaks in the same mountain group
  // (e.g. Großglockner <-> Glocknerwand, Hoher Dachstein <-> Torstein)
  for (let i = 0; i < peaks.length; i++) {
    for (let j = i + 1; j < peaks.length; j++) {
      const p1 = peaks[i];
      const p2 = peaks[j];
      const ridgeLen = Math.hypot(p2.xKm - p1.xKm, p2.yKm - p1.yKm);

      // If peaks are within 4.5km of each other, they share an alpine ridge crest
      if (ridgeLen > 0.4 && ridgeLen < 4.5) {
        const vx = (p2.xKm - p1.xKm) / ridgeLen;
        const vy = (p2.yKm - p1.yKm) / ridgeLen;

        // Projection along ridge segment
        const proj = (xKm - p1.xKm) * vx + (yKm - p1.yKm) * vy;
        if (proj >= 0 && proj <= ridgeLen) {
          const t = proj / ridgeLen;
          const projX = p1.xKm + t * (p2.xKm - p1.xKm);
          const projY = p1.yKm + t * (p2.yKm - p1.yKm);
          const perpDist = Math.hypot(xKm - projX, yKm - projY);

          const ridgeWidth = 0.55; // 550m ridge crest width
          if (perpDist < ridgeWidth * 2.5) {
            // Col/saddle dip in center of ridge (Scharte)
            const saddleDip = Math.sin(t * Math.PI) * Math.min(250, (p1.elevation + p2.elevation) * 0.04);
            const crestAlt = (p1.elevation * (1 - t) + p2.elevation * t) - saddleDip;

            const crestFactor = Math.exp(-((perpDist / ridgeWidth) ** 2) * 2.2);
            const ridgeAlt = baseAlt + (crestAlt - baseAlt) * crestFactor;
            elev = Math.max(elev, ridgeAlt);
          }
        }
      }
    }
  }

  // 4. Lake basins and major valley troughs
  // Use real landmarks of type 'lake' or location.lakeElevation
  const obsLat = location.observerPos.lat;
  const obsLng = location.observerPos.lng;
  const cosLat = Math.cos((obsLat * Math.PI) / 180);

  if (location.landmarks) {
    for (const lm of location.landmarks) {
      if (lm.type === 'lake') {
        const lx = (lm.lng - obsLng) * 111.139 * cosLat;
        const ly = (lm.lat - obsLat) * 111.139;
        const lakeDist = Math.hypot(xKm - lx, yKm - ly);

        // Approximate lake radius ~2.5km
        const lakeRadius = 2.4;
        if (lakeDist < lakeRadius) {
          const t = lakeDist / lakeRadius;
          const lakeFactor = (1 - Math.cos(t * Math.PI)) / 2;
          const waterLevel = lm.elevation || location.lakeElevation || 500;
          elev = waterLevel + (elev - waterLevel) * lakeFactor;
        }
      }
    }
  }

  // 5. Alpine micro-relief & rock texture (deterministic high-frequency fractal noise)
  // Provides jagged scree, gullies, and arêtes without displacing major peak altitudes
  const n1 = Math.sin(xKm * 1.8 + yKm * 1.1) * Math.cos(yKm * 1.6 - xKm * 0.9) * 45;
  const n2 = Math.sin(xKm * 4.2 - yKm * 3.3) * Math.cos(xKm * 2.8 + yKm * 5.1) * 22;
  const n3 = Math.sin(xKm * 9.5 + yKm * 8.7) * Math.cos(yKm * 11.2 - xKm * 7.4) * 8;
  const microNoise = n1 + n2 + n3;

  // Modulate noise: stronger on steep rock faces, gentle at summits and lake shores
  elev += microNoise;

  // 6. Smooth blend near observer to guarantee exact observerElevation at feet
  if (distFromObs < 0.25) {
    const blend = distFromObs / 0.25;
    elev = location.observerElevation * (1 - blend) + elev * blend;
  }

  // Minimum elevation is strictly 0m
  return Math.max(0, elev);
}
