/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, RotateCcw, X, MapPin, Award, Timer, Clock } from 'lucide-react';
import { formatDuration } from '../utils/geoUtils';

interface CampaignSummaryModalProps {
  isOpen: boolean;
  totalScore: number;
  maxScore?: number;
  rounds: Array<{
    roundNumber: number;
    locationName: string;
    distanceKm: number;
    score: number;
    timeSpentSec?: number;
  }>;
  totalTimeSec?: number;
  onRestart: () => void;
  onClose: () => void;
}

export const CampaignSummaryModal: React.FC<CampaignSummaryModalProps> = ({
  isOpen,
  totalScore,
  maxScore = 50000,
  rounds,
  totalTimeSec,
  onRestart,
  onClose,
}) => {
  if (!isOpen) return null;

  const percent = Math.round((totalScore / maxScore) * 100);

  const getRank = (score: number) => {
    const ratio = maxScore > 0 ? score / maxScore : 0;
    if (ratio >= 0.9) return { title: 'Legendärer Alpin-Meister', color: 'text-amber-400' };
    if (ratio >= 0.75) return { title: 'Erfahrener Bergführer', color: 'text-emerald-400' };
    if (ratio >= 0.55) return { title: 'Sicherer Gipfelstürmer', color: 'text-sky-400' };
    if (ratio >= 0.35) return { title: 'Ambitionierter Wanderer', color: 'text-indigo-400' };
    return { title: 'Alpen-Entdecker', color: 'text-stone-300' };
  };

  const rank = getRank(totalScore);

  // Compute total time from individual rounds if not explicitly given
  const calculatedTotalTimeSec =
    typeof totalTimeSec === 'number' && totalTimeSec > 0
      ? totalTimeSec
      : rounds.reduce((sum, r) => sum + (r.timeSpentSec || 0), 0);

  const averageTimeSec =
    rounds.length > 0 && calculatedTotalTimeSec > 0
      ? Math.round(calculatedTotalTimeSec / rounds.length)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 text-stone-100 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b border-stone-800 shrink-0">
          <div className="inline-flex p-3 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Kampagne abgeschlossen!</h2>
          <div className={`text-sm font-semibold ${rank.color} flex items-center justify-center gap-1.5`}>
            <Award className="w-4 h-4" />
            <span>{rank.title}</span>
          </div>

          <div className="pt-2">
            <div className="text-3xl font-bold font-mono-numbers text-amber-400">
              {totalScore.toLocaleString()}
              <span className="text-base text-stone-400 font-normal"> / {maxScore.toLocaleString()} pts</span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">{percent}% der maximalen Punktzahl erreicht</div>
          </div>

          {/* Time Stats Box */}
          {calculatedTotalTimeSec > 0 && (
            <div className="mt-3 flex items-center justify-center gap-4 py-2 px-4 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300">
              <div className="flex items-center gap-1.5 font-mono-numbers">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Gesamtzeit:</span>
                <strong className="text-white font-bold">{formatDuration(calculatedTotalTimeSec)}</strong>
              </div>
              {averageTimeSec > 0 && (
                <>
                  <span className="text-stone-700">|</span>
                  <div className="flex items-center gap-1.5 font-mono-numbers text-stone-400">
                    <Timer className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ø pro Aufgabe:</span>
                    <strong className="text-stone-200">{formatDuration(averageTimeSec)}</strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Rounds Breakdown */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 my-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 px-1 pb-1">
            <span>Aufgaben / Stationen</span>
            <span>Zeit &amp; Punkte</span>
          </div>

          {rounds.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs gap-2"
            >
              {/* Left: Round & Location */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-stone-800 shrink-0 flex items-center justify-center font-mono-numbers font-bold text-stone-300 text-[11px]">
                  {r.roundNumber}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate max-w-[170px] sm:max-w-[210px]">
                    {r.locationName}
                  </div>
                  <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{r.distanceKm.toFixed(1)} km Abweichung</span>
                  </div>
                </div>
              </div>

              {/* Right: Round Time & Score */}
              <div className="flex items-center gap-3 shrink-0">
                {typeof r.timeSpentSec === 'number' && r.timeSpentSec > 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800/90 text-stone-300 font-mono-numbers text-[11px] border border-stone-700/60"
                    title={`Benötigte Zeit für Aufgabe ${r.roundNumber}: ${formatDuration(r.timeSpentSec)}`}
                  >
                    <Timer className="w-3 h-3 text-amber-400/90" />
                    <span>{formatDuration(r.timeSpentSec)}</span>
                  </div>
                )}

                <div className="font-mono-numbers font-bold text-amber-400 text-sm min-w-[58px] text-right">
                  +{r.score.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note & Actions */}
        <div className="pt-3 border-t border-stone-800 space-y-2.5 shrink-0">
          <p className="text-[11px] text-stone-500 text-center">
            Die gemessene Zeit dient als persönliche Statistik und beeinflusst den Punktestand nicht.
          </p>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kampagne neu starten</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
