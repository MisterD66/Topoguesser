/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Sparkles } from 'lucide-react';

interface TopBarProps {
  roundNumber: number;
  totalRounds: number;
  totalScore: number;
  isCreatorMode?: boolean;
  onOpenSettings: () => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  roundNumber,
  totalRounds = 10,
  totalScore,
  isCreatorMode = false,
  onOpenSettings,
  className = '',
}) => {
  return (
    <header
      className={`h-11 bg-stone-950 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between z-40 select-none ${className}`}
    >
      {/* Left: Round Indicator (or Creator Mode badge) */}
      <div className="flex items-center gap-2">
        {isCreatorMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Creator-Modus</span>
          </div>
        ) : (
          <span className="text-xs sm:text-sm font-mono-numbers font-semibold text-stone-200">
            Round <strong className="text-white font-bold">{roundNumber}</strong>/{totalRounds}
          </span>
        )}
      </div>

      {/* Center: Total Score */}
      <div className="flex items-center gap-1.5 font-mono-numbers text-xs sm:text-sm">
        <span className="text-amber-400 font-bold">{totalScore.toLocaleString()} pts</span>
      </div>

      {/* Right: Zahnrad (Settings/Gear Button for Password Access) */}
      <div className="flex items-center">
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 rounded-lg transition-colors cursor-pointer"
          title="Creator-Zugang"
          aria-label="Creator-Zugang"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
