'use client';

import React from 'react';
import { ResolutionResult, GameState } from '@/types/game';
import { ActionCardUI } from '@/components/ui/ActionCardUI';
import { describeOutcome } from '@/lib/engine/resolution';

interface ResolutionModalProps {
  result: ResolutionResult;
  gameState: GameState;
  viewingPlayer: 'player1' | 'player2';
  onDismiss: () => void;
}

export function ResolutionModal({ result, gameState, viewingPlayer, onDismiss }: ResolutionModalProps) {
  const goalScored = result.goal_scored;
  const isWinner = goalScored && gameState.possession === viewingPlayer;
  // After resolution, possession may have changed — check score
  const p1Score = gameState.player1_score;
  const p2Score = gameState.player2_score;

  const outcomeBg = goalScored
    ? 'border-yellow-500 bg-yellow-950/90'
    : result.outcome === 'DEFENSE_WINS'
    ? 'border-blue-600 bg-blue-950/90'
    : 'border-green-600 bg-green-950/90';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`rounded-t-2xl sm:rounded-2xl border-2 p-5 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[90vh] overflow-y-auto ${outcomeBg}`}
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {/* Header */}
        <div className="text-center mb-4">
          {goalScored ? (
            <>
              <div className="text-6xl mb-2 animate-bounce">🚨</div>
              <h2 className="text-yellow-400 font-black text-3xl">GOAL!</h2>
              <div className="text-white text-xl mt-1">
                {p1Score} – {p2Score}
              </div>
            </>
          ) : result.outcome === 'DEFENSE_WINS' ? (
            <>
              <div className="text-4xl mb-2">🛡️</div>
              <h2 className="text-blue-400 font-bold text-2xl">Defense Wins!</h2>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">⚔️</div>
              <h2 className="text-green-400 font-bold text-2xl">Offense Succeeds!</h2>
            </>
          )}
        </div>

        {/* Cards reveal */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-xs text-orange-400 font-bold mb-1">⚔️ OFFENSE</div>
            <ActionCardUI cardType={result.offensive_card} size="lg" />
            <div className="text-white text-sm mt-1 font-bold">{result.offensive_card}</div>
          </div>
          <div className="text-gray-400 text-2xl font-bold">VS</div>
          <div className="text-center">
            <div className="text-xs text-blue-400 font-bold mb-1">🛡️ DEFENSE</div>
            <ActionCardUI cardType={result.defensive_card} size="lg" />
            <div className="text-white text-sm mt-1 font-bold">{result.defensive_card}</div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-black/40 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-white text-sm font-medium">{describeOutcome(result)}</p>
        </div>

        {/* Special effects */}
        {result.special_effects.length > 0 && (
          <div className="mb-4">
            <div className="text-purple-400 text-xs font-bold mb-1">Special Effects:</div>
            {result.special_effects.map((effect, i) => (
              <div key={i} className="text-purple-300 text-xs">
                ✨ {formatEffect(effect.type)}
              </div>
            ))}
          </div>
        )}

        {/* Catch-up */}
        {gameState.catch_up_traits_pending && (
          <div className="bg-yellow-950 border border-yellow-600 rounded-lg px-3 py-2 mb-4">
            <div className="text-yellow-400 text-sm font-bold">🎁 Catch-Up Bonus!</div>
            <div className="text-yellow-300 text-xs">
              {gameState.catch_up_traits_pending.player_id === 'player1' ? 'Player 1' : 'Player 2'} receives 2 Trait Cards
            </div>
          </div>
        )}

        {/* Match end check */}
        {gameState.winner && (
          <div className="text-center mb-4">
            <div className="text-4xl">🏆</div>
            <div className="text-yellow-400 font-black text-2xl">
              {gameState.winner === viewingPlayer ? 'YOU WIN!' : 'Opponent Wins!'}
            </div>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold transition-all min-h-[56px]"
        >
          {gameState.winner ? '🏆 View Final Score' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

function formatEffect(type: string): string {
  const effects: Record<string, string> = {
    TWO_WAY_RETAIN: 'Two-Way: Retained possession!',
    SNIPER_UNBLOCKABLE: 'Sniper: Shot cannot be blocked!',
    POWER_FWD_EJECT: 'Power Forward: Opponent ejected from ice!',
    TWO_TIMER_FALLBACK: 'Two-Timer: Secondary action triggered!',
    STAND_UP_COUNTERATTACK: 'Stand Up: Counterattack launched!',
    BUTTERFLY_RETURN: 'Butterfly: Card returned to pile!',
    PUCK_MOVER_NO_STEAL: 'Puck Mover: Pass cannot be stolen!',
    PLAYMAKER_BONUS_CARD: 'Playmaker: Teammate received bonus card!',
    GRINDER_DISCARD: 'Grinder: Opponent discarded a card!',
    DANGLER_DRAIN: 'Dangler: Opponent lost a card!',
    ENFORCER_DRAIN: 'Enforcer: Card drain effect!',
    HYBRID_CHOICE: 'Hybrid: Chose best counter!',
    OFFENSIVE_ARCHETYPE_PICK: 'Offensive Archetype: Chose specific card!',
    DEFENSIVE_ARCHETYPE_SEE: 'Defensive Archetype: Saw opponent card!',
  };
  return effects[type] || type;
}
