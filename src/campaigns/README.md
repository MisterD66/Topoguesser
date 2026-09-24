# Kampagnen-Ordner (`src/campaigns/`)

In diesem Ordner liegen alle Kampagnen für Topoguesser.

## So fügst du eine neue Kampagne hinzu:
1. Erstelle eine Kampagne im **Creator-Modus** (Zahnrad oben rechts ➔ Creator-Modus).
2. Klicke auf **"Kampagnendatei herunterladen"**.
3. Kopiere die heruntergeladene Datei (z.B. `meine-runde.campaign.json`) einfach in diesen Ordner `src/campaigns/`.
4. **Fertig!** Vite erkennt jede Datei mit der Endung `.campaign.json` oder `.json` in diesem Ordner automatisch per `import.meta.glob` und zeigt sie auf dem Start-Screen an.
