/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CampaignMeta } from '../types/campaign';
import {
  Mountain,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle,
  MapPin,
  Flame,
  Layers,
} from 'lucide-react';
import { loadCampaignProgress, clearCampaignProgress } from '../utils/campaignLoader';

interface StartScreenProps {
  campaigns: CampaignMeta[];
  onSelectCampaign: (campaign: CampaignMeta, resumeFromSaved?: boolean) => void;
  onOpenCreator: () => void;
  onResetProgress: (campaignId: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  campaigns,
  onSelectCampaign,
  onOpenCreator,
  onResetProgress,
}) => {
  return (
    <div className="w-full h-full bg-stone-950 text-stone-100 overflow-y-auto select-none flex flex-col justify-between">
      {/* Background ambient alpine glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-stone-900/10 to-transparent" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-between">
        {/* Top Section */}
        <div>
          {/* Header / Hero */}
          <header className="text-center space-y-3 mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
              <Mountain className="w-8 h-8 sm:w-11 h-11 text-amber-500 stroke-[2]" />
              <span>TOPOGUESSER</span>
            </h1>

            <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto font-medium">
              Erkenne markante Berggipfel und Täler im realistischen 3D-Rundumblick und setze deinen
              Pin auf der topographischen 2D-Karte.
            </p>
          </header>

          {/* Campaign Selection Section */}
          <section className="space-y-4 mb-8">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Verfügbare Kampagnen</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                  {campaigns.length}
                </span>
              </h2>
            </div>

            {/* Grid of Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const progress = loadCampaignProgress(camp.id);
                const maxPoints = camp.places.length * 5000;
                const hasStarted = Boolean(progress && progress.roundIndex > 0);
                const isCompleted = Boolean(
                  progress &&
                  (progress.completed || progress.roundIndex >= camp.places.length)
                );

                return (
                  <div
                    key={camp.id}
                    className="group relative bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
                  >
                    {/* Top Bar inside Card */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-800 text-amber-300 border border-stone-700">
                            {camp.region || 'Österreich'}
                          </span>
                          {camp.difficulty === 'hard' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-rose-400" />
                              Alpin
                            </span>
                          )}
                          {!camp.isBuiltIn && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Benutzerdefiniert
                            </span>
                          )}
                        </div>

                        {/* Station count */}
                        <span className="text-xs font-mono-numbers text-stone-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          <strong className="text-stone-200">{camp.places.length}</strong> Stationen
                        </span>
                      </div>

                      {/* Campaign Title & Subtitle */}
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        {camp.title}
                      </h3>

                      {camp.subtitle && (
                        <p className="text-xs font-medium text-amber-400/90 mt-0.5 mb-1.5">
                          {camp.subtitle}
                        </p>
                      )}

                      {camp.description && (
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>
                      )}
                    </div>

                    {/* Progress & Action Area */}
                    <div className="mt-5 pt-3.5 border-t border-stone-800/80 flex items-center justify-between gap-3">
                      {/* Progress Status */}
                      <div className="text-xs">
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono-numbers">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>
                              {progress?.totalScore?.toLocaleString() || 0} / {maxPoints.toLocaleString()} Pkt
                            </span>
                          </div>
                        ) : hasStarted && progress ? (
                          <div className="text-stone-300 font-mono-numbers text-[11px]">
                            <span className="text-amber-400 font-bold">Runde {progress.roundIndex + 1}</span>
                            /{camp.places.length} · {progress.totalScore.toLocaleString()} Pkt
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[11px] font-medium">
                            Noch nicht gespielt
                          </span>
                        )}
                      </div>

                      {/* Play / Resume Buttons */}
                      <div className="flex items-center gap-2">
                        {hasStarted && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              clearCampaignProgress(camp.id);
                              onResetProgress(camp.id);
                            }}
                            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                            title="Von vorne beginnen"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectCampaign(camp, hasStarted && !isCompleted)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {isCompleted
                              ? 'Erneut spielen'
                              : hasStarted
                              ? 'Fortsetzen'
                              : 'Starten'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom Footer: Credits & subtle blue star */}
        <footer className="pt-4 mt-6 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
          <div className="text-xs text-stone-400 font-medium">
            Created by Gemini &amp; MisterD
          </div>

          {/* Inconspicuous subtle blue star icon for Creator mode */}
          <button
            type="button"
            onClick={onOpenCreator}
            className="p-1.5 rounded-lg text-blue-400/50 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
            title="Creator-Modus"
            aria-label="Creator"
          >
            <Sparkles className="w-4 h-4 text-blue-400/70" />
          </button>
        </footer>
      </div>
    </div>
  );
};
