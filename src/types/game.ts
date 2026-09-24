/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AustrianBundesland = 
  | 'Tirol' 
  | 'Salzburg' 
  | 'Kärnten' 
  | 'Steiermark' 
  | 'Oberösterreich' 
  | 'Niederösterreich' 
  | 'Vorarlberg';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface OSMPeak {
  id: string;
  name: string;
  elevation: number; // in meters
  lat: number;
  lng: number;
  prominence?: number;
  hasSummitCross?: boolean;
}

export interface OSMLandmark {
  name: string;
  type: 'alpine_hut' | 'lake' | 'pass' | 'glacier' | 'valley';
  lat: number;
  lng: number;
  elevation?: number;
}

export interface AlpineLocation {
  id: string;
  name: string;
  subname: string;
  mountainRange: string;
  bundesland: AustrianBundesland;
  observerPos: LatLng;
  observerElevation: number; // in meters above sea level
  targetPeak: OSMPeak;
  nearbyPeaks: OSMPeak[];
  landmarks: OSMLandmark[];
  initialHeading: number; // degrees 0-360
  description: string;
  funFact: string;
  // Bounding box for local topographic grid (approx 15km x 15km)
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  // Regional map center offset in km from observer (so observer is NOT at map center)
  mapCenterOffsetKm?: { x: number; y: number };
  // Base water elevation if lake present
  lakeElevation?: number;
  lakeName?: string;
  // Procedural elevation profile generator seeds / features
  elevationFeatures: {
    baseAlt: number;
    noiseScale: number;
    peaks: Array<{
      dx: number; // km from center
      dy: number; // km from center
      alt: number; // peak altitude in m
      radius: number; // radius of mountain mass in km
      ridgeAngle?: number; // orientation of ridge in radians
      ridgeLength?: number;
    }>;
    valleys?: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      depth: number;
      width: number;
    }>;
    lakes?: Array<{
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      waterAlt: number;
    }>;
  };
  // Curated location settings
  timeOfDayHour?: number; // Fixed hour of day configured in creator
  difficulty?: 'standard' | 'hard'; // 'hard' = no compass, no visier
  showSearchZone?: boolean; // Red-blue dashed search zone circle on/off
  searchZoneRadiusKm?: number; // Search zone radius in km (default: 50km)
  searchZoneCenter?: LatLng; // Explicit center for the search zone
}

export type GameMode = 'campaign' | 'creator';

export interface CuratedPlace {
  id: string;
  name: string;
  subname?: string;
  mountainRange: string;
  bundesland: AustrianBundesland;
  observerPos: LatLng;
  observerElevation: number;
  initialHeading: number;
  description: string;
  funFact?: string;
  createdAt: string;
  targetPeakName?: string;
  timeOfDayHour?: number;
  difficulty?: 'standard' | 'hard';
  showSearchZone?: boolean;
  searchZoneRadiusKm?: number;
  searchZoneCenter?: LatLng;
}

export type DifficultyLevel = 'explorer' | 'hiker' | 'alpinist' | 'extrem';

export interface GameSettings {
  difficulty: DifficultyLevel;
  showCompassTape: boolean;
  showSummitLabels: boolean;
  showMapVisionCone: boolean;
  showElevationClue: boolean;
  showShadedRelief: boolean;
  contourInterval: 25 | 50 | 100; // in meters
  timeOfDayMode: 'real' | 'dawn' | 'noon' | 'sunset' | 'night' | 'custom';
  customTimeHour: number; // 0-24
  soundEffects: boolean;
}

export interface RoundResult {
  roundNumber: number;
  location: AlpineLocation;
  guessLatLng: LatLng | null;
  distanceKm: number;
  elevationDiffM: number;
  score: number; // 0 - 5000
  timeSpentSec: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  played: boolean;
  score: number;
  rounds: RoundResult[];
  streak: number;
  bestScore: number;
  totalGames: number;
}
