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
  const p1Score = gameState.player1_score;
  const p2Score = gameState.player2_score;

  const outcomeBg = goalScored
    ? 'border-yellow-500 bg-yellow-950/90'
    : result.outcome === 'TURNOVER'
    ? 'border-red-600 bg-red-950/90'
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
                {p1Score} - {p2Score}
              </div>
            </>
          ) : result.outcome === 'TURNOVER' ? (
            <>
              <div className="text-4xl mb-2">💥</div>
              <h2 className="text-red-400 font-bold text-2xl">TURNOVER!</h2>
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
            <div className="text-xs text-orange-400 font-bold mb-1">OFFENSE</div>
            <ActionCardUI cardType={result.offensive_card} size="lg" />
            <div className="text-white text-sm mt-1 font-bold">
              {result.offensive_card}
              {result.offensive_trait_name && (
                <div className="text-purple-300 text-xs">{result.offensive_trait_name}</div>
              )}
            </div>
          </div>
          <div className="text-gray-400 text-2xl font-bold">VS</div>
          <div className="text-center">
            <div className="text-xs text-blue-400 font-bold mb-1">DEFENSE</div>
            <ActionCardUI cardType={result.defensive_card} size="lg" />
            <div className="text-white text-sm mt-1 font-bold">
              {result.defensive_card}
              {result.defensive_trait_name && (
                <div className="text-purple-300 text-xs">{result.defensive_trait_name}</div>
              )}
            </div>
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
                {formatEffect(effect.type)}
              </div>
            ))}
          </div>
        )}

        {/* Card cycling info */}
        <div className="mb-4 text-xs text-gray-500">
          {result.offensive_card_returns_to_deck && <div>Offensive card returned to Action Deck</div>}
          {result.defensive_card_returns_to_deck && <div>Defensive card returned to Action Deck</div>}
          {!result.offensive_card_returns_to_deck && result.offensive_trait_name && (
            <div className="text-purple-400">Offensive trait triggered — permanently discarded</div>
          )}
          {!result.defensive_card_returns_to_deck && result.defensive_trait_name && (
            <div className="text-purple-400">Defensive trait triggered — permanently discarded</div>
          )}
          {result.immediate_redraw && (
            <div className="text-green-400">Immediate re-draw pending!</div>
          )}
        </div>

        {/* Catch-up */}
        {gameState.catch_up_traits_pending && (
          <div className="bg-yellow-950 border border-yellow-600 rounded-lg px-3 py-2 mb-4">
            <div className="text-yellow-400 text-sm font-bold">Catch-Up Bonus!</div>
            <div className="text-yellow-300 text-xs">
              {gameState.catch_up_traits_pending.player_id === 'player1' ? 'Player 1' : 'Player 2'} receives reserved Trait Cards added to Action Deck
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
    TWO_WAY_RETAIN: 'Two-Way: Retained possession + immediate re-draw!',
    SNIPER_UNBLOCKABLE: 'Sniper: Shot cannot be blocked!',
    SNIPER_NEGATED_BY_STEAL: 'Sniper: Negated by Steal!',
    SNIPER_NEGATED_BY_CHECK: 'Sniper: Negated by Check!',
    SHOOT_PREREQUISITE_FAIL: 'Shoot without Pass/Skate — TURNOVER!',
    TWO_TIMER_FALLBACK: 'Two-Timer: Primary stopped — backup action!',
    STAND_UP_COUNTERATTACK: 'Stand Up: Caught + counterattack!',
    STAND_UP_IMMEDIATE: 'Stand Up: Pass + immediate action!',
    BUTTERFLY_RETURN: 'Butterfly: Redraw triggered!',
    PUCK_MOVER_IMMEDIATE: 'Puck Mover: Pass + immediate action!',
    PLAYMAKER_IMMEDIATE: 'Playmaker: Skate + immediate action!',
    GRINDER_DISCARD_TRAIT: 'Grinder: Opponent lost a trait card!',
    GRINDER_DISCARD: 'Grinder: Opponent lost a card!',
    GRINDER_NO_TARGET: 'Grinder: No trait target — card returned!',
    DANGLER_DRAIN: 'Dangler: Opponent lost a card!',
    ENFORCER_FORCE_LINE_CHANGE: 'Enforcer: Forced opponent line change!',
    ENFORCER_COUNTER: 'Enforcer: Countered all + forced discard!',
    ENFORCER_CANT_LINE_CHANGE_DISCARD: 'Enforcer: Can\'t line change — all Beauts discarded!',
    HYBRID_CHOICE: 'Hybrid: Chose action!',
    OFFENSIVE_SWITCH_PUCK: 'Offensive: Switched puck holder!',
    OFFENSIVE_SHOOT_SWITCH: 'Offensive: Switch + Shoot!',
  };
  return effects[type] || type;
}
