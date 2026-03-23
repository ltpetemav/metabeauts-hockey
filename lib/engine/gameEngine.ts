/**
 * Game Engine — single source of truth for all state transitions.
 * New rules: Action Deck cycling, blind defense, shoot turnover, all 14 traits.
 */

import {
  GameState,
  GamePhase,
  BeautEntity,
  PlayerRoster,
  ActionCard,
  CardType,
  TraitName,
  RPSChoice,
  RPSResult,
  GameMode,
  Position,
  Tier,
} from '@/types/game';
import {
  setupActionDeck,
  drawFromPile,
  availableCards,
  shuffleArray,
  createActionCard,
  returnCardToDeck,
  drawFromDeck,
  POSITION_LEGAL_CARDS,
  BACKUP_ACTION,
  MAX_CARDS_PER_BEAUT,
} from './cards';
import { resolveAction, updateCanShoot, ResolutionInput, getEffectiveCardType } from './resolution';
import { v4 as uuidv4 } from 'uuid';

// RPS resolution
function resolveRPS(p1: RPSChoice, p2: RPSChoice): RPSResult {
  if (p1 === p2) return 'tie';
  if (
    (p1 === 'rock' && p2 === 'scissors') ||
    (p1 === 'scissors' && p2 === 'paper') ||
    (p1 === 'paper' && p2 === 'rock')
  ) {
    return 'player1';
  }
  return 'player2';
}

// Build initial BeautEntity from NFT metadata
export function buildBeautEntity(metadata: {
  token_id: number;
  name: string;
  position: Position;
  tier: Tier;
  trait_archetype: string;
  image_url: string;
  team: string;
}): BeautEntity {
  return {
    id: String(metadata.token_id),
    token_id: metadata.token_id,
    name: metadata.name,
    position: metadata.position,
    tier: metadata.tier,
    trait_archetype: metadata.trait_archetype,
    image_url: metadata.image_url,
    team: metadata.team,
    action_pile: [],
    is_exhausted: false,
  };
}

// Initialize roster with Action Deck system
function initRoster(
  beauts: BeautEntity[],
  onIceIds: string[],
  onBenchIds: string[],
  _mode: GameMode
): PlayerRoster {
  const { updatedBeauts, actionDeck, reservedTraits } = setupActionDeck(beauts, onIceIds, onBenchIds);

  return {
    player_id: 'player1', // overridden by caller
    beauts: updatedBeauts,
    on_ice: onIceIds,
    on_bench: onBenchIds,
    action_deck: actionDeck,
    reserved_traits: reservedTraits,
  };
}

// Create initial game state
export function createGameState(
  p1Beauts: BeautEntity[],
  p2Beauts: BeautEntity[],
  mode: GameMode
): GameState {
  const id = uuidv4();

  const p1OnIce = p1Beauts.slice(0, 3).map(b => b.id);
  const p1OnBench = p1Beauts.slice(3).map(b => b.id);
  const p2OnIce = p2Beauts.slice(0, 3).map(b => b.id);
  const p2OnBench = p2Beauts.slice(3).map(b => b.id);

  const p1Roster = initRoster(p1Beauts, p1OnIce, p1OnBench, mode);
  const p2Roster = initRoster(p2Beauts, p2OnIce, p2OnBench, mode);

  return {
    id,
    mode,
    phase: 'RPS',
    player1: { ...p1Roster, player_id: 'player1' },
    player2: { ...p2Roster, player_id: 'player2' },
    player1_score: 0,
    player2_score: 0,
    possession: 'player1',
    can_shoot: false,
    active_offensive_beaut_id: null,
    active_defensive_beaut_id: null,
    rps_choice_p1: null,
    rps_choice_p2: null,
    rps_winner: null,
    drawn_card: null,
    defensive_selected_card: null,
    last_resolution: null,
    winner: null,
    turn_number: 0,
    acting_player: null,
    offensive_line_change_done: false,
    defensive_line_change_done: false,
    line_change_used_this_possession: { player1: false, player2: false },
    hybrid_choice_pending: null,
    immediate_redraw_pending: false,
    forced_line_change_pending: null,
    catch_up_traits_pending: null,
    two_timer_secondary_pending: false,
    two_timer_primary_result: null,
  };
}

// Get a beaut entity by ID from game state
export function getBeaut(state: GameState, id: string): BeautEntity | null {
  const p1beaut = state.player1.beauts.find(b => b.id === id);
  if (p1beaut) return p1beaut;
  const p2beaut = state.player2.beauts.find(b => b.id === id);
  return p2beaut || null;
}

// Get which player owns a beaut
export function getBeautOwner(state: GameState, id: string): 'player1' | 'player2' | null {
  if (state.player1.beauts.find(b => b.id === id)) return 'player1';
  if (state.player2.beauts.find(b => b.id === id)) return 'player2';
  return null;
}

// Update a beaut entity in state (immutable)
export function updateBeaut(state: GameState, beaut: BeautEntity): GameState {
  const updateRoster = (roster: PlayerRoster): PlayerRoster => ({
    ...roster,
    beauts: roster.beauts.map(b => (b.id === beaut.id ? beaut : b)),
  });

  if (state.player1.beauts.find(b => b.id === beaut.id)) {
    return { ...state, player1: updateRoster(state.player1) };
  }
  return { ...state, player2: updateRoster(state.player2) };
}

// Update a player's roster
function updateRoster(state: GameState, player: 'player1' | 'player2', roster: PlayerRoster): GameState {
  if (player === 'player1') {
    return { ...state, player1: roster };
  }
  return { ...state, player2: roster };
}

// Submit RPS choice
export function submitRPS(
  state: GameState,
  player: 'player1' | 'player2',
  choice: RPSChoice
): GameState {
  let newState = {
    ...state,
    rps_choice_p1: player === 'player1' ? choice : state.rps_choice_p1,
    rps_choice_p2: player === 'player2' ? choice : state.rps_choice_p2,
  };

  if (newState.rps_choice_p1 && newState.rps_choice_p2) {
    const result = resolveRPS(newState.rps_choice_p1, newState.rps_choice_p2);

    if (result === 'tie') {
      return { ...newState, rps_choice_p1: null, rps_choice_p2: null };
    }

    newState = {
      ...newState,
      rps_winner: result,
      possession: result,
      phase: 'POSSESSION_START' as GamePhase,
    };
    newState = setDefaultActiveBeauts(newState);
  }

  return newState;
}

function setDefaultActiveBeauts(state: GameState): GameState {
  const offensiveRoster = state.possession === 'player1' ? state.player1 : state.player2;
  const defensiveRoster = state.possession === 'player1' ? state.player2 : state.player1;

  const offensiveBeaut =
    offensiveRoster.beauts.find(
      b => b.position === 'Center' && offensiveRoster.on_ice.includes(b.id)
    ) || offensiveRoster.beauts.find(b => offensiveRoster.on_ice.includes(b.id));

  const defensiveBeaut =
    defensiveRoster.beauts.find(
      b => b.position === 'Goaltender' && defensiveRoster.on_ice.includes(b.id)
    ) || defensiveRoster.beauts.find(b => defensiveRoster.on_ice.includes(b.id));

  return {
    ...state,
    active_offensive_beaut_id: offensiveBeaut?.id || null,
    active_defensive_beaut_id: defensiveBeaut?.id || null,
    offensive_line_change_done: false,
    defensive_line_change_done: false,
  };
}

// Perform a line change — now supports multi-swap
export function performLineChange(
  state: GameState,
  player: 'player1' | 'player2',
  swaps: Array<{ ice_beaut_id: string; bench_beaut_id: string; new_card: CardType }>
): GameState {
  let roster = player === 'player1' ? { ...state.player1 } : { ...state.player2 };

  let beauts = [...roster.beauts];
  let onIce = [...roster.on_ice];
  let onBench = [...roster.on_bench];
  let deck = [...roster.action_deck];

  for (const swap of swaps) {
    const iceBeautIdx = beauts.findIndex(b => b.id === swap.ice_beaut_id);
    const benchBeautIdx = beauts.findIndex(b => b.id === swap.bench_beaut_id);
    if (iceBeautIdx === -1 || benchBeautIdx === -1) continue;

    const iceBeaut = { ...beauts[iceBeautIdx] };
    const benchBeaut = { ...beauts[benchBeautIdx] };

    // Ice -> Bench: cards return to Action Deck
    for (const card of iceBeaut.action_pile) {
      deck = returnCardToDeck(deck, card);
    }
    // Bench beaut gets 2 cards from deck
    const benchDraw = drawFromDeck(deck, 2);
    iceBeaut.action_pile = benchDraw.drawn;
    deck = benchDraw.remaining;
    iceBeaut.is_exhausted = false;

    // Bench -> Ice: gets 1 additional card of player's choice
    // Respect max 3 cards
    if (benchBeaut.action_pile.length < MAX_CARDS_PER_BEAUT) {
      const newCard = createActionCard(swap.new_card);
      benchBeaut.action_pile = shuffleArray([...benchBeaut.action_pile, newCard]);
    }
    benchBeaut.is_exhausted = benchBeaut.action_pile.length === 0;

    // Swap ice/bench
    onIce = onIce.map(id => (id === swap.ice_beaut_id ? swap.bench_beaut_id : id));
    onBench = onBench.map(id => (id === swap.bench_beaut_id ? swap.ice_beaut_id : id));

    beauts[iceBeautIdx] = iceBeaut;
    beauts[benchBeautIdx] = benchBeaut;
  }

  roster = { ...roster, beauts, on_ice: onIce, on_bench: onBench, action_deck: deck };

  let newState = updateRoster(state, player, roster);

  // Mark line change done and used this possession
  const offensivePlayer = state.possession;
  const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';

  if (player === offensivePlayer) {
    newState = { ...newState, offensive_line_change_done: true };
  } else {
    newState = { ...newState, defensive_line_change_done: true };
  }

  newState = {
    ...newState,
    line_change_used_this_possession: {
      ...newState.line_change_used_this_possession,
      [player]: true,
    },
  };

  newState = setDefaultActiveBeauts(newState);
  return newState;
}

// Advance from POSSESSION_START to OFFENSIVE_DRAW
export function startOffensiveDraw(state: GameState): GameState {
  return { ...state, phase: 'OFFENSIVE_DRAW' };
}

// Server-side RNG draw for offense
export function performOffensiveDraw(state: GameState): GameState {
  const offensiveBeautId = state.active_offensive_beaut_id;
  if (!offensiveBeautId) return state;

  const beaut = getBeaut(state, offensiveBeautId);
  if (!beaut) return state;

  const pile = availableCards(beaut.action_pile);
  if (pile.length === 0) {
    // Exhaustion: no cards left — try to reload from Action Deck
    const offPlayer = state.possession;
    const roster = offPlayer === 'player1' ? state.player1 : state.player2;

    if (roster.action_deck.length > 0) {
      // Draw up to 3 from deck
      const reload = drawFromDeck(roster.action_deck, Math.min(3, roster.action_deck.length));
      const updatedBeaut = { ...beaut, action_pile: reload.drawn, is_exhausted: false };
      let newState = updateBeaut(state, updatedBeaut);
      const updatedRoster = { ...(offPlayer === 'player1' ? newState.player1 : newState.player2), action_deck: reload.remaining };
      newState = updateRoster(newState, offPlayer, updatedRoster);
      // Retry draw
      return performOffensiveDraw(newState);
    }

    // Truly exhausted — turnover
    const exhaustedBeaut = { ...beaut, is_exhausted: true };
    let newState = updateBeaut(state, exhaustedBeaut);
    const newPossession = state.possession === 'player1' ? 'player2' : 'player1';
    newState = {
      ...newState,
      possession: newPossession,
      can_shoot: false,
      phase: 'POSSESSION_START',
      turn_number: state.turn_number + 1,
    };
    newState = setDefaultActiveBeauts(newState);
    return newState;
  }

  const drawResult = drawFromPile(beaut.action_pile);
  if (!drawResult) return state;

  // --- BUTTERFLY HANDLING (offensive) ---
  if (drawResult.drawn.is_trait && drawResult.drawn.trait_name === 'Butterfly' && state.mode === 'RegularSeason') {
    return handleButterflyDraw(state, beaut, drawResult.drawn, drawResult.remaining, 'offense');
  }

  // --- SHOOT PREREQUISITE = TURNOVER ---
  const effectiveType = drawResult.drawn.is_trait && drawResult.drawn.trait_name
    ? getEffectiveCardType(drawResult.drawn.trait_name, beaut.position, true, null)
    : drawResult.drawn.card_type;

  if (effectiveType === 'Shoot' && !state.can_shoot) {
    // Power Fwd and Sniper bypass the prerequisite
    const canBypass = drawResult.drawn.is_trait &&
      (drawResult.drawn.trait_name === 'Power Fwd' || drawResult.drawn.trait_name === 'Sniper');
    if (!canBypass) {
      // TURNOVER — puck goes to defense immediately
      const updatedBeaut = { ...beaut, action_pile: drawResult.remaining };
      let newState = updateBeaut(state, updatedBeaut);

      // Return the drawn card to Action Deck
      const offPlayer = state.possession;
      const roster = offPlayer === 'player1' ? newState.player1 : newState.player2;
      const updatedRoster = { ...roster, action_deck: returnCardToDeck(roster.action_deck, drawResult.drawn) };
      newState = updateRoster(newState, offPlayer, updatedRoster);

      const newPossession = state.possession === 'player1' ? 'player2' : 'player1';
      newState = {
        ...newState,
        possession: newPossession,
        can_shoot: false,
        phase: 'POSSESSION_START',
        turn_number: state.turn_number + 1,
        drawn_card: drawResult.drawn,
        last_resolution: {
          outcome: 'TURNOVER',
          offensive_card: drawResult.drawn.card_type,
          defensive_card: 'Trait',
          goal_scored: false,
          puck_goes_to: 'defense',
          offensive_beaut_id: beaut.id,
          defensive_beaut_id: state.active_defensive_beaut_id || '',
          cards_discarded_from_offense: 0,
          cards_discarded_from_defense: 0,
          special_effects: [{ type: 'SHOOT_PREREQUISITE_FAIL' }],
          exhausted_beauts: [],
          offensive_card_returns_to_deck: true,
          defensive_card_returns_to_deck: true,
          immediate_redraw: false,
          immediate_redraw_side: null,
        },
      };
      newState = setDefaultActiveBeauts(newState);
      return newState;
    }
  }

  // --- HYBRID TRAIT: needs player choice ---
  if (drawResult.drawn.is_trait && drawResult.drawn.trait_name === 'Hybrid' && state.mode === 'RegularSeason') {
    const updatedBeaut = { ...beaut, action_pile: drawResult.remaining };
    let newState = updateBeaut(state, updatedBeaut);
    return {
      ...newState,
      drawn_card: drawResult.drawn,
      phase: 'HYBRID_CHOICE',
      hybrid_choice_pending: {
        player: state.possession,
        options: ['Skate', 'Pass'],
      },
    };
  }

  // Normal draw
  const updatedBeaut = { ...beaut, action_pile: drawResult.remaining };
  let newState = updateBeaut(state, updatedBeaut);

  newState = {
    ...newState,
    drawn_card: drawResult.drawn,
    phase: 'DEFENSIVE_RESPONSE',
  };

  return newState;
}

// Handle Butterfly redraw mechanic
function handleButterflyDraw(
  state: GameState,
  beaut: BeautEntity,
  butterflyCard: ActionCard,
  remainingPile: ActionCard[],
  _side: 'offense' | 'defense'
): GameState {
  const offPlayer = state.possession;
  let roster = offPlayer === 'player1' ? { ...state.player1 } : { ...state.player2 };

  if (remainingPile.length === 0) {
    // Last card: add 3 from Action Deck, put Butterfly back, redraw
    const refill = drawFromDeck(roster.action_deck, Math.min(3, roster.action_deck.length));
    const newPile = shuffleArray([butterflyCard, ...refill.drawn]);
    roster = { ...roster, action_deck: refill.remaining };

    const updatedBeaut = { ...beaut, action_pile: newPile, is_exhausted: false };
    let newState = updateRoster(state, offPlayer, roster);
    newState = updateBeaut(newState, updatedBeaut);
    // Redraw
    return performOffensiveDraw(newState);
  } else {
    // Not last card: put Butterfly back, redraw
    const newPile = shuffleArray([butterflyCard, ...remainingPile]);
    const updatedBeaut = { ...beaut, action_pile: newPile };
    let newState = updateBeaut(state, updatedBeaut);
    // Redraw (recursive — Butterfly goes back, draw again)
    return performOffensiveDraw(newState);
  }
}

// Defense selects a card (BLIND — they don't see offense's card)
export function submitDefensiveResponse(
  state: GameState,
  selectedCardId: string
): GameState {
  const defensiveBeautId = state.active_defensive_beaut_id;
  if (!defensiveBeautId) return state;

  const beaut = getBeaut(state, defensiveBeautId);
  if (!beaut) return state;

  const selectedCard = beaut.action_pile.find(c => c.id === selectedCardId);
  if (!selectedCard) return state;

  // --- BUTTERFLY on defense: redraw ---
  if (selectedCard.is_trait && selectedCard.trait_name === 'Butterfly' && state.mode === 'RegularSeason') {
    const remainingPile = beaut.action_pile.filter(c => c.id !== selectedCardId);
    const defPlayer = state.possession === 'player1' ? 'player2' : 'player1';
    let roster = defPlayer === 'player1' ? { ...state.player1 } : { ...state.player2 };

    if (remainingPile.length === 0) {
      // Last card: refill 3 from deck
      const refill = drawFromDeck(roster.action_deck, Math.min(3, roster.action_deck.length));
      const newPile = shuffleArray([selectedCard, ...refill.drawn]);
      roster = { ...roster, action_deck: refill.remaining };

      const updatedBeaut = { ...beaut, action_pile: newPile, is_exhausted: false };
      let newState = updateRoster(state, defPlayer, roster);
      newState = updateBeaut(newState, updatedBeaut);
      // Stay in DEFENSIVE_RESPONSE for re-pick
      return newState;
    } else {
      // Put Butterfly back, defense picks again
      const newPile = shuffleArray([selectedCard, ...remainingPile]);
      const updatedBeaut = { ...beaut, action_pile: newPile };
      const newState = updateBeaut(state, updatedBeaut);
      return newState; // Stay in DEFENSIVE_RESPONSE
    }
  }

  // --- HYBRID on defense: needs choice ---
  if (selectedCard.is_trait && selectedCard.trait_name === 'Hybrid' && state.mode === 'RegularSeason') {
    const defPlayer = state.possession === 'player1' ? 'player2' : 'player1';
    return {
      ...state,
      defensive_selected_card: selectedCard,
      phase: 'HYBRID_CHOICE',
      hybrid_choice_pending: {
        player: defPlayer,
        options: ['Block', 'Check'],
      },
    };
  }

  return {
    ...state,
    defensive_selected_card: selectedCard,
    phase: 'SIMULTANEOUS_REVEAL',
  };
}

// Resolve a Hybrid choice
export function resolveHybridChoice(state: GameState, chosenType: CardType): GameState {
  if (!state.hybrid_choice_pending) return state;

  const isOffense = state.hybrid_choice_pending.player === state.possession;

  const newState = {
    ...state,
    hybrid_choice_pending: {
      ...state.hybrid_choice_pending,
      resolved_card_type: chosenType,
    },
  };

  if (isOffense) {
    // Offense chose — now go to DEFENSIVE_RESPONSE
    return { ...newState, phase: 'DEFENSIVE_RESPONSE' };
  } else {
    // Defense chose — both cards ready, go to SIMULTANEOUS_REVEAL
    return { ...newState, phase: 'SIMULTANEOUS_REVEAL' };
  }
}

// Execute resolution
export function executeResolution(state: GameState): GameState {
  if (!state.drawn_card || !state.defensive_selected_card) return state;
  if (!state.active_offensive_beaut_id || !state.active_defensive_beaut_id) return state;

  const offensiveBeaut = getBeaut(state, state.active_offensive_beaut_id);
  const defensiveBeaut = getBeaut(state, state.active_defensive_beaut_id);
  if (!offensiveBeaut || !defensiveBeaut) return state;

  // Determine trait names
  const offTraitName = state.drawn_card.is_trait ? (state.drawn_card.trait_name || null) : null;
  const defTraitName = state.defensive_selected_card.is_trait ? (state.defensive_selected_card.trait_name || null) : null;

  // Get hybrid choices if any
  const hcp = state.hybrid_choice_pending;
  const hybridOffChoice = hcp && hcp.player === state.possession
    ? (hcp.resolved_card_type || null)
    : null;
  const hybridDefChoice = hcp && hcp.player !== state.possession
    ? (hcp.resolved_card_type || null)
    : null;

  const input: ResolutionInput = {
    offensiveCard: state.drawn_card.card_type,
    defensiveCard: state.defensive_selected_card.card_type,
    offensiveBeaut,
    defensiveBeaut,
    canShoot: state.can_shoot,
    mode: state.mode,
    offensiveTraitName: offTraitName,
    defensiveTraitName: defTraitName,
    hybridOffenseChoice: hybridOffChoice,
    hybridDefenseChoice: hybridDefChoice,
  };

  const result = resolveAction(input);

  // =====================================================
  // CARD CYCLING: return played cards to Action Deck
  // =====================================================
  const offPlayer = state.possession;
  const defPlayer = offPlayer === 'player1' ? 'player2' : 'player1';
  let offRoster = offPlayer === 'player1' ? { ...state.player1 } : { ...state.player2 };
  let defRoster = defPlayer === 'player1' ? { ...state.player1 } : { ...state.player2 };

  // Remove defensive card from its pile
  let updatedDefBeaut = {
    ...defensiveBeaut,
    action_pile: defensiveBeaut.action_pile.filter(c => c.id !== state.defensive_selected_card!.id),
  };
  let updatedOffBeaut = { ...offensiveBeaut };

  // Return offensive card to deck (if applicable)
  if (result.offensive_card_returns_to_deck) {
    offRoster = { ...offRoster, action_deck: returnCardToDeck(offRoster.action_deck, state.drawn_card) };
  }
  // else: trait was triggered, card is permanently discarded (removed from game)

  // Return defensive card to deck (if applicable)
  if (result.defensive_card_returns_to_deck) {
    defRoster = { ...defRoster, action_deck: returnCardToDeck(defRoster.action_deck, state.defensive_selected_card) };
  }

  // =====================================================
  // APPLY DISCARD EFFECTS
  // =====================================================

  // Discard cards from offense (Dangler/Enforcer/Grinder effects)
  if (result.cards_discarded_from_offense > 0) {
    const available = availableCards(updatedOffBeaut.action_pile);
    const toDiscard = Math.min(result.cards_discarded_from_offense, available.length);
    const shuffled = shuffleArray(available);
    const discarded = shuffled.slice(0, toDiscard);
    const kept = shuffled.slice(toDiscard);
    updatedOffBeaut = { ...updatedOffBeaut, action_pile: kept };
    // Discarded cards go back to the player's Action Deck
    for (const card of discarded) {
      offRoster = { ...offRoster, action_deck: returnCardToDeck(offRoster.action_deck, card) };
    }
  }

  // Discard cards from defense
  if (result.cards_discarded_from_defense > 0) {
    const available = availableCards(updatedDefBeaut.action_pile);
    const toDiscard = Math.min(result.cards_discarded_from_defense, available.length);
    const shuffled = shuffleArray(available);
    const discarded = shuffled.slice(0, toDiscard);
    const kept = shuffled.slice(toDiscard);
    updatedDefBeaut = { ...updatedDefBeaut, action_pile: kept };
    for (const card of discarded) {
      defRoster = { ...defRoster, action_deck: returnCardToDeck(defRoster.action_deck, card) };
    }
  }

  // Grinder: discard a TRAIT card specifically from defense
  const grinderTraitEffect = result.special_effects.find(e => e.type === 'GRINDER_DISCARD_TRAIT');
  if (grinderTraitEffect) {
    const traitIdx = updatedDefBeaut.action_pile.findIndex(c => c.is_trait);
    if (traitIdx !== -1) {
      const traitCard = updatedDefBeaut.action_pile[traitIdx];
      updatedDefBeaut = {
        ...updatedDefBeaut,
        action_pile: updatedDefBeaut.action_pile.filter((_, i) => i !== traitIdx),
      };
      // Trait removed by opponent → returns to Action Deck (not permanently discarded)
      defRoster = { ...defRoster, action_deck: returnCardToDeck(defRoster.action_deck, traitCard) };
    }
  }

  // Check exhaustion
  updatedOffBeaut.is_exhausted = availableCards(updatedOffBeaut.action_pile).length === 0;
  updatedDefBeaut.is_exhausted = availableCards(updatedDefBeaut.action_pile).length === 0;

  // Update rosters with modified beauts
  offRoster = {
    ...offRoster,
    beauts: offRoster.beauts.map(b => b.id === updatedOffBeaut.id ? updatedOffBeaut : b),
  };
  defRoster = {
    ...defRoster,
    beauts: defRoster.beauts.map(b => b.id === updatedDefBeaut.id ? updatedDefBeaut : b),
  };

  let newState: GameState;
  if (offPlayer === 'player1') {
    newState = { ...state, player1: offRoster, player2: defRoster };
  } else {
    newState = { ...state, player1: defRoster, player2: offRoster };
  }

  // =====================================================
  // UPDATE CAN_SHOOT
  // =====================================================
  const effectiveOffCard = result.offensive_card;
  const newCanShoot = updateCanShoot(state.can_shoot, effectiveOffCard, result.outcome);

  // =====================================================
  // HANDLE POSSESSION CHANGE
  // =====================================================
  let newPossession = state.possession;
  if (result.puck_goes_to === 'defense') {
    newPossession = state.possession === 'player1' ? 'player2' : 'player1';
  }

  // Handle Pass: switch active offensive beaut
  let newOffensiveBeautId = newState.active_offensive_beaut_id;
  let newDefensiveBeautId = newState.active_defensive_beaut_id;

  if (effectiveOffCard === 'Pass' && result.outcome === 'OFFENSE_WINS') {
    const currentOffRoster = newPossession === 'player1' ? newState.player1 : newState.player2;
    const otherOnIce = currentOffRoster.on_ice.filter(id => id !== state.active_offensive_beaut_id);
    if (otherOnIce.length > 0) {
      newOffensiveBeautId = otherOnIce[0];
    }
  }

  // Offensive archetype: switch puck holder
  const offSwitchEffect = result.special_effects.find(e => e.type === 'OFFENSIVE_SWITCH_PUCK');
  if (offSwitchEffect) {
    const currentOffRoster = state.possession === 'player1' ? newState.player1 : newState.player2;
    const otherOnIce = currentOffRoster.on_ice.filter(id => id !== state.active_offensive_beaut_id);
    if (otherOnIce.length > 0) {
      newOffensiveBeautId = otherOnIce[0];
    }
  }

  // =====================================================
  // HANDLE GOAL
  // =====================================================
  let p1Score = newState.player1_score;
  let p2Score = newState.player2_score;
  let winner: 'player1' | 'player2' | null = null;
  let catchUpPending: { player_id: 'player1' | 'player2'; count: number } | null = null;

  if (result.goal_scored) {
    const scorer = state.possession;
    if (scorer === 'player1') p1Score++;
    else p2Score++;

    if (p1Score >= 3) winner = 'player1';
    else if (p2Score >= 3) winner = 'player2';

    // Post-goal possession: trailing player gets puck
    if (!winner) {
      if (p1Score > p2Score) {
        newPossession = 'player2'; // Trailing player
      } else if (p2Score > p1Score) {
        newPossession = 'player1'; // Trailing player
      } else {
        // Tied: scored-upon team gets puck
        newPossession = scorer === 'player1' ? 'player2' : 'player1';
      }

      // Catch-up: 2 reserved trait cards added to Action Deck for scored-upon player
      const scoredUpon = scorer === 'player1' ? 'player2' : 'player1';
      const scoredUponRoster = scoredUpon === 'player1' ? newState.player1 : newState.player2;
      if (scoredUponRoster.reserved_traits.length > 0) {
        catchUpPending = { player_id: scoredUpon, count: 2 };
      }
    }
  }

  // =====================================================
  // HANDLE TWO-TIMER SECONDARY DRAW
  // =====================================================
  let twoTimerPending = false;
  if (state.mode === 'RegularSeason' && offTraitName === 'Two-Timer' && result.outcome === 'DEFENSE_WINS') {
    twoTimerPending = true;
  }

  // =====================================================
  // HANDLE IMMEDIATE REDRAW
  // =====================================================
  let immediateRedraw = result.immediate_redraw;
  if (result.immediate_redraw_side === 'defense' && result.outcome === 'DEFENSE_WINS') {
    // Defense gets puck and immediate redraw — possession already changed
    immediateRedraw = true;
  }

  // =====================================================
  // HANDLE ENFORCER FORCE LINE CHANGE
  // =====================================================
  let forcedLineChange: 'player1' | 'player2' | null = null;
  const enforcerEffect = result.special_effects.find(e => e.type === 'ENFORCER_FORCE_LINE_CHANGE');
  if (enforcerEffect) {
    forcedLineChange = defPlayer;
    // Check if opponent CAN do a line change
    const opponentRoster = defPlayer === 'player1' ? newState.player1 : newState.player2;
    if (opponentRoster.on_bench.length === 0) {
      // Can't line change → each opposing on-ice Beaut discards an Action Card
      let updatedOpponentRoster = { ...opponentRoster };
      const updatedOpponentBeauts = updatedOpponentRoster.beauts.map(b => {
        if (updatedOpponentRoster.on_ice.includes(b.id) && b.action_pile.length > 0) {
          const shuffled = shuffleArray(b.action_pile);
          const discarded = shuffled[0];
          updatedOpponentRoster = {
            ...updatedOpponentRoster,
            action_deck: returnCardToDeck(updatedOpponentRoster.action_deck, discarded),
          };
          return { ...b, action_pile: shuffled.slice(1) };
        }
        return b;
      });
      updatedOpponentRoster = { ...updatedOpponentRoster, beauts: updatedOpponentBeauts };
      newState = updateRoster(newState, defPlayer, updatedOpponentRoster);
      forcedLineChange = null; // No line change needed anymore
      result.special_effects.push({ type: 'ENFORCER_CANT_LINE_CHANGE_DISCARD' });
    }
  }

  // =====================================================
  // DETERMINE NEXT PHASE
  // =====================================================
  let nextPhase: GamePhase;
  if (winner) {
    nextPhase = 'MATCH_END';
  } else if (forcedLineChange) {
    nextPhase = 'FORCED_LINE_CHANGE';
  } else if (twoTimerPending) {
    nextPhase = 'OFFENSIVE_DRAW'; // Two-Timer secondary draw
  } else if (immediateRedraw) {
    nextPhase = 'OFFENSIVE_DRAW'; // Immediate redraw
  } else {
    nextPhase = 'POSSESSION_START';
  }

  newState = {
    ...newState,
    phase: nextPhase,
    player1_score: p1Score,
    player2_score: p2Score,
    possession: newPossession,
    can_shoot: result.goal_scored ? false : newCanShoot,
    active_offensive_beaut_id: newOffensiveBeautId,
    active_defensive_beaut_id: newDefensiveBeautId,
    drawn_card: null,
    defensive_selected_card: null,
    hybrid_choice_pending: null,
    last_resolution: result,
    winner,
    turn_number: state.turn_number + 1,
    catch_up_traits_pending: catchUpPending,
    two_timer_secondary_pending: twoTimerPending,
    two_timer_primary_result: twoTimerPending ? result.outcome : null,
    immediate_redraw_pending: immediateRedraw && !twoTimerPending,
    forced_line_change_pending: forcedLineChange,
    offensive_line_change_done: false,
    defensive_line_change_done: false,
  };

  // Reset line change tracking on possession change or goal
  if (newPossession !== state.possession || result.goal_scored) {
    newState = {
      ...newState,
      line_change_used_this_possession: { player1: false, player2: false },
    };
    newState = setDefaultActiveBeauts(newState);
  }

  return newState;
}

// Apply catch-up: move reserved traits to Action Deck
export function applyCatchUpTraits(
  state: GameState,
  player: 'player1' | 'player2'
): GameState {
  let roster = player === 'player1' ? { ...state.player1 } : { ...state.player2 };
  const count = Math.min(state.catch_up_traits_pending?.count || 2, roster.reserved_traits.length);

  // Move up to 'count' reserved traits to the Action Deck
  const traitsToAdd = roster.reserved_traits.slice(0, count);
  const remainingReserved = roster.reserved_traits.slice(count);

  roster = {
    ...roster,
    action_deck: [...roster.action_deck, ...traitsToAdd],
    reserved_traits: remainingReserved,
  };

  let newState = updateRoster(state, player, roster);
  newState = { ...newState, catch_up_traits_pending: null };
  return newState;
}

// Get the active offensive player
export function getOffensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession;
}

// Get the active defensive player
export function getDefensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession === 'player1' ? 'player2' : 'player1';
}

// Set active offensive beaut manually
export function setActiveOffensiveBeaut(state: GameState, beautId: string): GameState {
  return { ...state, active_offensive_beaut_id: beautId };
}

// Set active defensive beaut manually
export function setActiveDefensiveBeaut(state: GameState, beautId: string): GameState {
  return { ...state, active_defensive_beaut_id: beautId };
}

// Check if all on-ice Beauts for both players are exhausted
export function checkGlobalExhaustion(state: GameState): boolean {
  const offRoster = state.possession === 'player1' ? state.player1 : state.player2;
  const defRoster = state.possession === 'player1' ? state.player2 : state.player1;

  const offOnIce = offRoster.on_ice.map(id => getBeaut(state, id)).filter(Boolean) as BeautEntity[];
  const defOnIce = defRoster.on_ice.map(id => getBeaut(state, id)).filter(Boolean) as BeautEntity[];

  const offExhausted = offOnIce.every(b => b.is_exhausted || availableCards(b.action_pile).length === 0);
  const defExhausted = defOnIce.every(b => b.is_exhausted || availableCards(b.action_pile).length === 0);

  // Also check if Action Decks are empty
  const offDeckEmpty = offRoster.action_deck.length === 0;
  const defDeckEmpty = defRoster.action_deck.length === 0;

  return offExhausted && defExhausted && offDeckEmpty && defDeckEmpty;
}
