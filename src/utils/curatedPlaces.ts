/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlpineLocation, AustrianBundesland, CuratedPlace, LatLng, OSMPeak } from '../types/game';

const STORAGE_KEY = 'topoguesser_curated_places_playtest_v1';

export const MASTER_AUSTRIAN_PEAKS: OSMPeak[] = [
  // Hohe Tauern / Glocknergruppe
  { id: 'grossglockner', name: 'Großglockner', elevation: 3798, lat: 47.0742, lng: 12.6947, prominence: 2428, hasSummitCross: true },
  { id: 'glocknerwand', name: 'Glocknerwand', elevation: 3721, lat: 47.081, lng: 12.686 },
  { id: 'johannisberg', name: 'Johannisberg', elevation: 3453, lat: 47.112, lng: 12.691 },
  { id: 'fuscherkarkopf', name: 'Fuscherkarkopf', elevation: 3331, lat: 47.098, lng: 12.748 },
  { id: 'spielmann', name: 'Spielmann', elevation: 3027, lat: 47.092, lng: 12.798 },
  { id: 'schareck', name: 'Schareck', elevation: 3123, lat: 47.042, lng: 12.871 },
  { id: 'sonnblick', name: 'Hoher Sonnblick', elevation: 3106, lat: 47.054, lng: 12.955 },
  { id: 'ankogel', name: 'Ankogel', elevation: 3252, lat: 47.052, lng: 13.250 },
  { id: 'hochalmspitze', name: 'Hochalmspitze (Tauernkönigin)', elevation: 3360, lat: 47.016, lng: 13.321 },
  { id: 'grossvenediger', name: 'Großvenediger', elevation: 3657, lat: 47.109, lng: 12.346, prominence: 1198, hasSummitCross: true },
  { id: 'grosser-geiger', name: 'Großer Geiger', elevation: 3360, lat: 47.094, lng: 12.311 },
  { id: 'kleinvenediger', name: 'Kleinvenediger', elevation: 3471, lat: 47.118, lng: 12.355 },
  { id: 'rainerhorn', name: 'Rainerhorn', elevation: 3559, lat: 47.099, lng: 12.362 },
  { id: 'wiesbachhorn', name: 'Großes Wiesbachhorn', elevation: 3564, lat: 47.158, lng: 12.756 },
  { id: 'hohedock', name: 'Hohe Dock', elevation: 3348, lat: 47.142, lng: 12.729 },
  { id: 'kitzsteinhorn', name: 'Kitzsteinhorn', elevation: 3203, lat: 47.1997, lng: 12.6908, prominence: 439, hasSummitCross: true },

  // Dachstein & Salzkammergut
  { id: 'hoher-dachstein', name: 'Hoher Dachstein', elevation: 2995, lat: 47.4753, lng: 13.6058, prominence: 2136, hasSummitCross: true },
  { id: 'torstein', name: 'Torstein', elevation: 2948, lat: 47.468, lng: 13.583 },
  { id: 'mitterspitz', name: 'Mitterspitz', elevation: 2925, lat: 47.471, lng: 13.593 },
  { id: 'sarstein', name: 'Hoher Sarstein', elevation: 1975, lat: 47.601, lng: 13.702 },
  { id: 'plassen', name: 'Plassen', elevation: 1953, lat: 47.568, lng: 13.597 },
  { id: 'schafberg', name: 'Schafberg', elevation: 1783, lat: 47.7761, lng: 13.4328, prominence: 1181, hasSummitCross: true },
  { id: 'zwoelferhorn', name: 'Zwölferhorn', elevation: 1522, lat: 47.728, lng: 13.355 },
  { id: 'bleckwand', name: 'Bleckwand', elevation: 1541, lat: 47.702, lng: 13.435 },
  { id: 'drachenwand', name: 'Drachenwand', elevation: 1176, lat: 47.788, lng: 13.358 },
  { id: 'traunstein', name: 'Traunstein', elevation: 1691, lat: 47.8722, lng: 13.8406, prominence: 1083, hasSummitCross: true },
  { id: 'feuerkogel', name: 'Feuerkogel', elevation: 1592, lat: 47.818, lng: 13.722 },
  { id: 'erlakogel', name: 'Erlakogel (Schlafende Griechin)', elevation: 1575, lat: 47.828, lng: 13.811 },
  { id: 'hoellkogel', name: 'Großer Höllkogel', elevation: 1862, lat: 47.817, lng: 13.648 },

  // Kaisergebirge & Kitzbüheler Alpen
  { id: 'ellmauer-halt', name: 'Ellmauer Halt', elevation: 2344, lat: 47.5614, lng: 12.3047, prominence: 1551, hasSummitCross: true },
  { id: 'treffauer', name: 'Treffauer', elevation: 2304, lat: 47.554, lng: 12.285 },
  { id: 'karlspitze', name: 'Hintere Karlspitze', elevation: 2281, lat: 47.568, lng: 12.325 },
  { id: 'scheffauer', name: 'Scheffauer', elevation: 2111, lat: 47.551, lng: 12.247 },
  { id: 'hohe-salve', name: 'Hohe Salve', elevation: 1828, lat: 47.464, lng: 12.201 },
  { id: 'kitzbueheler-horn', name: 'Kitzbüheler Horn', elevation: 1996, lat: 47.476, lng: 12.431 },

  // Karwendel & Tuxer Alpen (Innsbruck)
  { id: 'patscherkofel', name: 'Patscherkofel', elevation: 2246, lat: 47.2089, lng: 11.4608, prominence: 400, hasSummitCross: true },
  { id: 'hafelekar', name: 'Hafelekarspitze', elevation: 2334, lat: 47.312, lng: 11.383 },
  { id: 'bettelwurf', name: 'Großer Bettelwurf', elevation: 2726, lat: 47.342, lng: 11.518 },
  { id: 'birkkarspitze', name: 'Birkkarspitze', elevation: 2749, lat: 47.411, lng: 11.434 },
  { id: 'serles', name: 'Serles (Altar Tirols)', elevation: 2717, lat: 47.126, lng: 11.381 },
  { id: 'glungezer', name: 'Glungezer', elevation: 2677, lat: 47.208, lng: 11.522 },
  { id: 'hohe-munde', name: 'Hohe Munde', elevation: 2662, lat: 47.348, lng: 11.074 },
  { id: 'zugspitze', name: 'Zugspitze', elevation: 2962, lat: 47.421, lng: 10.985 },

  // Silvretta & Vorarlberg
  { id: 'piz-buin', name: 'Großer Piz Buin', elevation: 3312, lat: 46.8447, lng: 10.1189, prominence: 544, hasSummitCross: true },
  { id: 'silvrettahorn', name: 'Silvrettahorn', elevation: 3244, lat: 46.857, lng: 10.098 },
  { id: 'fluchthorn', name: 'Fluchthorn', elevation: 3399, lat: 46.892, lng: 10.228 },
  { id: 'dreilaenderspitze', name: 'Dreiländerspitze', elevation: 3197, lat: 46.853, lng: 10.145 },
  { id: 'hoher-riffler', name: 'Hoher Riffler (Verwall)', elevation: 3168, lat: 47.114, lng: 10.371 },
  { id: 'rote-wand', name: 'Rote Wand (Lechquellengebirge)', elevation: 2704, lat: 47.198, lng: 9.985 },

  // Ötztaler & Stubaier Alpen
  { id: 'wildspitze', name: 'Wildspitze', elevation: 3770, lat: 46.885, lng: 10.867, prominence: 2261, hasSummitCross: true },
  { id: 'weisskugel', name: 'Weißkugel', elevation: 3738, lat: 46.799, lng: 10.728 },
  { id: 'similaun', name: 'Similaun', elevation: 3599, lat: 46.764, lng: 10.881 },
  { id: 'zuckerhuetl', name: 'Zuckerhütl', elevation: 3507, lat: 46.963, lng: 11.152 },
  { id: 'habicht', name: 'Habicht', elevation: 3277, lat: 47.042, lng: 11.289 },

  // Steiermark & Totes Gebirge
  { id: 'grimming', name: 'Grimming', elevation: 2351, lat: 47.5211, lng: 14.0153, prominence: 1518, hasSummitCross: true },
  { id: 'kammspitze', name: 'Kammspitze', elevation: 2139, lat: 47.465, lng: 13.918 },
  { id: 'stoderzinken', name: 'Stoderzinken', elevation: 2048, lat: 47.461, lng: 13.829 },
  { id: 'grosser-priel', name: 'Großer Priel', elevation: 2515, lat: 47.718, lng: 14.078 },
  { id: 'spitzmauer', name: 'Spitzmauer', elevation: 2446, lat: 47.701, lng: 14.062 },
  { id: 'hochgolling', name: 'Hochgolling', elevation: 2862, lat: 47.266, lng: 13.765 },
  { id: 'hochschwab', name: 'Hochschwab', elevation: 2277, lat: 47.618, lng: 15.088 },
  { id: 'zirbitzkogel', name: 'Zirbitzkogel', elevation: 2396, lat: 47.064, lng: 14.567 },

  // Niederösterreich / Wiener Alpen
  { id: 'klosterwappen', name: 'Klosterwappen (Schneeberg)', elevation: 2076, lat: 47.7672, lng: 15.8058, prominence: 1348, hasSummitCross: true },
  { id: 'kaiserstein', name: 'Kaiserstein', elevation: 2061, lat: 47.771, lng: 15.811 },
  { id: 'heukuppe', name: 'Rax (Heukuppe)', elevation: 2007, lat: 47.689, lng: 15.698 },
  { id: 'schneealpe', name: 'Schneealpe', elevation: 1903, lat: 47.701, lng: 15.599 },
  { id: 'oetscher', name: 'Großer Ötscher', elevation: 1893, lat: 47.866, lng: 15.201 },
  { id: 'duerrenstein', name: 'Dürrenstein', elevation: 1878, lat: 47.788, lng: 15.058 },
];

/**
 * Heuristically determines the Austrian Bundesland from coordinates
 */
export function determineBundesland(lat: number, lng: number): AustrianBundesland {
  if (lng < 10.3) return 'Vorarlberg';
  if (lng >= 10.3 && lng < 12.45) return 'Tirol';
  if (lat > 47.45 && lng >= 13.2 && lng < 14.8) return 'Oberösterreich';
  if (lng >= 12.45 && lng < 13.8 && lat >= 47.0 && lat <= 47.8) return 'Salzburg';
  if (lat < 47.15 && lng >= 12.7 && lng < 15.1) return 'Kärnten';
  if (lng >= 15.3 || (lat > 47.6 && lng >= 14.8)) return 'Niederösterreich';
  return 'Steiermark';
}

/**
 * Calculates straight line km between two lat/lng
 */
function distKm(pos1: LatLng, pos2: LatLng): number {
  const R = 6371;
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds all peaks sorted by distance from coordinate
 */
export function findSurroundingPeaks(pos: LatLng): Array<{ peak: OSMPeak; distanceKm: number }> {
  return MASTER_AUSTRIAN_PEAKS.map((p) => ({
    peak: p,
    distanceKm: distKm(pos, { lat: p.lat, lng: p.lng }),
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Estimates natural ground elevation at given coordinates
 */
export function estimateElevation(pos: LatLng): number {
  const nearby = findSurroundingPeaks(pos);
  if (nearby.length === 0) return 1200;

  const closest = nearby[0];
  // If extremely close to a summit (< 1.5 km), it's high
  if (closest.distanceKm < 1.5) {
    return Math.max(1400, Math.round(closest.peak.elevation - closest.distanceKm * 400));
  }
  // If moderately close (1.5 - 6 km), typical subalpine shoulder/terrace
  if (closest.distanceKm < 6.0) {
    const factor = 1 - closest.distanceKm / 6.0;
    return Math.max(900, Math.round(1100 + (closest.peak.elevation - 1100) * factor * 0.65));
  }

  // Regional alpine baseline
  return 1250;
}

/**
 * Synthesizes a valid AlpineLocation object for any coordinate placed on the map
 */
export function synthesizeLocationFromCoord(options: {
  lat: number;
  lng: number;
  elevation?: number;
  name?: string;
  subname?: string;
  heading?: number;
  timeOfDayHour?: number;
  difficulty?: 'standard' | 'hard';
  showSearchZone?: boolean;
  searchZoneRadiusKm?: number;
  searchZoneCenter?: LatLng;
}): AlpineLocation {
  const { lat, lng } = options;
  const bundesland = determineBundesland(lat, lng);
  const surrounding = findSurroundingPeaks({ lat, lng });

  const target = surrounding[0]?.peak || MASTER_AUSTRIAN_PEAKS[0];
  const nearbyPeaks = surrounding.slice(1, 8).map((s) => s.peak);

  const observerElevation = options.elevation ?? estimateElevation({ lat, lng });

  // Azimuth to target peak
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dx = (target.lng - lng) * 111.139 * cosLat;
  const dy = (target.lat - lat) * 111.139;
  const targetAzimuth = Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360);

  const initialHeading = options.heading ?? targetAzimuth;

  const locName = options.name || `Aussichtspunkt bei ${target.name}`;
  const subname = options.subname || `${target.name} (${target.elevation} m) · Blickfeld`;

  return {
    id: `custom-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    name: locName,
    subname,
    mountainRange: `${target.name}-Region · ${bundesland}`,
    bundesland,
    observerPos: { lat, lng },
    observerElevation,
    initialHeading,
    description: `Kuratierter alpiner Aussichtspunkt mit Blick auf ${target.name} (${target.elevation} m) und umliegende Massive.`,
    funFact: `Vom Standort sind ${surrounding.filter((s) => s.distanceKm < 30).length} bekannte Gipfel im Umkreis von 30 km sichtbar.`,
    targetPeak: target,
    nearbyPeaks,
    timeOfDayHour: options.timeOfDayHour ?? 14,
    difficulty: options.difficulty ?? 'standard',
    showSearchZone: options.showSearchZone ?? true,
    searchZoneRadiusKm: options.searchZoneRadiusKm ?? 50,
    searchZoneCenter: options.searchZoneCenter,
    landmarks: [
      {
        name: `${target.name} Gipfelkreuz`,
        type: 'pass',
        lat: target.lat,
        lng: target.lng,
        elevation: target.elevation,
      },
    ],
    bounds: {
      minLat: lat - 0.12,
      maxLat: lat + 0.12,
      minLng: lng - 0.18,
      maxLng: lng + 0.18,
    },
    mapCenterOffsetKm: { x: 0, y: 0 },
    elevationFeatures: {
      baseAlt: Math.min(800, Math.round(observerElevation * 0.6)),
      noiseScale: 140,
      peaks: surrounding.slice(0, 5).map((s) => ({
        dx: (s.peak.lng - lng) * 111.139 * cosLat,
        dy: (s.peak.lat - lat) * 111.139,
        alt: s.peak.elevation,
        radius: 2.5,
      })),
    },
  };
}

/**
 * Loads curated places collection from localStorage
 */
export function loadCuratedPlaces(): CuratedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultCuratedPlaces();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load curated places:', err);
  }
  return getDefaultCuratedPlaces();
}

/**
 * Saves a single curated place into localStorage
 */
export function saveCuratedPlace(place: CuratedPlace): void {
  try {
    const current = loadCuratedPlaces();
    const existingIndex = current.findIndex((p) => p.id === place.id);
    if (existingIndex >= 0) {
      current[existingIndex] = place;
    } else {
      current.unshift(place);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save curated place:', err);
  }
}

/**
 * Deletes a curated place by id
 */
export function deleteCuratedPlace(id: string): void {
  try {
    const current = loadCuratedPlaces().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to delete curated place:', err);
  }
}

/**
 * Exports all curated places to formatted JSON string
 */
export function exportCuratedPlacesJSON(): string {
  const places = loadCuratedPlaces();
  return JSON.stringify(places, null, 2);
}

/**
 * Imports curated places from JSON string
 */
export function importCuratedPlacesJSON(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'Ungültiges JSON-Format: Array erwartet' };
    }

    const current = loadCuratedPlaces();
    const existingIds = new Set(current.map((p) => p.id));
    let addedCount = 0;

    for (const item of parsed) {
      if (item && item.id && item.name && item.observerPos?.lat && item.observerPos?.lng) {
        if (!existingIds.has(item.id)) {
          current.push(item);
          existingIds.add(item.id);
          addedCount++;
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return { success: true, count: addedCount };
  } catch (err) {
    return { success: false, count: 0, error: (err as Error).message };
  }
}

/**
 * Converts a CuratedPlace into a full AlpineLocation
 */
export function convertCuratedToAlpineLocation(curated: CuratedPlace): AlpineLocation {
  return synthesizeLocationFromCoord({
    lat: curated.observerPos.lat,
    lng: curated.observerPos.lng,
    elevation: curated.observerElevation,
    name: curated.name,
    subname: curated.subname,
    heading: curated.initialHeading,
    timeOfDayHour: curated.timeOfDayHour,
    difficulty: curated.difficulty,
    showSearchZone: curated.showSearchZone,
    searchZoneRadiusKm: curated.searchZoneRadiusKm,
    searchZoneCenter: curated.searchZoneCenter,
  });
}

/**
 * Playtest campaign: exactly 5 curated locations selected for playtesting
 */
export const PLAYTEST_CAMPAIGN_PLACES: CuratedPlace[] = [
  {
    id: 'curated-1790240548375',
    name: 'Adlerstein',
    mountainRange: 'Schafberg-Region · Oberösterreich',
    bundesland: 'Oberösterreich',
    observerPos: {
      lat: 47.791563985367496,
      lng: 13.472585678100588,
    },
    observerElevation: 1290,
    initialHeading: 281,
    description: 'Aussichtspunkt auf die markante Südwand des Wilden Kaisers',
    createdAt: '2026-09-24T09:02:28.375Z',
    targetPeakName: 'Schafberg',
    timeOfDayHour: 15.5,
    difficulty: 'standard',
    showSearchZone: true,
    searchZoneRadiusKm: 50,
    searchZoneCenter: {
      lat: 47.73655265353601,
      lng: 13.672485351562502,
    },
  },
  {
    id: 'curated-1790240510416',
    name: 'Strandbad Seewalchen',
    mountainRange: 'Großer Höllkogel-Region · Oberösterreich',
    bundesland: 'Oberösterreich',
    observerPos: {
      lat: 47.95006946020493,
      lng: 13.590441942214968,
    },
    observerElevation: 550,
    initialHeading: 229,
    description: 'Aussichtspunkt auf die markante Südwand des Wilden Kaisers',
    createdAt: '2026-09-24T09:01:50.416Z',
    targetPeakName: 'Großer Höllkogel',
    timeOfDayHour: 13,
    difficulty: 'standard',
    showSearchZone: true,
    searchZoneRadiusKm: 50,
    searchZoneCenter: {
      lat: 47.73655265353601,
      lng: 13.672485351562502,
    },
  },
  {
    id: 'curated-1790240379293',
    name: 'Schafberg',
    mountainRange: 'Schafberg-Region · Oberösterreich',
    bundesland: 'Oberösterreich',
    observerPos: {
      lat: 47.77606458167728,
      lng: 13.433672189712526,
    },
    observerElevation: 1757,
    initialHeading: 46,
    description: 'Aussichtspunkt auf die markante Südwand des Wilden Kaisers',
    createdAt: '2026-09-24T08:59:39.293Z',
    targetPeakName: 'Schafberg',
    timeOfDayHour: 9.5,
    difficulty: 'standard',
    showSearchZone: true,
    searchZoneRadiusKm: 50,
    searchZoneCenter: {
      lat: 47.73655265353601,
      lng: 13.672485351562502,
    },
  },
  {
    id: 'curated-1790240271765',
    name: 'Ahornkogel',
    mountainRange: 'Hoher Sarstein-Region · Oberösterreich',
    bundesland: 'Oberösterreich',
    observerPos: {
      lat: 47.63939823096526,
      lng: 13.81532907485962,
    },
    observerElevation: 1800,
    initialHeading: 267,
    description: 'Aussichtspunkt auf die markante Südwand des Wilden Kaisers',
    createdAt: '2026-09-24T08:57:51.765Z',
    targetPeakName: 'Hoher Sarstein',
    timeOfDayHour: 9.5,
    difficulty: 'standard',
    showSearchZone: true,
    searchZoneRadiusKm: 50,
    searchZoneCenter: {
      lat: 47.73655265353601,
      lng: 13.672485351562502,
    },
  },
  {
    id: 'curated-1790240027621',
    name: 'Grünberg VM',
    mountainRange: 'Traunstein-Region · Oberösterreich',
    bundesland: 'Oberösterreich',
    observerPos: {
      lat: 47.898160943206086,
      lng: 13.817796707153322,
    },
    observerElevation: 1025,
    initialHeading: 316,
    description: 'Aussichtspunkt auf die markante Südwand des Wilden Kaisers',
    createdAt: '2026-09-24T08:53:47.621Z',
    targetPeakName: 'Traunstein',
    timeOfDayHour: 9.5,
    difficulty: 'standard',
    showSearchZone: true,
    searchZoneRadiusKm: 50,
    searchZoneCenter: {
      lat: 47.73655265353601,
      lng: 13.672485351562502,
    },
  },
];

/**
 * Default inspirational curated places across Austria
 */
function getDefaultCuratedPlaces(): CuratedPlace[] {
  return PLAYTEST_CAMPAIGN_PLACES;
}
