/**
 * Tutorial Engine — wraps real game engine with scripted overrides.
 * Allows deterministic card draws and auto-plays opponent decisions.
 */

import {
  GameState,
  BeautEntity,
  BeautMetadata,
  CardType,
  Position,
  Tier,
  TraitName,
  ActionCard,
  PlayerRoster,
} from '@/types/game';
import {
  createGameState,
  buildBeautEntity,
  submitRPS,
  performLineChange,
  submitDefensiveResponse,
  executeResolution,
  setActiveDefensiveBeaut,
  getBeaut,
} from '@/lib/engine/gameEngine';
import {
  buildActionPile,
  createActionCard,
  availableCards,
} from '@/lib/engine/cards';
import { v4 as uuidv4 } from 'uuid';

// ── Hardcoded Tutorial Roster Metadata ────────────────────────────────────

export const TUTORIAL_PLAYER1_METADATA: BeautMetadata[] = [
  {
    token_id: 9001,
    name: 'Aleksandra "The Sniper" Volkov',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sniper&backgroundColor=1a1a2e',
    position: 'Winger',
    tier: 3,
    trait_archetype: 'Sniper',
    team: 'Tutorial HC',
    jersey: '17',
  },
  {
    token_id: 9002,
    name: 'Maya "Two-Way" Chen',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=twoway&backgroundColor=0d1b2a',
    position: 'Center',
    tier: 2,
    trait_archetype: 'Two-Way',
    team: 'Tutorial HC',
    jersey: '91',
  },
  {
    token_id: 9003,
    name: 'Sofia "Dangler" Marchetti',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dangler&backgroundColor=1b2838',
    position: 'Winger',
    tier: 2,
    trait_archetype: 'Dangler',
    team: 'Tutorial HC',
    jersey: '44',
  },
  {
    token_id: 9004,
    name: 'Ingrid "Enforcer" Larsson',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=enforcer&backgroundColor=161b22',
    position: 'Defender',
    tier: 2,
    trait_archetype: 'Enforcer',
    team: 'Tutorial HC',
    jersey: '55',
  },
  {
    token_id: 9005,
    name: 'Zoe "Puck Mover" Williams',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=puckmover&backgroundColor=0a1628',
    position: 'Defender',
    tier: 1,
    trait_archetype: 'Puck Mover',
    team: 'Tutorial HC',
    jersey: '33',
  },
  {
    token_id: 9006,
    name: 'Petra "Butterfly" Novak',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=butterfly&backgroundColor=1a0a2e',
    position: 'Goaltender',
    tier: 3,
    trait_archetype: 'Butterfly',
    team: 'Tutorial HC',
    jersey: '01',
  },
];

export const TUTORIAL_PLAYER2_METADATA: BeautMetadata[] = [
  {
    token_id: 9011,
    name: 'Opponent Winger A',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp1&backgroundColor=2a0a0a',
    position: 'Winger',
    tier: 2,
    trait_archetype: 'Grinder',
    team: 'Opponent FC',
    jersey: '10',
  },
  {
    token_id: 9012,
    name: 'Opponent Center',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp2&backgroundColor=2a1a0a',
    position: 'Center',
    tier: 2,
    trait_archetype: 'Playmaker',
    team: 'Opponent FC',
    jersey: '14',
  },
  {
    token_id: 9013,
    name: 'Opponent Winger B',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp3&backgroundColor=2a2a0a',
    position: 'Winger',
    tier: 1,
    trait_archetype: 'Grinder',
    team: 'Opponent FC',
    jersey: '22',
  },
  {
    token_id: 9014,
    name: 'Opponent Defender A',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp4&backgroundColor=0a2a0a',
    position: 'Defender',
    tier: 2,
    trait_archetype: 'Stand Up',
    team: 'Opponent FC',
    jersey: '06',
  },
  {
    token_id: 9015,
    name: 'Opponent Defender B',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp5&backgroundColor=0a0a2a',
    position: 'Defender',
    tier: 1,
    trait_archetype: 'Defensive',
    team: 'Opponent FC',
    jersey: '07',
  },
  {
    token_id: 9016,
    name: 'Opponent Goalie',
    image_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=opp6&backgroundColor=1a0a1a',
    position: 'Goaltender',
    tier: 2,
    trait_archetype: 'Stand Up',
    team: 'Opponent FC',
    jersey: '30',
  },
];

// ── Build tutorial game state ─────────────────────────────────────────────

export function createTutorialGameState(): GameState {
  const p1Entities = TUTORIAL_PLAYER1_METADATA.map(buildBeautEntity);
  const p2Entities = TUTORIAL_PLAYER2_METADATA.map(buildBeautEntity);

  // Build game with RegularSeason mode for traits
  const state = createGameState(p1Entities, p2Entities, 'RegularSeason');

  // Pre-configure: Player1 gets possession (tutorial always starts this way)
  return {
    ...state,
    possession: 'player1',
    phase: 'RPS',
    rps_choice_p1: null,
    rps_choice_p2: null,
    rps_winner: null,
  };
}

// ── Override offensive draw with scripted card ────────────────────────────

export function performScriptedOffensiveDraw(
  state: GameState,
  scriptedCard: CardType
): GameState {
  const offensiveBeautId = state.active_offensive_beaut_id;
  if (!offensiveBeautId) return state;

  const beaut = getBeaut(state, offensiveBeautId);
  if (!beaut) return state;

  // Create the scripted card
  const drawn: ActionCard = createActionCard(scriptedCard);

  // Remove one card from pile (consume the draw)
  const inPile = beaut.action_pile.filter(c => c.state === 'in_pile');
  const remaining = inPile.length > 0
    ? beaut.action_pile.filter(c => c.id !== inPile[0].id)
    : beaut.action_pile;

  // Update beaut
  const updatedBeaut = { ...beaut, action_pile: remaining };
  const updatedBeauts = state.player1.beauts.map(b => b.id === offensiveBeautId ? updatedBeaut : b);
  const updatedPlayer1 = { ...state.player1, beauts: updatedBeauts };

  return {
    ...state,
    player1: updatedPlayer1,
    drawn_card: drawn,
    drawn_card_is_natural_trait: false,
    natural_trait_activation_pending: false,
    natural_trait_beaut_id: null,
    phase: 'DEFENSIVE_RESPONSE',
  };
}

// ── Auto-play scripted defensive response ─────────────────────────────────

export function performScriptedDefensiveResponse(
  state: GameState,
  scriptedCard: CardType
): GameState {
  const defensiveBeautId = state.active_defensive_beaut_id;
  if (!defensiveBeautId) return state;

  const beaut = getBeaut(state, defensiveBeautId);
  if (!beaut) return state;

  // Find or create the card
  const available = availableCards(beaut.action_pile);
  const matchingCard = available.find(c => c.card_type === scriptedCard);

  let cardToPlay: ActionCard;
  if (matchingCard) {
    cardToPlay = matchingCard;
  } else {
    // Create a scripted card even if they don't have it (tutorial scripting)
    cardToPlay = createActionCard(scriptedCard);
    // Add it to pile temporarily
    const updatedBeaut = { ...beaut, action_pile: [...beaut.action_pile, cardToPlay] };
    const updatedPlayer2 = {
      ...state.player2,
      beauts: state.player2.beauts.map(b => b.id === defensiveBeautId ? updatedBeaut : b),
    };
    const stateWithCard = { ...state, player2: updatedPlayer2 };
    return submitDefensiveResponse(stateWithCard, cardToPlay.id);
  }

  return submitDefensiveResponse(state, cardToPlay.id);
}

// ── Scripted RPS: Player 1 always wins ────────────────────────────────────

export function performScriptedRPS(state: GameState): GameState {
  // Player 1 plays rock, Player 2 plays scissors (P1 wins)
  let newState = submitRPS(state, 'player1', 'rock');
  newState = submitRPS(newState, 'player2', 'scissors');
  return {
    ...newState,
    possession: 'player1',
    rps_winner: 'player1',
    phase: 'POSSESSION_START',
  };
}

// ── Scripted line change skip ─────────────────────────────────────────────

export function performScriptedSkipBothLineChanges(state: GameState): GameState {
  return {
    ...state,
    phase: 'OFFENSIVE_DRAW',
    offensive_line_change_done: true,
    defensive_line_change_done: true,
  };
}
