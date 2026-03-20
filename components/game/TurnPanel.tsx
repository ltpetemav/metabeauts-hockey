'use client';

import React, { useState } from 'react';
import { GameState, CardType, TraitName, RPSChoice, ActionCard } from '@/types/game';
import { ActionCardUI } from '@/components/ui/ActionCardUI';
import { availableCards } from '@/lib/engine/cards';
import { describeOutcome } from '@/lib/engine/resolution';

interface TurnPanelProps {
  gameState: GameState;
  viewingPlayer: 'player1' | 'player2';
  onRPSSubmit: (player: 'player1' | 'player2', choice: RPSChoice) => void;
  onSkipLineChange: (player: 'player1' | 'player2') => void;
  onLineChange: (player: 'player1' | 'player2', swaps: Array<{ ice_beaut_id: string; bench_beaut_id: string; new_card: CardType }>) => void;
  onDrawCard: () => void;
  onSelectDefensiveCard: (cardId: string) => void;
  onActivateTrait: (player: 'player1' | 'player2', trait: TraitName | null) => void;
  onConfirmResolution: () => void;
}

export function TurnPanel({
  gameState,
  viewingPlayer,
  onRPSSubmit,
  onSkipLineChange,
  onLineChange,
  onDrawCard,
  onSelectDefensiveCard,
  onActivateTrait,
  onConfirmResolution,
}: TurnPanelProps) {
  const { phase, possession, drawn_card, defensive_selected_card, mode } = gameState;
  const isOffensivePlayer = possession === viewingPlayer;
  const defensivePlayer = possession === 'player1' ? 'player2' : 'player1';
  const isDefensivePlayer = defensivePlayer === viewingPlayer;

  const offensiveBeautId = gameState.active_offensive_beaut_id;
  const defensiveBeautId = gameState.active_defensive_beaut_id;

  const offensiveBeaut = offensiveBeautId
    ? (gameState.player1.beauts.find(b => b.id === offensiveBeautId) ||
       gameState.player2.beauts.find(b => b.id === offensiveBeautId))
    : null;

  const defensiveBeaut = defensiveBeautId
    ? (gameState.player1.beauts.find(b => b.id === defensiveBeautId) ||
       gameState.player2.beauts.find(b => b.id === defensiveBeautId))
    : null;

  // --- RPS Phase ---
  if (phase === 'RPS') {
    const p1Chose = gameState.rps_choice_p1 !== null;
    const p2Chose = gameState.rps_choice_p2 !== null;
    const thisPlayerChose = viewingPlayer === 'player1' ? p1Chose : p2Chose;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold text-base sm:text-lg mb-2">✊ Rock-Paper-Scissors</h3>
        <p className="text-gray-400 text-sm mb-3">
          {viewingPlayer === 'player1' ? 'Player 1' : 'Player 2'}: Choose your move!
          Winner gets possession.
        </p>
        {thisPlayerChose ? (
          <div className="text-green-400 text-sm py-2">✅ Choice locked! Waiting for opponent...</div>
        ) : (
          <div className="flex gap-2 sm:gap-3">
            {(['rock', 'paper', 'scissors'] as RPSChoice[]).map(choice => (
              <button
                key={choice}
                onClick={() => onRPSSubmit(viewingPlayer, choice)}
                className="flex-1 py-4 sm:py-3 px-2 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-bold border border-gray-600 hover:border-gray-400 transition-all active:scale-95 min-h-[72px] sm:min-h-[64px]"
              >
                <div className="text-3xl sm:text-2xl">{choice === 'rock' ? '✊' : choice === 'paper' ? '🖐' : '✌️'}</div>
                <div className="text-sm capitalize mt-1">{choice}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- POSSESSION_START / LINE_CHANGE ---
  if (phase === 'POSSESSION_START' || phase === 'LINE_CHANGE_OFFENSIVE' || phase === 'LINE_CHANGE_DEFENSIVE') {
    const isMyTurn =
      (phase === 'POSSESSION_START' && !gameState.offensive_line_change_done && isOffensivePlayer) ||
      (phase === 'POSSESSION_START' && gameState.offensive_line_change_done && !gameState.defensive_line_change_done && isDefensivePlayer) ||
      (phase === 'LINE_CHANGE_OFFENSIVE' && isOffensivePlayer) ||
      (phase === 'LINE_CHANGE_DEFENSIVE' && isDefensivePlayer);

    if (!isMyTurn) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">
            ⏳ Waiting for {isOffensivePlayer ? 'defense' : 'offense'} to decide on line change...
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold text-base sm:text-lg mb-2">🔄 Line Change?</h3>
        <p className="text-gray-400 text-sm mb-3">
          {isOffensivePlayer ? '⚔️ Offense' : '🛡️ Defense'}: Do you want to make a line change before this possession?
        </p>
        <LineChangeUI
          gameState={gameState}
          player={viewingPlayer}
          onConfirm={(swaps) => onLineChange(viewingPlayer, swaps)}
          onSkip={() => onSkipLineChange(viewingPlayer)}
        />
      </div>
    );
  }

  // --- OFFENSIVE_DRAW ---
  if (phase === 'OFFENSIVE_DRAW') {
    if (!isOffensivePlayer) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">🎲 Opponent is drawing an action card...</div>
        </div>
      );
    }
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold text-base sm:text-lg mb-2">🎲 Draw Your Card</h3>
        <p className="text-gray-400 text-sm mb-3">
          Server will randomly draw from {offensiveBeaut?.name}&apos;s pile.
          ({offensiveBeaut ? availableCards(offensiveBeaut.action_pile).length : 0} cards remaining)
        </p>
        {gameState.can_shoot ? (
          <div className="bg-green-900/50 border border-green-600 rounded-lg px-3 py-2 mb-3 text-green-300 text-sm">
            🎯 canShoot = TRUE — Shoot cards are eligible!
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 mb-3 text-gray-400 text-sm">
            ⛔ canShoot = FALSE — Must Pass or Skate first
          </div>
        )}
        <button
          onClick={onDrawCard}
          className="w-full py-4 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 text-white font-bold text-base sm:text-lg transition-all active:scale-95 min-h-[56px]"
        >
          🎲 Draw Card (Server RNG)
        </button>
      </div>
    );
  }

  // --- DEFENSIVE_RESPONSE ---
  if (phase === 'DEFENSIVE_RESPONSE') {
    if (isOffensivePlayer) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-bold mb-2 text-sm sm:text-base">You drew:</h3>
          {drawn_card && (
            <div className="flex items-center gap-3">
              <ActionCardUI cardType={drawn_card.card_type} size="lg" />
              <div>
                <div className="text-white font-bold text-lg sm:text-xl">{drawn_card.card_type}</div>
                {drawn_card.is_trait && (
                  <div className="text-purple-300 text-sm">Trait: {drawn_card.trait_name}</div>
                )}
              </div>
            </div>
          )}
          <p className="text-gray-400 text-sm mt-3">⏳ Waiting for defense to select their response...</p>
        </div>
      );
    }

    // Defensive player selects a card
    if (!defensiveBeaut) return null;
    const availDef = availableCards(defensiveBeaut.action_pile);

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold text-base sm:text-lg mb-2">🛡️ Select Your Defense</h3>
        <p className="text-gray-400 text-sm mb-2">
          {defensiveBeaut.name} — <span className="text-white font-bold">{availDef.length} cards</span>
        </p>
        {drawn_card && (
          <div className="mb-3 bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-400 text-xs">Offense played: </span>
            <span className="text-white font-bold">{drawn_card.card_type}</span>
          </div>
        )}
        {availDef.length === 0 ? (
          <div className="text-red-400">💀 No cards left — defense auto-fails!</div>
        ) : (
          <div className="flex flex-wrap gap-2 sm:gap-2 justify-center">
            {availDef.map(card => (
              <ActionCardUI
                key={card.id}
                card={card}
                isSelected={defensive_selected_card?.id === card.id}
                onClick={() => onSelectDefensiveCard(card.id)}
                size="md"
              />
            ))}
          </div>
        )}
        {defensive_selected_card && (
          <div className="mt-3 text-green-400 text-sm">
            ✅ Selected: {defensive_selected_card.card_type}
            {defensive_selected_card.is_trait && ` (Trait: ${defensive_selected_card.trait_name})`}
          </div>
        )}
      </div>
    );
  }

  // --- TRAIT_WINDOW ---
  if (phase === 'TRAIT_WINDOW') {
    const myRoster = viewingPlayer === 'player1' ? gameState.player1 : gameState.player2;
    const myBeautId = isOffensivePlayer ? offensiveBeautId : defensiveBeautId;
    const myBeaut = myBeautId ? myRoster.beauts.find(b => b.id === myBeautId) : null;
    const myTrait = myBeaut?.trait_card;
    const hasForcedTrait = myTrait && !myTrait.is_spent && myTrait.trait_type === 'Forced' && mode === 'RegularSeason';

    const alreadyActivated = isOffensivePlayer
      ? gameState.pending_offensive_trait !== null
      : gameState.pending_defensive_trait !== null;

    const bothCardsReady = drawn_card !== null && defensive_selected_card !== null;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold text-base sm:text-lg mb-2">✨ Trait Window</h3>

        {/* Show both cards about to resolve — compact on mobile */}
        <div className="flex gap-2 sm:gap-4 justify-center mb-3">
          {drawn_card && (
            <div className="text-center">
              <div className="text-xs text-orange-400 mb-1">⚔️ Off</div>
              <ActionCardUI cardType={drawn_card.card_type} size="sm" />
              <div className="text-xs text-gray-400 mt-1">{drawn_card.card_type}</div>
            </div>
          )}
          <div className="flex items-center text-gray-500 text-base sm:text-xl font-bold">VS</div>
          {defensive_selected_card && (
            <div className="text-center">
              <div className="text-xs text-blue-400 mb-1">🛡️ Def</div>
              <ActionCardUI cardType={defensive_selected_card.card_type} size="sm" />
              <div className="text-xs text-gray-400 mt-1">{defensive_selected_card.card_type}</div>
            </div>
          )}
        </div>

        {hasForcedTrait && !alreadyActivated ? (
          <div>
            <div className="bg-purple-900/50 border border-purple-600 rounded-lg px-3 py-2 mb-3">
              <div className="text-purple-300 font-bold text-sm">✨ {myTrait!.trait_name} available!</div>
              <div className="text-purple-400 text-xs mt-1">
                {isOffensivePlayer ? 'Offensive' : 'Defensive'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onActivateTrait(viewingPlayer, myTrait!.trait_name)}
                className="flex-1 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-sm transition-all min-h-[48px]"
              >
                ✨ Activate {myTrait!.trait_name}
              </button>
              <button
                onClick={() => onActivateTrait(viewingPlayer, null)}
                className="flex-1 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white text-sm transition-all min-h-[48px]"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div>
            {mode === 'PreSeason' && (
              <div className="text-gray-500 text-sm mb-2">🔕 Pre-Season: Traits disabled</div>
            )}
            {alreadyActivated && (
              <div className="text-purple-400 text-sm mb-2">
                ✨ Trait activated: {isOffensivePlayer ? gameState.pending_offensive_trait : gameState.pending_defensive_trait}
              </div>
            )}
            {bothCardsReady && (
              <button
                onClick={onConfirmResolution}
                className="w-full py-4 rounded-xl bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold text-base sm:text-lg transition-all active:scale-95 min-h-[56px]"
              >
                ⚡ Resolve Action!
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- MATCH_END ---
  if (phase === 'MATCH_END') {
    const winner = gameState.winner;
    return (
      <div className="bg-gray-900 border border-yellow-600 rounded-xl p-4 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="text-yellow-400 font-black text-xl sm:text-2xl">
          {winner === viewingPlayer ? 'YOU WIN!' : winner ? 'OPPONENT WINS!' : 'GAME OVER'}
        </h3>
        <div className="text-gray-400 mt-2 text-sm sm:text-base">
          Final: {gameState.player1_score} – {gameState.player2_score}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="text-gray-400 text-sm">Phase: {phase}</div>
    </div>
  );
}

// Line Change sub-component — mobile-friendly
function LineChangeUI({
  gameState,
  player,
  onConfirm,
  onSkip,
}: {
  gameState: GameState;
  player: 'player1' | 'player2';
  onConfirm: (swaps: Array<{ ice_beaut_id: string; bench_beaut_id: string; new_card: CardType }>) => void;
  onSkip: (player: 'player1' | 'player2') => void;
}) {
  const roster = player === 'player1' ? gameState.player1 : gameState.player2;
  const [selectedIce, setSelectedIce] = useState<string | null>(null);
  const [selectedBench, setSelectedBench] = useState<string | null>(null);
  const [newCard, setNewCard] = useState<CardType>('Block');

  const iceBeauts = roster.on_ice.map(id => roster.beauts.find(b => b.id === id)).filter(Boolean) as typeof roster.beauts;
  const benchBeauts = roster.on_bench.map(id => roster.beauts.find(b => b.id === id)).filter(Boolean) as typeof roster.beauts;

  const CARD_OPTIONS: CardType[] = ['Shoot', 'Pass', 'Skate', 'Block', 'Catch', 'Steal', 'Check'];

  const handleConfirm = () => {
    if (selectedIce && selectedBench) {
      onConfirm([{ ice_beaut_id: selectedIce, bench_beaut_id: selectedBench, new_card: newCard }]);
      setSelectedIce(null);
      setSelectedBench(null);
    }
  };

  return (
    <div>
      {/* Stack vertically on mobile, 2-col on sm+ */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">Send to bench:</div>
          <div className="flex flex-wrap gap-1.5">
            {iceBeauts.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedIce(selectedIce === b.id ? null : b.id)}
                className={`text-xs px-2 py-2 rounded border transition-all min-h-[40px] ${
                  selectedIce === b.id
                    ? 'bg-orange-700 border-orange-400 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                }`}
              >
                {b.name.replace('MetaBeauts #', '#')} ({b.position.slice(0, 3)})
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Bring from bench:</div>
          <div className="flex flex-wrap gap-1.5">
            {benchBeauts.length === 0 ? (
              <div className="text-xs text-gray-600 italic">— bench empty —</div>
            ) : (
              benchBeauts.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBench(selectedBench === b.id ? null : b.id)}
                  className={`text-xs px-2 py-2 rounded border transition-all min-h-[40px] ${
                    selectedBench === b.id
                      ? 'bg-blue-700 border-blue-400 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {b.name.replace('MetaBeauts #', '#')} ({b.position.slice(0, 3)})
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedBench && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Incoming beaut gets 1 new card:</div>
          <div className="flex flex-wrap gap-1.5">
            {CARD_OPTIONS.map(ct => (
              <button
                key={ct}
                onClick={() => setNewCard(ct)}
                className={`text-xs px-2 py-2 rounded border transition-all min-h-[36px] ${
                  newCard === ct
                    ? 'bg-green-700 border-green-400 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {selectedIce && selectedBench && (
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-lg bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-sm transition-all min-h-[48px]"
          >
            ✅ Confirm
          </button>
        )}
        <button
          onClick={() => onSkip(player)}
          className="flex-1 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white text-sm transition-all min-h-[48px]"
        >
          ⏩ Skip
        </button>
      </div>
    </div>
  );
}
