/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type MapTextureLayer = 'opentopo' | 'ortho' | 'osm' | 'relief';

interface TileCoord {
  x: number;
  y: number;
  z: number;
}

export interface DemElevationSampler {
  getElevationAtMeters: (xMeters: number, zMeters: number) => number | null;
  minElevation: number;
  maxElevation: number;
  isLoaded: boolean;
}

/**
 * Converts Latitude and Longitude to Web Mercator tile coordinates
 */
export function latLngToTile(lat: number, lng: number, zoom: number): TileCoord {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)), z: zoom };
}

/**
 * Converts tile coordinates to Latitude and Longitude (North-West corner of tile)
 */
export function tileToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/**
 * Gets tile bounds in [minLng, minLat, maxLng, maxLat]
 */
export function getTileBounds(x: number, y: number, zoom: number): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} {
  const nw = tileToLatLng(x, y, zoom);
  const se = tileToLatLng(x + 1, y + 1, zoom);
  return {
    minLng: nw.lng,
    maxLng: se.lng,
    minLat: se.lat,
    maxLat: nw.lat,
  };
}

/**
 * Helper to safely load an image with CORS
 */
function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Loads real AWS Terrarium DEM tiles and provides a high-accuracy elevation sampler.
 * Minimum elevation is strictly 0m (sea level).
 */
export async function loadDemElevationSampler(
  centerLat: number,
  centerLng: number,
  sizeMeters: number = 46000
): Promise<DemElevationSampler> {
  const zoom = 11; // High-precision elevation zoom (~35m horizontal resolution)
  const halfSizeKm = sizeMeters / 2000;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const dLat = halfSizeKm / 111.139;
  const dLng = halfSizeKm / (111.139 * cosLat);

  const minLat = centerLat - dLat;
  const maxLat = centerLat + dLat;
  const minLng = centerLng - dLng;
  const maxLng = centerLng + dLng;

  const nwTile = latLngToTile(maxLat, minLng, zoom);
  const seTile = latLngToTile(minLat, maxLng, zoom);

  const minX = Math.min(nwTile.x, seTile.x);
  const maxX = Math.max(nwTile.x, seTile.x);
  const minY = Math.min(nwTile.y, seTile.y);
  const maxY = Math.max(nwTile.y, seTile.y);

  const canvas = document.createElement('canvas');
  canvas.width = Math.min((maxX - minX + 1) * 256, 1536);
  canvas.height = Math.min((maxY - minY + 1) * 256, 1536);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      getElevationAtMeters: () => null,
      minElevation: 0,
      maxElevation: 3800,
      isLoaded: false,
    };
  }

  // Load overlapping Terrarium DEM tiles
  const tilePromises: Promise<void>[] = [];

  for (let tx = minX; tx <= maxX; tx++) {
    for (let ty = minY; ty <= maxY; ty++) {
      const tileUrl = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${tx}/${ty}.png`;
      const p = loadImageAsync(tileUrl)
        .then((img) => {
          const destX = ((tx - minX) / (maxX - minX + 1)) * canvas.width;
          const destY = ((ty - minY) / (maxY - minY + 1)) * canvas.height;
          const destW = canvas.width / (maxX - minX + 1);
          const destH = canvas.height / (maxY - minY + 1);
          ctx.drawImage(img, destX, destY, destW, destH);
        })
        .catch(() => {});
      tilePromises.push(p);
    }
  }

  await Promise.allSettled(tilePromises);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Geographic bounds of the stitched canvas
  const stitchedNw = tileToLatLng(minX, minY, zoom);
  const stitchedSe = tileToLatLng(maxX + 1, maxY + 1, zoom);

  let minElevation = 9999;
  let maxElevation = 0;

  // Sampler function - minimum elevation is 0m
  const getElevationAtMeters = (xMeters: number, zMeters: number): number | null => {
    // In Three.js: -Z is North, +X is East
    const lat = centerLat + (-zMeters / 1000) / 111.139;
    const lng = centerLng + (xMeters / 1000) / (111.139 * cosLat);

    if (lat < stitchedSe.lat || lat > stitchedNw.lat || lng < stitchedNw.lng || lng > stitchedSe.lng) {
      return null;
    }

    const u = (lng - stitchedNw.lng) / (stitchedSe.lng - stitchedNw.lng);
    const v = (stitchedNw.lat - lat) / (stitchedNw.lat - stitchedSe.lat);

    const px = Math.floor(Math.max(0, Math.min(canvas.width - 1, u * canvas.width)));
    const py = Math.floor(Math.max(0, Math.min(canvas.height - 1, v * canvas.height)));

    const idx = (py * canvas.width + px) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Terrarium elevation formula:
    // elevation = (r * 256 + g + b / 256) - 32768
    const elev = r * 256 + g + b / 256 - 32768;

    // Minimum altitude is 0m (sea level), maximum 4800m (Mont Blanc / Alps ceiling)
    if (elev < 0 || elev > 4800) {
      return null;
    }

    const validAlt = Math.max(0, elev);
    if (validAlt < minElevation) minElevation = validAlt;
    if (validAlt > maxElevation) maxElevation = validAlt;

    return validAlt;
  };

  return {
    getElevationAtMeters,
    minElevation: minElevation === 9999 ? 0 : minElevation,
    maxElevation: maxElevation === 0 ? 3800 : maxElevation,
    isLoaded: true,
  };
}

/**
 * Builds a draped high-resolution Three.js CanvasTexture of real aerial / orthophoto imagery
 * centered exactly around the observer position.
 * Features 3072x3072 composite resolution with zoom 12 detail.
 */
export async function createDrapedAerialTexture(
  centerLat: number,
  centerLng: number,
  sizeMeters: number = 46000,
  maxAnisotropy: number = 16
): Promise<THREE.CanvasTexture | null> {
  const zoom = 12; // High-detail aerial zoom level
  const halfSizeKm = sizeMeters / 2000;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const dLat = halfSizeKm / 111.139;
  const dLng = halfSizeKm / (111.139 * cosLat);

  const minLat = centerLat - dLat;
  const maxLat = centerLat + dLat;
  const minLng = centerLng - dLng;
  const maxLng = centerLng + dLng;

  const nwTile = latLngToTile(maxLat, minLng, zoom);
  const seTile = latLngToTile(minLat, maxLng, zoom);

  const minX = Math.min(nwTile.x, seTile.x);
  const maxX = Math.max(nwTile.x, seTile.x);
  const minY = Math.min(nwTile.y, seTile.y);
  const maxY = Math.max(nwTile.y, seTile.y);

  // High-resolution 3072x3072 composite canvas for razor-sharp aerial detail
  const canvas = document.createElement('canvas');
  canvas.width = 3072;
  canvas.height = 3072;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Natural Alpine stone & alpine pasture base color
  ctx.fillStyle = '#3a4439';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tilePromises: Promise<void>[] = [];

  for (let tx = minX; tx <= maxX; tx++) {
    for (let ty = minY; ty <= maxY; ty++) {
      const bounds = getTileBounds(tx, ty, zoom);

      const x0 = ((bounds.minLng - minLng) / (maxLng - minLng)) * canvas.width;
      const x1 = ((bounds.maxLng - minLng) / (maxLng - minLng)) * canvas.width;
      const y0 = ((maxLat - bounds.maxLat) / (maxLat - minLat)) * canvas.height;
      const y1 = ((maxLat - bounds.minLat) / (maxLat - minLat)) * canvas.height;

      // Primary: Esri High-Resolution World Imagery
      const primaryUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;

      const p = loadImageAsync(primaryUrl)
        .then((img) => {
          ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
        })
        .catch(() => {
          // Backup fallback to lower zoom or OSM if an individual tile fails
          const fallbackUrl = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
          return loadImageAsync(fallbackUrl)
            .then((fbImg) => {
              ctx.drawImage(fbImg, x0, y0, x1 - x0, y1 - y0);
            })
            .catch(() => {});
        });

      tilePromises.push(p);
    }
  }

  await Promise.allSettled(tilePromises);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(16, maxAnisotropy);
  texture.needsUpdate = true;

  return texture;
}
