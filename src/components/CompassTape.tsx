/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { headingToCardinal } from '../utils/geoUtils';

interface CompassTapeProps {
  headingDeg: number; // 0 to 360
  fovDeg?: number;
  className?: string;
}

export const CompassTape: React.FC<CompassTapeProps> = ({
  headingDeg,
  fovDeg = 75,
  className = '',
}) => {
  const normalizedHeading = ((headingDeg % 360) + 360) % 360;
  const cardinal = headingToCardinal(normalizedHeading);

  // Generate tick marks for visible range (+/- half FOV plus margin)
  const ticks = useMemo(() => {
    const list: Array<{
      deg: number;
      label?: string;
      isCardinal: boolean;
      isMajor: boolean;
    }> = [];

    // Span from -180 to +540 so wrap-around is continuous
    for (let deg = 0; deg < 360; deg += 5) {
      const isCardinal = deg % 45 === 0;
      const isMajor = deg % 10 === 0;
      let label: string | undefined;

      if (deg === 0) label = 'N';
      else if (deg === 45) label = 'NE';
      else if (deg === 90) label = 'E';
      else if (deg === 135) label = 'SE';
      else if (deg === 180) label = 'S';
      else if (deg === 225) label = 'SW';
      else if (deg === 270) label = 'W';
      else if (deg === 315) label = 'NW';
      else if (isMajor) label = `${deg}°`;

      list.push({ deg, label, isCardinal, isMajor });
    }

    return list;
  }, []);

  // Calculate pixel translation for compass tape
  // Tape width corresponds to 360 degrees
  // Let 1 degree = 6px
  const degPx = 6;
  const tapeWidth = 360 * degPx;
  const offset = -normalizedHeading * degPx;

  return (
    <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Background glass strip */}
      <div className="h-10 bg-stone-950/60 backdrop-blur-md border-b border-stone-800/80 flex items-center justify-center relative shadow-sm">
        
        {/* Moving ticks strip (duplicated 3 times for seamless wrapping) */}
        <div className="absolute top-0 bottom-0 left-1/2 flex items-center">
          {[-1, 0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="absolute top-0 bottom-0 flex items-center"
              style={{
                transform: `translateX(${offset + copyIndex * tapeWidth}px)`,
                width: `${tapeWidth}px`,
              }}
            >
              {ticks.map((tick) => {
                const tickLeft = tick.deg * degPx;
                return (
                  <div
                    key={tick.deg}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: `${tickLeft}px`, transform: 'translateX(-50%)' }}
                  >
                    {tick.label && (
                      <span
                        className={`text-[10px] font-mono-numbers tracking-tight mb-0.5 leading-none ${
                          tick.isCardinal
                            ? tick.deg === 0
                              ? 'text-red-400 font-bold text-[11px]'
                              : 'text-amber-300 font-semibold'
                            : 'text-stone-400 text-[9px]'
                        }`}
                      >
                        {tick.label}
                      </span>
                    )}
                    <div
                      className={`w-[1px] ${
                        tick.isCardinal
                          ? 'h-3 bg-amber-400'
                          : tick.isMajor
                          ? 'h-2.5 bg-stone-300'
                          : 'h-1.5 bg-stone-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Center reticle needle */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between pointer-events-none z-10">
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-5 border-t-amber-400" />
          <div className="w-[1.5px] h-full bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          <div className="w-0 h-0 border-x-4 border-x-transparent border-b-5 border-b-amber-400" />
        </div>

        {/* Real-time heading readout floating pill */}
        <div className="absolute right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-900/90 border border-stone-700/80 text-xs font-mono-numbers text-stone-200 shadow-md">
          <span className="font-bold text-amber-300">{Math.round(normalizedHeading)}°</span>
          <span className="text-stone-400 text-[11px]">{cardinal}</span>
        </div>
      </div>
    </div>
  );
};
