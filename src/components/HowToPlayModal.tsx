/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Compass, Mountain, Map, Sun, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-white">How to Play Topoguesser</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-stone-300 leading-relaxed">
          {/* Section 1: The Goal */}
          <div>
            <h4 className="text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">Objective</h4>
            <p>
              You are standing at an iconic mountain vantage point in the Austrian Alps.
              Your mission is to deduce your exact geographic location by matching the <strong>3D Horizon View</strong> with the <strong>2D Topographic Map</strong>.
            </p>
          </div>

          {/* Section 2: 3D Horizon Panorama */}
          <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-700/80 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Top Half: 3D Horizon View</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
              <li><strong>Drag horizontally</strong> to pan 360° around the horizon.</li>
              <li>Read the <strong>Compass Heading Tape</strong> at the top to check your bearings (N, E, S, W).</li>
              <li>Watch the <strong>Sun Position & Lighting</strong>: illuminated mountain faces point toward the sun.</li>
              <li>Notice valleys, glaciated cirques, ridges, and alpine lakes below.</li>
            </ul>
          </div>

          {/* Section 3: 2D Topo Map */}
          <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-700/80 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Map className="w-4 h-4 text-amber-400" />
              <span>Bottom Half: 2D Topographic Map</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
              <li><strong>Contour Lines:</strong> Closely packed lines indicate steep vertical rock walls. Widely spaced lines mean gentle slopes or plateaus.</li>
              <li><strong>Index Labels:</strong> Numbers like <span className="font-mono-numbers text-amber-300 font-bold">▲2400m</span> or <span className="font-mono-numbers text-amber-300 font-bold">▲2000m</span> mark specific elevations.</li>
              <li><strong>Shaded Relief:</strong> Mountain hillshading highlights ridges and ravines.</li>
              <li><strong>Pan & Zoom:</strong> Drag to move across Austria, tap to drop your guess pin, and tap <strong>Confirm Guess</strong>!</li>
            </ul>
          </div>

          {/* Section 4: Daily Challenge */}
          <div>
            <h4 className="text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">Daily Challenge</h4>
            <p className="text-xs">
              Every day at midnight Central European Time, a new seeded 5-round riddle goes live.
              Every player worldwide gets the exact same mountains. Compete for the top 25,000 score and build your daily streak!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            Ready to Climb!
          </button>
        </div>
      </div>
    </div>
  );
};
