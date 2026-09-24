/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyStats, RoundResult } from '../types/game';
import { generateShareText } from '../utils/dailySeed';
import { formatDistance } from '../utils/geoUtils';
import { Trophy, Share2, Flame, RotateCcw, Check, Sparkles, Mountain } from 'lucide-react';

interface DailySummaryModalProps {
  stats: DailyStats;
  rounds: RoundResult[];
  onPlayPractice: () => void;
  onClose: () => void;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  stats,
  rounds,
  onPlayPractice,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = rounds.length * 5000;

  const handleShare = async () => {
    const text = generateShareText(stats, rounds);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="bg-gradient-to-b from-stone-800 to-stone-900 p-6 text-center border-b border-stone-800 relative">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
            Daily Challenge #{stats.date}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white mt-1">
            {totalScore.toLocaleString()}{' '}
            <span className="text-xl text-stone-400 font-normal">/ {maxPossible.toLocaleString()}</span>
          </h2>

          {/* Daily Streak Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono-numbers">
            <Flame className="w-4 h-4 fill-orange-400" />
            <span className="font-semibold">{stats.streak} Day Streak</span>
          </div>
        </div>

        {/* Round by Round Breakdown List */}
        <div className="p-5 space-y-2.5 overflow-y-auto flex-1">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Rounds Breakdown
          </div>

          {rounds.map((round, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/80 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-[11px]">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-semibold text-stone-100">{round.location.name}</div>
                  <div className="text-stone-400 text-[11px]">
                    {round.location.bundesland} · Error: {formatDistance(round.distanceKm)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-numbers font-bold text-amber-400 text-sm">
                  {round.score.toLocaleString()} pts
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {copied ? <Check className="w-4 h-4 text-stone-950" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
          </button>

          <button
            onClick={onPlayPractice}
            className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Mountain className="w-4 h-4" />
            <span>Practice Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
