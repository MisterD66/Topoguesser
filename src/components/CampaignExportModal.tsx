/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CuratedPlace } from '../types/game';
import { CampaignFile } from '../types/campaign';
import { downloadCampaignFile } from '../utils/campaignLoader';
import {
  Download,
  X,
  FileJson,
  CheckCircle2,
  FolderPlus,
  Mountain,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

interface CampaignExportModalProps {
  places: CuratedPlace[];
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaign: CampaignFile) => void;
}

export const CampaignExportModal: React.FC<CampaignExportModalProps> = ({
  places,
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [title, setTitle] = useState('Meine Alpen-Kampagne');
  const [subtitle, setSubtitle] = useState('Ausgewählte Rundblicke');
  const [description, setDescription] = useState(
    'Finde und verorte die Aussichtspunkte anhand des 3D-Panoramas auf der topographischen Karte.'
  );
  const [region, setRegion] = useState<string>(places[0]?.bundesland || 'Österreich');
  const [difficulty, setDifficulty] = useState<'standard' | 'hard'>('standard');
  const [author, setAuthor] = useState('');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(
    new Set(places.map((p) => p.id))
  );
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const togglePlace = (id: string) => {
    const next = new Set(selectedPlaceIds);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPlaceIds(next);
  };

  const selectedPlaces = places.filter((p) => selectedPlaceIds.has(p.id));

  const handleDownload = () => {
    if (selectedPlaces.length === 0) return;

    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `campaign-${Date.now()}`;

    const campaign: CampaignFile = {
      version: 1,
      id,
      title: title.trim() || 'Alpen-Kampagne',
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      region: region.trim() || 'Österreich',
      difficulty,
      author: author.trim() || undefined,
      createdAt: new Date().toISOString(),
      places: selectedPlaces,
    };

    downloadCampaignFile(campaign);
    if (onCampaignCreated) onCampaignCreated(campaign);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Kampagnendatei herunterladen</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                  .campaign.json
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Exportiere deine gespeicherten Orte als eigenständige Kampagne
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Metadata Form */}
          <div className="space-y-3 bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Titel der Kampagne:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Salzkammergut Seen & Gipfel"
                className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs font-semibold text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Untertitel:
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="z.B. 5 markante Aussichtspunkte"
                  className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Region / Bundesland:
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="z.B. Oberösterreich"
                  className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Beschreibung:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung für die Spieler..."
                className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Schwierigkeitsgrad:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDifficulty('standard')}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      difficulty === 'standard'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                        : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      difficulty === 'hard'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-semibold'
                        : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
                    }`}
                  >
                    Alpin / Schwer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Autor (optional):
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Dein Name oder Team"
                  className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Places selection list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                Enthaltene Orte ({selectedPlaces.length} von {places.length}):
              </span>
              <span className="text-[11px] text-stone-400 font-mono-numbers">
                Max. Punktzahl: {selectedPlaces.length * 5000} Pkt
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {places.map((place, idx) => {
                const isSelected = selectedPlaceIds.has(place.id);
                return (
                  <label
                    key={place.id}
                    onClick={() => togglePlace(place.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-stone-800/80 border-stone-700 text-white'
                        : 'bg-stone-900/40 border-stone-800/60 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded accent-amber-400"
                      />
                      <span className="font-mono-numbers text-stone-400 text-[11px] w-4">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold text-stone-200">{place.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono-numbers">
                      <span>{place.observerElevation} m</span>
                      <span>·</span>
                      <span>Blick {place.initialHeading}°</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* File Placement Explainer Box */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Einfaches Hinzufügen (auch im kompilierten Build):</strong>
              Kopiere die heruntergeladene Datei einfach in das Verzeichnis{' '}
              <code className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-amber-300 font-mono text-[11px]">
                docs/campaigns/
              </code>{' '}
              (bzw.{' '}
              <code className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-amber-300 font-mono text-[11px]">
                public/campaigns/
              </code>
              ) und trage den Dateinamen in <code className="text-stone-200 font-mono text-[11px]">index.json</code> ein.
              Die Kampagne erscheint sofort beim nächsten Start der App!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            onClick={handleDownload}
            disabled={selectedPlaces.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-500 text-stone-950 scale-105'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 hover:shadow-amber-500/25 active:scale-95'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Datei heruntergeladen!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Kampagnendatei herunterladen ({selectedPlaces.length} Orte)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
