/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GameMode,
  AlpineLocation,
  RoundResult,
  LatLng,
  CuratedPlace,
} from './types/game';
import { AUSTRIAN_LOCATIONS } from './data/austrianLocations';
import { calculateDistanceKm, calculateScore } from './utils/geoUtils';
import {
  loadCuratedPlaces,
  saveCuratedPlace,
  deleteCuratedPlace,
  importCuratedPlacesJSON,
  synthesizeLocationFromCoord,
  convertCuratedToAlpineLocation,
  estimateElevation,
} from './utils/curatedPlaces';
import {
  saveCampaignCookie,
  loadCampaignCookie,
  clearCampaignCookie,
} from './utils/cookieStorage';

import { TopBar } from './components/TopBar';
import { Horizon3DView } from './components/Horizon3DView';
import { TopoMap2D } from './components/TopoMap2D';
import { CreatorPasswordModal } from './components/CreatorPasswordModal';
import { RoundResultModal } from './components/RoundResultModal';
import { CampaignSummaryModal } from './components/CampaignSummaryModal';
import { CreatorControlBar } from './components/CreatorControlBar';
import { CuratedPlacesModal } from './components/CuratedPlacesModal';

const TOTAL_ROUNDS = 10;

export default function App() {
  // Mode: Only 'campaign' (curated 10-round game) or 'creator' (unlocked via password)
  const [gameMode, setGameMode] = useState<GameMode>('campaign');

  // Curated Places collection from localStorage
  const [curatedPlaces, setCuratedPlaces] = useState<CuratedPlace[]>(() => loadCuratedPlaces());

  // Build the 10 campaign locations from curated places + default Austrian landmarks
  const campaignLocations = useMemo<AlpineLocation[]>(() => {
    const list: AlpineLocation[] = [];

    // Prioritize curated places
    for (const place of curatedPlaces) {
      list.push(convertCuratedToAlpineLocation(place));
      if (list.length >= TOTAL_ROUNDS) break;
    }

    // Fill remaining spots up to 10 from master Austrian locations
    if (list.length < TOTAL_ROUNDS) {
      for (const loc of AUSTRIAN_LOCATIONS) {
        if (!list.some((existing) => existing.id === loc.id)) {
          list.push({
            ...loc,
            timeOfDayHour: loc.timeOfDayHour ?? 14,
            difficulty: loc.difficulty ?? 'standard',
            showSearchZone: loc.showSearchZone ?? true,
            searchZoneRadiusKm: loc.searchZoneRadiusKm ?? 50,
          });
        }
        if (list.length >= TOTAL_ROUNDS) break;
      }
    }

    return list.slice(0, TOTAL_ROUNDS);
  }, [curatedPlaces]);

  // Round progression (0 to 9) and points
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [roundsHistory, setRoundsHistory] = useState<RoundResult[]>([]);
  const [testPlayLocation, setTestPlayLocation] = useState<AlpineLocation | null>(null);

  // Restore saved campaign progress and points from cookies on mount
  useEffect(() => {
    const saved = loadCampaignCookie();
    if (saved) {
      if (typeof saved.roundIndex === 'number' && saved.roundIndex >= 0 && saved.roundIndex < TOTAL_ROUNDS) {
        setRoundIndex(saved.roundIndex);
      }
      if (Array.isArray(saved.roundsHistory) && saved.roundsHistory.length > 0) {
        const reconstructed: RoundResult[] = saved.roundsHistory.map((h) => {
          const loc = campaignLocations.find((l) => l.id === h.locationId) || campaignLocations[0];
          return {
            roundNumber: h.roundNumber,
            location: loc,
            guessLatLng: h.guessLatLng || { lat: loc.observerPos.lat, lng: loc.observerPos.lng },
            distanceKm: h.distanceKm,
            elevationDiffM: 0,
            score: h.score,
            timeSpentSec: 0,
          };
        });
        setRoundsHistory(reconstructed);
      }
    }
  }, [campaignLocations]);

  // Creator Mode State
  const [creatorPos, setCreatorPos] = useState<LatLng>({ lat: 47.5512, lng: 12.3168 });
  const [creatorElevation, setCreatorElevation] = useState<number>(1620);
  const [creatorName, setCreatorName] = useState<string>('Gruttenhütte Blick (Wilder Kaiser)');
  const [creatorMountainRange, setCreatorMountainRange] = useState<string>('Kaisergebirge · Tirol');
  const [creatorDescription, setCreatorDescription] = useState<string>('Aussichtspunkt auf die markante Südwand des Wilden Kaisers');
  const [creatorTimeHour, setCreatorTimeHour] = useState<number>(14);
  const [creatorDifficulty, setCreatorDifficulty] = useState<'standard' | 'hard'>('standard');
  const [creatorShowSearchZone, setCreatorShowSearchZone] = useState<boolean>(true);
  const [creatorSearchZoneRadiusKm, setCreatorSearchZoneRadiusKm] = useState<number>(50);
  const [creatorSearchZoneCenter, setCreatorSearchZoneCenter] = useState<LatLng | null>(null);
  const [creatorActiveTool, setCreatorActiveTool] = useState<'camera' | 'searchZone'>('camera');
  const [showCuratedModal, setShowCuratedModal] = useState<boolean>(false);
  const [justSavedPlace, setJustSavedPlace] = useState<boolean>(false);

  // Auto-offset search circle around camera (not centered, natural alpine placement)
  const handleAutoOffsetSearchZone = useCallback(() => {
    const offsetKm = Math.min(creatorSearchZoneRadiusKm * 0.45, 22);
    const angleRad = (Math.PI / 180) * 55; // 55 degrees North-East
    const cosLat = Math.cos((creatorPos.lat * Math.PI) / 180);
    const dLat = (offsetKm * Math.cos(angleRad)) / 111.0;
    const dLng = (offsetKm * Math.sin(angleRad)) / (111.0 * cosLat);
    setCreatorSearchZoneCenter({
      lat: Number((creatorPos.lat + dLat).toFixed(4)),
      lng: Number((creatorPos.lng + dLng).toFixed(4)),
    });
  }, [creatorPos, creatorSearchZoneRadiusKm]);

  // Distance between camera position and search circle center
  const distanceCamToCircleKm = useMemo(() => {
    if (!creatorSearchZoneCenter) return 0;
    return calculateDistanceKm(creatorPos, creatorSearchZoneCenter);
  }, [creatorPos, creatorSearchZoneCenter]);

  // Password Modal State for Settings / Gear button
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

  // Active location determination
  const currentLocation: AlpineLocation = useMemo(() => {
    if (gameMode === 'creator') {
      return synthesizeLocationFromCoord({
        lat: creatorPos.lat,
        lng: creatorPos.lng,
        elevation: creatorElevation,
        name: creatorName,
        timeOfDayHour: creatorTimeHour,
        difficulty: creatorDifficulty,
        showSearchZone: creatorShowSearchZone,
        searchZoneRadiusKm: creatorSearchZoneRadiusKm,
        searchZoneCenter: creatorSearchZoneCenter || undefined,
      });
    }

    if (testPlayLocation) {
      return testPlayLocation;
    }

    return campaignLocations[roundIndex] || campaignLocations[0];
  }, [
    gameMode,
    creatorPos,
    creatorElevation,
    creatorName,
    creatorTimeHour,
    creatorDifficulty,
    creatorShowSearchZone,
    creatorSearchZoneRadiusKm,
    creatorSearchZoneCenter,
    testPlayLocation,
    campaignLocations,
    roundIndex,
  ]);

  // Player interaction state
  const [headingDeg, setHeadingDeg] = useState<number>(currentLocation.initialHeading);
  const [guessLatLng, setGuessLatLng] = useState<LatLng | null>(null);
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);

  // Modals visibility
  const [showRoundResult, setShowRoundResult] = useState<boolean>(false);
  const [showCampaignSummary, setShowCampaignSummary] = useState<boolean>(false);

  // Total score calculation
  const totalScore = useMemo(() => {
    return roundsHistory.reduce((sum, r) => sum + r.score, 0);
  }, [roundsHistory]);

  // Reset round state when location changes (in campaign mode)
  useEffect(() => {
    if (gameMode !== 'creator') {
      setHeadingDeg(currentLocation.initialHeading);
      setGuessLatLng(null);
      setIsRoundComplete(false);
      setCurrentRoundResult(null);
    }
  }, [currentLocation, gameMode]);

  // Pin drop handler
  const handleGuessChange = (pos: LatLng | null) => {
    setGuessLatLng(pos);
  };

  // Creator Mode pin placement handler
  const handleCreatorPinChange = (newPos: LatLng) => {
    setCreatorPos(newPos);
    const newElev = estimateElevation(newPos);
    setCreatorElevation(newElev);
    const synth = synthesizeLocationFromCoord({
      lat: newPos.lat,
      lng: newPos.lng,
      elevation: newElev,
      timeOfDayHour: creatorTimeHour,
      difficulty: creatorDifficulty,
      showSearchZone: creatorShowSearchZone,
      searchZoneRadiusKm: creatorSearchZoneRadiusKm,
    });
    setCreatorName(`Blick auf ${synth.targetPeak.name}`);
    setCreatorMountainRange(synth.mountainRange);
  };

  // Save Curated Place in Creator Mode
  const handleSaveCurrentPlace = () => {
    const place: CuratedPlace = {
      id: `curated-${Date.now()}`,
      name: creatorName.trim() || `Aussichtspunkt ${currentLocation.targetPeak.name}`,
      mountainRange: creatorMountainRange.trim() || currentLocation.mountainRange,
      bundesland: currentLocation.bundesland,
      observerPos: creatorPos,
      observerElevation: creatorElevation,
      initialHeading: Math.round(headingDeg),
      description: creatorDescription.trim(),
      createdAt: new Date().toISOString(),
      targetPeakName: currentLocation.targetPeak.name,
      timeOfDayHour: creatorTimeHour,
      difficulty: creatorDifficulty,
      showSearchZone: creatorShowSearchZone,
      searchZoneRadiusKm: creatorSearchZoneRadiusKm,
      searchZoneCenter: creatorSearchZoneCenter || undefined,
    };
    saveCuratedPlace(place);
    setCuratedPlaces(loadCuratedPlaces());
    setJustSavedPlace(true);
    setTimeout(() => setJustSavedPlace(false), 2400);
  };

  // Test play current creator view immediately
  const handleTestPlayCurrent = () => {
    const alpineLoc = synthesizeLocationFromCoord({
      lat: creatorPos.lat,
      lng: creatorPos.lng,
      elevation: creatorElevation,
      name: creatorName.trim() || `Aussichtspunkt ${currentLocation.targetPeak.name}`,
      heading: headingDeg,
      timeOfDayHour: creatorTimeHour,
      difficulty: creatorDifficulty,
      showSearchZone: creatorShowSearchZone,
      searchZoneRadiusKm: creatorSearchZoneRadiusKm,
      searchZoneCenter: creatorSearchZoneCenter || undefined,
    });
    setTestPlayLocation(alpineLoc);
    setGameMode('campaign');
    setGuessLatLng(null);
    setIsRoundComplete(false);
    setCurrentRoundResult(null);
  };

  // Select place from Curated Modal
  const handleSelectCuratedPlace = (place: CuratedPlace) => {
    setCreatorPos(place.observerPos);
    setCreatorElevation(place.observerElevation);
    setCreatorName(place.name);
    setCreatorMountainRange(place.mountainRange);
    setCreatorDescription(place.description);
    setHeadingDeg(place.initialHeading);
    if (typeof place.timeOfDayHour === 'number') setCreatorTimeHour(place.timeOfDayHour);
    if (place.difficulty) setCreatorDifficulty(place.difficulty);
    if (typeof place.showSearchZone === 'boolean') setCreatorShowSearchZone(place.showSearchZone);
    if (typeof place.searchZoneRadiusKm === 'number') setCreatorSearchZoneRadiusKm(place.searchZoneRadiusKm);
    setCreatorSearchZoneCenter(place.searchZoneCenter || null);
    setShowCuratedModal(false);
  };

  // Play place from Curated Modal
  const handlePlayCuratedPlace = (place: CuratedPlace) => {
    const alpineLoc = convertCuratedToAlpineLocation(place);
    setTestPlayLocation(alpineLoc);
    setGameMode('campaign');
    setGuessLatLng(null);
    setIsRoundComplete(false);
    setCurrentRoundResult(null);
    setShowCuratedModal(false);
  };

  // Delete place from collection
  const handleDeleteCuratedPlace = (id: string) => {
    deleteCuratedPlace(id);
    setCuratedPlaces(loadCuratedPlaces());
  };

  // Import JSON collection
  const handleImportCuratedPlaces = (jsonStr: string) => {
    const result = importCuratedPlacesJSON(jsonStr);
    if (result.success) {
      setCuratedPlaces(loadCuratedPlaces());
    }
  };

  // Submit Guess & Calculate Score (Save to Cookies)
  const handleSubmitGuess = () => {
    if (!guessLatLng || isRoundComplete) return;

    const distanceKm = calculateDistanceKm(guessLatLng, currentLocation.observerPos);
    const score = calculateScore(distanceKm);

    const result: RoundResult = {
      roundNumber: testPlayLocation ? 1 : roundIndex + 1,
      location: currentLocation,
      guessLatLng,
      distanceKm,
      elevationDiffM: 0,
      score,
      timeSpentSec: 0,
    };

    setIsRoundComplete(true);
    setCurrentRoundResult(result);

    const nextHistory = [...roundsHistory, result];
    setRoundsHistory(nextHistory);

    // Save progress and points to cookies
    if (!testPlayLocation) {
      saveCampaignCookie({
        roundIndex,
        totalScore: nextHistory.reduce((sum, r) => sum + r.score, 0),
        roundsHistory: nextHistory.map((r) => ({
          roundNumber: r.roundNumber,
          locationId: r.location.id,
          locationName: r.location.name,
          score: r.score,
          distanceKm: r.distanceKm,
          guessLatLng: r.guessLatLng,
        })),
      });
    }

    // Show round result modal
    setTimeout(() => {
      setShowRoundResult(true);
    }, 1100);
  };

  // Proceed to Next Round or Final Campaign Summary
  const handleNextRound = () => {
    setShowRoundResult(false);
    setIsRoundComplete(false);
    setGuessLatLng(null);
    setCurrentRoundResult(null);

    if (testPlayLocation) {
      // Return to creator mode after test play
      setTestPlayLocation(null);
      setGameMode('creator');
      return;
    }

    const nextIndex = roundIndex + 1;
    if (nextIndex < TOTAL_ROUNDS) {
      setRoundIndex(nextIndex);
      // Update cookie with next round
      saveCampaignCookie({
        roundIndex: nextIndex,
        totalScore,
        roundsHistory: roundsHistory.map((r) => ({
          roundNumber: r.roundNumber,
          locationId: r.location.id,
          locationName: r.location.name,
          score: r.score,
          distanceKm: r.distanceKm,
          guessLatLng: r.guessLatLng,
        })),
      });
    } else {
      // Campaign Completed (10 Rounds)!
      setShowCampaignSummary(true);
    }
  };

  // Restart Campaign (Reset cookies, start fresh)
  const handleRestartCampaign = () => {
    clearCampaignCookie();
    setRoundIndex(0);
    setRoundsHistory([]);
    setGuessLatLng(null);
    setIsRoundComplete(false);
    setCurrentRoundResult(null);
    setTestPlayLocation(null);
    setShowCampaignSummary(false);
  };

  // Difficulty check: 'hard' = no compass, no visier
  const isHardDifficulty = currentLocation.difficulty === 'hard';

  return (
    <div className="flex flex-col w-full h-full bg-stone-950 text-stone-100 overflow-hidden select-none">
      {/* 1. Ultra-clean Header: Only "Round X/10", "X pts", and Settings/Gear icon */}
      <TopBar
        roundNumber={testPlayLocation ? 1 : roundIndex + 1}
        totalRounds={TOTAL_ROUNDS}
        totalScore={totalScore}
        isCreatorMode={gameMode === 'creator'}
        onOpenSettings={() => setShowPasswordModal(true)}
      />

      {/* 2. Main Split Viewport (Top: 3D Panorama, Bottom: 2D Topo Map) */}
      <main className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100%-2.75rem)] overflow-hidden relative">
        {/* Top Half (Left on Desktop): 3D Horizon Panorama */}
        <section className="h-[48%] lg:h-full lg:w-1/2 relative border-b lg:border-b-0 lg:border-r border-stone-800 shrink-0">
          <Horizon3DView
            location={currentLocation}
            headingDeg={headingDeg}
            onHeadingChange={setHeadingDeg}
            showCompassTape={true}
            timeOfDayHour={currentLocation.timeOfDayHour ?? creatorTimeHour}
            onTimeChange={(h) => setCreatorTimeHour(h)}
            isCreatorMode={gameMode === 'creator'}
            hideCompassAndVisier={isHardDifficulty}
          />
        </section>

        {/* Bottom Half (Right on Desktop): 2D OpenTopoMap with alternating red-blue dashed circle */}
        <section className="h-[52%] lg:h-full lg:w-1/2 relative flex-1">
          <TopoMap2D
            location={currentLocation}
            headingDeg={headingDeg}
            showVisionCone={false}
            guessLatLng={guessLatLng}
            onGuessChange={handleGuessChange}
            onSubmitGuess={handleSubmitGuess}
            isRoundComplete={isRoundComplete}
            roundScore={currentRoundResult?.score}
            isCreatorMode={gameMode === 'creator'}
            creatorPin={creatorPos}
            onCreatorPinChange={handleCreatorPinChange}
            creatorSearchZoneCenter={creatorSearchZoneCenter}
            onCreatorSearchZoneCenterChange={setCreatorSearchZoneCenter}
            creatorActiveTool={creatorActiveTool}
          />
        </section>
      </main>

      {/* 3. Creator Mode Control & Save Dock (Shown ONLY in Creator Mode) */}
      {gameMode === 'creator' && (
        <CreatorControlBar
          creatorPos={creatorPos}
          elevation={creatorElevation}
          onElevationChange={setCreatorElevation}
          headingDeg={headingDeg}
          locationName={creatorName}
          onLocationNameChange={setCreatorName}
          mountainRange={creatorMountainRange}
          onMountainRangeChange={setCreatorMountainRange}
          description={creatorDescription}
          onDescriptionChange={setCreatorDescription}
          timeOfDayHour={creatorTimeHour}
          onTimeOfDayHourChange={setCreatorTimeHour}
          difficulty={creatorDifficulty}
          onDifficultyChange={setCreatorDifficulty}
          showSearchZone={creatorShowSearchZone}
          onShowSearchZoneChange={setCreatorShowSearchZone}
          searchZoneRadiusKm={creatorSearchZoneRadiusKm}
          onSearchZoneRadiusKmChange={setCreatorSearchZoneRadiusKm}
          activeTool={creatorActiveTool}
          onActiveToolChange={setCreatorActiveTool}
          searchZoneCenter={creatorSearchZoneCenter}
          onSearchZoneCenterChange={setCreatorSearchZoneCenter}
          onAutoOffsetSearchZone={handleAutoOffsetSearchZone}
          distanceToCenterKm={distanceCamToCircleKm}
          onSavePlace={handleSaveCurrentPlace}
          onOpenCuratedModal={() => setShowCuratedModal(true)}
          onTestPlay={handleTestPlayCurrent}
          savedCount={curatedPlaces.length}
          justSaved={justSavedPlace}
        />
      )}

      {/* 4. Password Modal behind the Gear Icon */}
      <CreatorPasswordModal
        isOpen={showPasswordModal}
        isCreatorMode={gameMode === 'creator'}
        onUnlockCreator={() => {
          setGameMode('creator');
          setTestPlayLocation(null);
        }}
        onExitCreator={() => {
          setGameMode('campaign');
          setTestPlayLocation(null);
        }}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* 5. Curated Places Collection Modal */}
      {showCuratedModal && (
        <CuratedPlacesModal
          places={curatedPlaces}
          onSelectPlace={handleSelectCuratedPlace}
          onPlayPlace={handlePlayCuratedPlace}
          onDeletePlace={handleDeleteCuratedPlace}
          onImportPlaces={handleImportCuratedPlaces}
          onClose={() => setShowCuratedModal(false)}
        />
      )}

      {/* 6. Round Result Modal */}
      {showRoundResult && currentRoundResult && (
        <RoundResultModal
          result={currentRoundResult}
          roundNumber={testPlayLocation ? 1 : roundIndex + 1}
          totalRounds={TOTAL_ROUNDS}
          onNextRound={handleNextRound}
          isLastRound={!testPlayLocation && roundIndex === TOTAL_ROUNDS - 1}
        />
      )}

      {/* 7. Campaign Summary Modal (After Round 10) */}
      <CampaignSummaryModal
        isOpen={showCampaignSummary}
        totalScore={totalScore}
        maxScore={TOTAL_ROUNDS * 5000}
        rounds={roundsHistory.map((r) => ({
          roundNumber: r.roundNumber,
          locationName: r.location.name,
          distanceKm: r.distanceKm,
          score: r.score,
        }))}
        onRestart={handleRestartCampaign}
        onClose={() => setShowCampaignSummary(false)}
      />
    </div>
  );
}
