'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { RinkLayout } from '@/components/game/RinkLayout';
import { TurnPanel } from '@/components/game/TurnPanel';
import { ResolutionModal } from '@/components/game/ResolutionModal';
import { RPSChoice } from '@/types/game';
import { HandoffScreen } from '@/components/game/HandoffScreen';

export default function GamePage() {
  const router = useRouter();
  const {
    gameState,
    currentViewingPlayer,
    pendingHandoff,
    confirmHandoff,
    showResolutionResult,
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

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-white mb-2">No game in progress</h1>
          <button
            onClick={() => router.push('/roster')}
            className="mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold min-h-[48px]"
          >
            ← Back to Roster Selection
          </button>
        </div>
      </div>
    );
  }

  const handleResolutionDismiss = () => {
    dismissResolution();
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-7xl mx-auto px-3 py-3 md:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center"
          >
            ← Home
          </button>
          <div className="text-xs sm:text-sm font-semibold text-gray-300">
            {currentViewingPlayer === 'player1' ? '🔵 P1' : '🔴 P2'}&apos;s view
          </div>
          <button
            onClick={() => {
              resetGame();
              router.push('/roster');
            }}
            className="text-gray-400 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-end"
          >
            New →
          </button>
        </div>

        {/* Scoreboard */}
        <div className="mb-3">
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

        {/* Main game area
            Mobile: TurnPanel first (most interactive), then Rink below
            Desktop (lg): Rink left (2/3), TurnPanel right (1/3)
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3">
          {/* TurnPanel — on mobile rendered FIRST so it's immediately visible */}
          <div className="order-1 lg:order-2 lg:col-start-3">
            <TurnPanel
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onRPSSubmit={(player, choice) => submitRPSChoice(player, choice)}
              onSkipLineChange={(player) => skipLineChange(player)}
              onLineChange={(player, swaps) => doLineChange(player, swaps)}
              onDrawCard={drawOffensiveCard}
              onSelectDefensiveCard={selectDefensiveCard}
              onActivateTrait={(player, trait) => activateTrait(player, trait)}
              onConfirmResolution={confirmResolution}
            />
          </div>

          {/* Rink — on mobile rendered SECOND (below TurnPanel) */}
          <div className="order-2 lg:order-1 lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <RinkLayout
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onSelectOffensiveBeaut={setActiveOffensiveBeaut}
              onSelectDefensiveBeaut={setActiveDefensiveBeaut}
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

        {/* Hot-Seat Handoff Screen — renders on top of everything */}
        {pendingHandoff && (
          <HandoffScreen toPlayer={pendingHandoff} onReady={confirmHandoff} />
        )}

        {/* Match End Modal */}
        {gameState.phase === 'MATCH_END' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-6 sm:p-8 w-full max-w-md text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl sm:text-4xl font-black text-yellow-400 mb-3">
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
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-all min-h-[56px]"
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
