/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Solar position calculations based on standard astronomical solar geometry equations.
 * Coordinates are for Austria (~46.5°N - 48.5°N, 9.5°E - 17°E).
 */

export interface SolarPosition {
  azimuthDeg: number;    // 0° = North, 90° = East, 180° = South, 270° = West
  elevationDeg: number;  // -90° (nadir) to +90° (zenith)
  isDaylight: boolean;
  phaseName: string;
  alpenglowFactor: number; // 0 to 1, peaks when sun is between -4° and +3°
  skyZenithColor: string;
  skyHorizonColor: string;
  sunColor: string;
  lightVector: [number, number, number]; // normalized [x, y, z] pointing TO the sun
  ambientIntensity: number; // 0.1 to 1.0
  directIntensity: number;  // 0.0 to 1.0
  fogColor: string;
}

/**
 * Calculate solar position for a given date, hour of day (0-24), latitude and longitude.
 */
export function calculateSolarPosition(
  date: Date,
  hourOfDay: number,
  lat: number = 47.5,
  lng: number = 13.5
): SolarPosition {
  // Day of the year (1-365)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // Fractional year in radians
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hourOfDay - 12) / 24);

  // Equation of time in minutes
  const eqTime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination angle in radians
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes (Austrian standard time UTC+1 / daylight UTC+2)
  // Approximate standard meridian for Austria is 15°E (UTC+1)
  const timeOffset = eqTime + 4 * (lng - 15);
  const trueSolarTime = hourOfDay * 60 + timeOffset;

  // Solar hour angle in degrees
  let hourAngleDeg = (trueSolarTime / 4) - 180;
  if (hourAngleDeg < -180) hourAngleDeg += 360;
  if (hourAngleDeg > 180) hourAngleDeg -= 360;

  const latRad = (lat * Math.PI) / 180;
  const hourAngleRad = (hourAngleDeg * Math.PI) / 180;

  // Solar zenith angle cosine
  const cosZenith =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngleRad);

  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevationDeg = 90 - (zenithRad * 180) / Math.PI;

  // Solar azimuth angle
  const cosAzimuth =
    (Math.sin(declination) - Math.sin(latRad) * Math.cos(zenithRad)) /
    (Math.cos(latRad) * Math.sin(zenithRad) || 0.0001);

  let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
  if (hourAngleDeg > 0) {
    azimuthDeg = 360 - azimuthDeg;
  }

  // Determine daylight, phase and color aesthetics
  let phaseName = 'Day';
  let alpenglow = 0;
  let zenithColor = '#1e3a8a'; // deep blue
  let horizonColor = '#93c5fd'; // pale blue
  let sunColor = '#fef08a'; // bright yellow
  let fogColor = '#bfdbfe';
  let direct = Math.max(0, Math.sin((Math.max(0, elevationDeg) * Math.PI) / 180));
  let ambient = 0.25 + 0.75 * direct;

  if (elevationDeg > 35) {
    phaseName = 'High Noon';
    zenithColor = '#1e40af';
    horizonColor = '#dbeafe';
    sunColor = '#ffffff';
    fogColor = '#e0f2fe';
    ambient = 1.0;
    direct = 1.0;
  } else if (elevationDeg > 15) {
    phaseName = 'Daylight';
    zenithColor = '#1d4ed8';
    horizonColor = '#bfdbfe';
    sunColor = '#fef08a';
    fogColor = '#dbeafe';
    ambient = 0.85;
    direct = 0.9;
  } else if (elevationDeg > 4) {
    phaseName = 'Golden Hour';
    zenithColor = '#2563eb';
    horizonColor = '#fed7aa'; // warm peach
    sunColor = '#fbbf24'; // rich amber
    fogColor = '#ffedd5';
    alpenglow = 0.6;
    ambient = 0.65;
    direct = 0.7;
  } else if (elevationDeg > -2) {
    phaseName = elevationDeg >= 0 ? 'Sunset' : 'Alpenglow';
    zenithColor = '#3b0764'; // purple nightfall
    horizonColor = '#f97316'; // vivid orange
    sunColor = '#ea580c'; // fiery red-orange
    fogColor = '#fed7aa';
    alpenglow = 1.0; // peak alpenglow on limestone peaks
    ambient = 0.45;
    direct = 0.4;
  } else if (elevationDeg > -8) {
    phaseName = 'Civil Twilight';
    zenithColor = '#1e1b4b'; // deep indigo
    horizonColor = '#c026d3'; // fuchsia magenta
    sunColor = '#db2777';
    fogColor = '#475569';
    alpenglow = 0.5;
    ambient = 0.3;
    direct = 0.1;
  } else if (elevationDeg > -14) {
    phaseName = 'Nautical Twilight';
    zenithColor = '#0f172a';
    horizonColor = '#312e81';
    sunColor = '#818cf8';
    fogColor = '#1e293b';
    ambient = 0.2;
    direct = 0.0;
  } else {
    phaseName = 'Starlight Night';
    zenithColor = '#030712'; // pitch black
    horizonColor = '#0f172a'; // dark navy
    sunColor = '#f8fafc'; // pale moonlight
    fogColor = '#090d16';
    ambient = 0.12;
    direct = 0.0;
  }

  // Compute 3D light vector in cartographic space:
  // x: East, y: North, z: Up
  const elevRad = (elevationDeg * Math.PI) / 180;
  const azimRad = (azimuthDeg * Math.PI) / 180;
  // Azimuth is clockwise from North:
  // dx = sin(azim), dy = cos(azim)
  const lx = Math.sin(azimRad) * Math.cos(elevRad);
  const ly = Math.cos(azimRad) * Math.cos(elevRad);
  const lz = Math.sin(elevRad);

  return {
    azimuthDeg,
    elevationDeg,
    isDaylight: elevationDeg > -6,
    phaseName,
    alpenglowFactor: alpenglow,
    skyZenithColor: zenithColor,
    skyHorizonColor: horizonColor,
    sunColor,
    lightVector: [lx, ly, lz],
    ambientIntensity: ambient,
    directIntensity: direct,
    fogColor,
  };
}

/**
 * Get the current real local Austrian time (CET/CEST).
 */
export function getAustrianCurrentHour(): number {
  const now = new Date();
  // Austria is Europe/Vienna
  const viennaTimeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Europe/Vienna',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const [h, m] = viennaTimeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}
