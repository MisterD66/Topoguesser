/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, KeyRound, X, Sparkles, LogOut, Check } from 'lucide-react';

interface CreatorPasswordModalProps {
  isOpen: boolean;
  isCreatorMode: boolean;
  onUnlockCreator: () => void;
  onExitCreator: () => void;
  onClose: () => void;
}

export const CreatorPasswordModal: React.FC<CreatorPasswordModalProps> = ({
  isOpen,
  isCreatorMode,
  onUnlockCreator,
  onExitCreator,
  onClose,
}) => {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Topoguesser') {
      setError('');
      setPassword('');
      onUnlockCreator();
      onClose();
    } else {
      setError('Falsches Passwort!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 text-stone-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isCreatorMode ? (
          /* Already in Creator Mode */
          <div className="flex flex-col items-center text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Creator-Modus aktiv</h3>
              <p className="text-xs text-stone-400 mt-1">
                Du kannst neue Standorte kuratieren, Höhendaten anpassen und Blickwinkel speichern.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  onExitCreator();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold transition-colors border border-stone-700"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>Creator-Modus beenden (Zurück zur Kampagne)</span>
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Im Creator-Modus weiterarbeiten
              </button>
            </div>
          </div>
        ) : (
          /* Password Prompt */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Creator-Modus</h3>
                <p className="text-xs text-stone-400">Passwort eingeben zur Freischaltung</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Passwort eingeben..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                {error && (
                  <p className="text-[11px] text-rose-400 font-medium pl-1 animate-in fade-in">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Freischalten</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
