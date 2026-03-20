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

      set({
        currentStepIndex: nextIndex,
        currentLesson: nextStep.lesson,
        gameState: newGameState,
        scriptedDrawPending: nextStep.scriptedOffensiveDraw || null,
        scriptedDefensePending: nextStep.scriptedDefensiveCard || null,
        awaitingAutoDefense: false,
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
      if (step.phase === 'TRAIT_WINDOW') {
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
      if (!gameState || gameState.phase !== 'TRAIT_WINDOW') return;
      if (!gameState.drawn_card || !gameState.defensive_selected_card) return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only allow resolve when the current step expects it
      if (!step || step.phase !== 'TRAIT_WINDOW' || step.waitFor !== 'click-spotlight') return;

      set({ resolutionAnimating: true });

      setTimeout(() => {
        const resolved = executeResolution(gameState);

        // Apply catch-up if needed
        let finalState = resolved;
        if (finalState.catch_up_traits_pending) {
          finalState = applyCatchUpTraits(finalState, finalState.catch_up_traits_pending.player_id);
        }

        set({
          gameState: finalState,
          resolutionAnimating: false,
          showResolutionResult: true,
        });
        get().advanceStep();
      }, 800);
    },

    dismissResolution: () => {
      const { gameState, currentStepIndex } = get();
      if (!gameState) return;
      const step = TUTORIAL_STEPS[currentStepIndex];
      // Only dismiss when step expects it (advance type on resolution result)
      // Allow dismissal if the step spotlights the resolution or is an advance step
      if (step && step.waitFor === 'click-spotlight' && step.phase !== undefined) return;

      // After resolution dismiss, reset to next draw state
      let newState = { ...gameState };
      if (newState.phase === 'POSSESSION_START') {
        // Skip line changes for tutorial
        newState = performScriptedSkipBothLineChanges(newState);
      }

      set({
        gameState: newState,
        showResolutionResult: false,
      });
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

      // If this step expects the resolve button (TRAIT_WINDOW phase),
      // auto-skip trait activations so the "Resolve Action!" button appears.
      // Exception: lesson 4 teaches traits, so don't auto-skip there.
      if (step.phase === 'TRAIT_WINDOW' && step.lesson !== 4) {
        const { gameState } = get();
        if (gameState && gameState.phase === 'TRAIT_WINDOW') {
          // Mark all beauts' trait cards as spent so TurnPanel's hasForcedTrait = false
          // This makes it skip the "Activate / Skip" UI and show "Resolve Action!" directly
          const spendTraits = (beauts: any[]) => beauts.map((b: any) => ({
            ...b,
            trait_card: b.trait_card ? { ...b.trait_card, is_spent: true } : null,
          }));
          set({
            gameState: {
              ...gameState,
              player1: { ...gameState.player1, beauts: spendTraits(gameState.player1.beauts) },
              player2: { ...gameState.player2, beauts: spendTraits(gameState.player2.beauts) },
            },
          });
        }
      }

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
