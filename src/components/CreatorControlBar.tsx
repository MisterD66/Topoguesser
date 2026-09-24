/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LatLng } from '../types/game';
import {
  Sparkles,
  MapPin,
  Save,
  FolderHeart,
  Play,
  Sliders,
  Check,
  Clock,
  EyeOff,
  Eye,
  CircleDot,
  Camera,
  AlertTriangle,
  Move,
  RotateCw,
  Download,
} from 'lucide-react';

interface CreatorControlBarProps {
  creatorPos: LatLng;
  elevation: number;
  onElevationChange: (elev: number) => void;
  headingDeg: number;
  locationName: string;
  onLocationNameChange: (name: string) => void;
  mountainRange: string;
  onMountainRangeChange: (range: string) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  timeOfDayHour: number;
  onTimeOfDayHourChange: (hour: number) => void;
  difficulty: 'standard' | 'hard';
  onDifficultyChange: (diff: 'standard' | 'hard') => void;
  showSearchZone: boolean;
  onShowSearchZoneChange: (val: boolean) => void;
  searchZoneRadiusKm: number;
  onSearchZoneRadiusKmChange: (val: number) => void;
  activeTool: 'camera' | 'searchZone';
  onActiveToolChange: (tool: 'camera' | 'searchZone') => void;
  searchZoneCenter: LatLng | null;
  onSearchZoneCenterChange: (pos: LatLng) => void;
  onAutoOffsetSearchZone: () => void;
  distanceToCenterKm?: number;
  onSavePlace: () => void;
  onOpenCuratedModal: () => void;
  onDownloadCampaign?: () => void;
  onTestPlay: () => void;
  savedCount: number;
  justSaved: boolean;
  className?: string;
}

export const CreatorControlBar: React.FC<CreatorControlBarProps> = ({
  creatorPos,
  elevation,
  onElevationChange,
  headingDeg,
  locationName,
  onLocationNameChange,
  mountainRange,
  onMountainRangeChange,
  description,
  onDescriptionChange,
  timeOfDayHour,
  onTimeOfDayHourChange,
  difficulty,
  onDifficultyChange,
  showSearchZone,
  onShowSearchZoneChange,
  searchZoneRadiusKm,
  onSearchZoneRadiusKmChange,
  activeTool,
  onActiveToolChange,
  searchZoneCenter,
  onSearchZoneCenterChange,
  onAutoOffsetSearchZone,
  distanceToCenterKm = 0,
  onSavePlace,
  onOpenCuratedModal,
  onDownloadCampaign,
  onTestPlay,
  savedCount,
  justSaved,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isInsideCircle = distanceToCenterKm <= searchZoneRadiusKm;

  return (
    <div
      className={`bg-stone-900/95 backdrop-blur-md border-t border-stone-800 px-3 py-2 sm:px-4 sm:py-2.5 z-30 shadow-2xl ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top summary row: Mode badge, Tool Switcher, Name input, Altitude, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Mode Badge & Interactive Tool Switcher (3D-Kamera vs Suchkreis) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="hidden sm:inline">Creator-Modus</span>
            </div>

            {/* Click tool switch: Camera or Search Zone */}
            <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700 text-xs">
              <button
                type="button"
                onClick={() => onActiveToolChange('camera')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                  activeTool === 'camera'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Klick in die 2D-Karte platziert den 3D-Kamerastandort"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => onActiveToolChange('searchZone')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                  activeTool === 'searchZone'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Klick in die 2D-Karte oder Ziehen des Markers platziert den Suchkreis"
              >
                <CircleDot className="w-3.5 h-3.5" />
                <span>Suchkreis</span>
              </button>
            </div>
          </div>

          {/* Center: Editable Name Input */}
          <div className="flex-1 min-w-[160px] max-w-sm">
            <input
              type="text"
              value={locationName}
              onChange={(e) => onLocationNameChange(e.target.value)}
              placeholder="Name des Ortes (z.B. Gruttenhütte Blick)"
              className="w-full px-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs font-semibold text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Center-Right: Quick parameters (Höhe, Zeit, Modus) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Elevation */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono-numbers">
              <span className="text-amber-400 font-semibold">Höhe:</span>
              <input
                type="number"
                min={400}
                max={4000}
                step={25}
                value={elevation}
                onChange={(e) => onElevationChange(Math.max(300, Math.min(4200, parseInt(e.target.value) || 1200)))}
                className="w-14 bg-transparent text-white font-bold focus:outline-none text-right"
              />
              <span className="text-stone-400">m</span>
            </div>

            {/* Time of day quick preview */}
            <div className="flex items-center gap-1 px-2 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono-numbers text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {Math.floor(timeOfDayHour).toString().padStart(2, '0')}:
                {Math.floor((timeOfDayHour % 1) * 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Difficulty quick badge */}
            <button
              onClick={() => onDifficultyChange(difficulty === 'standard' ? 'hard' : 'standard')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                difficulty === 'hard'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              }`}
              title="Klicken zum Umschalten der Schwierigkeit"
            >
              {difficulty === 'hard' ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Schwer</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Standard</span>
                </>
              )}
            </button>

            {/* Toggle expanded parameters */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
              }`}
              title="Alle Parameter (Sonnenstand, Suchkreis-Optionen) öffnen"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Optionen</span>
            </button>
          </div>

          {/* Right: Actions (Save, Collection, Play) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onSavePlace}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                justSaved
                  ? 'bg-emerald-500 text-stone-950 scale-105'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95'
              }`}
              title="Diesen Aussichtspunkt in deiner Sammlung speichern"
            >
              {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{justSaved ? 'Gespeichert!' : 'Ort speichern'}</span>
            </button>

            <button
              onClick={onOpenCuratedModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-medium text-stone-200 hover:text-white transition-colors cursor-pointer"
              title="Kuratierte Orte verwalten"
            >
              <FolderHeart className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Sammlung</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-700 text-amber-300 font-mono-numbers text-[10px]">
                {savedCount}
              </span>
            </button>

            {onDownloadCampaign && (
              <button
                onClick={onDownloadCampaign}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="Aktuelle Orte als .campaign.json herunterladen"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              onClick={onTestPlay}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              title="Diesen Ort jetzt als Rätsel spielen"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Testspiel</span>
            </button>
          </div>
        </div>

        {/* Expandable row: Fine-tuning for Creator */}
        {isExpanded && (
          <div className="pt-2 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            {/* 1. Time of Day slider (Fix im Creator festgelegt!) */}
            <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Fixe Sonnenzeit:
                </span>
                <span className="text-amber-400 font-mono-numbers font-bold">
                  {Math.floor(timeOfDayHour).toString().padStart(2, '0')}:
                  {Math.floor((timeOfDayHour % 1) * 60).toString().padStart(2, '0')} Uhr
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="21"
                step="0.5"
                value={timeOfDayHour}
                onChange={(e) => onTimeOfDayHourChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <button onClick={() => onTimeOfDayHourChange(7)} className="hover:text-amber-300 cursor-pointer">07:00 Morgen</button>
                <button onClick={() => onTimeOfDayHourChange(12)} className="hover:text-amber-300 cursor-pointer">12:00 Mittag</button>
                <button onClick={() => onTimeOfDayHourChange(18.5)} className="hover:text-amber-300 cursor-pointer">18:30 Abend</button>
              </div>
            </div>

            {/* 2. Difficulty Level: Standard vs Hard (No compass & no visier) */}
            <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800">
              <div className="text-[11px] text-stone-300 font-semibold">
                Schwierigkeitsgrad für dieses Rätsel:
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onDifficultyChange('standard')}
                  className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    difficulty === 'standard'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold'
                      : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="text-xs">Standard</div>
                  <div className="text-[10px] text-stone-400">Kompass & Visier an</div>
                </button>
                <button
                  type="button"
                  onClick={() => onDifficultyChange('hard')}
                  className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    difficulty === 'hard'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold'
                      : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="text-xs">Schwer</div>
                  <div className="text-[10px] text-stone-400">Kein Kompass, kein Visier</div>
                </button>
              </div>
            </div>

            {/* 3. Rot-Blau gestrichelter Suchkreis: Einzeichnen, Radius & Verschieben */}
            <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-300 font-semibold flex items-center gap-1">
                  <CircleDot className="w-3.5 h-3.5 text-blue-400" />
                  Suchkreis einzeichnen:
                </span>
                <button
                  type="button"
                  onClick={() => onShowSearchZoneChange(!showSearchZone)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    showSearchZone
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  {showSearchZone ? 'Aktiviert' : 'Aus'}
                </button>
              </div>

              {showSearchZone && (
                <div className="space-y-2 pt-1">
                  {/* Radius Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono-numbers">
                      <span>Radius:</span>
                      <span className="text-blue-400 font-bold">{searchZoneRadiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={searchZoneRadiusKm}
                      onChange={(e) => onSearchZoneRadiusKmChange(parseInt(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Positioning Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onActiveToolChange('searchZone')}
                      className={`flex-1 py-1 px-1.5 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        activeTool === 'searchZone'
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                      }`}
                      title="Klicke in die Karte oder ziehe das blaue Zentrum auf der Karte"
                    >
                      <Move className="w-3 h-3 text-blue-400" />
                      <span>Klick-Platzieren</span>
                    </button>

                    <button
                      type="button"
                      onClick={onAutoOffsetSearchZone}
                      className="py-1 px-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Platziert den Suchkreis automatisch dezentralisiert um den Kamerastandort (Ziel nicht mittig)"
                    >
                      <RotateCw className="w-3 h-3 text-amber-400" />
                      <span>Dezentral</span>
                    </button>
                  </div>

                  {/* Distance validation status indicator */}
                  <div className="pt-0.5">
                    {isInsideCircle ? (
                      <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Kamera liegt im Suchkreis ({distanceToCenterKm.toFixed(1)} km)</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Kamera liegt außerhalb des Kreises ({distanceToCenterKm.toFixed(1)} km &gt; {searchZoneRadiusKm} km)!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Mountain Range & Info */}
            <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800">
              <label className="text-[11px] text-stone-300 font-semibold">Gebirgsgruppe & Hinweis:</label>
              <input
                type="text"
                value={mountainRange}
                onChange={(e) => onMountainRangeChange(e.target.value)}
                placeholder="z.B. Hohe Tauern, Kaisergebirge"
                className="w-full px-2.5 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Rätsel-Hinweis (z.B. Südwand-Blick)"
                className="w-full px-2.5 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
