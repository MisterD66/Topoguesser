/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings, DifficultyLevel } from '../types/game';
import { X, Sliders, Compass, Mountain, Eye, Layers, Sun, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const setDifficultyPreset = (level: DifficultyLevel) => {
    switch (level) {
      case 'explorer':
        onUpdateSettings({
          difficulty: 'explorer',
          showCompassTape: true,
          showSummitLabels: true,
          showMapVisionCone: true,
          showElevationClue: true,
          showShadedRelief: true,
          contourInterval: 50,
        });
        break;
      case 'hiker':
        onUpdateSettings({
          difficulty: 'hiker',
          showCompassTape: true,
          showSummitLabels: false,
          showMapVisionCone: false,
          showElevationClue: true,
          showShadedRelief: true,
          contourInterval: 50,
        });
        break;
      case 'alpinist':
        onUpdateSettings({
          difficulty: 'alpinist',
          showCompassTape: false,
          showSummitLabels: false,
          showMapVisionCone: false,
          showElevationClue: false,
          showShadedRelief: true,
          contourInterval: 50,
        });
        break;
      case 'extrem':
        onUpdateSettings({
          difficulty: 'extrem',
          showCompassTape: false,
          showSummitLabels: false,
          showMapVisionCone: false,
          showElevationClue: false,
          showShadedRelief: false,
          contourInterval: 25,
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-white">Cartography & Difficulty</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Difficulty Presets */}
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              Difficulty Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'explorer', name: 'Explorer', desc: 'All aids & tags' },
                { id: 'hiker', name: 'Hiker', desc: 'Standard alpine rules' },
                { id: 'alpinist', name: 'Alpinist', desc: 'No compass, pure topo' },
                { id: 'extrem', name: 'Extrem', desc: 'Contour lines only' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setDifficultyPreset(lvl.id as DifficultyLevel)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    settings.difficulty === lvl.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-stone-800/60 border-stone-700 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold text-sm">{lvl.name}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Feature Toggles */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
              Cartographic Visual Features
            </label>

            {/* Compass Heading Ribbon */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-stone-200">Compass Heading Tape</div>
                  <div className="text-xs text-stone-400">360° heading ribbon in 3D Horizon view</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showCompassTape}
                onChange={(e) => onUpdateSettings({ showCompassTape: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
              />
            </div>

            {/* Map Vision Cone */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-stone-200">Map Vision Cone</div>
                  <div className="text-xs text-stone-400">Display observer sight frustum on 2D map</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showMapVisionCone}
                onChange={(e) => onUpdateSettings({ showMapVisionCone: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
              />
            </div>

            {/* Shaded Relief */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-stone-200">Shaded Relief (Hillshade)</div>
                  <div className="text-xs text-stone-400">Analytical sun hillshading on 2D map</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showShadedRelief}
                onChange={(e) => onUpdateSettings({ showShadedRelief: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
              />
            </div>

            {/* Observer Altitude Clue */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Mountain className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-stone-200">Observer Altitude Clue</div>
                  <div className="text-xs text-stone-400">Display observer station altitude</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showElevationClue}
                onChange={(e) => onUpdateSettings({ showElevationClue: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
              />
            </div>

            {/* Contour Line Interval */}
            <div className="pt-2">
              <div className="text-sm font-medium text-stone-200 mb-1.5">Contour Line Spacing (Δh)</div>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => onUpdateSettings({ contourInterval: interval as 25 | 50 | 100 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono-numbers border transition-colors ${
                      settings.contourInterval === interval
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    Δ {interval} m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
          >
            Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};
