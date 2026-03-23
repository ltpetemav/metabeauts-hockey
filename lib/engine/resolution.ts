/**
 * Action Resolution Matrix + all 14 trait implementations.
 * New rules: traits are drawn from pile, defense is blind, cards cycle back to deck.
 */

import { CardType, OutcomeType, ResolutionResult, BeautEntity, GameMode, TraitName, Position } from '@/types/game';
import { PRIMARY_ACTION, BACKUP_ACTION, POSITION_DEFENSE_ACTION } from './cards';

export interface ResolutionInput {
  offensiveCard: CardType;
  defensiveCard: CardType;
  offensiveBeaut: BeautEntity;
  defensiveBeaut: BeautEntity;
  canShoot: boolean;
  mode: GameMode;
  // Trait info from drawn cards
  offensiveTraitName: TraitName | null;
  defensiveTraitName: TraitName | null;
  // Hybrid resolved choice (set if Hybrid was chosen)
  hybridOffenseChoice: CardType | null;
  hybridDefenseChoice: CardType | null;
}

/**
 * Get the effective card type for a trait card based on position and side.
 */
export function getEffectiveCardType(
  traitName: TraitName,
  position: Position,
  isOffense: boolean,
  hybridChoice: CardType | null
): CardType {
  if (isOffense) {
    switch (traitName) {
      case 'Power Fwd': return 'Shoot';
      case 'Sniper': return 'Shoot';
      case 'Stand Up': return 'Pass';
      case 'Puck Mover': return 'Pass';
      case 'Playmaker': return 'Skate';
      case 'Two-Way': return PRIMARY_ACTION[position];
      case 'Two-Timer': return PRIMARY_ACTION[position];
      case 'Hybrid': return hybridChoice || 'Pass';
      case 'Defensive': return PRIMARY_ACTION[position];
      case 'Offensive': return 'Trait'; // Special handling
      case 'Dangler': return 'Trait'; // Special handling (pre-resolution effect only)
      case 'Grinder': return 'Trait'; // Special handling
      case 'Enforcer': return 'Trait'; // Special handling (force line change)
      case 'Butterfly': return 'Trait'; // Should be handled before resolution (redraw)
    }
  } else {
    // Defense
    switch (traitName) {
      case 'Stand Up': return 'Catch';
      case 'Enforcer': return 'Trait'; // Acts as Block+Steal+Check simultaneously
      case 'Hybrid': return hybridChoice || 'Block';
      case 'Dangler': return 'Trait'; // Pre-resolution discard only, no blocking
      case 'Grinder': return 'Trait'; // Pre-resolution discard only
      case 'Butterfly': return 'Trait'; // Should be handled before resolution (redraw)
      // All "Position Action" traits:
      case 'Two-Way':
      case 'Power Fwd':
      case 'Sniper':
      case 'Two-Timer':
      case 'Puck Mover':
      case 'Playmaker':
      case 'Offensive':
      case 'Defensive':
        return POSITION_DEFENSE_ACTION[position] || 'Block';
    }
  }
  return 'Trait';
}

/**
 * Full Action Resolution Matrix:
 *
 * Offensive / Defensive | Block          | Catch          | Steal          | Check
 * Shoot                 | Block succeeds | Catch succeeds | GOAL           | GOAL
 * Pass                  | Pass ok        | Pass ok        | Steal succeeds | Pass ok
 * Skate                 | Skate ok       | Skate ok       | Skate ok       | Check succeeds
 */
export function resolveAction(input: ResolutionInput): ResolutionResult {
  const {
    offensiveCard,
    defensiveCard,
    offensiveBeaut,
    defensiveBeaut,
    canShoot,
    mode,
    offensiveTraitName,
    defensiveTraitName,
    hybridOffenseChoice,
    hybridDefenseChoice,
  } = input;

  const traitsActive = mode === 'RegularSeason';

  // Determine effective card types
  let effectiveOffense = offensiveCard;
  let effectiveDefense = defensiveCard;

  if (traitsActive && offensiveCard === 'Trait' && offensiveTraitName) {
    effectiveOffense = getEffectiveCardType(offensiveTraitName, offensiveBeaut.position, true, hybridOffenseChoice);
  }
  if (traitsActive && defensiveCard === 'Trait' && defensiveTraitName) {
    effectiveDefense = getEffectiveCardType(defensiveTraitName, defensiveBeaut.position, false, hybridDefenseChoice);
  }

  const result: ResolutionResult = {
    outcome: 'OFFENSE_WINS',
    offensive_card: effectiveOffense,
    defensive_card: effectiveDefense,
    offensive_trait_name: offensiveTraitName || undefined,
    defensive_trait_name: defensiveTraitName || undefined,
    goal_scored: false,
    puck_goes_to: null,
    offensive_beaut_id: offensiveBeaut.id,
    defensive_beaut_id: defensiveBeaut.id,
    cards_discarded_from_offense: 0,
    cards_discarded_from_defense: 0,
    special_effects: [],
    exhausted_beauts: [],
    offensive_card_returns_to_deck: true,
    defensive_card_returns_to_deck: true,
    immediate_redraw: false,
    immediate_redraw_side: null,
  };

  // =====================================================
  // PRE-RESOLUTION TRAIT EFFECTS
  // =====================================================

  // --- Dangler (OFF): Opponent discards an Action card BEFORE resolution ---
  if (traitsActive && offensiveTraitName === 'Dangler') {
    result.cards_discarded_from_defense += 1;
    result.special_effects.push({ type: 'DANGLER_DRAIN', beaut_id: defensiveBeaut.id });
    result.offensive_card_returns_to_deck = false; // Trait ability triggered → permanently discarded
  }

  // --- Dangler (DEF): Opponent discards an Action card BEFORE resolution ---
  if (traitsActive && defensiveTraitName === 'Dangler') {
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'DANGLER_DRAIN', beaut_id: offensiveBeaut.id });
    result.defensive_card_returns_to_deck = false; // Trait ability triggered → permanently discarded
  }

  // --- Grinder (OFF): Opponent discards a TRAIT card specifically ---
  if (traitsActive && offensiveTraitName === 'Grinder') {
    const opponentHasTrait = defensiveBeaut.action_pile.some(c => c.is_trait);
    if (opponentHasTrait) {
      result.special_effects.push({ type: 'GRINDER_DISCARD_TRAIT', beaut_id: defensiveBeaut.id });
      result.offensive_card_returns_to_deck = false; // Triggered
    } else {
      // No trait to discard → Grinder returns to deck (not consumed)
      result.offensive_card_returns_to_deck = true;
      result.special_effects.push({ type: 'GRINDER_NO_TARGET' });
    }
  }

  // --- Grinder (DEF): Opponent loses an Action card ---
  if (traitsActive && defensiveTraitName === 'Grinder') {
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'GRINDER_DISCARD', beaut_id: offensiveBeaut.id });
    result.defensive_card_returns_to_deck = false; // Triggered
  }

  // --- Enforcer (OFF): Force opponent line change ---
  if (traitsActive && offensiveTraitName === 'Enforcer') {
    result.special_effects.push({ type: 'ENFORCER_FORCE_LINE_CHANGE' });
    result.offensive_card_returns_to_deck = false; // Triggered
    // The actual line change is handled by the engine. Puck stays with offense.
    result.outcome = 'OFFENSE_WINS';
    result.puck_goes_to = null;
    // Defense card still returns to deck (wasted play)
    return result;
  }

  // --- Enforcer (DEF): Acts as Block + Steal + Check simultaneously ---
  if (traitsActive && defensiveTraitName === 'Enforcer') {
    // Counters ANY offensive action (Shoot, Pass, or Skate)
    // But: "Opposing Beaut retains puck but discards an Action Card"
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'ENFORCER_COUNTER', beaut_id: defensiveBeaut.id });
    result.defensive_card_returns_to_deck = false; // Triggered

    // Offense retains puck but action is negated
    result.outcome = 'DEFENSE_WINS';
    result.puck_goes_to = 'offense'; // Puck stays with offense (retain)
    return result;
  }

  // --- Offensive archetype (OFF): Complex switching mechanic ---
  if (traitsActive && offensiveTraitName === 'Offensive') {
    const beautHasOffensive = offensiveBeaut.trait_archetype === 'Offensive';
    if (beautHasOffensive) {
      // Switch active Beauts (not a Pass). Defense action still resolves.
      result.special_effects.push({ type: 'OFFENSIVE_SWITCH_PUCK', beaut_id: offensiveBeaut.id });
      result.offensive_card_returns_to_deck = false; // Card moves under new Beaut
      // Don't count as Shoot/Pass/Skate — defense action is "used" but doesn't counter
      result.outcome = 'OFFENSE_WINS';
      result.puck_goes_to = null;
      return result;
    } else {
      // Switch to a Beaut with Offensive archetype and Shoot
      result.special_effects.push({ type: 'OFFENSIVE_SHOOT_SWITCH' });
      result.offensive_card_returns_to_deck = false; // Triggered
      effectiveOffense = 'Shoot';
      // Catch treated as Block for this
      if (effectiveDefense === 'Catch') {
        effectiveDefense = 'Block';
      }
      // Fall through to normal resolution with Shoot
    }
  }

  // =====================================================
  // SHOOT PREREQUISITE CHECK
  // =====================================================
  if (effectiveOffense === 'Shoot') {
    const canShootOverride = traitsActive && (offensiveTraitName === 'Power Fwd' || offensiveTraitName === 'Sniper' || offensiveTraitName === 'Offensive');
    if (!canShoot && !canShootOverride) {
      // TURNOVER — puck goes to active defensive Beaut immediately
      result.outcome = 'TURNOVER';
      result.puck_goes_to = 'defense';
      result.special_effects.push({ type: 'SHOOT_PREREQUISITE_FAIL' });
      return result;
    }
  }

  // =====================================================
  // CORE RESOLUTION MATRIX
  // =====================================================

  // Handle special trait-only cards that don't map to standard actions
  if (effectiveOffense === 'Trait') {
    // Trait that doesn't map to standard action (Dangler, Grinder on offense with no target)
    // Puck stays with offense, no goal attempt
    result.outcome = 'OFFENSE_WINS';
    result.puck_goes_to = null;
    // Apply post-resolution effects and return
    applyPostResolutionTraits(result, input, traitsActive, effectiveOffense, effectiveDefense);
    return result;
  }

  if (effectiveDefense === 'Trait') {
    // Defensive trait that doesn't block (Dangler, Grinder on defense)
    // Offense action succeeds as if no defense
    switch (effectiveOffense) {
      case 'Shoot':
        result.outcome = 'GOAL_SCORED';
        result.goal_scored = true;
        break;
      case 'Pass':
        result.outcome = 'OFFENSE_WINS';
        break;
      case 'Skate':
        result.outcome = 'OFFENSE_WINS';
        break;
      default:
        result.outcome = 'OFFENSE_WINS';
    }
    applyPostResolutionTraits(result, input, traitsActive, effectiveOffense, effectiveDefense);
    return result;
  }

  // Standard matrix resolution
  switch (effectiveOffense) {
    case 'Shoot': {
      // Sniper: Block has no effect
      if (effectiveDefense === 'Block') {
        if (traitsActive && offensiveTraitName === 'Sniper') {
          result.outcome = 'GOAL_SCORED';
          result.goal_scored = true;
          result.special_effects.push({ type: 'SNIPER_UNBLOCKABLE' });
          result.offensive_card_returns_to_deck = false; // Trait triggered
        } else {
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'offense'; // Puck bounces back to shooter
        }
      } else if (effectiveDefense === 'Catch') {
        result.outcome = 'DEFENSE_WINS';
        result.puck_goes_to = 'defense';
      } else if (effectiveDefense === 'Steal') {
        // Sniper: Steal negates the trait
        if (traitsActive && offensiveTraitName === 'Sniper') {
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'defense';
          result.special_effects.push({ type: 'SNIPER_NEGATED_BY_STEAL' });
          result.offensive_card_returns_to_deck = false; // Triggered (but negated)
        } else {
          // Steal has no effect on Shoot normally → GOAL
          result.outcome = 'GOAL_SCORED';
          result.goal_scored = true;
        }
      } else if (effectiveDefense === 'Check') {
        // Sniper: Check negates the trait
        if (traitsActive && offensiveTraitName === 'Sniper') {
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'defense';
          result.special_effects.push({ type: 'SNIPER_NEGATED_BY_CHECK' });
          result.offensive_card_returns_to_deck = false;
        } else {
          // Check has no effect on Shoot → GOAL
          result.outcome = 'GOAL_SCORED';
          result.goal_scored = true;
        }
      } else {
        result.outcome = 'GOAL_SCORED';
        result.goal_scored = true;
      }
      break;
    }

    case 'Pass': {
      if (effectiveDefense === 'Steal') {
        result.outcome = 'DEFENSE_WINS';
        result.puck_goes_to = 'defense';
      } else {
        result.outcome = 'OFFENSE_WINS';
        result.puck_goes_to = null;
      }
      break;
    }

    case 'Skate': {
      if (effectiveDefense === 'Check') {
        result.outcome = 'DEFENSE_WINS';
        result.puck_goes_to = 'defense';
      } else {
        result.outcome = 'OFFENSE_WINS';
        result.puck_goes_to = null;
      }
      break;
    }

    default: {
      // Non-standard offensive card (shouldn't happen after trait mapping)
      result.outcome = 'OFFENSE_WINS';
      result.puck_goes_to = null;
    }
  }

  // =====================================================
  // POST-RESOLUTION TRAIT EFFECTS
  // =====================================================
  applyPostResolutionTraits(result, input, traitsActive, effectiveOffense, effectiveDefense);

  return result;
}

function applyPostResolutionTraits(
  result: ResolutionResult,
  input: ResolutionInput,
  traitsActive: boolean,
  effectiveOffense: CardType,
  effectiveDefense: CardType,
) {
  const { offensiveBeaut, defensiveBeaut, offensiveTraitName, defensiveTraitName } = input;

  if (!traitsActive) return;

  // --- Two-Way (OFF): If puck would be lost, retain it AND immediately redraw ---
  if (offensiveTraitName === 'Two-Way' && result.outcome === 'DEFENSE_WINS') {
    result.puck_goes_to = 'offense'; // Retain possession
    result.immediate_redraw = true;
    result.immediate_redraw_side = 'offense';
    result.offensive_card_returns_to_deck = false; // Trait triggered
    result.special_effects.push({ type: 'TWO_WAY_RETAIN', beaut_id: offensiveBeaut.id });
    // Override outcome since we retained
    result.outcome = 'OFFENSE_WINS';
  }

  // --- Two-Way (DEF): Position Action — card returns to deck (already handled by effective type) ---
  if (defensiveTraitName === 'Two-Way') {
    result.defensive_card_returns_to_deck = true; // Position Action → returns to deck
  }

  // --- Power Fwd (OFF): Shoot bypasses prerequisite (handled in canShoot override) ---
  if (offensiveTraitName === 'Power Fwd') {
    result.offensive_card_returns_to_deck = false; // Trait triggered (used Shoot ability)
  }

  // --- Power Fwd (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Power Fwd') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Sniper (OFF): already handled in matrix (unblockable, steal/check negate) ---
  // (offensive_card_returns_to_deck already set above)

  // --- Sniper (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Sniper') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Stand Up (OFF): Pass + immediate redraw ---
  if (offensiveTraitName === 'Stand Up' && result.outcome === 'OFFENSE_WINS') {
    result.immediate_redraw = true;
    result.immediate_redraw_side = 'offense';
    result.offensive_card_returns_to_deck = false; // Triggered
    result.special_effects.push({ type: 'STAND_UP_IMMEDIATE', beaut_id: offensiveBeaut.id });
  }

  // --- Stand Up (DEF): Catch + immediate redraw (defense now has puck) ---
  if (defensiveTraitName === 'Stand Up' && effectiveDefense === 'Catch') {
    if (effectiveOffense === 'Shoot') {
      // Catch the shoot → defense gets puck AND immediate redraw
      result.outcome = 'DEFENSE_WINS';
      result.puck_goes_to = 'defense';
      result.immediate_redraw = true;
      result.immediate_redraw_side = 'defense';
      result.defensive_card_returns_to_deck = false; // Triggered
      result.special_effects.push({ type: 'STAND_UP_COUNTERATTACK', beaut_id: defensiveBeaut.id });
    }
  }

  // --- Two-Timer (OFF): Primary Action; if stopped, use Backup instead ---
  if (offensiveTraitName === 'Two-Timer' && result.outcome === 'DEFENSE_WINS') {
    result.special_effects.push({ type: 'TWO_TIMER_FALLBACK' });
    result.offensive_card_returns_to_deck = false; // Triggered
    // The engine will handle the secondary draw with backup action
  }

  // --- Two-Timer (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Two-Timer') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Puck Mover (OFF): Pass + immediate redraw ---
  if (offensiveTraitName === 'Puck Mover' && result.outcome === 'OFFENSE_WINS') {
    result.immediate_redraw = true;
    result.immediate_redraw_side = 'offense';
    result.offensive_card_returns_to_deck = false; // Triggered
    result.special_effects.push({ type: 'PUCK_MOVER_IMMEDIATE', beaut_id: offensiveBeaut.id });
  }

  // --- Puck Mover (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Puck Mover') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Playmaker (OFF): Skate + immediate redraw ---
  if (offensiveTraitName === 'Playmaker' && result.outcome === 'OFFENSE_WINS') {
    result.immediate_redraw = true;
    result.immediate_redraw_side = 'offense';
    result.offensive_card_returns_to_deck = false; // Triggered
    result.special_effects.push({ type: 'PLAYMAKER_IMMEDIATE', beaut_id: offensiveBeaut.id });
  }

  // --- Playmaker (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Playmaker') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Defensive archetype (OFF): Position Action ---
  if (offensiveTraitName === 'Defensive') {
    result.offensive_card_returns_to_deck = true; // Position action, returns
  }

  // --- Defensive archetype (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Defensive') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Offensive archetype (DEF): Position Action → returns to deck ---
  if (defensiveTraitName === 'Offensive') {
    result.defensive_card_returns_to_deck = true;
  }

  // --- Hybrid: trait is triggered (choice was made) ---
  if (offensiveTraitName === 'Hybrid') {
    result.offensive_card_returns_to_deck = false; // Triggered
  }
  if (defensiveTraitName === 'Hybrid') {
    result.defensive_card_returns_to_deck = false; // Triggered
  }
}

// Determine canShoot state after an action
export function updateCanShoot(currentCanShoot: boolean, effectiveOffenseCard: CardType, outcome: OutcomeType): boolean {
  if (effectiveOffenseCard === 'Pass' && outcome !== 'DEFENSE_WINS' && outcome !== 'TURNOVER') {
    return true;
  }
  if (effectiveOffenseCard === 'Skate' && outcome !== 'DEFENSE_WINS' && outcome !== 'TURNOVER') {
    return true;
  }
  if (effectiveOffenseCard === 'Shoot') {
    return false;
  }
  if (outcome === 'DEFENSE_WINS' || outcome === 'TURNOVER') {
    return false;
  }
  return currentCanShoot;
}

// Helper to describe outcome for UI
export function describeOutcome(result: ResolutionResult): string {
  const { offensive_card, defensive_card, outcome, goal_scored, offensive_trait_name, defensive_trait_name } = result;

  if (goal_scored) {
    const sniperNote = result.special_effects.some(e => e.type === 'SNIPER_UNBLOCKABLE')
      ? ' (Sniper — unblockable!)'
      : '';
    return `GOAL SCORED!${sniperNote}`;
  }

  if (outcome === 'TURNOVER') {
    return 'Shoot prerequisite not met — TURNOVER!';
  }

  const hasEffect = (type: string) => result.special_effects.some(e => e.type === type);

  // Trait-specific descriptions
  if (hasEffect('TWO_WAY_RETAIN')) return 'Two-Way: Retained possession + immediate action!';
  if (hasEffect('ENFORCER_FORCE_LINE_CHANGE')) return `Enforcer: Forced opponent line change!`;
  if (hasEffect('ENFORCER_COUNTER')) return 'Enforcer: Countered offense + forced discard!';
  if (hasEffect('STAND_UP_COUNTERATTACK')) return 'Stand Up: Caught AND counterattack!';
  if (hasEffect('STAND_UP_IMMEDIATE')) return 'Stand Up: Pass + immediate action!';
  if (hasEffect('PUCK_MOVER_IMMEDIATE')) return 'Puck Mover: Pass + immediate action!';
  if (hasEffect('PLAYMAKER_IMMEDIATE')) return 'Playmaker: Skate + immediate action!';
  if (hasEffect('TWO_TIMER_FALLBACK')) return 'Two-Timer: Primary stopped — backup action coming!';
  if (hasEffect('OFFENSIVE_SWITCH_PUCK')) return 'Offensive: Switched puck holder!';
  if (hasEffect('OFFENSIVE_SHOOT_SWITCH')) return 'Offensive: Switched to Offensive Beaut + Shoot!';
  if (hasEffect('GRINDER_DISCARD_TRAIT')) return 'Grinder: Discarded opponent trait card!';
  if (hasEffect('GRINDER_NO_TARGET')) return 'Grinder: No trait to discard — card returned!';
  if (hasEffect('DANGLER_DRAIN')) return `Dangler: Opponent lost a card!`;

  if (outcome === 'DEFENSE_WINS') {
    if (defensive_card === 'Block') return 'Block succeeds! Puck bounced back to shooter.';
    if (defensive_card === 'Catch') return 'Catch! Defense takes possession.';
    if (defensive_card === 'Steal') return 'Steal! Defense intercepts the pass.';
    if (defensive_card === 'Check') return 'Check! Defense stops the skater.';
    return 'Defense wins!';
  }

  if (outcome === 'OFFENSE_WINS') {
    if (offensive_card === 'Pass') return 'Pass succeeds! canShoot enabled.';
    if (offensive_card === 'Skate') return 'Skate succeeds! canShoot enabled.';
    if (offensive_trait_name) return `${offensive_trait_name} effect resolved — offense keeps puck.`;
    return 'Offense succeeds!';
  }

  return 'No effect.';
}
