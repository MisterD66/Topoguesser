/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Sparkles, ChevronLeft, Mountain, Timer } from 'lucide-react';
import { formatDigitalTimer } from '../utils/geoUtils';

interface TopBarProps {
  roundNumber: number;
  totalRounds: number;
  totalScore: number;
  campaignTitle?: string;
  isCreatorMode?: boolean;
  roundElapsedSeconds?: number;
  onBackToStartScreen?: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  roundNumber,
  totalRounds = 5,
  totalScore,
  campaignTitle,
  isCreatorMode = false,
  roundElapsedSeconds,
  onBackToStartScreen,
  onOpenSettings,
  className = '',
}) => {
  return (
    <header
      className={`h-11 bg-stone-950 border-b border-stone-800 px-3 sm:px-5 flex items-center justify-between z-40 select-none ${className}`}
    >
      {/* Left: Back to Campaign List / Round Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onBackToStartScreen && (
          <button
            onClick={onBackToStartScreen}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
            title="Zurück zur Kampagnenübersicht"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Kampagnen</span>
          </button>
        )}

        {isCreatorMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Creator-Modus</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-mono-numbers font-semibold text-stone-200">
              Round <strong className="text-white font-bold">{roundNumber}</strong>/{totalRounds}
            </span>
            {campaignTitle && (
              <span className="hidden md:inline-block text-xs text-stone-400 max-w-[200px] truncate border-l border-stone-800 pl-2">
                {campaignTitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center: Live Timer & Total Score */}
      <div className="flex items-center gap-2.5 sm:gap-4 font-mono-numbers text-xs sm:text-sm">
        {typeof roundElapsedSeconds === 'number' && !isCreatorMode && (
          <div
            className="flex items-center gap-1 text-stone-300 bg-stone-900/90 border border-stone-800 px-2 py-0.5 rounded-lg shadow-inner text-xs"
            title="Verstrichene Zeit dieser Runde"
          >
            <Timer className="w-3.5 h-3.5 text-amber-400/90 animate-pulse" />
            <span className="font-semibold text-stone-200">{formatDigitalTimer(roundElapsedSeconds)}</span>
          </div>
        )}

        <span className="text-amber-400 font-bold">{totalScore.toLocaleString()} pts</span>
      </div>

      {/* Right: Zahnrad (Settings/Gear Button for Password Access) */}
      <div className="flex items-center gap-1">
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
