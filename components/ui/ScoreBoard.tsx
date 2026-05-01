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

const WIN_GOALS = 3;

/**
 * Jumbotron — themed scoreboard with LED-grid background, neon-glow scores, and per-preset
 * variants (HUD/Retro/Vapor/Topps). Replaces the prior flat ScoreBoard.
 * Keeps the same prop interface so the rest of the gameplay flow is untouched.
 */
export function ScoreBoard({
  player1Score,
  player2Score,
  possession,
  canShoot,
  turnNumber,
  phase,
  currentViewingPlayer: _viewing,
}: ScoreBoardProps) {
  return (
    <div className="jumbo">
      <div className="jumbo-grid">
        {/* P1 */}
        <div className={`jb-team p1 ${possession === 'player1' ? 'pos' : ''}`}>
          <div className="jb-badge">
            <span>P1</span>
          </div>
          <div className="jb-info">
            <div className="jb-name">Player 1</div>
            <div className="jb-meta">
              {possession === 'player1' && <span className="jb-puck">🏒 PUCK</span>}
              <span className="jb-pips">
                {Array.from({ length: WIN_GOALS }).map((_, i) => (
                  <span key={i} className={`pip ${i < player1Score ? 'on' : ''}`} />
                ))}
              </span>
            </div>
          </div>
          <div className="jb-score">{player1Score}</div>
        </div>

        {/* Center */}
        <div className="jb-center">
          <div className="jb-vs">VS</div>
          <div className="jb-period">T{turnNumber}</div>
          <div className={`jb-shot ${canShoot ? 'on' : 'off'}`}>
            {canShoot ? '🎯 SHOOT' : '⛔ NO SHOT'}
          </div>
          <div className="jb-phase">{formatPhase(phase)}</div>
        </div>

        {/* P2 */}
        <div className={`jb-team p2 ${possession === 'player2' ? 'pos' : ''}`}>
          <div className="jb-score">{player2Score}</div>
          <div className="jb-info right">
            <div className="jb-name">Player 2</div>
            <div className="jb-meta right">
              <span className="jb-pips">
                {Array.from({ length: WIN_GOALS }).map((_, i) => (
                  <span key={i} className={`pip ${i < player2Score ? 'on' : ''}`} />
                ))}
              </span>
              {possession === 'player2' && <span className="jb-puck">🏒 PUCK</span>}
            </div>
          </div>
          <div className="jb-badge">
            <span>P2</span>
          </div>
        </div>
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
    OFFENSIVE_DRAW: '🎲 Drawing',
    DEFENSIVE_RESPONSE: '🛡️ Defense',
    HYBRID_CHOICE: '🔀 Hybrid',
    SIMULTANEOUS_REVEAL: '⚡ Reveal',
    RESOLUTION: '⚡ Resolving',
    POST_RESOLUTION: '📋 Post',
    GOAL_SCORED: '🚨 GOAL!',
    FORCED_LINE_CHANGE: '🔄 Forced',
    MATCH_END: '🏆 Over',
  };
  return phaseMap[phase] || phase;
}
