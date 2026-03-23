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
  executeResolution,
  applyCatchUpTraits,
  setActiveOffensiveBeaut,
  setActiveDefensiveBeaut,
  resolveHybridChoice,
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
  currentViewingPlayer: 'player1' | 'player2';
  pendingHandoff: 'player1' | 'player2' | null;
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
  submitHybridChoice: (chosenType: CardType) => void;
  confirmResolution: () => void;
  dismissResolution: () => void;
  applyCatchUp: () => void;

  setActiveOffensiveBeaut: (beautId: string) => void;
  setActiveDefensiveBeaut: (beautId: string) => void;

  setBrowsedBeauts: (beauts: BeautMetadata[]) => void;
  setLoadingBeauts: (loading: boolean) => void;
  setRosterBrowsePosition: (pos: Position | null) => void;

  switchViewToPlayer: (player: 'player1' | 'player2') => void;
  confirmHandoff: () => void;

  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    rosterSelection: { player1: [], player2: [] },
    selectedGameMode: 'RegularSeason',
    gameState: null,
    currentViewingPlayer: 'player1',
    pendingHandoff: null,
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

      if (current.length >= 6) return;
      if (current.find((b) => b.token_id === beaut.token_id)) return;

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
      if ((positionCounts[beaut.position] || 0) >= positionLimits[beaut.position]) return;

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
        lastAction: 'Game started!',
      });
    },

    submitRPSChoice: (player, choice) => {
      const { gameState } = get();
      if (!gameState) return;
      const newState = submitRPS(gameState, player, choice);

      const pendingHandoff: 'player1' | 'player2' | null =
        player === 'player1' ? 'player2' : null;

      set({ gameState: newState, lastAction: `${player} chose ${choice}`, pendingHandoff });
    },

    doLineChange: (player, swaps) => {
      const { gameState } = get();
      if (!gameState) return;
      let newState = performLineChange(gameState, player, swaps);
      const offensivePlayer = gameState.possession;
      const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';

      let pendingHandoff: 'player1' | 'player2' | null = null;

      if (player === offensivePlayer) {
        newState = { ...newState, offensive_line_change_done: true };
        pendingHandoff = defensivePlayer;
      } else {
        newState = { ...newState, defensive_line_change_done: true };
        pendingHandoff = offensivePlayer;
      }

      set({ gameState: newState, lastAction: `${player} made a line change`, pendingHandoff });
    },

    skipLineChange: (player) => {
      const { gameState } = get();
      if (!gameState) return;
      const offensivePlayer = gameState.possession;
      const defensivePlayer = offensivePlayer === 'player1' ? 'player2' : 'player1';

      let newState = { ...gameState };
      let pendingHandoff: 'player1' | 'player2' | null = null;

      if (player === offensivePlayer) {
        newState = { ...newState, offensive_line_change_done: true };
      } else {
        newState = { ...newState, defensive_line_change_done: true };
      }

      if (newState.offensive_line_change_done && newState.defensive_line_change_done) {
        newState = { ...newState, phase: 'OFFENSIVE_DRAW' };
        pendingHandoff = offensivePlayer;
      } else if (newState.offensive_line_change_done) {
        newState = { ...newState, phase: 'LINE_CHANGE_DEFENSIVE' };
        pendingHandoff = defensivePlayer;
      }

      set({ gameState: newState, lastAction: `${player} skipped line change`, pendingHandoff });
    },

    drawOffensiveCard: () => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'OFFENSIVE_DRAW') return;
      const newState = performOffensiveDraw(gameState);

      const defensivePlayer =
        gameState.possession === 'player1' ? 'player2' : 'player1';

      // Determine handoff based on new phase
      let pendingHandoff: 'player1' | 'player2' | null = null;
      if (newState.phase === 'DEFENSIVE_RESPONSE') {
        pendingHandoff = defensivePlayer;
      } else if (newState.phase === 'HYBRID_CHOICE') {
        // Hybrid: offense needs to choose — stay with current player
        pendingHandoff = null;
      }

      set({
        gameState: newState,
        lastAction: newState.drawn_card
          ? `Drew: ${newState.drawn_card.card_type}${newState.drawn_card.is_trait ? ` (${newState.drawn_card.trait_name})` : ''}`
          : 'Beaut exhausted!',
        pendingHandoff,
      });
    },

    selectDefensiveCard: (cardId) => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'DEFENSIVE_RESPONSE') return;
      const newState = submitDefensiveResponse(gameState, cardId);

      // If still in DEFENSIVE_RESPONSE (Butterfly re-pick), no handoff needed
      if (newState.phase === 'DEFENSIVE_RESPONSE') {
        set({ gameState: newState, lastAction: 'Butterfly — pick again!' });
        return;
      }

      // If HYBRID_CHOICE for defense, stay with defensive player
      if (newState.phase === 'HYBRID_CHOICE') {
        set({ gameState: newState, lastAction: 'Hybrid — choose your action!' });
        return;
      }

      // SIMULTANEOUS_REVEAL — no handoff, both can see
      set({ gameState: newState, lastAction: 'Defense card selected — reveal!' });
    },

    submitHybridChoice: (chosenType) => {
      const { gameState } = get();
      if (!gameState || gameState.phase !== 'HYBRID_CHOICE' || !gameState.hybrid_choice_pending) return;

      const newState = resolveHybridChoice(gameState, chosenType);

      const defensivePlayer =
        gameState.possession === 'player1' ? 'player2' : 'player1';

      let pendingHandoff: 'player1' | 'player2' | null = null;
      if (newState.phase === 'DEFENSIVE_RESPONSE') {
        pendingHandoff = defensivePlayer;
      }

      set({
        gameState: newState,
        lastAction: `Hybrid: chose ${chosenType}`,
        pendingHandoff,
      });
    },

    confirmResolution: () => {
      const { gameState } = get();
      if (!gameState) return;
      if (gameState.phase !== 'SIMULTANEOUS_REVEAL') return;
      if (!gameState.drawn_card || !gameState.defensive_selected_card) return;

      set({ resolutionAnimating: true });

      setTimeout(() => {
        const currentState = get().gameState;
        if (!currentState) return;
        const newState = executeResolution(currentState);
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

      if (gameState.catch_up_traits_pending) {
        const newState = applyCatchUpTraits(gameState, gameState.catch_up_traits_pending.player_id);
        set({ gameState: newState, showResolutionResult: false });
        return;
      }

      const nextPhase = gameState.phase;
      let pendingHandoff: 'player1' | 'player2' | null = null;
      if (nextPhase === 'POSSESSION_START' || nextPhase === 'RPS') {
        pendingHandoff = gameState.possession;
      } else if (nextPhase === 'OFFENSIVE_DRAW') {
        pendingHandoff = gameState.possession;
      } else if (nextPhase === 'FORCED_LINE_CHANGE' && gameState.forced_line_change_pending) {
        pendingHandoff = gameState.forced_line_change_pending;
      }

      set({ showResolutionResult: false, pendingHandoff });
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

    switchViewToPlayer: (player) => set({ currentViewingPlayer: player, pendingHandoff: null }),

    confirmHandoff: () => {
      const { pendingHandoff } = get();
      if (!pendingHandoff) return;
      set({ currentViewingPlayer: pendingHandoff, pendingHandoff: null });
    },

    resetGame: () =>
      set({
        gameState: null,
        rosterSelection: { player1: [], player2: [] },
        currentViewingPlayer: 'player1',
        pendingHandoff: null,
        showResolutionResult: false,
        resolutionAnimating: false,
        lastAction: null,
      }),
  }))
);
