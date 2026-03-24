/**
 * Tutorial Store — separate Zustand store for tutorial state.
 * Does NOT modify gameStore.ts.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameState, CardType, TraitName, RPSChoice } from '@/types/game';
import {
  createTutorialGameState,
  performScriptedOffensiveDraw,
  performScriptedDefensiveResponse,
  performScriptedRPS,
  performScriptedSkipBothLineChanges,
} from '@/lib/tutorial/tutorialEngine';
import {
  TUTORIAL_STEPS,
  TutorialStep,
  getLessonStartIndex,
} from '@/lib/tutorial/tutorialScript';
import {
  submitRPS,
  executeResolution,
  performOffensiveDraw,
  submitDefensiveResponse,
  setActiveOffensiveBeaut,
  setActiveDefensiveBeaut,
  applyCatchUpTraits,
} from '@/lib/engine/gameEngine';
import { availableCards } from '@/lib/engine/cards';

export type TutorialPhase =
  | 'LESSON_SELECT'   // Choose which lesson
  | 'PLAYING'         // In tutorial
  | 'COMPLETE';       // All done

interface TutorialStore {
  // Meta
  tutorialPhase: TutorialPhase;
  currentStepIndex: number;
  currentLesson: number;

  // Game state (tutorial-specific, wraps real engine)
  gameState: GameState | null;

  // UI state
  showResolutionResult: boolean;
  resolutionAnimating: boolean;
  currentViewingPlayer: 'player1' | 'player2';

  // Scripted overrides active?
  scriptedDrawPending: CardType | null;
  scriptedDefensePending: CardType | null;
  awaitingAutoDefense: boolean; // Waiting to auto-play defense after overlay advance

  // Actions
  startLesson: (lesson: number) => void;
  advanceStep: () => void;
  handleSpotlightClick: () => void; // Player clicked the spotlighted element
  resetTutorial: () => void;
  completeTutorial: () => void;

  // Game actions (mirrored from gameStore, but tutorial-aware)
  submitRPSChoice: (choice: RPSChoice) => void;
  skipLineChange: () => void;
  drawCard: () => void;
  selectDefensiveCard: (cardId: string) => void;
  confirmResolution: () => void;
  dismissResolution: () => void;

  // Internal
  _applyStep: (step: TutorialStep) => void;
}

export const useTutorialStore = create<TutorialStore>()(
  subscribeWithSelector((set, get) => ({
    tutorialPhase: 'LESSON_SELECT',
    currentStepIndex: 0,
    currentLesson: 1,
    gameState: null,
    showResolutionResult: false,
    resolutionAnimating: false,
    currentViewingPlayer: 'player1',
    scriptedDrawPending: null,
    scriptedDefensePending: null,
    awaitingAutoDefense: false,

    startLesson: (lesson) => {
      const stepIndex = getLessonStartIndex(lesson);
      const gameState = createTutorialGameState();

      // For lessons that need the game past RPS (3, 4, 5),
      // auto-advance. Lessons 1 and 2 start from the beginning
      // so the player can experience RPS.
      let readyState = gameState;
      if (lesson >= 3) {
        readyState = performScriptedRPS(gameState);
        readyState = performScriptedSkipBothLineChanges(readyState);
      }

      set({
        tutorialPhase: 'PLAYING',
        currentLesson: lesson,
        currentStepIndex: stepIndex,
        gameState: readyState,
        showResolutionResult: false,
        resolutionAnimating: false,
        currentViewingPlayer: 'player1',
        scriptedDrawPending: null,
        scriptedDefensePending: null,
        awaitingAutoDefense: false,
      });

      // Apply the first step
      const step = TUTORIAL_STEPS[stepIndex];
      if (step) get()._applyStep(step);
    },

    advanceStep: () => {
      const { currentStepIndex, gameState } = get();
      const nextIndex = currentStepIndex + 1;

      if (nextIndex >= TUTORIAL_STEPS.length) {
        set({ tutorialPhase: 'COMPLETE' });
        return;
      }

      const nextStep = TUTORIAL_STEPS[nextIndex];

      // If we're transitioning to a new lesson, reset game for that lesson context
      const currentStep = TUTORIAL_STEPS[currentStepIndex];
      let newGameState = gameState;

      if (nextStep.lesson !== currentStep?.lesson) {
        // New lesson — create fresh game state appropriately
        const freshState = createTutorialGameState();
        if (nextStep.lesson >= 3) {
          // Lessons 3+ start past RPS and line changes
          newGameState = performScriptedSkipBothLineChanges(performScriptedRPS(freshState));
        } else {
          // Lessons 1-2 start fresh (lesson 2 needs RPS to still be showing)
          newGameState = freshState;
        }
      }

      // Auto-resolve if game is in SIMULTANEOUS_REVEAL with both cards ready
      // This prevents the tutorial from getting stuck when steps don't require
      // explicit "Resolve Action" clicks
      if (newGameState && newGameState.phase === 'SIMULTANEOUS_REVEAL' &&
          newGameState.drawn_card && newGameState.defensive_selected_card) {
        const resolved = executeResolution(newGameState);
        let finalState = resolved;
        if (finalState.catch_up_traits_pending) {
          finalState = applyCatchUpTraits(finalState, finalState.catch_up_traits_pending.player_id);
        }
        // Preserve can_shoot for tutorial
        const drawnType = newGameState.drawn_card?.card_type;
        if ((drawnType === 'Pass' || drawnType === 'Skate') &&
            resolved.last_resolution?.outcome !== 'DEFENSE_WINS') {
          finalState = { ...finalState, can_shoot: true };
        }
        // Skip line changes for tutorial
        if (finalState.phase === 'POSSESSION_START') {
          finalState = performScriptedSkipBothLineChanges(finalState);
        }
        newGameState = finalState;
      }

      set({
        currentStepIndex: nextIndex,
        currentLesson: nextStep.lesson,
        gameState: newGameState,
        scriptedDrawPending: nextStep.scriptedOffensiveDraw || null,
        scriptedDefensePending: nextStep.scriptedDefensiveCard || null,
        awaitingAutoDefense: false,
        showResolutionResult: false,
      });

      get()._applyStep(nextStep);
    },

    handleSpotlightClick: () => {
      const { currentStepIndex } = get();
      const step = TUTORIAL_STEPS[currentStepIndex];
      if (!step || step.waitFor !== 'click-spotlight') return;

      // Delegate to the gated action handlers — they check the current step
      if (step.phase === 'RPS') {
        get().submitRPSChoice('rock');
        return;
      }
      if (step.phase === 'POSSESSION_START') {
        get().skipLineChange();
        return;
      }
      if (step.phase === 'OFFENSIVE_DRAW') {
        get().drawCard();
        return;
      }
      if (step.phase === 'SIMULTANEOUS_REVEAL') {
        get().confirmResolution();
        return;
      }

      // Default: advance
      get().advanceStep();
    },

    submitRPSChoice: (choice) => {
      const { gameState, currentStepIndex } = get();
      if (!gameState) return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only allow RPS when the current step expects it
      if (!step || step.phase !== 'RPS' || step.waitFor !== 'click-spotlight') return;
      const newState = performScriptedRPS(gameState);
      set({ gameState: newState });
      get().advanceStep();
    },

    skipLineChange: () => {
      const { gameState, currentStepIndex } = get();
      if (!gameState) return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only allow line change skip when the current step expects it
      if (!step || step.phase !== 'POSSESSION_START' || step.waitFor !== 'click-spotlight') return;
      const newState = performScriptedSkipBothLineChanges(gameState);
      set({ gameState: newState });
      get().advanceStep();
    },

    drawCard: () => {
      const { gameState, scriptedDrawPending, scriptedDefensePending, currentStepIndex } = get();
      if (!gameState || gameState.phase !== 'OFFENSIVE_DRAW') return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only allow draw when the current step expects it
      if (!step || step.phase !== 'OFFENSIVE_DRAW' || step.waitFor !== 'click-spotlight') return;

      let newState: GameState;
      if (scriptedDrawPending) {
        newState = performScriptedOffensiveDraw(gameState, scriptedDrawPending);
      } else {
        newState = performOffensiveDraw(gameState);
      }

      // Auto-play defense if scripted
      if (scriptedDefensePending && newState.phase === 'DEFENSIVE_RESPONSE') {
        newState = performScriptedDefensiveResponse(newState, scriptedDefensePending);
      }

      set({
        gameState: newState,
        scriptedDrawPending: null,
      });
      get().advanceStep();
    },

    selectDefensiveCard: (cardId) => {
      const { gameState, currentStepIndex } = get();
      if (!gameState || gameState.phase !== 'DEFENSIVE_RESPONSE') return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only allow defense selection when step expects it
      if (!step || step.phase !== 'DEFENSIVE_RESPONSE') return;
      const newState = submitDefensiveResponse(gameState, cardId);
      set({ gameState: newState });
    },

    confirmResolution: () => {
      const { gameState, currentStepIndex } = get();
      if (!gameState || (gameState.phase !== 'SIMULTANEOUS_REVEAL' && gameState.phase !== 'DEFENSIVE_RESPONSE')) return;
      if (!gameState.drawn_card || !gameState.defensive_selected_card) return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      if (!step || step.phase !== 'SIMULTANEOUS_REVEAL' || step.waitFor !== 'click-spotlight') return;

      set({ resolutionAnimating: true });

      setTimeout(() => {
        // Re-read latest state for resolution (avoids stale closure issues)
        const latestState = get().gameState;
        const stateToResolve = latestState || gameState;
        const resolved = executeResolution(stateToResolve);

        // Apply catch-up if needed
        let finalState = resolved;
        if (finalState.catch_up_traits_pending) {
          finalState = applyCatchUpTraits(finalState, finalState.catch_up_traits_pending.player_id);
        }

        // Force can_shoot based on resolution outcome:
        // If offense drew Pass/Skate and won, can_shoot MUST be true
        const drawnType = stateToResolve.drawn_card?.card_type;
        if ((drawnType === 'Pass' || drawnType === 'Skate') && 
            resolved.last_resolution?.outcome !== 'DEFENSE_WINS') {
          finalState = { ...finalState, can_shoot: true };
        }

        console.log('[Tutorial] Resolution:', drawnType, 'vs', stateToResolve.defensive_selected_card?.card_type, '→ can_shoot:', finalState.can_shoot, 'outcome:', resolved.last_resolution?.outcome);

        set({
          gameState: finalState,
          resolutionAnimating: false,
          showResolutionResult: true,
        });
        // Don't advance here — let dismissResolution advance the step
        // so the player can see the result before moving on
      }, 800);
    },

    dismissResolution: () => {
      const { gameState } = get();
      if (!gameState) return;

      // Always allow dismissing the resolution modal — it blocks the tutorial otherwise
      let newState = { ...gameState };
      console.log('[Tutorial] Dismiss resolution — phase:', newState.phase, 'can_shoot:', newState.can_shoot);
      if (newState.phase === 'POSSESSION_START') {
        // Skip line changes for tutorial
        newState = performScriptedSkipBothLineChanges(newState);
      }
      console.log('[Tutorial] After line change skip — phase:', newState.phase, 'can_shoot:', newState.can_shoot);

      set({
        gameState: newState,
        showResolutionResult: false,
      });

      // Advance the tutorial step after the player sees the result
      get().advanceStep();
    },

    resetTutorial: () => {
      set({
        tutorialPhase: 'LESSON_SELECT',
        currentStepIndex: 0,
        currentLesson: 1,
        gameState: null,
        showResolutionResult: false,
        resolutionAnimating: false,
        scriptedDrawPending: null,
        scriptedDefensePending: null,
        awaitingAutoDefense: false,
      });
    },

    completeTutorial: () => {
      set({ tutorialPhase: 'COMPLETE' });
    },

    _applyStep: (step) => {
      // Pre-set scripted cards for this step
      set({
        scriptedDrawPending: step.scriptedOffensiveDraw || null,
        scriptedDefensePending: step.scriptedDefensiveCard || null,
      });

      // In the new system, there's no TRAIT_WINDOW — traits auto-activate when drawn.
      // SIMULTANEOUS_REVEAL is the phase where both cards are shown and resolve is clicked.
      // No special trait spending needed.

      // Auto-advance steps
      if (step.waitFor === 'auto' && step.autoAdvanceMs) {
        setTimeout(() => {
          // Auto-apply defense if needed
          const { gameState, scriptedDefensePending } = get();
          if (gameState && scriptedDefensePending && gameState.phase === 'DEFENSIVE_RESPONSE') {
            const newState = performScriptedDefensiveResponse(gameState, scriptedDefensePending);
            set({ gameState: newState, scriptedDefensePending: null });
          }
          get().advanceStep();
        }, step.autoAdvanceMs);
      }
    },
  }))
);
