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
    <div className="flex items-center justify-between bg-gray-900/90 border border-gray-700 rounded-xl px-3 py-2 sm:px-4 sm:py-2 w-full">
      {/* Player 1 Score */}
      <div className={`flex flex-col items-center min-w-[60px] sm:min-w-[80px] ${possession === 'player1' ? 'text-white' : 'text-gray-400'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider hidden sm:block">Player 1</div>
        <div className="text-xs font-semibold sm:hidden">P1</div>
        <div className="text-3xl sm:text-4xl font-black tabular-nums">{player1Score}</div>
        <div className="flex gap-0.5 sm:gap-1 mt-1">
          {Array.from({ length: WIN_GOALS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border ${i < player1Score ? 'bg-white border-white' : 'border-gray-600 bg-transparent'}`}
            />
          ))}
        </div>
        {possession === 'player1' && (
          <div className="text-xs text-green-400 mt-0.5 animate-pulse">🏒</div>
        )}
      </div>

      {/* Center info */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1 px-1">
        <div className="text-gray-500 text-xs uppercase tracking-widest">VS</div>
        <div className="text-gray-400 text-xs hidden sm:block">First to {WIN_GOALS}</div>
        <div className={`text-xs px-1.5 py-0.5 rounded font-bold ${canShoot ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
          {canShoot ? '🎯 Shoot' : '⛔ No'}
        </div>
        <div className="text-gray-500 text-xs">T{turnNumber}</div>
        <div className="text-gray-600 text-xs truncate max-w-[90px] sm:max-w-[120px] text-center">{formatPhase(phase)}</div>
      </div>

      {/* Player 2 Score */}
      <div className={`flex flex-col items-center min-w-[60px] sm:min-w-[80px] ${possession === 'player2' ? 'text-white' : 'text-gray-400'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider hidden sm:block">Player 2</div>
        <div className="text-xs font-semibold sm:hidden">P2</div>
        <div className="text-3xl sm:text-4xl font-black tabular-nums">{player2Score}</div>
        <div className="flex gap-0.5 sm:gap-1 mt-1">
          {Array.from({ length: WIN_GOALS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border ${i < player2Score ? 'bg-white border-white' : 'border-gray-600 bg-transparent'}`}
            />
          ))}
        </div>
        {possession === 'player2' && (
          <div className="text-xs text-green-400 mt-0.5 animate-pulse">🏒</div>
        )}
      </div>
    </div>
  );
}

function formatPhase(phase: string): string {
  const phaseMap: Record<string, string> = {
    INIT: '⚙️ Init',
    ROSTER_SELECT: '📋 Roster',
    SETUP: '🏗️ Setup',
    RPS: '✊ RPS',
    POSSESSION_START: '🏒 Possession',
    LINE_CHANGE_OFFENSIVE: '🔄 Off Change',
    LINE_CHANGE_DEFENSIVE: '🔄 Def Change',
    OFFENSIVE_DRAW: '🎲 Drawing...',
    DEFENSIVE_RESPONSE: '🛡️ Defense',
    HYBRID_CHOICE: '🔀 Hybrid',
    SIMULTANEOUS_REVEAL: '⚡ Reveal',
    RESOLUTION: '⚡ Resolving',
    POST_RESOLUTION: '📋 Post',
    GOAL_SCORED: '🚨 GOAL!',
    FORCED_LINE_CHANGE: '🔄 Forced Change',
    MATCH_END: '🏆 Over!',
  };
  return phaseMap[phase] || phase;
}
