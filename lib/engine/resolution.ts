/**
 * Action Resolution Matrix implementation.
 * Based on spec Section 2.3 — follow EXACTLY.
 */

import { CardType, OutcomeType, ResolutionResult, ActionCard, BeautEntity, GameMode, TraitName } from '@/types/game';

export interface ResolutionInput {
  offensiveCard: CardType;
  defensiveCard: CardType;
  offensiveBeaut: BeautEntity;
  defensiveBeaut: BeautEntity;
  canShoot: boolean;
  mode: GameMode;
  // Active trait effects this turn
  activeOffensiveTrait: TraitName | null;
  activeDefensiveTrait: TraitName | null;
}

/**
 * Full Action Resolution Matrix from spec Section 2.3:
 *
 * Offensive ↓ / Defensive → | Block          | Catch          | Steal          | Check
 * Shoot                     | Block succeeds | Catch succeeds | No effect ✅   | No effect ✅
 * Pass                      | No effect ✅   | No effect ✅   | Steal succeeds | No effect ✅
 * Skate                     | No effect ✅   | No effect ✅   | No effect ✅   | Check succeeds
 */
export function resolveAction(input: ResolutionInput): ResolutionResult {
  const {
    offensiveCard,
    defensiveCard,
    offensiveBeaut,
    defensiveBeaut,
    canShoot,
    mode,
    activeOffensiveTrait,
    activeDefensiveTrait,
  } = input;

  const result: ResolutionResult = {
    outcome: 'OFFENSE_WINS',
    offensive_card: offensiveCard,
    defensive_card: defensiveCard,
    goal_scored: false,
    puck_goes_to: null,
    offensive_beaut_id: offensiveBeaut.id,
    defensive_beaut_id: defensiveBeaut.id,
    cards_discarded_from_offense: 0,
    cards_discarded_from_defense: 0,
    special_effects: [],
    exhausted_beauts: [],
  };

  // Handle Trait effects (mode check: PreSeason = no traits)
  const traitsActive = mode === 'RegularSeason';

  // Dangler: Opponent discards 1 card (before resolution)
  if (traitsActive && activeOffensiveTrait === 'Dangler') {
    result.cards_discarded_from_defense += 1;
    result.special_effects.push({ type: 'DANGLER_DRAIN', beaut_id: defensiveBeaut.id });
  }
  if (traitsActive && activeDefensiveTrait === 'Dangler') {
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'DANGLER_DRAIN', beaut_id: offensiveBeaut.id });
  }

  // Grinder: Opponent discards 1 random card (before resolution)
  if (traitsActive && activeOffensiveTrait === 'Grinder') {
    result.cards_discarded_from_defense += 1;
    result.special_effects.push({ type: 'GRINDER_DISCARD', beaut_id: defensiveBeaut.id });
  }
  if (traitsActive && activeDefensiveTrait === 'Grinder') {
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'GRINDER_DISCARD', beaut_id: offensiveBeaut.id });
  }

  // Enforcer (defensive): opponent discards 1 card
  if (traitsActive && activeDefensiveTrait === 'Enforcer') {
    result.cards_discarded_from_offense += 1;
    result.special_effects.push({ type: 'ENFORCER_DRAIN', beaut_id: offensiveBeaut.id });
  }
  // Enforcer (offensive): draw 1 additional card to pile (handled in state update)
  if (traitsActive && activeOffensiveTrait === 'Enforcer') {
    result.special_effects.push({ type: 'ENFORCER_DRAIN', beaut_id: offensiveBeaut.id, data: { is_replenish: true } });
  }

  // Power Fwd (defensive): unconditional turnover, eject all opponent cards
  if (traitsActive && activeDefensiveTrait === 'Power Fwd') {
    result.outcome = 'DEFENSE_WINS';
    result.puck_goes_to = 'defense';
    result.cards_discarded_from_offense = 999; // signal: all cards discarded
    result.special_effects.push({ type: 'POWER_FWD_EJECT', beaut_id: offensiveBeaut.id });
    return result;
  }

  // Apply core resolution matrix
  switch (offensiveCard) {
    case 'Shoot': {
      // Check canShoot prerequisite (Power Fwd can bypass)
      const canShootOverride = traitsActive && activeOffensiveTrait === 'Power Fwd';
      if (!canShoot && !canShootOverride) {
        // Illegal draw — treat as burned card (offense must re-draw)
        result.outcome = 'NO_EFFECT';
        result.puck_goes_to = null;
        result.special_effects.push({ type: 'OFFENSIVE_ARCHETYPE_PICK', data: { illegal_shoot: true } });
        return result;
      }

      if (defensiveCard === 'Block') {
        // Sniper trait: Block has no effect
        if (traitsActive && activeOffensiveTrait === 'Sniper') {
          result.outcome = 'GOAL_SCORED';
          result.goal_scored = true;
          result.puck_goes_to = null;
          result.special_effects.push({ type: 'SNIPER_UNBLOCKABLE' });
        } else {
          // Block succeeds — puck returns to shooter
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'offense'; // puck stays with offense (bounces back)
          // Note: possession stays with offense but canShoot resets
        }
      } else if (defensiveCard === 'Catch') {
        // Catch succeeds — puck goes to defender
        // Butterfly special case: Catch AND puck transfer
        if (traitsActive && activeDefensiveTrait === 'Butterfly' && defensiveBeaut.position === 'Goaltender') {
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'defense';
          result.special_effects.push({ type: 'BUTTERFLY_RETURN', beaut_id: defensiveBeaut.id });
        } else {
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'defense';
        }
      } else {
        // Steal or Check has no effect on Shoot
        result.outcome = 'GOAL_SCORED';
        result.goal_scored = true;
        result.puck_goes_to = null;
      }
      break;
    }

    case 'Pass': {
      if (defensiveCard === 'Steal') {
        // Check Puck Mover trait: Steal has no effect on this pass
        if (traitsActive && activeOffensiveTrait === 'Puck Mover' && offensiveBeaut.position === 'Defender') {
          result.outcome = 'OFFENSE_WINS';
          result.puck_goes_to = null;
          result.special_effects.push({ type: 'PUCK_MOVER_NO_STEAL' });
        } else {
          // Steal succeeds
          result.outcome = 'DEFENSE_WINS';
          result.puck_goes_to = 'defense';
        }
      } else {
        // Block, Catch, Check have no effect on Pass
        result.outcome = 'OFFENSE_WINS';
        result.puck_goes_to = null;
      }
      break;
    }

    case 'Skate': {
      if (defensiveCard === 'Check') {
        result.outcome = 'DEFENSE_WINS';
        result.puck_goes_to = 'defense';
      } else {
        // Block, Catch, Steal have no effect on Skate
        result.outcome = 'OFFENSE_WINS';
        result.puck_goes_to = null;
      }
      break;
    }

    default: {
      result.outcome = 'NO_EFFECT';
    }
  }

  // Post-resolution trait effects
  if (traitsActive && result.outcome === 'DEFENSE_WINS' && activeOffensiveTrait === 'Two-Way') {
    // Two-Way: retain possession (puck comes back to offense)
    result.puck_goes_to = 'offense';
    result.special_effects.push({ type: 'TWO_WAY_RETAIN', beaut_id: offensiveBeaut.id });
  }

  // Playmaker: if Pass succeeds, receiving beaut gets +1 bonus card
  if (traitsActive && offensiveCard === 'Pass' && result.outcome === 'OFFENSE_WINS' && activeOffensiveTrait === 'Playmaker') {
    result.special_effects.push({ type: 'PLAYMAKER_BONUS_CARD' });
  }

  // Stand Up (defensive): Catch shoot AND counterattack
  if (traitsActive && activeDefensiveTrait === 'Stand Up' && offensiveCard === 'Shoot') {
    result.outcome = 'DEFENSE_WINS';
    result.puck_goes_to = 'defense';
    result.special_effects.push({ type: 'STAND_UP_COUNTERATTACK', beaut_id: defensiveBeaut.id });
  }

  return result;
}

// Determine canShoot state after an action
export function updateCanShoot(currentCanShoot: boolean, offensiveCard: CardType, outcome: OutcomeType): boolean {
  if (offensiveCard === 'Pass' && outcome !== 'DEFENSE_WINS') {
    return true; // Successful pass enables shoot
  }
  if (offensiveCard === 'Skate' && outcome !== 'DEFENSE_WINS') {
    return true; // Successful skate enables shoot
  }
  if (offensiveCard === 'Shoot') {
    return false; // After shoot attempt, reset canShoot
  }
  // Possession change resets canShoot
  if (outcome === 'DEFENSE_WINS') {
    return false;
  }
  return currentCanShoot;
}

// Helper to describe outcome for UI
export function describeOutcome(result: ResolutionResult): string {
  const { offensive_card, defensive_card, outcome, goal_scored } = result;

  if (goal_scored) {
    const sniperNote = result.special_effects.some(e => e.type === 'SNIPER_UNBLOCKABLE')
      ? ' (Sniper — unblockable!)'
      : '';
    return `⚡ GOAL SCORED!${sniperNote}`;
  }

  const hasEffect = (type: string) => result.special_effects.some(e => e.type === type);

  if (outcome === 'DEFENSE_WINS') {
    if (defensive_card === 'Block') return '🛡️ Block succeeds! Puck bounced back to shooter.';
    if (defensive_card === 'Catch') {
      if (hasEffect('BUTTERFLY_RETURN')) return '🦋 Butterfly! Goaltender catches and keeps it!';
      return '🧤 Catch! Defense takes possession.';
    }
    if (defensive_card === 'Steal') return '💨 Steal! Defense intercepts the pass.';
    if (defensive_card === 'Check') {
      if (hasEffect('POWER_FWD_EJECT')) return '💥 Power Forward! Devastating check — all cards discarded!';
      return '💪 Check! Defense stops the skater.';
    }
    if (hasEffect('STAND_UP_COUNTERATTACK')) return '🥊 Stand Up! Defense catches AND counterattacks!';
    return '❌ Defense wins!';
  }

  if (outcome === 'OFFENSE_WINS') {
    if (offensive_card === 'Pass') {
      if (hasEffect('PUCK_MOVER_NO_STEAL')) return '🏒 Puck Mover! Unstealable breakout pass succeeds!';
      return '🏒 Pass succeeds! canShoot enabled.';
    }
    if (offensive_card === 'Skate') return '⛸️ Skate succeeds! canShoot enabled.';
    if (offensive_card === 'Shoot' && defensive_card !== 'Block' && defensive_card !== 'Catch') {
      return `⚡ ${defensive_card} had no effect — Shoot would have resolved.`;
    }
    return '✅ Offense succeeds!';
  }

  return 'No effect.';
}
