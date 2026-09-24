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
import { CampaignMeta, CampaignFile } from './types/campaign';
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
  getAllCampaigns,
  fetchExternalCampaigns,
  saveCustomCampaign,
  loadCampaignProgress,
  saveCampaignProgress,
  clearCampaignProgress,
} from './utils/campaignLoader';

import { StartScreen } from './components/StartScreen';
import { TopBar } from './components/TopBar';
import { Horizon3DView } from './components/Horizon3DView';
import { TopoMap2D } from './components/TopoMap2D';
import { CreatorPasswordModal } from './components/CreatorPasswordModal';
import { RoundResultModal } from './components/RoundResultModal';
import { CampaignSummaryModal } from './components/CampaignSummaryModal';
import { CreatorControlBar } from './components/CreatorControlBar';
import { CuratedPlacesModal } from './components/CuratedPlacesModal';
import { CampaignExportModal } from './components/CampaignExportModal';

export default function App() {
  // Campaign registry (all .campaign.json in src/campaigns/ + custom user imports + runtime docs/campaigns/)
  const [allCampaigns, setAllCampaigns] = useState<CampaignMeta[]>(() => getAllCampaigns());

  // Load external campaigns from docs/campaigns/ (or public/campaigns/) asynchronously at startup
  useEffect(() => {
    fetchExternalCampaigns().then((camps) => {
      setAllCampaigns(camps);
    });
  }, []);

  // Active playing campaign: null = show StartScreen
  const [activeCampaign, setActiveCampaign] = useState<CampaignMeta | null>(null);

  // Mode: 'campaign' (playing active campaign or test play) or 'creator' (interactive editor)
  const [gameMode, setGameMode] = useState<GameMode>('campaign');

  // Curated Places collection in Creator Mode (stored in localStorage)
  const [curatedPlaces, setCuratedPlaces] = useState<CuratedPlace[]>(() => loadCuratedPlaces());

  // Locations of the active campaign
  const campaignLocations = useMemo<AlpineLocation[]>(() => {
    if (!activeCampaign || !activeCampaign.places || activeCampaign.places.length === 0) {
      return [];
    }
    return activeCampaign.places.map((p) => convertCuratedToAlpineLocation(p));
  }, [activeCampaign]);

  const totalRounds = campaignLocations.length || 5;

  // Round progression and history
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [roundsHistory, setRoundsHistory] = useState<RoundResult[]>([]);
  const [testPlayLocation, setTestPlayLocation] = useState<AlpineLocation | null>(null);

  // Select campaign from Start Screen
  const handleSelectCampaign = (camp: CampaignMeta, resumeFromSaved = false) => {
    setActiveCampaign(camp);
    setGameMode('campaign');
    setTestPlayLocation(null);

    if (resumeFromSaved) {
      const saved = loadCampaignProgress(camp.id);
      if (saved && saved.roundIndex >= 0 && saved.roundIndex < camp.places.length) {
        setRoundIndex(saved.roundIndex);
        if (Array.isArray(saved.roundsHistory)) {
          const reconstructed: RoundResult[] = saved.roundsHistory.map((h) => {
            const loc =
              camp.places.find((p) => p.id === h.locationId) || camp.places[0];
            return {
              roundNumber: h.roundNumber,
              location: convertCuratedToAlpineLocation(loc),
              guessLatLng: h.guessLatLng || { lat: loc.observerPos.lat, lng: loc.observerPos.lng },
              distanceKm: h.distanceKm,
              elevationDiffM: 0,
              score: h.score,
              timeSpentSec: 0,
            };
          });
          setRoundsHistory(reconstructed);
          return;
        }
      }
    }

    // Fresh start
    setRoundIndex(0);
    setRoundsHistory([]);
  };

  // Import custom campaign from JSON
  const handleImportCampaign = (campaignData: CampaignFile) => {
    saveCustomCampaign(campaignData);
    const updated = getAllCampaigns();
    setAllCampaigns(updated);
    const imported = updated.find((c) => c.id === campaignData.id) || updated[0];
    if (imported) {
      handleSelectCampaign(imported, false);
    }
  };

  // Creator Mode State
  const [creatorPos, setCreatorPos] = useState<LatLng>({ lat: 47.79156, lng: 13.47258 });
  const [creatorElevation, setCreatorElevation] = useState<number>(1290);
  const [creatorName, setCreatorName] = useState<string>('Adlerstein');
  const [creatorMountainRange, setCreatorMountainRange] = useState<string>('Schafberg-Region · Oberösterreich');
  const [creatorDescription, setCreatorDescription] = useState<string>('Aussichtspunkt auf die markante Schafberg-Flanke');
  const [creatorTimeHour, setCreatorTimeHour] = useState<number>(14);
  const [creatorDifficulty, setCreatorDifficulty] = useState<'standard' | 'hard'>('standard');
  const [creatorShowSearchZone, setCreatorShowSearchZone] = useState<boolean>(true);
  const [creatorSearchZoneRadiusKm, setCreatorSearchZoneRadiusKm] = useState<number>(50);
  const [creatorSearchZoneCenter, setCreatorSearchZoneCenter] = useState<LatLng | null>({
    lat: 47.73655,
    lng: 13.67248,
  });
  const [creatorActiveTool, setCreatorActiveTool] = useState<'camera' | 'searchZone'>('camera');
  const [showCuratedModal, setShowCuratedModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [justSavedPlace, setJustSavedPlace] = useState<boolean>(false);

  // Auto-offset search circle around camera
  const handleAutoOffsetSearchZone = useCallback(() => {
    const offsetKm = Math.min(creatorSearchZoneRadiusKm * 0.45, 22);
    const angleRad = (Math.PI / 180) * 55;
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
  const [headingDeg, setHeadingDeg] = useState<number>(currentLocation ? currentLocation.initialHeading : 0);
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
    if (gameMode !== 'creator' && currentLocation) {
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

  // Submit Guess & Calculate Score
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

    // Persist per-campaign progress
    if (activeCampaign && !testPlayLocation) {
      saveCampaignProgress(activeCampaign.id, {
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
      setTestPlayLocation(null);
      setGameMode('creator');
      return;
    }

    const nextIndex = roundIndex + 1;
    if (nextIndex < totalRounds) {
      setRoundIndex(nextIndex);
      if (activeCampaign) {
        saveCampaignProgress(activeCampaign.id, {
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
      }
    } else {
      // Completed! Mark completed in storage
      if (activeCampaign) {
        saveCampaignProgress(activeCampaign.id, {
          roundIndex: totalRounds,
          totalScore,
          completed: true,
          roundsHistory: roundsHistory.map((r) => ({
            roundNumber: r.roundNumber,
            locationId: r.location.id,
            locationName: r.location.name,
            score: r.score,
            distanceKm: r.distanceKm,
            guessLatLng: r.guessLatLng,
          })),
        });
      }
      setShowCampaignSummary(true);
    }
  };

  // Restart Active Campaign
  const handleRestartCampaign = () => {
    if (activeCampaign) {
      clearCampaignProgress(activeCampaign.id);
    }
    setRoundIndex(0);
    setRoundsHistory([]);
    setGuessLatLng(null);
    setIsRoundComplete(false);
    setCurrentRoundResult(null);
    setTestPlayLocation(null);
    setShowCampaignSummary(false);
  };

  // Back to Start Screen
  const handleBackToStartScreen = () => {
    setActiveCampaign(null);
    setGameMode('campaign');
    setTestPlayLocation(null);
    setShowCampaignSummary(false);
    setShowRoundResult(false);
    fetchExternalCampaigns().then((camps) => {
      setAllCampaigns(camps);
    });
  };

  // Difficulty check: 'hard' = no compass, no visier
  const isHardDifficulty = currentLocation?.difficulty === 'hard';

  // 1. RENDER START SCREEN if no active campaign and not in creator mode
  if (!activeCampaign && gameMode !== 'creator') {
    return (
      <div className="w-full h-full">
        <StartScreen
          campaigns={allCampaigns}
          onSelectCampaign={(c, resume) => handleSelectCampaign(c, resume)}
          onOpenCreator={() => setShowPasswordModal(true)}
          onResetProgress={(id) => {
            clearCampaignProgress(id);
            setAllCampaigns(getAllCampaigns());
          }}
        />

        {/* Password Modal to unlock Creator Mode from Start Screen */}
        <CreatorPasswordModal
          isOpen={showPasswordModal}
          isCreatorMode={false}
          onUnlockCreator={() => {
            setGameMode('creator');
            setShowPasswordModal(false);
          }}
          onExitCreator={() => {
            setGameMode('campaign');
            setShowPasswordModal(false);
          }}
          onClose={() => setShowPasswordModal(false)}
        />
      </div>
    );
  }

  // 2. RENDER MAIN GAME VIEWPORT OR CREATOR MODE
  return (
    <div className="flex flex-col w-full h-full bg-stone-950 text-stone-100 overflow-hidden select-none">
      {/* Ultra-clean Header */}
      <TopBar
        roundNumber={testPlayLocation ? 1 : roundIndex + 1}
        totalRounds={totalRounds}
        totalScore={totalScore}
        campaignTitle={activeCampaign?.title}
        isCreatorMode={gameMode === 'creator'}
        onBackToStartScreen={handleBackToStartScreen}
        onOpenSettings={() => setShowPasswordModal(true)}
      />

      {/* Main Split Viewport */}
      <main className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100%-2.75rem)] overflow-hidden relative">
        {/* Top Half: 3D Horizon Panorama */}
        <section className="h-[48%] lg:h-full lg:w-1/2 relative border-b lg:border-b-0 lg:border-r border-stone-800 shrink-0">
          {currentLocation && (
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
          )}
        </section>

        {/* Bottom Half: 2D Topo Map */}
        <section className="h-[52%] lg:h-full lg:w-1/2 relative flex-1">
          {currentLocation && (
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
          )}
        </section>
      </main>

      {/* Creator Mode Control & Save Dock */}
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
          onDownloadCampaign={() => setShowExportModal(true)}
          onTestPlay={handleTestPlayCurrent}
          savedCount={curatedPlaces.length}
          justSaved={justSavedPlace}
        />
      )}

      {/* Password Modal */}
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

      {/* Curated Places Collection Modal */}
      {showCuratedModal && (
        <CuratedPlacesModal
          places={curatedPlaces}
          onSelectPlace={handleSelectCuratedPlace}
          onPlayPlace={handlePlayCuratedPlace}
          onDeletePlace={handleDeleteCuratedPlace}
          onImportPlaces={handleImportCuratedPlaces}
          onDownloadCampaign={() => {
            setShowCuratedModal(false);
            setShowExportModal(true);
          }}
          onClose={() => setShowCuratedModal(false)}
        />
      )}

      {/* Campaign Export & Download Modal */}
      <CampaignExportModal
        places={curatedPlaces}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onCampaignCreated={(camp) => {
          const updated = getAllCampaigns();
          setAllCampaigns(updated);
        }}
      />

      {/* Round Result Modal */}
      {showRoundResult && currentRoundResult && (
        <RoundResultModal
          result={currentRoundResult}
          roundNumber={testPlayLocation ? 1 : roundIndex + 1}
          totalRounds={totalRounds}
          onNextRound={handleNextRound}
          isLastRound={!testPlayLocation && roundIndex === totalRounds - 1}
        />
      )}

      {/* Campaign Summary Modal */}
      <CampaignSummaryModal
        isOpen={showCampaignSummary}
        totalScore={totalScore}
        maxScore={totalRounds * 5000}
        rounds={roundsHistory.map((r) => ({
          roundNumber: r.roundNumber,
          locationName: r.location.name,
          distanceKm: r.distanceKm,
          score: r.score,
        }))}
        onRestart={handleRestartCampaign}
        onClose={handleBackToStartScreen}
      />
    </div>
  );
}
