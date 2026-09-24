/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { AlpineLocation, LatLng } from '../types/game';
import {
  Navigation,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Crosshair,
  CircleDot,
} from 'lucide-react';

interface TopoMap2DProps {
  location: AlpineLocation;
  headingDeg: number;
  showVisionCone: boolean;
  guessLatLng: LatLng | null;
  onGuessChange: (pos: LatLng) => void;
  onSubmitGuess?: () => void;
  isRoundComplete: boolean;
  roundScore?: number;
  isCreatorMode?: boolean;
  creatorPin?: LatLng | null;
  onCreatorPinChange?: (pos: LatLng) => void;
  creatorSearchZoneCenter?: LatLng | null;
  onCreatorSearchZoneCenterChange?: (pos: LatLng) => void;
  creatorActiveTool?: 'camera' | 'searchZone';
  className?: string;
}

export const TopoMap2D: React.FC<TopoMap2DProps> = ({
  location,
  headingDeg,
  showVisionCone,
  guessLatLng,
  onGuessChange,
  onSubmitGuess,
  isRoundComplete,
  roundScore,
  isCreatorMode = false,
  creatorPin,
  onCreatorPinChange,
  creatorSearchZoneCenter,
  onCreatorSearchZoneCenterChange,
  creatorActiveTool = 'camera',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const creatorMarkerRef = useRef<L.Marker | null>(null);
  const searchZoneCenterMarkerRef = useRef<L.Marker | null>(null);
  const trueMarkerRef = useRef<L.Marker | null>(null);
  const resultLineRef = useRef<L.Polyline | null>(null);
  const resultLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const visionConeLayerRef = useRef<L.Polygon | null>(null);
  const sightLineRef = useRef<L.Polyline | null>(null);

  // Keep latest callbacks in ref for Leaflet event handlers
  const propsRef = useRef({
    isCreatorMode,
    onCreatorPinChange,
    onCreatorSearchZoneCenterChange,
    creatorActiveTool,
    onGuessChange,
    isRoundComplete,
  });
  useEffect(() => {
    propsRef.current = {
      isCreatorMode,
      onCreatorPinChange,
      onCreatorSearchZoneCenterChange,
      creatorActiveTool,
      onGuessChange,
      isRoundComplete,
    };
  }, [
    isCreatorMode,
    onCreatorPinChange,
    onCreatorSearchZoneCenterChange,
    creatorActiveTool,
    onGuessChange,
    isRoundComplete,
  ]);

  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth / 2 : 800,
    height: typeof window !== 'undefined' ? window.innerHeight / 2 : 800,
  });

  // Sightline metrics: Ray and Arrowhead extend all the way to the Bildrand (screen edge)
  const rayMetrics = useMemo(() => {
    const hw = Math.max(100, containerDimensions.width / 2);
    const hh = Math.max(100, containerDimensions.height / 2);

    const rad = (headingDeg * Math.PI) / 180;
    const sinA = Math.sin(rad);
    const cosA = Math.cos(rad);

    // Distance from center to vertical borders (left / right)
    const tx = Math.abs(sinA) > 0.0001 ? hw / Math.abs(sinA) : Infinity;
    // Distance from center to horizontal borders (top / bottom)
    const ty = Math.abs(cosA) > 0.0001 ? hh / Math.abs(cosA) : Infinity;

    const borderDist = Math.min(tx, ty);
    const lineEndDist = Math.max(80, borderDist);
    // Position arrowhead right at the Bildrand (6px margin from viewport edge)
    const arrowDist = Math.max(40, borderDist - 6);

    // Direction chevrons along the sightline every 110px
    const chevrons: number[] = [];
    for (let d = 100; d < arrowDist - 45; d += 110) {
      chevrons.push(d);
    }

    return {
      borderDist,
      lineEndDist,
      arrowDist,
      chevrons,
      hw,
      hh,
    };
  }, [containerDimensions, headingDeg]);

  // Search Zone Circle Calculation
  // Priority: 1. Creator center override, 2. Location custom center, 3. Deterministic pseudo-random offset
  const searchZone = useMemo(() => {
    const radiusKm = location.searchZoneRadiusKm ?? 50;

    // Use active creator center if in creator mode, or location stored center
    const explicitCenter = isCreatorMode
      ? creatorSearchZoneCenter || location.searchZoneCenter
      : location.searchZoneCenter;

    if (explicitCenter) {
      return {
        center: explicitCenter,
        radiusMeters: radiusKm * 1000,
        diameterKm: radiusKm * 2,
      };
    }

    // Deterministic pseudo-random offset between 20km and 32km from target
    const seed = Math.sin(location.observerPos.lat * 997.13 + location.observerPos.lng * 883.29);
    const angleRad = (Math.abs(seed) * 100) % (2 * Math.PI);
    const maxOffset = Math.min(radiusKm * 0.65, 30);
    const offsetDistanceKm = Math.max(12, maxOffset * 0.75 + ((Math.abs(Math.cos(seed * 53.7)) * 1000) % 1) * 8);

    const cosLat = Math.cos((location.observerPos.lat * Math.PI) / 180);
    const dLat = (offsetDistanceKm * Math.cos(angleRad)) / 111.0;
    const dLng = (offsetDistanceKm * Math.sin(angleRad)) / (111.0 * cosLat);

    const center = {
      lat: location.observerPos.lat + dLat,
      lng: location.observerPos.lng + dLng,
    };

    return {
      center,
      radiusMeters: radiusKm * 1000,
      diameterKm: radiusKm * 2,
    };
  }, [location, isCreatorMode, creatorSearchZoneCenter]);

  const searchZoneCircleRedRef = useRef<L.Circle | null>(null);
  const searchZoneCircleBlueRef = useRef<L.Circle | null>(null);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [searchZone.center.lat, searchZone.center.lng],
      zoom: 10,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });

    // Metric scale bar in lower-left
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

    // Fixed OpenTopoMap tile layer with authentic Alpine contour lines, relief, trails & huts
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      subdomains: 'abc',
      attribution:
        'Kartendaten: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> · Topo: &copy; <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a>',
    }).addTo(map);

    // Dedicated layer group for game results ensuring old games are never displayed
    const resultGroup = L.layerGroup().addTo(map);
    resultLayerGroupRef.current = resultGroup;

    mapRef.current = map;

    // Observe container size changes to prevent coordinate offsets and adjust sightline ray
    const resizeObserver = new ResizeObserver((entries) => {
      map.invalidateSize();
      if (entries[0] && entries[0].contentRect) {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
        }
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Map click handler:
    // In Creator Mode: sets camera pin or search zone center based on creatorActiveTool
    // In Game Mode: NO click placement! Guesser aims exclusively by panning/moving the map!
    map.on('click', (e: L.LeafletMouseEvent) => {
      const {
        isCreatorMode,
        creatorActiveTool,
        onCreatorPinChange,
        onCreatorSearchZoneCenterChange,
      } = propsRef.current;

      if (isCreatorMode) {
        if (creatorActiveTool === 'searchZone') {
          onCreatorSearchZoneCenterChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        } else {
          onCreatorPinChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      }
    });

    // Map move handler:
    // As the player pans/moves the map in game mode, the center of the map continuously becomes the guess!
    map.on('move', () => {
      const { isCreatorMode, isRoundComplete, onGuessChange } = propsRef.current;
      if (!isCreatorMode && !isRoundComplete) {
        const center = map.getCenter();
        onGuessChange({ lat: center.lat, lng: center.lng });
      }
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. When Location or Search Zone changes: render red-blue alternating dashed search zone and frame map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous search zone circles
    if (searchZoneCircleRedRef.current) {
      map.removeLayer(searchZoneCircleRedRef.current);
      searchZoneCircleRedRef.current = null;
    }
    if (searchZoneCircleBlueRef.current) {
      map.removeLayer(searchZoneCircleBlueRef.current);
      searchZoneCircleBlueRef.current = null;
    }

    // Completely clear all markers and lines from old games/rounds
    if (resultLayerGroupRef.current) {
      resultLayerGroupRef.current.clearLayers();
    }
    if (guessMarkerRef.current) {
      map.removeLayer(guessMarkerRef.current);
      guessMarkerRef.current = null;
    }
    if (trueMarkerRef.current) {
      map.removeLayer(trueMarkerRef.current);
      trueMarkerRef.current = null;
    }
    if (resultLineRef.current) {
      map.removeLayer(resultLineRef.current);
      resultLineRef.current = null;
    }

    // Safety sweep: remove any orphaned markers or polylines from previous games
    map.eachLayer((layer) => {
      if (
        (layer instanceof L.Marker || layer instanceof L.Polyline) &&
        layer !== creatorMarkerRef.current &&
        layer !== searchZoneCenterMarkerRef.current
      ) {
        map.removeLayer(layer);
      }
    });

    const showZone = location.showSearchZone !== false;

    if (showZone) {
      // Red dashed circle stroke
      const circleRed = L.circle([searchZone.center.lat, searchZone.center.lng], {
        radius: searchZone.radiusMeters,
        color: '#ef4444',
        weight: 3.5,
        dashArray: '12, 12',
        dashOffset: '0',
        fillColor: '#ef4444',
        fillOpacity: 0.02,
        interactive: false,
      }).addTo(map);
      searchZoneCircleRedRef.current = circleRed;

      // Blue dashed circle stroke (offset by 12px to interlace with red dashes)
      const circleBlue = L.circle([searchZone.center.lat, searchZone.center.lng], {
        radius: searchZone.radiusMeters,
        color: '#3b82f6',
        weight: 3.5,
        dashArray: '12, 12',
        dashOffset: '12',
        fill: false,
        interactive: false,
      }).addTo(map);
      searchZoneCircleBlueRef.current = circleBlue;

      if (!isCreatorMode) {
        // Smoothly frame the search zone for the player
        map.fitBounds(circleRed.getBounds(), { padding: [25, 25], animate: true });
        // Initialize guess with current center of the framed bounds
        setTimeout(() => {
          if (mapRef.current) {
            const center = mapRef.current.getCenter();
            propsRef.current.onGuessChange({ lat: center.lat, lng: center.lng });
          }
        }, 150);
      }
    } else if (!isCreatorMode) {
      // If no search zone, center on general location
      map.setView([location.observerPos.lat, location.observerPos.lng], 12, { animate: true });
      setTimeout(() => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter();
          propsRef.current.onGuessChange({ lat: center.lat, lng: center.lng });
        }
      }, 150);
    }
  }, [location, searchZone.center.lat, searchZone.center.lng, searchZone.radiusMeters, isCreatorMode]);

  // 3. Creator Mode: Search Zone Center Draggable Handle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isCreatorMode || location.showSearchZone === false) {
      if (searchZoneCenterMarkerRef.current) {
        map.removeLayer(searchZoneCenterMarkerRef.current);
        searchZoneCenterMarkerRef.current = null;
      }
      return;
    }

    const centerPos = searchZone.center;

    const markerHtml = `
      <div class="relative select-none pointer-events-auto filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing" style="width: 36px; height: 36px;">
        <div class="w-9 h-9 rounded-full bg-blue-600/95 border-2 border-white text-white flex items-center justify-center shadow-xl ring-2 ring-blue-500/50">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
        </div>
        <div class="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900/95 border border-blue-400 text-blue-300 text-[10px] font-bold shadow-lg whitespace-nowrap pointer-events-none">
          Suchkreis-Zentrum
        </div>
      </div>
    `;

    const centerIcon = L.divIcon({
      className: 'creator-search-zone-center-icon',
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (searchZoneCenterMarkerRef.current) {
      searchZoneCenterMarkerRef.current.setIcon(centerIcon);
      searchZoneCenterMarkerRef.current.setLatLng([centerPos.lat, centerPos.lng]);
    } else {
      const marker = L.marker([centerPos.lat, centerPos.lng], {
        icon: centerIcon,
        draggable: true,
        zIndexOffset: 1300,
      }).addTo(map);

      marker.on('drag', () => {
        const p = marker.getLatLng();
        propsRef.current.onCreatorSearchZoneCenterChange?.({ lat: p.lat, lng: p.lng });
      });

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        propsRef.current.onCreatorSearchZoneCenterChange?.({ lat: p.lat, lng: p.lng });
      });

      searchZoneCenterMarkerRef.current = marker;
    }
  }, [isCreatorMode, location.showSearchZone, searchZone.center]);

  // 4. Manage Creator Camera Pin Marker (in Creator Mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isCreatorMode) {
      if (creatorMarkerRef.current) {
        map.removeLayer(creatorMarkerRef.current);
        creatorMarkerRef.current = null;
      }
      return;
    }

    const pos = creatorPin || location.observerPos;

    const pinHtml = `
      <div class="relative select-none pointer-events-auto filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing" style="width: 40px; height: 50px;">
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin Body with tip at (20, 50) -->
          <path d="M20 0C8.95 0 0 8.95 0 20C0 32.8 17.3 47.8 18.9 49.3C19.5 49.8 20.5 49.8 21.1 49.3C22.7 47.8 40 32.8 40 20C40 8.95 31.05 0 20 0Z" fill="#4f46e5" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          <!-- Camera Icon inside -->
          <path d="M20 16C17.8 16 16 17.8 16 20C16 22.2 17.8 24 20 24C22.2 24 24 22.2 24 20C24 17.8 22.2 16 20 16ZM26 12H24.5L23.2 10.5H16.8L15.5 12H14C12.9 12 12 12.9 12 14V26C12 27.1 12.9 28 14 28H26C27.1 28 28 27.1 28 26V14C28 12.9 27.1 12 26 12ZM20 26C16.7 26 14 23.3 14 20C14 16.7 16.7 14 20 14C23.3 14 26 16.7 26 20C26 23.3 23.3 26 20 26Z" fill="#ffffff"/>
        </svg>
        <div class="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900/95 border border-indigo-400 text-indigo-300 text-[10px] font-bold shadow-lg whitespace-nowrap pointer-events-none">
          3D Kamera
        </div>
      </div>
    `;

    const creatorIcon = L.divIcon({
      className: 'creator-camera-pin-icon',
      html: pinHtml,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
    });

    if (creatorMarkerRef.current) {
      creatorMarkerRef.current.setIcon(creatorIcon);
      creatorMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    } else {
      const marker = L.marker([pos.lat, pos.lng], {
        icon: creatorIcon,
        draggable: true,
        zIndexOffset: 1200,
      }).addTo(map);

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onCreatorPinChange?.({ lat: p.lat, lng: p.lng });
      });

      creatorMarkerRef.current = marker;
    }
  }, [isCreatorMode, creatorPin, location.observerPos, onCreatorPinChange]);

  // 5. Vision Cone in Creator Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (visionConeLayerRef.current) {
      map.removeLayer(visionConeLayerRef.current);
      visionConeLayerRef.current = null;
    }
    if (sightLineRef.current) {
      map.removeLayer(sightLineRef.current);
      sightLineRef.current = null;
    }

    if (!isCreatorMode) return;

    const anchor = creatorPin || location.observerPos;
    if (!anchor) return;

    const coneDistanceKm = 10.0;
    const sightRayDistanceKm = 18.0;
    const fovDeg = 65;
    const centerHeading = headingDeg;
    const leftHeading = centerHeading - fovDeg / 2;
    const rightHeading = centerHeading + fovDeg / 2;

    const computeEndpoint = (heading: number, distKm: number) => {
      const rad = (heading * Math.PI) / 180;
      const dxKm = distKm * Math.sin(rad);
      const dyKm = distKm * Math.cos(rad);
      const lat = anchor.lat + dyKm / 111.0;
      const lng = anchor.lng + dxKm / (111.0 * Math.cos((anchor.lat * Math.PI) / 180));
      return [lat, lng] as [number, number];
    };

    const polyCoords: [number, number][] = [
      [anchor.lat, anchor.lng],
      computeEndpoint(leftHeading, coneDistanceKm),
      computeEndpoint(centerHeading - fovDeg / 4, coneDistanceKm * 1.05),
      computeEndpoint(centerHeading, coneDistanceKm * 1.1),
      computeEndpoint(centerHeading + fovDeg / 4, coneDistanceKm * 1.05),
      computeEndpoint(rightHeading, coneDistanceKm),
    ];

    const coneColor = '#818cf8';

    const cone = L.polygon(polyCoords, {
      color: coneColor,
      weight: 1.5,
      dashArray: '3, 4',
      fillColor: coneColor,
      fillOpacity: 0.18,
      interactive: false,
    }).addTo(map);
    visionConeLayerRef.current = cone;

    // Central Sighting Ray
    const rayEnd = computeEndpoint(centerHeading, sightRayDistanceKm);
    const sightLine = L.polyline([[anchor.lat, anchor.lng], rayEnd], {
      color: coneColor,
      weight: 2,
      dashArray: '6, 6',
      opacity: 0.85,
      interactive: false,
    }).addTo(map);
    sightLineRef.current = sightLine;

    return () => {
      if (map) {
        if (cone) map.removeLayer(cone);
        if (sightLine) map.removeLayer(sightLine);
      }
    };
  }, [isCreatorMode, creatorPin, location.observerPos, headingDeg]);

  // 6. Reveal True Location, Guess Pin & Distance Line upon Round Completion
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Always clear existing result layers first so old games/rounds never persist
    if (resultLayerGroupRef.current) {
      resultLayerGroupRef.current.clearLayers();
    }
    if (guessMarkerRef.current) {
      map.removeLayer(guessMarkerRef.current);
      guessMarkerRef.current = null;
    }
    if (trueMarkerRef.current) {
      map.removeLayer(trueMarkerRef.current);
      trueMarkerRef.current = null;
    }
    if (resultLineRef.current) {
      map.removeLayer(resultLineRef.current);
      resultLineRef.current = null;
    }

    if (!isRoundComplete) {
      return;
    }

    const group = resultLayerGroupRef.current || map;

    // Render locked guess pin at guessLatLng
    if (guessLatLng) {
      const pinHtml = `
        <div class="relative select-none pointer-events-auto filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]" style="width: 36px; height: 46px;">
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18C0 29.5 15.6 43.8 17.1 45.3C17.6 45.8 18.4 45.8 18.9 45.3C20.4 43.8 36 29.5 36 18C36 8.06 27.94 0 18 0Z" fill="#f59e0b" stroke="#1c1917" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="18" cy="17" r="7.5" fill="#1c1917"/>
            <circle cx="18" cy="17" r="3" fill="#fef3c7"/>
          </svg>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-stone-950 pointer-events-none shadow-sm"></div>
        </div>
      `;

      const guessIcon = L.divIcon({
        className: 'guess-pin-icon',
        html: pinHtml,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
      });

      const marker = L.marker([guessLatLng.lat, guessLatLng.lng], {
        icon: guessIcon,
        zIndexOffset: 1500,
      }).addTo(group);
      guessMarkerRef.current = marker;
    }

    // True Observer Location Marker (Austrian Alpine Red/White Flag)
    const trueIconHtml = `
      <div class="relative select-none pointer-events-auto filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]" style="width: 160px; height: 50px;">
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-md border-2 border-white shadow-2xl font-bold text-xs whitespace-nowrap">
            <span>🚩</span>
            <span>${location.name}</span>
            <span class="font-mono-numbers text-[10px] opacity-90">${location.observerElevation}m</span>
          </div>
          <div class="w-1 h-3 bg-white border border-stone-800 shadow-sm"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white -mt-1 shadow"></div>
        </div>
      </div>
    `;

    const trueIcon = L.divIcon({
      className: 'true-location-icon',
      html: trueIconHtml,
      iconSize: [160, 50],
      iconAnchor: [80, 50],
    });

    const trueMarker = L.marker([location.observerPos.lat, location.observerPos.lng], {
      icon: trueIcon,
      zIndexOffset: 1000,
    }).addTo(group);
    trueMarkerRef.current = trueMarker;

    // Line connecting Guess and True Location
    if (guessLatLng) {
      const line = L.polyline(
        [
          [guessLatLng.lat, guessLatLng.lng],
          [location.observerPos.lat, location.observerPos.lng],
        ],
        {
          color: '#ef4444',
          weight: 3,
          dashArray: '6, 6',
          opacity: 0.9,
        }
      ).addTo(group);
      resultLineRef.current = line;

      // Fit map bounds to smoothly show both points
      const bounds = L.latLngBounds([
        [guessLatLng.lat, guessLatLng.lng],
        [location.observerPos.lat, location.observerPos.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    }

    return () => {
      if (resultLayerGroupRef.current) {
        resultLayerGroupRef.current.clearLayers();
      }
    };
  }, [isRoundComplete, guessLatLng, location]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-stone-900 ${className}`}>
      {/* Real OpenStreetMap / OpenTopoMap Leaflet Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* FIXED RETICLE / VISIER IN THE CENTER OF 2D VIEW (GAME MODE ONLY) */}
      {!isCreatorMode && !isRoundComplete && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-15 select-none overflow-hidden">
          <svg
            className="w-full h-full pointer-events-none overflow-hidden"
            viewBox={`-${rayMetrics.hw} -${rayMetrics.hh} ${containerDimensions.width} ${containerDimensions.height}`}
          >
            {/* Live Heading Sight Ray (schwarz dünn gestrichelt) bis zum Bildrand */}
            <g transform={`rotate(${headingDeg})`}>
              {/* White contrast outline behind black dashed line for high visibility over all terrain */}
              <line
                x1="0"
                y1="-18"
                x2="0"
                y2={-rayMetrics.lineEndDist}
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Black thin dashed line extending all the way to the Bildrand */}
              <line
                x1="0"
                y1="-18"
                x2="0"
                y2={-rayMetrics.lineEndDist}
                stroke="#000000"
                strokeWidth="1.6"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Directional chevrons along the line */}
              {rayMetrics.chevrons.map((dist) => (
                <g key={dist}>
                  <path
                    d={`M-4 ${-dist + 6} L0 ${-dist} L4 ${-dist + 6}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                  <path
                    d={`M-4 ${-dist + 6} L0 ${-dist} L4 ${-dist + 6}`}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
              ))}

              {/* Prominent Arrowhead directly at the Bildrand (screen edge) */}
              <path
                d={`M-7 ${-rayMetrics.arrowDist + 14} L0 ${-rayMetrics.arrowDist} L7 ${-rayMetrics.arrowDist + 14}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <path
                d={`M-7 ${-rayMetrics.arrowDist + 14} L0 ${-rayMetrics.arrowDist} L7 ${-rayMetrics.arrowDist + 14}`}
                fill="none"
                stroke="#000000"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>

            {/* Center Visier Reticle */}
            <circle cx="0" cy="0" r="16" fill="rgba(0,0,0,0.03)" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#1c1917" strokeWidth="1.5" />

            {/* Crosshair lines with central opening */}
            <line x1="-24" y1="0" x2="-8" y2="0" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
            <line x1="-24" y1="0" x2="-8" y2="0" stroke="#1c1917" strokeWidth="1.5" />

            <line x1="8" y1="0" x2="24" y2="0" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
            <line x1="8" y1="0" x2="24" y2="0" stroke="#1c1917" strokeWidth="1.5" />

            <line x1="0" y1="-24" x2="0" y2="-8" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
            <line x1="0" y1="-24" x2="0" y2="-8" stroke="#1c1917" strokeWidth="1.5" />

            <line x1="0" y1="8" x2="0" y2="24" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
            <line x1="0" y1="8" x2="0" y2="24" stroke="#1c1917" strokeWidth="1.5" />

            {/* Center target dot */}
            <circle cx="0" cy="0" r="2.5" fill="#1c1917" />
            <circle cx="0" cy="0" r="1.2" fill="#f59e0b" />
          </svg>
        </div>
      )}

      {/* Floating North Compass Indicator */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-stone-900/85 backdrop-blur-md border border-stone-700/80 shadow flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-red-400 leading-none">N</span>
          <Navigation className="w-3.5 h-3.5 text-stone-300 rotate-0" />
        </div>
      </div>

      {/* Right Zoom & Pan Controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
        <div className="flex flex-col bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors border-b border-stone-800 cursor-pointer"
            title="Heranzoomen"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="Herauszoomen"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => {
            if (mapRef.current) {
              if (isCreatorMode) {
                const centerPos = creatorPin || location.observerPos;
                mapRef.current.setView([centerPos.lat, centerPos.lng], 13, { animate: true });
              } else if (searchZoneCircleRedRef.current) {
                mapRef.current.fitBounds(searchZoneCircleRedRef.current.getBounds(), { padding: [25, 25], animate: true });
              }
            }
          }}
          className="p-2 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 shadow-lg transition-colors cursor-pointer"
          title={isCreatorMode ? 'Auf 3D-Kamera zentrieren' : 'Suchkreis zentrieren'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {isCreatorMode ? (
          /* Creator Mode Coordinates & Guidance */
          <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md border border-indigo-500/50 px-3.5 py-2 rounded-xl shadow-2xl text-xs flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-300">
              <MapPin className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-mono-numbers text-stone-100 text-xs font-semibold">
                <span>
                  {(creatorPin || location.observerPos).lat.toFixed(4)}°N, {(creatorPin || location.observerPos).lng.toFixed(4)}°E
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-indigo-300 font-normal">
                  {creatorActiveTool === 'searchZone' ? '⭕ Suchkreis-Modus aktiv' : '📷 3D-Kamera-Modus'}
                </span>
              </div>
              <span className="text-[10px] text-stone-400">
                {creatorActiveTool === 'searchZone'
                  ? 'Klicke in die Karte oder ziehe den blauen Kreis-Mittelpunkt, um die Suchzone zu verschieben'
                  : 'Klicke in die Karte oder ziehe den Kamera-Pin, um den 3D-Standort festzulegen'}
              </span>
            </div>
          </div>
        ) : (
          /* Game Mode Guesser: Center Reticle Target Coordinates & Submit Button */
          <>
            <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md border border-stone-700 px-3 py-1.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="font-mono-numbers text-stone-200 text-[11px]">
                  {guessLatLng
                    ? `${guessLatLng.lat.toFixed(4)}°N, ${guessLatLng.lng.toFixed(4)}°E`
                    : 'Karte verschieben...'}
                </span>
                <span className="text-[9px] text-stone-400">
                  {isRoundComplete ? 'Auswertung' : 'Karte verschieben, um Visier auszurichten'}
                </span>
              </div>
            </div>

            {!isRoundComplete ? (
              <button
                onClick={onSubmitGuess}
                disabled={!guessLatLng}
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all duration-200 bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 shadow-amber-500/25 cursor-pointer ring-2 ring-amber-400/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tipp abgeben</span>
              </button>
            ) : (
              <div className="pointer-events-auto bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{roundScore ?? 0} Punkte erzielt!</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
