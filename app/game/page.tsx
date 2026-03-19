'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { RinkLayout } from '@/components/game/RinkLayout';
import { TurnPanel } from '@/components/game/TurnPanel';
import { ResolutionModal } from '@/components/game/ResolutionModal';
import { CardType, TraitName, RPSChoice } from '@/types/game';

export default function GamePage() {
  const router = useRouter();
  const {
    gameState,
    currentViewingPlayer,
    switchViewToPlayer,
    showResolutionResult,
    resolutionAnimating,
    submitRPSChoice,
    doLineChange,
    skipLineChange,
    drawOffensiveCard,
    selectDefensiveCard,
    activateTrait,
    confirmResolution,
    dismissResolution,
    setActiveOffensiveBeaut,
    setActiveDefensiveBeaut,
    resetGame,
  } = useGameStore();

  const [autoSwitching, setAutoSwitching] = useState(false);

  // Hot-seat: auto-switch after resolution
  useEffect(() => {
    if (gameState && !showResolutionResult && autoSwitching && gameState.phase === 'POSSESSION_START') {
      const otherPlayer = currentViewingPlayer === 'player1' ? 'player2' : 'player1';
      switchViewToPlayer(otherPlayer);
      setAutoSwitching(false);
    }
  }, [showResolutionResult, autoSwitching, gameState, currentViewingPlayer, switchViewToPlayer]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-white mb-2">No game in progress</h1>
          <button
            onClick={() => router.push('/roster')}
            className="mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            ← Back to Roster Selection
          </button>
        </div>
      </div>
    );
  }

  const handleResolutionDismiss = () => {
    dismissResolution();
    setAutoSwitching(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with player switch */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Home
          </button>
          <div className="flex gap-2">
            {(['player1', 'player2'] as const).map(p => (
              <button
                key={p}
                onClick={() => switchViewToPlayer(p)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  currentViewingPlayer === p
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p === 'player1' ? '👤 P1' : '👤 P2'}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              resetGame();
              router.push('/roster');
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            New Game →
          </button>
        </div>

        {/* Scoreboard */}
        <div className="mb-4">
          <ScoreBoard
            player1Score={gameState.player1_score}
            player2Score={gameState.player2_score}
            possession={gameState.possession}
            canShoot={gameState.can_shoot}
            turnNumber={gameState.turn_number}
            phase={gameState.phase}
            currentViewingPlayer={currentViewingPlayer}
          />
        </div>

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rink (center/left) */}
          <div className="lg:col-span-2">
            <RinkLayout
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onSelectOffensiveBeaut={setActiveOffensiveBeaut}
              onSelectDefensiveBeaut={setActiveDefensiveBeaut}
            />
          </div>

          {/* Turn panel (right) */}
          <div>
            <TurnPanel
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onRPSSubmit={(player, choice) => submitRPSChoice(player, choice)}
              onSkipLineChange={(player) => skipLineChange(player)}
              onLineChange={(player, swaps) => {
                doLineChange(player, swaps);
                setAutoSwitching(true);
              }}
              onDrawCard={drawOffensiveCard}
              onSelectDefensiveCard={selectDefensiveCard}
              onActivateTrait={(player, trait) => activateTrait(player, trait)}
              onConfirmResolution={confirmResolution}
            />
          </div>
        </div>

        {/* Resolution Modal */}
        {showResolutionResult && gameState.last_resolution && (
          <ResolutionModal
            result={gameState.last_resolution}
            gameState={gameState}
            viewingPlayer={currentViewingPlayer}
            onDismiss={handleResolutionDismiss}
          />
        )}

        {/* Match End Modal */}
        {gameState.phase === 'MATCH_END' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-4xl font-black text-yellow-400 mb-3">
                {gameState.winner === currentViewingPlayer ? 'YOU WIN!' : 'GAME OVER'}
              </h2>
              <div className="text-2xl text-white font-bold mb-4">
                {gameState.player1_score} – {gameState.player2_score}
              </div>
              <p className="text-gray-400 mb-6">
                {gameState.winner === 'player1' ? 'Player 1' : 'Player 2'} wins!
              </p>
              <button
                onClick={() => {
                  resetGame();
                  router.push('/roster');
                }}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-all"
              >
                🎮 New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
