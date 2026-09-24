/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CuratedPlace } from '../types/game';
import {
  X,
  MapPin,
  Mountain,
  Eye,
  Play,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  Plus,
  Compass,
} from 'lucide-react';

interface CuratedPlacesModalProps {
  places: CuratedPlace[];
  onSelectPlace: (place: CuratedPlace) => void;
  onPlayPlace: (place: CuratedPlace) => void;
  onDeletePlace: (id: string) => void;
  onImportPlaces: (jsonStr: string) => void;
  onClose: () => void;
}

export const CuratedPlacesModal: React.FC<CuratedPlacesModalProps> = ({
  places,
  onSelectPlace,
  onPlayPlace,
  onDeletePlace,
  onImportPlaces,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlaces = places.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mountainRange.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bundesland.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyJSON = () => {
    const json = JSON.stringify(places, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(places, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topoguesser-kuratierte-orte-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunImport = () => {
    try {
      onImportPlaces(importText);
      setShowImport(false);
      setImportText('');
      setImportError(null);
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Kuratierte Orte Sammlung</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 font-mono-numbers font-semibold">
                  {places.length}
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Deine gespeicherten 3D-Aussichtspunkte in den österreichischen Alpen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar (Search, Export, Import) */}
        <div className="px-5 py-3 bg-stone-950/40 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <input
            type="text"
            placeholder="Orte durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-stone-800/80 border border-stone-700/80 rounded-lg text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              title="Als JSON in die Zwischenablage kopieren"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              title="JSON-Datei herunterladen"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              title="Orte aus JSON importieren"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Import Drawer */}
        {showImport && (
          <div className="p-4 bg-stone-950 border-b border-stone-800 space-y-2.5 animate-in fade-in duration-150">
            <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
              <span>JSON-Daten einfügen:</span>
              <button
                onClick={() => setShowImport(false)}
                className="text-stone-400 hover:text-white text-[11px]"
              >
                Abbrechen
              </button>
            </div>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[ { "id": "...", "name": "...", "observerPos": { "lat": 47.1, "lng": 12.3 } ... } ]'
              className="w-full p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500"
            />
            {importError && <p className="text-xs text-rose-400">{importError}</p>}
            <button
              onClick={handleRunImport}
              disabled={!importText.trim()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg transition-colors"
            >
              Orte importieren
            </button>
          </div>
        )}

        {/* Places List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-stone-800/40">
          {filteredPlaces.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Mountain className="w-10 h-10 mx-auto text-stone-600 stroke-[1.5]" />
              <p className="text-sm font-medium">Keine Orte gefunden</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Setze im Creator-Modus den Pin auf der Karte, blicke dich in 3D um und klicke auf "Ort speichern".
              </p>
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-800/40 hover:bg-stone-800/70 border border-stone-800/80 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">📍</span>
                    <h3 className="font-bold text-sm text-white">{place.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-700/70 text-stone-300 font-semibold font-mono-numbers">
                      {place.observerElevation} m
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                    <span className="text-stone-300 font-medium">{place.mountainRange}</span>
                    <span>·</span>
                    <span className="text-amber-400/80 font-mono-numbers">
                      Blick {place.initialHeading}°
                    </span>
                    <span>·</span>
                    <span className="text-stone-400">{place.bundesland}</span>
                  </div>

                  {place.description && (
                    <p className="text-xs text-stone-400 line-clamp-1 italic">{place.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onSelectPlace(place);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    title="Im 3D-Creator-Modus ansehen & bearbeiten"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>3D ansehen</span>
                  </button>

                  <button
                    onClick={() => {
                      onPlayPlace(place);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    title="Diesen Ort jetzt erraten (Practice Mode)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Spielen</span>
                  </button>

                  <button
                    onClick={() => onDeletePlace(place.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-700/50 rounded-lg transition-colors"
                    title="Ort löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between text-xs text-stone-400">
          <span>Tipp: Klicke auf "3D ansehen", um die Kameraposition in Echtzeit zu prüfen.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
