'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTutorialStore } from '@/store/tutorialStore';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { RinkLayout } from '@/components/game/RinkLayout';
import { TurnPanel } from '@/components/game/TurnPanel';
import { ResolutionModal } from '@/components/game/ResolutionModal';
import { TUTORIAL_STEPS } from '@/lib/tutorial/tutorialScript';
import { RPSChoice } from '@/types/game';

// ── Tutorial Game Content ─────────────────────────────────────────────────
// Renders the actual game UI with tutorial-aware data attributes for spotlights

function TutorialGameContent() {
  const {
    gameState,
    currentStepIndex,
    currentViewingPlayer,
    showResolutionResult,
    submitRPSChoice,
    skipLineChange,
    drawCard,
    selectDefensiveCard,
    confirmResolution,
    dismissResolution,
    handleSpotlightClick,
  } = useTutorialStore();

  const router = useRouter();

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Initializing tutorial...</div>
      </div>
    );
  }

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Wrap TurnPanel actions with tutorial awareness
  const handleRPSSubmit = (player: 'player1' | 'player2', choice: RPSChoice) => {
    if (currentStep?.spotlight === 'tutorial-rps-area' && currentStep?.waitFor === 'click-spotlight') {
      handleSpotlightClick();
    } else {
      submitRPSChoice(choice);
    }
  };

  const handleSkipLineChange = (player: 'player1' | 'player2') => {
    if (currentStep?.spotlight === 'tutorial-turn-panel' && currentStep?.waitFor === 'click-spotlight') {
      handleSpotlightClick();
    } else {
      skipLineChange();
    }
  };

  const handleDrawCard = () => {
    if (currentStep?.spotlight === 'tutorial-draw-btn' && currentStep?.waitFor === 'click-spotlight') {
      handleSpotlightClick();
    } else {
      drawCard();
    }
  };

  const handleConfirmResolution = () => {
    if (currentStep?.spotlight === 'tutorial-resolve-btn' && currentStep?.waitFor === 'click-spotlight') {
      handleSpotlightClick();
    } else {
      confirmResolution();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-4 pb-36">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Home
          </button>
          <div className="text-sm font-semibold text-blue-300">
            🎓 Tutorial Mode
          </div>
          <a
            href="/roster"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Skip →
          </a>
        </div>

        {/* Scoreboard */}
        <div className="mb-4" data-tutorial-id="tutorial-scoreboard">
          <ScoreBoard
            player1Score={gameState.player1_score}
            player2Score={gameState.player2_score}
            possession={gameState.possession}
            canShoot={gameState.can_shoot}
            turnNumber={gameState.turn_number}
            phase={gameState.phase}
            currentViewingPlayer={currentViewingPlayer}
          />
          {/* canShoot indicator spotlightable separately */}
          <div
            data-tutorial-id="tutorial-can-shoot-indicator"
            className={`mt-2 text-center text-xs font-bold py-1 px-3 rounded-full inline-block mx-auto ${
              gameState.can_shoot
                ? 'bg-green-900/60 text-green-300 border border-green-600'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            {gameState.can_shoot ? '🎯 canShoot = TRUE — Shoot cards are live!' : '⛔ canShoot = FALSE — Need a Pass or Skate first'}
          </div>
        </div>

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rink */}
          <div className="lg:col-span-2" data-tutorial-id="tutorial-rink-ice">
            <RinkLayout
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onSelectOffensiveBeaut={() => {}}
              onSelectDefensiveBeaut={() => {}}
            />
          </div>

          {/* Turn Panel */}
          <div data-tutorial-id="tutorial-turn-panel">
            {/* Draw button / resolve button spotlights */}
            <TurnPanelWithSpotlights
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onRPSSubmit={handleRPSSubmit}
              onSkipLineChange={handleSkipLineChange}
              onDrawCard={handleDrawCard}
              onSelectDefensiveCard={selectDefensiveCard}
              onActivateTrait={() => {}}
              onConfirmResolution={handleConfirmResolution}
            />
          </div>
        </div>

        {/* Roster panel (lesson 1) */}
        <div data-tutorial-id="tutorial-roster-panel" className="mt-4">
          <TutorialRosterDisplay gameState={gameState} />
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionResult && gameState.last_resolution && (
        <div data-tutorial-id="tutorial-resolution-result">
          <ResolutionModal
            result={gameState.last_resolution}
            gameState={gameState}
            viewingPlayer={currentViewingPlayer}
            onDismiss={dismissResolution}
          />
        </div>
      )}
    </div>
  );
}

// ── Turn Panel with Spotlight Data Attributes ─────────────────────────────

interface TurnPanelWithSpotlightsProps {
  gameState: any;
  viewingPlayer: 'player1' | 'player2';
  onRPSSubmit: (player: 'player1' | 'player2', choice: RPSChoice) => void;
  onSkipLineChange: (player: 'player1' | 'player2') => void;
  onDrawCard: () => void;
  onSelectDefensiveCard: (cardId: string) => void;
  onActivateTrait: (player: 'player1' | 'player2', trait: any) => void;
  onConfirmResolution: () => void;
}

function TurnPanelWithSpotlights(props: TurnPanelWithSpotlightsProps) {
  const { gameState } = props;

  // Determine which phase-specific spotlight ID to put on the turn panel wrapper.
  // This way, phase-specific IDs (tutorial-rps-area, tutorial-draw-btn, etc.)
  // target the actual visible turn panel content, not invisible zero-size anchors.
  const phaseSpotlightId =
    gameState.phase === 'RPS' ? 'tutorial-rps-area' :
    gameState.phase === 'OFFENSIVE_DRAW' ? 'tutorial-draw-btn' :
    gameState.phase === 'TRAIT_WINDOW' ? 'tutorial-resolve-btn' :
    gameState.phase === 'DEFENSIVE_RESPONSE' ? 'tutorial-drawn-card' :
    undefined;

  return (
    <div
      data-tutorial-id={phaseSpotlightId}
    >
      <TurnPanel
        gameState={props.gameState}
        viewingPlayer={props.viewingPlayer}
        onRPSSubmit={props.onRPSSubmit}
        onSkipLineChange={props.onSkipLineChange}
        onLineChange={() => {}}
        onDrawCard={props.onDrawCard}
        onSelectDefensiveCard={props.onSelectDefensiveCard}
        onActivateTrait={props.onActivateTrait}
        onConfirmResolution={props.onConfirmResolution}
      />
    </div>
  );
}

// ── Tutorial Roster Display (for lesson 1) ────────────────────────────────

function TutorialRosterDisplay({ gameState }: { gameState: any }) {
  if (!gameState) return null;

  const p1 = gameState.player1;
  const positions = ['Winger', 'Center', 'Defender', 'Goaltender'];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-gray-400 text-sm font-semibold mb-3">
        📋 Your Tutorial Roster — Player 1
      </h3>
      <div className="flex flex-wrap gap-3">
        {p1.beauts.map((b: any, idx: number) => (
          <div
            key={b.id}
            className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700"
          >
            <div className="text-base">
              {b.position === 'Winger' ? '🏒' :
               b.position === 'Center' ? '⭐' :
               b.position === 'Defender' ? '🛡️' : '🥅'}
            </div>
            <div>
              <div className="text-white text-xs font-semibold truncate max-w-[140px]">
                {b.name}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="text-xs text-blue-300 bg-blue-900/40 px-1 rounded"
                  {...(idx === 0 ? { 'data-tutorial-id': 'tutorial-position-badges' } : {})}
                >
                  {b.position}
                </span>
                <span
                  className="text-xs text-purple-300 bg-purple-900/40 px-1 rounded"
                  {...(idx === 0 ? { 'data-tutorial-id': 'tutorial-archetype-badge' } : {})}
                >
                  {b.trait_archetype}
                </span>
                <span
                  className="text-xs text-yellow-300 bg-yellow-900/40 px-1 rounded"
                  {...(idx === 0 ? { 'data-tutorial-id': 'tutorial-tier-badge' } : {})}
                >
                  T{b.tier}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tutorial Page ─────────────────────────────────────────────────────────

export default function TutorialPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes tutorialSpotlightPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4), 0 0 20px 4px rgba(96, 165, 250, 0.15); }
          50% { box-shadow: 0 0 0 6px rgba(96, 165, 250, 0.15), 0 0 30px 8px rgba(96, 165, 250, 0.25); }
        }
        .tutorial-spotlight-pulse {
          animation: tutorialSpotlightPulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <TutorialOverlay>
        <TutorialGameContent />
      </TutorialOverlay>
    </>
  );
}
