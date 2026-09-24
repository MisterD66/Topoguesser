/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RoundResult } from '../types/game';
import { formatDistance } from '../utils/geoUtils';
import { ArrowRight, Mountain } from 'lucide-react';

interface RoundResultModalProps {
  result: RoundResult;
  roundNumber: number;
  totalRounds: number;
  onNextRound: () => void;
  isLastRound: boolean;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  result,
  roundNumber,
  totalRounds,
  onNextRound,
  isLastRound,
}) => {
  const { location, distanceKm, score } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        {/* Header Ribbon */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 uppercase tracking-wider font-semibold">
            <Mountain className="w-4 h-4 text-amber-500" />
            <span>Round {roundNumber} of {totalRounds}</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Big Score Card */}
          <div className="text-center py-2">
            <div className="text-xs text-stone-400 uppercase tracking-widest font-mono">Points Earned</div>
            <div className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono-numbers mt-1">
              +{score.toLocaleString()}
            </div>
            <div className="text-xs text-stone-400 mt-1 font-mono-numbers">
              Distance error: <strong className="text-white">{formatDistance(distanceKm)}</strong>
            </div>
          </div>

          {/* Location Reveal Details: Nur Überschrift & Freitext */}
          <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700 space-y-1.5">
            <h4 className="text-lg font-bold font-display text-white">{location.name}</h4>
            {location.description && (
              <p className="text-xs text-stone-300 leading-relaxed">{location.description}</p>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onNextRound}
            className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{isLastRound ? 'View Challenge Summary' : 'Next Round'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
