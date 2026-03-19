/**
 * Game Engine — single source of truth for all state transitions.
 * Server-authoritative even in local 2-player mode.
 * All random draws happen here, not in UI.
 */

import {
  GameState,
  GamePhase,
  BeautEntity,
  PlayerRoster,
  ActionCard,
  TraitCard,
  CardType,
  TraitName,
  RPSChoice,
  RPSResult,
  GameMode,
  Position,
  Tier,
} from '@/types/game';
import {
  buildActionPile,
  drawFromPile,
  availableCards,
  createTraitCard,
  shuffleArray,
  isNaturalTrait,
  createActionCard,
  POSITION_LEGAL_CARDS,
} from './cards';
import { resolveAction, updateCanShoot, ResolutionInput } from './resolution';
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
    action_pile: [], // set when ice/bench assigned
    trait_card: null,
    is_exhausted: false,
    can_shoot: false,
  };
}

// Initialize roster with action piles
function initRoster(
  beauts: BeautEntity[],
  onIceIds: string[],
  onBenchIds: string[],
  mode: GameMode
): PlayerRoster & { beauts: BeautEntity[] } {
  const initedBeauts = beauts.map(b => {
    const isOnIce = onIceIds.includes(b.id);
    const trait = b.trait_archetype as TraitName;
    const pile = buildActionPile(b.position, isOnIce, trait);

    // Assign trait card
    let traitCard: TraitCard | null = null;
    if (trait && mode === 'RegularSeason') {
      const isNatural = isNaturalTrait(trait);
      if (!isNatural) {
        // Forced traits are held separately (not in pile)
        traitCard = createTraitCard(trait as TraitName, 'setup');
      }
      // Natural traits are already in the pile (added by buildActionPile)
    }

    return {
      ...b,
      action_pile: pile,
      trait_card: traitCard,
      is_exhausted: false,
    };
  });

  return {
    player_id: 'player1', // overridden by caller
    beauts: initedBeauts,
    on_ice: onIceIds,
    on_bench: onBenchIds,
  };
}

// Create initial game state
export function createGameState(
  p1Beauts: BeautEntity[],
  p2Beauts: BeautEntity[],
  mode: GameMode
): GameState {
  const id = uuidv4();

  // Default: first 3 are on ice, last 3 on bench
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
    drawn_card_is_natural_trait: false,
    defensive_selected_card: null,
    pending_offensive_trait: null,
    pending_defensive_trait: null,
    last_resolution: null,
    winner: null,
    turn_number: 0,
    acting_player: null,
    catch_up_traits_pending: null,
    natural_trait_activation_pending: false,
    natural_trait_beaut_id: null,
    offensive_line_change_done: false,
    defensive_line_change_done: false,
    defensive_archetype_revealed: false,
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

  // Both have chosen — resolve
  if (newState.rps_choice_p1 && newState.rps_choice_p2) {
    const result = resolveRPS(newState.rps_choice_p1, newState.rps_choice_p2);

    if (result === 'tie') {
      // Reset for another round
      return { ...newState, rps_choice_p1: null, rps_choice_p2: null };
    }

    // Winner gets to choose — for simplicity, winner gets possession
    newState = {
      ...newState,
      rps_winner: result,
      possession: result, // winner starts with puck
      phase: 'POSSESSION_START' as GamePhase,
    };

    // Set default active beauts (center for offense, goalie for defense)
    newState = setDefaultActiveBeauts(newState);
  }

  return newState;
}

function setDefaultActiveBeauts(state: GameState): GameState {
  const offensiveRoster = state.possession === 'player1' ? state.player1 : state.player2;
  const defensiveRoster = state.possession === 'player1' ? state.player2 : state.player1;

  // Offensive: prefer Center on ice, fallback to first on-ice
  const offensiveBeaut =
    offensiveRoster.beauts.find(
      b => b.position === 'Center' && offensiveRoster.on_ice.includes(b.id)
    ) || offensiveRoster.beauts.find(b => offensiveRoster.on_ice.includes(b.id));

  // Defensive: prefer Goaltender on ice, fallback to first on-ice
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

// Perform a line change
export function performLineChange(
  state: GameState,
  player: 'player1' | 'player2',
  swaps: Array<{ ice_beaut_id: string; bench_beaut_id: string; new_card: CardType }>
): GameState {
  let roster = player === 'player1' ? state.player1 : state.player2;

  // Apply each swap
  let beauts = [...roster.beauts];
  let onIce = [...roster.on_ice];
  let onBench = [...roster.on_bench];

  for (const swap of swaps) {
    const iceBeautIdx = beauts.findIndex(b => b.id === swap.ice_beaut_id);
    const benchBeautIdx = beauts.findIndex(b => b.id === swap.bench_beaut_id);
    if (iceBeautIdx === -1 || benchBeautIdx === -1) continue;

    const iceBeaut = { ...beauts[iceBeautIdx] };
    const benchBeaut = { ...beauts[benchBeautIdx] };

    // Ice -> Bench: loses all cards, gets 2 fresh cards on bench
    const freshBenchCards = buildActionPile(iceBeaut.position, false, null);
    iceBeaut.action_pile = freshBenchCards;
    iceBeaut.is_exhausted = false;

    // Bench -> Ice: gains 1 additional card of player's choice
    const incomingCards = [...benchBeaut.action_pile];
    const newCard = createActionCard(swap.new_card);
    benchBeaut.action_pile = shuffleArray([...incomingCards, newCard]);
    benchBeaut.is_exhausted = benchBeaut.action_pile.length === 0;

    // Swap ice/bench
    onIce = onIce.map(id => (id === swap.ice_beaut_id ? swap.bench_beaut_id : id));
    onBench = onBench.map(id => (id === swap.bench_beaut_id ? swap.ice_beaut_id : id));

    beauts[iceBeautIdx] = iceBeaut;
    beauts[benchBeautIdx] = benchBeaut;
  }

  roster = { ...roster, beauts, on_ice: onIce, on_bench: onBench };

  let newState: GameState;
  if (player === 'player1') {
    newState = { ...state, player1: roster };
  } else {
    newState = { ...state, player2: roster };
  }

  // Mark line change done
  const offensivePlayer = state.possession;
  const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';

  if (player === offensivePlayer) {
    newState = { ...newState, offensive_line_change_done: true };
  } else {
    newState = { ...newState, defensive_line_change_done: true };
  }

  // Update active beauts after line change
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

  const drawResult = drawFromPile(beaut.action_pile);

  if (!drawResult) {
    // Exhaustion: no cards left
    const exhaustedBeaut = { ...beaut, is_exhausted: true };
    let newState = updateBeaut(state, exhaustedBeaut);
    // Possession transfers to defense
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

  // Check for illegal Shoot draw
  if (drawResult.drawn.card_type === 'Shoot' && !state.can_shoot) {
    // Natural Trait override: Power Fwd can bypass — but that's activated before draw
    // Discard the card and re-draw
    const updatedPile = drawResult.remaining.map(c => c); // card is burned
    const updatedBeaut = { ...beaut, action_pile: updatedPile };
    let newState = updateBeaut(state, updatedBeaut);

    // Try again (recursion)
    if (availableCards(updatedPile).length === 0) {
      // Exhausted after burn
      const exhaustedBeaut = { ...updatedBeaut, is_exhausted: true };
      newState = updateBeaut(newState, exhaustedBeaut);
      const newPossession = newState.possession === 'player1' ? 'player2' : 'player1';
      newState = {
        ...newState,
        possession: newPossession,
        can_shoot: false,
        phase: 'POSSESSION_START',
      };
      newState = setDefaultActiveBeauts(newState);
      return newState;
    }

    return performOffensiveDraw(newState);
  }

  // Check for Natural Trait draw
  const isNaturalTraitDrawn =
    drawResult.drawn.card_type === 'Trait' &&
    drawResult.drawn.trait_type === 'Natural' &&
    state.mode === 'RegularSeason';

  // Update beaut's pile
  const updatedBeaut = { ...beaut, action_pile: drawResult.remaining };
  let newState = updateBeaut(state, updatedBeaut);

  newState = {
    ...newState,
    drawn_card: drawResult.drawn,
    drawn_card_is_natural_trait: isNaturalTraitDrawn,
    natural_trait_activation_pending: isNaturalTraitDrawn,
    natural_trait_beaut_id: isNaturalTraitDrawn ? offensiveBeautId : null,
    phase: isNaturalTraitDrawn ? 'TRAIT_WINDOW' : 'DEFENSIVE_RESPONSE',
  };

  return newState;
}

// Defense selects a card
export function submitDefensiveResponse(
  state: GameState,
  selectedCardId: string
): GameState {
  const defensiveBeautId = state.active_defensive_beaut_id;
  if (!defensiveBeautId) return state;

  const beaut = getBeaut(state, defensiveBeautId);
  if (!beaut) return state;

  const selectedCard = beaut.action_pile.find(c => c.id === selectedCardId && c.state === 'in_pile');
  if (!selectedCard) return state;

  return {
    ...state,
    defensive_selected_card: selectedCard,
    phase: 'TRAIT_WINDOW',
  };
}

// Activate forced trait (offensive or defensive)
export function activateForcedTrait(
  state: GameState,
  player: 'player1' | 'player2',
  traitName: TraitName | null
): GameState {
  if (!traitName) {
    // No trait activated
    if (player === state.possession) {
      return { ...state, pending_offensive_trait: null };
    } else {
      return { ...state, pending_defensive_trait: null };
    }
  }

  if (player === state.possession) {
    return { ...state, pending_offensive_trait: traitName };
  } else {
    return { ...state, pending_defensive_trait: traitName };
  }
}

// Execute resolution
export function executeResolution(state: GameState): GameState {
  if (!state.drawn_card || !state.defensive_selected_card) return state;
  if (!state.active_offensive_beaut_id || !state.active_defensive_beaut_id) return state;

  const offensiveBeaut = getBeaut(state, state.active_offensive_beaut_id);
  const defensiveBeaut = getBeaut(state, state.active_defensive_beaut_id);
  if (!offensiveBeaut || !defensiveBeaut) return state;

  const input: ResolutionInput = {
    offensiveCard: state.drawn_card.card_type,
    defensiveCard: state.defensive_selected_card.card_type,
    offensiveBeaut,
    defensiveBeaut,
    canShoot: state.can_shoot,
    mode: state.mode,
    activeOffensiveTrait: state.pending_offensive_trait,
    activeDefensiveTrait: state.pending_defensive_trait,
  };

  const result = resolveAction(input);

  // Remove defensive card from pile (it was played/selected)
  let updatedDefBeaut = {
    ...defensiveBeaut,
    action_pile: defensiveBeaut.action_pile.filter(
      c => c.id !== state.defensive_selected_card!.id
    ),
  };

  // Apply special card-discard effects
  let updatedOffBeaut = { ...offensiveBeaut };

  // Discard cards from offense
  if (result.cards_discarded_from_offense > 0) {
    const available = availableCards(updatedOffBeaut.action_pile);
    const toDiscard = result.cards_discarded_from_offense === 999
      ? available.length
      : Math.min(result.cards_discarded_from_offense, available.length);
    // Remove first N cards randomly
    const shuffled = shuffleArray(available);
    const discardIds = new Set(shuffled.slice(0, toDiscard).map(c => c.id));
    updatedOffBeaut.action_pile = updatedOffBeaut.action_pile.filter(c => !discardIds.has(c.id));
  }

  // Discard cards from defense
  if (result.cards_discarded_from_defense > 0) {
    const available = availableCards(updatedDefBeaut.action_pile);
    const toDiscard = Math.min(result.cards_discarded_from_defense, available.length);
    const shuffled = shuffleArray(available);
    const discardIds = new Set(shuffled.slice(0, toDiscard).map(c => c.id));
    updatedDefBeaut.action_pile = updatedDefBeaut.action_pile.filter(c => !discardIds.has(c.id));
  }

  // Butterfly: if Butterfly trait was activated and it was a catch, return to pile
  const butterflyEffect = result.special_effects.find(e => e.type === 'BUTTERFLY_RETURN');
  if (butterflyEffect) {
    // Butterfly card returns to pile — it was the defensive selected card
    const butterflyCard = { ...state.defensive_selected_card, state: 'in_pile' as const };
    updatedDefBeaut.action_pile = [...updatedDefBeaut.action_pile, butterflyCard];
  }

  // Check exhaustion
  updatedOffBeaut.is_exhausted = availableCards(updatedOffBeaut.action_pile).length === 0;
  updatedDefBeaut.is_exhausted = availableCards(updatedDefBeaut.action_pile).length === 0;

  let newState = updateBeaut(state, updatedOffBeaut);
  newState = updateBeaut(newState, updatedDefBeaut);

  // Update canShoot
  const newCanShoot = updateCanShoot(state.can_shoot, state.drawn_card.card_type, result.outcome);

  // Handle possession change
  let newPossession = state.possession;
  if (result.puck_goes_to === 'defense') {
    newPossession = state.possession === 'player1' ? 'player2' : 'player1';
  }
  // If puck_goes_to is 'offense' (e.g., Block), possession stays but canShoot resets
  // (already handled by updateCanShoot returning false for Shoot)

  // Handle goal scored
  let p1Score = newState.player1_score;
  let p2Score = newState.player2_score;
  let winner: 'player1' | 'player2' | null = null;
  let catchUpPending: { player_id: 'player1' | 'player2'; count: number } | null = null;

  if (result.goal_scored) {
    const scorer = state.possession;
    if (scorer === 'player1') {
      p1Score++;
    } else {
      p2Score++;
    }

    // Check win condition
    if (p1Score >= 3) {
      winner = 'player1';
    } else if (p2Score >= 3) {
      winner = 'player2';
    }

    // Catch-up mechanic: trailing player gets 2 trait cards
    if (!winner) {
      const trailingPlayer =
        scorer === 'player1'
          ? 'player2'
          : 'player1';
      catchUpPending = { player_id: trailingPlayer, count: 2 };
    }

    // After goal: possession goes to the team that was scored on
    newPossession = state.possession === 'player1' ? 'player2' : 'player1';
  }

  // Handle Pass: active beaut changes (switch active beaut to another on-ice)
  let newOffensiveBeautId = newState.active_offensive_beaut_id;
  let newDefensiveBeautId = newState.active_defensive_beaut_id;

  if (state.drawn_card.card_type === 'Pass' && result.outcome === 'OFFENSE_WINS') {
    // Switch active offensive beaut to another on-ice Beaut
    const offRoster = state.possession === 'player1' ? newState.player1 : newState.player2;
    const otherOnIce = offRoster.on_ice.filter(id => id !== state.active_offensive_beaut_id);
    if (otherOnIce.length > 0) {
      newOffensiveBeautId = otherOnIce[0]; // Pick first other on-ice beaut
    }
  }

  // Playmaker bonus card: add 1 card to receiving beaut
  const playmakerEffect = result.special_effects.find(e => e.type === 'PLAYMAKER_BONUS_CARD');
  if (playmakerEffect && newOffensiveBeautId) {
    const receivingBeaut = getBeaut(newState, newOffensiveBeautId);
    if (receivingBeaut) {
      const bonusCard = createActionCard(
        POSITION_LEGAL_CARDS[receivingBeaut.position][0] as CardType
      );
      const updated = {
        ...receivingBeaut,
        action_pile: [...receivingBeaut.action_pile, bonusCard],
        is_exhausted: false,
      };
      newState = updateBeaut(newState, updated);
    }
  }

  // Power Fwd (defensive): eject offensive beaut to bench
  const powerFwdEject = result.special_effects.find(e => e.type === 'POWER_FWD_EJECT');
  if (powerFwdEject && state.active_offensive_beaut_id) {
    // Move offensive beaut to bench, replace with a bench beaut
    const offRoster = state.possession === 'player1' ? newState.player1 : newState.player2;
    const ejectedId = state.active_offensive_beaut_id;
    const newOnIce = offRoster.on_ice.filter(id => id !== ejectedId);
    const newOnBench = [...offRoster.on_bench, ejectedId];

    // Move first bench beaut to ice
    if (offRoster.on_bench.length > 0) {
      const incoming = offRoster.on_bench[0];
      newOnIce.push(incoming);
      const finalBench = newOnBench.filter(id => id !== incoming);
      const updatedOffRoster = { ...offRoster, on_ice: newOnIce, on_bench: finalBench };
      if (state.possession === 'player1') {
        newState = { ...newState, player1: updatedOffRoster };
      } else {
        newState = { ...newState, player2: updatedOffRoster };
      }
    }

    newOffensiveBeautId = newOnIce[0] || null;
  }

  // Two-Timer: if primary would have been stopped, mark secondary draw needed
  let twoTimerPending = false;
  if (state.mode === 'RegularSeason' && state.pending_offensive_trait === 'Two-Timer') {
    if (result.outcome === 'DEFENSE_WINS') {
      twoTimerPending = true;
    }
  }

  const nextPhase: GamePhase = winner
    ? 'MATCH_END'
    : twoTimerPending
    ? 'OFFENSIVE_DRAW' // re-draw secondary
    : 'POSSESSION_START';

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
    drawn_card_is_natural_trait: false,
    defensive_selected_card: null,
    pending_offensive_trait: null,
    pending_defensive_trait: null,
    natural_trait_activation_pending: false,
    natural_trait_beaut_id: null,
    defensive_archetype_revealed: false,
    last_resolution: result,
    winner,
    turn_number: state.turn_number + 1,
    catch_up_traits_pending: catchUpPending,
    two_timer_secondary_pending: twoTimerPending,
    offensive_line_change_done: false,
    defensive_line_change_done: false,
  };

  // If possession changed, reset active beauts
  if (newPossession !== state.possession || result.goal_scored) {
    newState = setDefaultActiveBeauts(newState);
  }

  return newState;
}

// Apply catch-up trait cards to a player
export function applyCatchUpTraits(
  state: GameState,
  player: 'player1' | 'player2'
): GameState {
  const roster = player === 'player1' ? state.player1 : state.player2;

  // Find beauts without trait cards that need one
  let beauts = [...roster.beauts];
  let traitsGranted = 0;

  for (let i = 0; i < beauts.length && traitsGranted < 2; i++) {
    const b = beauts[i];
    if (!b.trait_card && b.trait_archetype) {
      const traitName = b.trait_archetype as TraitName;
      const newTrait = createTraitCard(traitName, 'catch_up');

      // Natural traits go in pile, forced traits held
      if (isNaturalTrait(traitName)) {
        const traitCard = createActionCard('Trait', traitName);
        beauts[i] = {
          ...b,
          action_pile: shuffleArray([...b.action_pile, traitCard]),
        };
      } else {
        beauts[i] = { ...b, trait_card: newTrait };
      }
      traitsGranted++;
    }
  }

  const updatedRoster = { ...roster, beauts };
  const newState = {
    ...state,
    catch_up_traits_pending: null,
  };

  if (player === 'player1') {
    return { ...newState, player1: updatedRoster };
  }
  return { ...newState, player2: updatedRoster };
}

// Spend a trait card from a beaut
export function spendTraitCard(state: GameState, beautId: string): GameState {
  const beaut = getBeaut(state, beautId);
  if (!beaut || !beaut.trait_card) return state;

  const updatedBeaut = { ...beaut, trait_card: null };
  return updateBeaut(state, updatedBeaut);
}

// Get the active offensive player
export function getOffensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession;
}

// Get the active defensive player
export function getDefensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession === 'player1' ? 'player2' : 'player1';
}

// Check if game is in global exhaustion state
export function checkGlobalExhaustion(state: GameState): boolean {
  const offRoster = state.possession === 'player1' ? state.player1 : state.player2;
  const defRoster = state.possession === 'player1' ? state.player2 : state.player1;

  const offOnIce = offRoster.on_ice.map(id => getBeaut({ ...state }, id)).filter(Boolean) as any[];
  const defOnIce = defRoster.on_ice.map(id => getBeaut({ ...state }, id)).filter(Boolean) as any[];

  const offExhausted = offOnIce.every((b: any) => b.is_exhausted || availableCards(b.action_pile).length === 0);
  const defExhausted = defOnIce.every((b: any) => b.is_exhausted || availableCards(b.action_pile).length === 0);

  return offExhausted && defExhausted;
}

// Set active offensive beaut manually
export function setActiveOffensiveBeaut(state: GameState, beautId: string): GameState {
  return { ...state, active_offensive_beaut_id: beautId };
}

// Set active defensive beaut manually
export function setActiveDefensiveBeaut(state: GameState, beautId: string): GameState {
  return { ...state, active_defensive_beaut_id: beautId };
}
