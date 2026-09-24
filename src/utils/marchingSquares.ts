/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ContourSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  elevation: number;
  isIndex: boolean;
}

export interface ContourLabel {
  x: number;
  y: number;
  angle: number; // in radians
  text: string;
  elevation: number;
}

/**
 * Computes marching squares contour segments for a 2D elevation grid.
 *
 * @param grid 2D array of elevations [rows][cols]
 * @param cols number of columns
 * @param rows number of rows
 * @param bounds world coordinates bounding box { minX, maxX, minY, maxY }
 * @param contourInterval spacing between intermediate contours in meters (e.g., 50m)
 * @param indexMultiplier factor for thick index contours (e.g., 4 or 5 -> every 200m / 250m)
 */
export function generateMarchingSquaresContours(
  grid: number[][],
  cols: number,
  rows: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  contourInterval: number = 50,
  indexMultiplier: number = 4
): { segments: ContourSegment[]; labels: ContourLabel[] } {
  // Find min and max elevation in grid
  let minElev = Infinity;
  let maxElev = -Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      if (val < minElev) minElev = val;
      if (val > maxElev) maxElev = val;
    }
  }

  const startLevel = Math.ceil(minElev / contourInterval) * contourInterval;
  const endLevel = Math.floor(maxElev / contourInterval) * contourInterval;

  const dx = (bounds.maxX - bounds.minX) / (cols - 1);
  const dy = (bounds.maxY - bounds.minY) / (rows - 1);

  const segments: ContourSegment[] = [];
  const labels: ContourLabel[] = [];

  // Helper for linear interpolation along edge
  const lerp = (v1: number, v2: number, h: number): number => {
    if (Math.abs(v2 - v1) < 1e-6) return 0.5;
    return Math.max(0, Math.min(1, (h - v1) / (v2 - v1)));
  };

  const indexInterval = contourInterval * indexMultiplier;

  // Process each contour level
  for (let h = startLevel; h <= endLevel; h += contourInterval) {
    const isIndex = Math.abs(h % indexInterval) < 0.1;
    let labelPlacedForLevel = 0;
    const maxLabelsForLevel = isIndex ? 4 : 0;

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        // Corners:
        // 0: top-left (c, r)
        // 1: top-right (c+1, r)
        // 2: bottom-right (c+1, r+1)
        // 3: bottom-left (c, r+1)
        const v0 = grid[r][c];
        const v1 = grid[r][c + 1];
        const v2 = grid[r + 1][c + 1];
        const v3 = grid[r + 1][c];

        // 4-bit state
        let state = 0;
        if (v0 >= h) state |= 1;
        if (v1 >= h) state |= 2;
        if (v2 >= h) state |= 4;
        if (v3 >= h) state |= 8;

        if (state === 0 || state === 15) continue;

        const x0 = bounds.minX + c * dx;
        const x1 = bounds.minX + (c + 1) * dx;
        const y0 = bounds.minY + r * dy;
        const y1 = bounds.minY + (r + 1) * dy;

        // Midpoints along 4 cell edges:
        // top edge (0 -> 1)
        const topX = x0 + lerp(v0, v1, h) * dx;
        const topY = y0;
        // right edge (1 -> 2)
        const rightX = x1;
        const rightY = y0 + lerp(v1, v2, h) * dy;
        // bottom edge (3 -> 2)
        const bottomX = x0 + lerp(v3, v2, h) * dx;
        const bottomY = y1;
        // left edge (0 -> 3)
        const leftX = x0;
        const leftY = y0 + lerp(v0, v3, h) * dy;

        // Add line segment between two edge points
        const addSeg = (ax: number, ay: number, bx: number, by: number) => {
          segments.push({
            x1: ax,
            y1: ay,
            x2: bx,
            y2: by,
            elevation: h,
            isIndex,
          });

          // Label placement heuristic: placed along index contours spaced out
          if (
            isIndex &&
            labelPlacedForLevel < maxLabelsForLevel &&
            (r + c) % 11 === 0 &&
            c > 4 && c < cols - 5 &&
            r > 4 && r < rows - 5
          ) {
            const segDx = bx - ax;
            const segDy = by - ay;
            const len = Math.hypot(segDx, segDy);
            if (len > 0.0001) {
              let angle = Math.atan2(segDy, segDx);
              // Keep text readable (never upside down)
              if (angle > Math.PI / 2) angle -= Math.PI;
              if (angle < -Math.PI / 2) angle += Math.PI;

              labels.push({
                x: (ax + bx) / 2,
                y: (ay + by) / 2,
                angle,
                text: `▲${h}m`,
                elevation: h,
              });
              labelPlacedForLevel++;
            }
          }
        };

        switch (state) {
          case 1:  // v0
            addSeg(leftX, leftY, topX, topY);
            break;
          case 2:  // v1
            addSeg(topX, topY, rightX, rightY);
            break;
          case 3:  // v0, v1
            addSeg(leftX, leftY, rightX, rightY);
            break;
          case 4:  // v2
            addSeg(rightX, rightY, bottomX, bottomY);
            break;
          case 5:  // v0, v2 (saddle ambiguous - standard asymptotic decider)
            addSeg(leftX, leftY, topX, topY);
            addSeg(rightX, rightY, bottomX, bottomY);
            break;
          case 6:  // v1, v2
            addSeg(topX, topY, bottomX, bottomY);
            break;
          case 7:  // v0, v1, v2
            addSeg(leftX, leftY, bottomX, bottomY);
            break;
          case 8:  // v3
            addSeg(bottomX, bottomY, leftX, leftY);
            break;
          case 9:  // v0, v3
            addSeg(topX, topY, bottomX, bottomY);
            break;
          case 10: // v1, v3 (saddle ambiguous)
            addSeg(topX, topY, rightX, rightY);
            addSeg(bottomX, bottomY, leftX, leftY);
            break;
          case 11: // v0, v1, v3
            addSeg(rightX, rightY, bottomX, bottomY);
            break;
          case 12: // v2, v3
            addSeg(leftX, leftY, rightX, rightY);
            break;
          case 13: // v0, v2, v3
            addSeg(topX, topY, rightX, rightY);
            break;
          case 14: // v1, v2, v3
            addSeg(leftX, leftY, topX, topY);
            break;
        }
      }
    }
  }

  return { segments, labels };
}

/**
 * Computes analytical hillshade luminance grid (0 to 255) for Shaded Relief.
 * Light source standard azimuth 315° (NW) or dynamic solar azimuth, 45° elevation.
 */
export function computeHillshade(
  grid: number[][],
  cols: number,
  rows: number,
  cellSizeMeters: number,
  sunAzimuthDeg: number = 315,
  sunElevationDeg: number = 45,
  zFactor: number = 1.5
): Uint8ClampedArray {
  const hillshade = new Uint8ClampedArray(cols * rows);

  const sunZenithRad = ((90 - sunElevationDeg) * Math.PI) / 180;
  const sunAzimuthRad = ((360 - sunAzimuthDeg + 90) * Math.PI) / 180;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;

      // Handle boundaries
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        hillshade[idx] = 180;
        continue;
      }

      // Horn's method 3x3 kernel:
      // [a b c]
      // [d e f]
      // [g h i]
      const a = grid[r - 1][c - 1];
      const b = grid[r - 1][c];
      const d = grid[r][c - 1];
      const f = grid[r][c + 1];
      const g = grid[r + 1][c - 1];
      const h = grid[r + 1][c];
      const i = grid[r + 1][c + 1];
      const cVal = grid[r - 1][c + 1];

      const dzdx = ((cVal + 2 * f + i) - (a + 2 * d + g)) / (8 * cellSizeMeters);
      const dzdy = ((g + 2 * h + i) - (a + 2 * b + cVal)) / (8 * cellSizeMeters);

      const slopeRad = Math.atan(zFactor * Math.hypot(dzdx, dzdy));
      let aspectRad = 0;
      if (dzdx !== 0) {
        aspectRad = Math.atan2(dzdy, -dzdx);
        if (aspectRad < 0) aspectRad += 2 * Math.PI;
      } else {
        aspectRad = dzdy > 0 ? Math.PI / 2 : (dzdy < 0 ? (3 * Math.PI) / 2 : 0);
      }

      // Hillshade formula
      const shade =
        Math.cos(sunZenithRad) * Math.cos(slopeRad) +
        Math.sin(sunZenithRad) * Math.sin(slopeRad) * Math.cos(sunAzimuthRad - aspectRad);

      hillshade[idx] = Math.max(0, Math.min(255, Math.round(shade * 255)));
    }
  }

  return hillshade;
}
