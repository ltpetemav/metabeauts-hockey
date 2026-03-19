// Core game types for MetaBeauts: Hockey

export type Position = 'Winger' | 'Center' | 'Defender' | 'Goaltender';
export type Tier = 1 | 2 | 3 | 4;
export type TierName = 'Rookie' | 'Pro' | 'All-Star' | 'Legend';

export type CardType = 'Shoot' | 'Pass' | 'Skate' | 'Block' | 'Catch' | 'Steal' | 'Check' | 'Trait';
export type TraitType = 'Natural' | 'Forced' | 'Talent';

export type TraitName =
  | 'Two-Way'
  | 'Enforcer'
  | 'Power Fwd'
  | 'Sniper'
  | 'Stand Up'
  | 'Two-Timer'
  | 'Hybrid'
  | 'Dangler'
  | 'Playmaker'
  | 'Grinder'
  | 'Puck Mover'
  | 'Butterfly'
  | 'Offensive'
  | 'Defensive';

export type GameMode = 'PreSeason' | 'RegularSeason';

export type GamePhase =
  | 'INIT'
  | 'ROSTER_SELECT'
  | 'SETUP'
  | 'RPS'
  | 'POSSESSION_START'
  | 'LINE_CHANGE_OFFENSIVE'
  | 'LINE_CHANGE_DEFENSIVE'
  | 'OFFENSIVE_DRAW'
  | 'DEFENSIVE_RESPONSE'
  | 'TRAIT_WINDOW'
  | 'RESOLUTION'
  | 'POST_RESOLUTION'
  | 'GOAL_SCORED'
  | 'GLOBAL_EXHAUSTION_REFRESH'
  | 'MATCH_END';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'player1' | 'player2' | 'tie';

export type OutcomeType = 'OFFENSE_WINS' | 'DEFENSE_WINS' | 'GOAL_SCORED' | 'NO_EFFECT';

export interface BeautMetadata {
  token_id: number;
  name: string;
  image_url: string;
  position: Position;
  tier: Tier;
  trait_archetype: TraitName | string;
  team: string;
  jersey: string;
  visual_traits?: Record<string, string>;
}

export interface ActionCard {
  id: string;
  card_type: CardType;
  is_trait: boolean;
  trait_name?: TraitName;
  trait_type?: TraitType;
  state: 'in_pile' | 'played' | 'discarded' | 'held';
  returns_to_pile: boolean; // only true for Butterfly
}

export interface TraitCard {
  id: string;
  trait_name: TraitName;
  trait_type: TraitType;
  is_spent: boolean;
  returns_to_pile: boolean;
  acquired_from: 'setup' | 'catch_up';
}

export interface BeautEntity {
  id: string; // token_id as string
  token_id: number;
  name: string;
  position: Position;
  tier: Tier;
  trait_archetype: TraitName | string;
  image_url: string;
  team: string;
  // In-game state
  action_pile: ActionCard[]; // Face-down cards under this Beaut
  trait_card: TraitCard | null; // Held trait card (held separately, not in pile unless Natural)
  is_exhausted: boolean;
  can_shoot: boolean; // per-beaut shoot eligibility (set by pass/skate)
}

export interface PlayerRoster {
  player_id: 'player1' | 'player2';
  beauts: BeautEntity[]; // All 6 beauts
  on_ice: string[]; // 3 beaut IDs currently on ice
  on_bench: string[]; // 3 beaut IDs on bench
}

export interface ResolutionResult {
  outcome: OutcomeType;
  offensive_card: CardType;
  defensive_card: CardType;
  goal_scored: boolean;
  puck_goes_to: 'offense' | 'defense' | null; // null = unchanged
  offensive_beaut_id: string;
  defensive_beaut_id: string;
  cards_discarded_from_offense: number;
  cards_discarded_from_defense: number;
  special_effects: SpecialEffect[];
  exhausted_beauts: string[];
}

export interface SpecialEffect {
  type:
    | 'TWO_WAY_RETAIN'
    | 'SNIPER_UNBLOCKABLE'
    | 'POWER_FWD_EJECT'
    | 'TWO_TIMER_FALLBACK'
    | 'STAND_UP_COUNTERATTACK'
    | 'BUTTERFLY_RETURN'
    | 'PUCK_MOVER_NO_STEAL'
    | 'PLAYMAKER_BONUS_CARD'
    | 'GRINDER_DISCARD'
    | 'DANGLER_DRAIN'
    | 'ENFORCER_DRAIN'
    | 'HYBRID_CHOICE'
    | 'OFFENSIVE_ARCHETYPE_PICK'
    | 'DEFENSIVE_ARCHETYPE_SEE';
  beaut_id?: string;
  data?: Record<string, unknown>;
}

export interface GameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;

  player1: PlayerRoster;
  player2: PlayerRoster;

  player1_score: number;
  player2_score: number;

  possession: 'player1' | 'player2'; // who has the puck
  can_shoot: boolean; // global canShoot state for current possession

  active_offensive_beaut_id: string | null;
  active_defensive_beaut_id: string | null;

  // RPS
  rps_choice_p1: RPSChoice | null;
  rps_choice_p2: RPSChoice | null;
  rps_winner: 'player1' | 'player2' | null;

  // Current turn context
  drawn_card: ActionCard | null;
  drawn_card_is_natural_trait: boolean;
  defensive_selected_card: ActionCard | null;

  // Pending trait activations
  pending_offensive_trait: TraitName | null;
  pending_defensive_trait: TraitName | null;

  // Last resolution result (for UI display)
  last_resolution: ResolutionResult | null;

  // Winner
  winner: 'player1' | 'player2' | null;

  // Turn counter
  turn_number: number;

  // Phase for which player is acting (used in LINE_CHANGE phases)
  acting_player: 'player1' | 'player2' | null;

  // Catch-up trait grants pending
  catch_up_traits_pending: { player_id: 'player1' | 'player2'; count: number } | null;

  // Natural trait activation prompt
  natural_trait_activation_pending: boolean;
  natural_trait_beaut_id: string | null;

  // Line change phase tracking
  offensive_line_change_done: boolean;
  defensive_line_change_done: boolean;

  // Defensive archetype: did defensive player see offense card?
  defensive_archetype_revealed: boolean;

  // Two-timer: is a secondary draw pending?
  two_timer_secondary_pending: boolean;
  two_timer_primary_result: OutcomeType | null;
}
