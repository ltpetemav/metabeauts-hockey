'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { RinkLayout } from '@/components/game/RinkLayout';
import { TurnPanel } from '@/components/game/TurnPanel';
import { ResolutionModal } from '@/components/game/ResolutionModal';
import { HandoffScreen } from '@/components/game/HandoffScreen';
import GameStage from '@/components/game/GameStage';
import './game.css';

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
    submitHybridChoice,
    confirmResolution,
    dismissResolution,
    setActiveOffensiveBeaut,
    setActiveDefensiveBeaut,
    resetGame,
  } = useGameStore();

  if (!gameState) {
    return (
      <div className="no-game">
        <div className="inner">
          <div className="icon">🎮</div>
          <h1>No game in progress</h1>
          <button onClick={() => router.push('/roster')} className="back-btn">
            ← Back to Roster
          </button>
        </div>
      </div>
    );
  }

  const handleResolutionDismiss = () => {
    dismissResolution();
  };

  const topBar = (
    <div className="game-topbar">
      <div className="left-meta">
        <button onClick={() => router.push('/')} className="crumb">← Home</button>
        <div className="live-pill"><span className="dot" /> LIVE</div>
        <div className="live-pill">T{gameState.turn_number}</div>
      </div>

      <div className="game-logo">
        <span className="game-logo-mark">
          <svg viewBox="0 0 24 24"><path d="M5 4 L19 4 L19 7 L13 7 L13 20 L11 20 L11 7 L5 7 Z" fill="white" /></svg>
        </span>
        <div className="game-logo-text">
          <span className="game-logo-name">META<b>BEAUTS</b></span>
          <span className="game-logo-sub">HOCKEY</span>
        </div>
      </div>

      <div className="right-meta">
        <div className="crumb" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          {currentViewingPlayer === 'player1' ? '🔵 P1' : '🔴 P2'}
        </div>
        <button
          onClick={() => {
            resetGame();
            router.push('/roster');
          }}
          className="crumb"
        >
          New →
        </button>
      </div>
    </div>
  );

  return (
    <>
      <GameStage topBar={topBar}>
        {/* Scoreboard */}
        <div>
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
            Desktop (lg): Rink left (2/3), TurnPanel right (1/3) */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 flex-1 min-h-0">
          <div className="order-1 lg:order-2 lg:col-start-3 lg:overflow-y-auto">
            <TurnPanel
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onRPSSubmit={(player, choice) => submitRPSChoice(player, choice)}
              onSkipLineChange={(player) => skipLineChange(player)}
              onLineChange={(player, swaps) => doLineChange(player, swaps)}
              onDrawCard={drawOffensiveCard}
              onSelectDefensiveCard={selectDefensiveCard}
              onSubmitHybridChoice={submitHybridChoice}
              onConfirmResolution={confirmResolution}
            />
          </div>

          <div className="order-2 lg:order-1 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:overflow-y-auto">
            <RinkLayout
              gameState={gameState}
              viewingPlayer={currentViewingPlayer}
              onSelectOffensiveBeaut={setActiveOffensiveBeaut}
              onSelectDefensiveBeaut={setActiveDefensiveBeaut}
            />
          </div>
        </div>
      </GameStage>

      {/* Resolution Modal */}
      {showResolutionResult && gameState.last_resolution && (
        <ResolutionModal
          result={gameState.last_resolution}
          gameState={gameState}
          viewingPlayer={currentViewingPlayer}
          onDismiss={handleResolutionDismiss}
        />
      )}

      {/* Hot-Seat Handoff Screen */}
      {pendingHandoff && (
        <HandoffScreen toPlayer={pendingHandoff} onReady={confirmHandoff} />
      )}

      {/* Match End Modal — themed */}
      {gameState.phase === 'MATCH_END' && (
        <div className="game-end-overlay">
          <div className="game-end-card">
            <div className="trophy">🏆</div>
            <h2>{gameState.winner === currentViewingPlayer ? 'You Win!' : 'Game Over'}</h2>
            <div className="final-score">
              {gameState.player1_score} – {gameState.player2_score}
            </div>
            <p>
              {gameState.winner === 'player1' ? 'Player 1' : 'Player 2'} wins
            </p>
            <button
              onClick={() => {
                resetGame();
                router.push('/roster');
              }}
              className="new-game-btn"
            >
              🎮 New Game
            </button>
          </div>
        </div>
      )}
    </>
  );
}
