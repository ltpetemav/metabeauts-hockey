'use client';

import React from 'react';

interface ScoreBoardProps {
  player1Score: number;
  player2Score: number;
  possession: 'player1' | 'player2';
  canShoot: boolean;
  turnNumber: number;
  phase: string;
  currentViewingPlayer: 'player1' | 'player2';
}

export function ScoreBoard({
  player1Score,
  player2Score,
  possession,
  canShoot,
  turnNumber,
  phase,
  currentViewingPlayer,
}: ScoreBoardProps) {
  const WIN_GOALS = 3;

  return (
    <div className="flex items-center justify-between bg-gray-900/90 border border-gray-700 rounded-xl px-4 py-2 w-full">
      {/* Player 1 Score */}
      <div className={`flex flex-col items-center min-w-[80px] ${possession === 'player1' ? 'text-white' : 'text-gray-400'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider">Player 1</div>
        <div className="text-4xl font-black tabular-nums">{player1Score}</div>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: WIN_GOALS }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${i < player1Score ? 'bg-white border-white' : 'border-gray-600 bg-transparent'}`}
            />
          ))}
        </div>
        {possession === 'player1' && (
          <div className="text-xs text-green-400 mt-0.5 animate-pulse">🏒 Has Puck</div>
        )}
      </div>

      {/* Center info */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-gray-500 text-xs uppercase tracking-widest">VS</div>
        <div className="text-gray-400 text-xs">First to {WIN_GOALS} wins</div>
        <div className={`text-xs px-2 py-0.5 rounded font-bold ${canShoot ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
          {canShoot ? '🎯 canShoot' : '⛔ No Shoot'}
        </div>
        <div className="text-gray-500 text-xs">Turn {turnNumber}</div>
        <div className="text-gray-600 text-xs truncate max-w-[120px] text-center">{formatPhase(phase)}</div>
      </div>

      {/* Player 2 Score */}
      <div className={`flex flex-col items-center min-w-[80px] ${possession === 'player2' ? 'text-white' : 'text-gray-400'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider">Player 2</div>
        <div className="text-4xl font-black tabular-nums">{player2Score}</div>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: WIN_GOALS }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${i < player2Score ? 'bg-white border-white' : 'border-gray-600 bg-transparent'}`}
            />
          ))}
        </div>
        {possession === 'player2' && (
          <div className="text-xs text-green-400 mt-0.5 animate-pulse">🏒 Has Puck</div>
        )}
      </div>
    </div>
  );
}

function formatPhase(phase: string): string {
  const phaseMap: Record<string, string> = {
    INIT: '⚙️ Initializing...',
    ROSTER_SELECT: '📋 Roster Select',
    SETUP: '🏗️ Setup',
    RPS: '✊ Rock-Paper-Scissors',
    POSSESSION_START: '🏒 Start of Possession',
    LINE_CHANGE_OFFENSIVE: '🔄 Offense: Line Change?',
    LINE_CHANGE_DEFENSIVE: '🔄 Defense: Line Change?',
    OFFENSIVE_DRAW: '🎲 Drawing Offense Card...',
    DEFENSIVE_RESPONSE: '🛡️ Defense: Select Response',
    TRAIT_WINDOW: '✨ Trait Activation Window',
    RESOLUTION: '⚡ Resolving Action...',
    POST_RESOLUTION: '📋 Post-Resolution',
    GOAL_SCORED: '🚨 GOAL!',
    GLOBAL_EXHAUSTION_REFRESH: '🔄 Exhaustion Refresh',
    MATCH_END: '🏆 Match Over!',
  };
  return phaseMap[phase] || phase;
}
