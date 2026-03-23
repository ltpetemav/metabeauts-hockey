// Core game types for MetaBeauts: Hockey

export type Position = 'Winger' | 'Center' | 'Defender' | 'Goaltender';
export type Tier = 1 | 2 | 3 | 4;
export type TierName = 'Rookie' | 'Pro' | 'All-Star' | 'Legend';

export type CardType = 'Shoot' | 'Pass' | 'Skate' | 'Block' | 'Catch' | 'Steal' | 'Check' | 'Trait';

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
  | 'HYBRID_CHOICE'
  | 'DEFENSIVE_RESPONSE'
  | 'SIMULTANEOUS_REVEAL'
  | 'RESOLUTION'
  | 'POST_RESOLUTION'
  | 'GOAL_SCORED'
  | 'FORCED_LINE_CHANGE'
  | 'MATCH_END';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'player1' | 'player2' | 'tie';

export type OutcomeType = 'OFFENSE_WINS' | 'DEFENSE_WINS' | 'GOAL_SCORED' | 'NO_EFFECT' | 'TURNOVER';

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
}

export interface BeautEntity {
  id: string;
  token_id: number;
  name: string;
  position: Position;
  tier: Tier;
  trait_archetype: TraitName | string;
  image_url: string;
  team: string;
  action_pile: ActionCard[]; // Face-down cards under this Beaut (max 3)
  is_exhausted: boolean;
}

export interface PlayerRoster {
  player_id: 'player1' | 'player2';
  beauts: BeautEntity[];
  on_ice: string[];
  on_bench: string[];
  action_deck: ActionCard[]; // Shared card pool that cards return to
  reserved_traits: ActionCard[]; // Trait cards set aside at setup (added via catch-up)
}

export interface ResolutionResult {
  outcome: OutcomeType;
  offensive_card: CardType;
  defensive_card: CardType;
  offensive_trait_name?: TraitName;
  defensive_trait_name?: TraitName;
  goal_scored: boolean;
  puck_goes_to: 'offense' | 'defense' | null;
  offensive_beaut_id: string;
  defensive_beaut_id: string;
  cards_discarded_from_offense: number;
  cards_discarded_from_defense: number;
  special_effects: SpecialEffect[];
  exhausted_beauts: string[];
  // Card cycling: do these cards return to the Action Deck?
  offensive_card_returns_to_deck: boolean;
  defensive_card_returns_to_deck: boolean;
  // Immediate re-draw for traits like Two-Way, Stand Up, Playmaker, Puck Mover
  immediate_redraw: boolean;
  immediate_redraw_side: 'offense' | 'defense' | null;
}

export interface SpecialEffect {
  type: string;
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

  possession: 'player1' | 'player2';
  can_shoot: boolean;

  active_offensive_beaut_id: string | null;
  active_defensive_beaut_id: string | null;

  // RPS
  rps_choice_p1: RPSChoice | null;
  rps_choice_p2: RPSChoice | null;
  rps_winner: 'player1' | 'player2' | null;

  // Current turn context
  drawn_card: ActionCard | null;
  defensive_selected_card: ActionCard | null;

  // Last resolution result (for UI display)
  last_resolution: ResolutionResult | null;

  // Winner
  winner: 'player1' | 'player2' | null;

  // Turn counter
  turn_number: number;

  // Phase for which player is acting
  acting_player: 'player1' | 'player2' | null;

  // Line change tracking
  offensive_line_change_done: boolean;
  defensive_line_change_done: boolean;
  line_change_used_this_possession: { player1: boolean; player2: boolean };

  // Hybrid choice: when a Hybrid trait is drawn, player must choose between 2 options
  hybrid_choice_pending: {
    player: 'player1' | 'player2';
    options: [CardType, CardType];
    resolved_card_type?: CardType;
  } | null;

  // Immediate re-draw pending (Two-Way, Stand Up, Puck Mover, Playmaker)
  immediate_redraw_pending: boolean;

  // Forced line change (Enforcer offensive)
  forced_line_change_pending: 'player1' | 'player2' | null;

  // Catch-up: reserved trait selection pending after a goal
  catch_up_traits_pending: { player_id: 'player1' | 'player2'; count: number } | null;

  // Two-timer: is a secondary draw pending?
  two_timer_secondary_pending: boolean;
  two_timer_primary_result: OutcomeType | null;
}
