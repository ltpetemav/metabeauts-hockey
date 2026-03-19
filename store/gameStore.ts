/**
 * Zustand game store — single source of truth for UI state.
 * All game logic is delegated to the engine functions.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  BeautMetadata,
  Position,
  CardType,
  TraitName,
  RPSChoice,
  GameMode,
} from '@/types/game';
import {
  createGameState,
  buildBeautEntity,
  submitRPS,
  performLineChange,
  performOffensiveDraw,
  submitDefensiveResponse,
  activateForcedTrait,
  executeResolution,
  applyCatchUpTraits,
  spendTraitCard,
  setActiveOffensiveBeaut,
  setActiveDefensiveBeaut,
  checkGlobalExhaustion,
  getBeaut,
} from '@/lib/engine/gameEngine';
import { availableCards } from '@/lib/engine/cards';

export interface RosterSelection {
  player1: BeautMetadata[];
  player2: BeautMetadata[];
}

interface GameStore {
  // Roster selection phase
  rosterSelection: RosterSelection;
  selectedGameMode: GameMode;

  // Live game state
  gameState: GameState | null;

  // UI-specific state
  currentViewingPlayer: 'player1' | 'player2'; // Hot-seat: which player is currently viewing
  resolutionAnimating: boolean;
  showResolutionResult: boolean;
  lastAction: string | null;

  // Roster browsing
  browsedBeauts: BeautMetadata[];
  isLoadingBeauts: boolean;
  rosterBrowsePosition: Position | null;

  // Actions
  setGameMode: (mode: GameMode) => void;
  addBeautToRoster: (player: 'player1' | 'player2', beaut: BeautMetadata) => void;
  removeBeautFromRoster: (player: 'player1' | 'player2', tokenId: number) => void;
  startGame: () => void;

  submitRPSChoice: (player: 'player1' | 'player2', choice: RPSChoice) => void;
  doLineChange: (
    player: 'player1' | 'player2',
    swaps: Array<{ ice_beaut_id: string; bench_beaut_id: string; new_card: CardType }>
  ) => void;
  skipLineChange: (player: 'player1' | 'player2') => void;
  drawOffensiveCard: () => void;
  selectDefensiveCard: (cardId: string) => void;
  activateTrait: (player: 'player1' | 'player2', trait: TraitName | null) => void;
  confirmResolution: () => void;
  dismissResolution: () => void;
  applyCatchUp: () => void;

  setActiveOffensiveBeaut: (beautId: string) => void;
  setActiveDefensiveBeaut: (beautId: string) => void;

  setBrowsedBeauts: (beauts: BeautMetadata[]) => void;
  setLoadingBeauts: (loading: boolean) => void;
  setRosterBrowsePosition: (pos: Position | null) => void;

  switchViewToPlayer: (player: 'player1' | 'player2') => void;

  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    rosterSelection: { player1: [], player2: [] },
    selectedGameMode: 'RegularSeason',
    gameState: null,
    currentViewingPlayer: 'player1',
    resolutionAnimating: false,
    showResolutionResult: false,
    lastAction: null,
    browsedBeauts: [],
    isLoadingBeauts: false,
    rosterBrowsePosition: null,

    setGameMode: (mode) => set({ selectedGameMode: mode }),

    addBeautToRoster: (player, beaut) => {
      const { rosterSelection } = get();
      const current = rosterSelection[player];

      // Max 6 beauts per player
      if (current.length >= 6) return;

      // No duplicate token IDs
      if (current.find((b) => b.token_id === beaut.token_id)) return;

      // Position limits: 2 Wingers, 1 Center, 2 Defenders, 1 Goaltender
      const positionCounts = current.reduce(
        (acc, b) => ({ ...acc, [b.position]: (acc[b.position as Position] || 0) + 1 }),
        {} as Record<Position, number>
      );
      const positionLimits: Record<Position, number> = {
        Winger: 2,
        Center: 1,
        Defender: 2,
        Goaltender: 1,
      };
      if ((positionCounts[beaut.position] || 0) >= positionLimits[beaut.position]) {
        return; // Position slot full
      }

      set({
        rosterSelection: {
          ...rosterSelection,
          [player]: [...current, beaut],
        },
      });
    },

    removeBeautFromRoster: (player, tokenId) => {
      const { rosterSelection } = get();
      set({
        rosterSelection: {
          ...rosterSelection,
          [player]: rosterSelection[player].filter((b) => b.token_id !== tokenId),
        },
      });
    },

    startGame: () => {
      const { rosterSelection, selectedGameMode } = get();
      const { player1, player2 } = rosterSelection;

      if (player1.length !== 6 || player2.length !== 6) {
        console.error('Each player must have exactly 6 Beauts');
        return;
      }

      const p1Entities = player1.map(buildBeautEntity);
      const p2Entities = player2.map(buildBeautEntity);

      const gameState = createGameState(p1Entities, p2Entities, selectedGameMode);

      set({
        gameState,
        currentViewingPlayer: 'player1',
        showResolutionResult: false,
        resolutionAnimating: false,
        lastAction: 'Game started! Player 1 wins RPS or both submit choices.',
      });
    },

    submitRPSChoice: (player, choice) => {
      const { gameState } = get();
      if (!gameState) return;
      const newState = submitRPS(gameState, player, choice);
      set({ gameState: newState, lastAction: `${player} chose ${choice}` });
    },

    doLineChange: (player, swaps) => {
      const { gameState } = get();
      if (!gameState) return;
      let newState = performLineChange(gameState, player, swaps);
      // After line change, advance phase if both done
      const offensivePlayer = gameState.possession;
      const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';
      
      if (player === offensivePlayer) {
        newState = { ...newState, offensive_line_change_done: true };
      } else {
        newState = { ...newState, defensive_line_change_done: true };
      }

      set({ gameState: newState, lastAction: `${player} made a line change` });
    },

    skipLineChange: (player) => {
      const { gameState } = get();
      if (!gameState) return;
      const offensivePlayer = gameState.possession;
      const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';

      let newState = { ...gameState };

      if (player === offensivePlayer) {
        newState = { ...newState, offensive_line_change_done: true };
      } else {
        newState = { ...newState, defensive_line_change_done: true };
      }

      // If both line changes resolved, move to offensive draw
      if (newState.offensive_line_change_done && newState.defensive_line_change_done) {
        newState = { ...newState, phase: 'OFFENSIVE_DRAW' };
      } else if (newState.offensive_line_change_done) {
        // Now it's defensive player's turn for line change
        newState = { ...newState, phase: 'LINE_CHANGE_DEFENSIVE' };
      }

      set({ gameState: newState, lastAction: `${player} skipped line change` });
    },

    drawOffensiveCard: () => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'OFFENSIVE_DRAW') return;
      const newState = performOffensiveDraw(gameState);
      set({
        gameState: newState,
        lastAction: newState.drawn_card
          ? `Drew: ${newState.drawn_card.card_type}`
          : 'Beaut exhausted!',
      });
    },

    selectDefensiveCard: (cardId) => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'DEFENSIVE_RESPONSE') return;
      const newState = submitDefensiveResponse(gameState, cardId);
      set({ gameState: newState, lastAction: 'Defense card selected' });
    },

    activateTrait: (player, trait) => {
      const { gameState } = get();
      if (!gameState) return;
      const newState = activateForcedTrait(gameState, player, trait);
      set({
        gameState: newState,
        lastAction: trait ? `${player} activated ${trait}` : `${player} skipped trait`,
      });
    },

    confirmResolution: () => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'TRAIT_WINDOW') return;
      
      // Execute resolution only if both offensive and defensive cards are set
      if (!gameState.drawn_card || !gameState.defensive_selected_card) return;
      
      set({ resolutionAnimating: true });
      
      setTimeout(() => {
        const newState = executeResolution(gameState);
        set({
          gameState: newState,
          resolutionAnimating: false,
          showResolutionResult: true,
          lastAction: newState.last_resolution
            ? `Resolution: ${newState.last_resolution.outcome}`
            : 'Resolved',
        });
      }, 1000);
    },

    dismissResolution: () => {
      const { gameState } = get();
      if (!gameState) return;
      
      // Apply catch-up traits if pending
      if (gameState.catch_up_traits_pending) {
        const newState = applyCatchUpTraits(gameState, gameState.catch_up_traits_pending.player_id);
        set({ gameState: newState, showResolutionResult: false });
        return;
      }
      
      set({ showResolutionResult: false });
    },

    applyCatchUp: () => {
      const { gameState } = get();
      if (!gameState?.catch_up_traits_pending) return;
      const newState = applyCatchUpTraits(gameState, gameState.catch_up_traits_pending.player_id);
      set({ gameState: newState });
    },

    setActiveOffensiveBeaut: (beautId) => {
      const { gameState } = get();
      if (!gameState) return;
      const newState = setActiveOffensiveBeaut(gameState, beautId);
      set({ gameState: newState });
    },

    setActiveDefensiveBeaut: (beautId) => {
      const { gameState } = get();
      if (!gameState) return;
      const newState = setActiveDefensiveBeaut(gameState, beautId);
      set({ gameState: newState });
    },

    setBrowsedBeauts: (beauts) => set({ browsedBeauts: beauts }),
    setLoadingBeauts: (loading) => set({ isLoadingBeauts: loading }),
    setRosterBrowsePosition: (pos) => set({ rosterBrowsePosition: pos }),

    switchViewToPlayer: (player) => set({ currentViewingPlayer: player }),

    resetGame: () =>
      set({
        gameState: null,
        rosterSelection: { player1: [], player2: [] },
        currentViewingPlayer: 'player1',
        showResolutionResult: false,
        resolutionAnimating: false,
        lastAction: null,
      }),
  }))
);
