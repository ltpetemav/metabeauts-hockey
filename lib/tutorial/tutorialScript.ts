/**
 * Tutorial Script — All 5 lessons, every dialogue line, spotlight targets.
 * Coach B walks the player through every mechanic.
 */

import { CardType } from '@/types/game';

export type WaitFor = 'click-spotlight' | 'advance' | 'auto';

export interface TutorialStep {
  id: string;
  lesson: number; // 1-5
  stepIndex: number; // within lesson
  dialogue: string; // Coach B's speech
  spotlight?: string; // data-tutorial-id to highlight (or undefined = no spotlight)
  waitFor: WaitFor;
  autoAdvanceMs?: number; // For 'auto' type
  scriptedOffensiveDraw?: CardType; // Override for this step's draw
  scriptedDefensiveCard?: CardType; // What opponent plays
  phase?: string; // Expected game phase for this step
}

// ── LESSON 1 — The Roster ──────────────────────────────────────────────────

const lesson1Steps: TutorialStep[] = [
  {
    id: 'l1-welcome',
    lesson: 1,
    stepIndex: 0,
    dialogue: "Welcome to MetaBeauts: Hockey! I'm Coach B. 🏒 We're gonna learn this game together. First up — building your roster.",
    waitFor: 'advance',
  },
  {
    id: 'l1-roster-overview',
    lesson: 1,
    stepIndex: 1,
    dialogue: "Every team needs exactly 6 Beauts: 2 Wingers, 1 Center, 2 Defenders, and 1 Goaltender. First 3 go on ice, last 3 sit the bench.",
    waitFor: 'advance',
    spotlight: 'tutorial-roster-panel',
  },
  {
    id: 'l1-positions',
    lesson: 1,
    stepIndex: 2,
    dialogue: "Position matters. Wingers shoot. Centers do a bit of everything. Defenders block and skate. Goalies are your last line of defense.",
    spotlight: 'tutorial-position-badges',
    waitFor: 'advance',
  },
  {
    id: 'l1-archetypes',
    lesson: 1,
    stepIndex: 3,
    dialogue: "See that archetype badge on each Beaut? That's their special trait. Snipers score big. Enforcers hit hard. Danglers dodge checks. Each one changes how you play.",
    spotlight: 'tutorial-archetype-badge',
    waitFor: 'advance',
  },
  {
    id: 'l1-tier',
    lesson: 1,
    stepIndex: 4,
    dialogue: "Tiers go from Rookie (1) all the way to Legend (4). Higher tier = more cards in their pile to start. More cards = more plays before they're worn out.",
    spotlight: 'tutorial-tier-badge',
    waitFor: 'advance',
  },
  {
    id: 'l1-ready',
    lesson: 1,
    stepIndex: 5,
    dialogue: "Your tutorial roster is set. Six Beauts, ready to go. Let's hit the ice. 🏒",
    waitFor: 'advance',
  },
];

// ── LESSON 2 — First Possession ───────────────────────────────────────────

const lesson2Steps: TutorialStep[] = [
  {
    id: 'l2-rps-intro',
    lesson: 2,
    stepIndex: 0,
    dialogue: "Rock-Paper-Scissors decides who attacks first. Each player picks in secret, then they reveal. Winner gets the puck.",
    spotlight: 'tutorial-rps-area',
    waitFor: 'advance',
  },
  {
    id: 'l2-rps-pick',
    lesson: 2,
    stepIndex: 1,
    dialogue: "Go ahead — pick Rock, Paper, or Scissors. Don't overthink it, the tutorial always lets you win RPS.",
    spotlight: 'tutorial-rps-area',
    waitFor: 'click-spotlight',
    phase: 'RPS',
  },
  {
    id: 'l2-possession',
    lesson: 2,
    stepIndex: 2,
    dialogue: "You won! You've got the puck. See that green indicator? That's you on offense. The other team is on defense.",
    spotlight: 'tutorial-scoreboard',
    waitFor: 'advance',
  },
  {
    id: 'l2-line-change',
    lesson: 2,
    stepIndex: 3,
    dialogue: "Before every possession, both teams can swap a Beaut from the bench. We're skipping that for now — hit Skip.",
    spotlight: 'tutorial-turn-panel',
    waitFor: 'click-spotlight',
    phase: 'POSSESSION_START',
  },
  {
    id: 'l2-draw-explain',
    lesson: 2,
    stepIndex: 4,
    dialogue: "Now you're on offense — but you don't CHOOSE your card. You DRAW one at random from your active Beaut's pile. That's the key! Defense chooses. Offense draws.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'advance',
  },
  {
    id: 'l2-draw-action',
    lesson: 2,
    stepIndex: 5,
    dialogue: "Tap the Draw button. Let's see what you get.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'click-spotlight',
    phase: 'OFFENSIVE_DRAW',
    scriptedOffensiveDraw: 'Pass',
  },
  {
    id: 'l2-drew-pass',
    lesson: 2,
    stepIndex: 6,
    dialogue: "You drew Pass! That's a move up ice — solid play. Now the defense has to respond. They SEE what you drew (in this tutorial) and CHOOSE their counter card.",
    spotlight: 'tutorial-drawn-card',
    waitFor: 'advance',
  },
  {
    id: 'l2-defense-responds',
    lesson: 2,
    stepIndex: 7,
    dialogue: "Defense is picking Block to stop your Pass. Watch — when Pass meets Block, it's a TIE. Puck stays with you, but nothing moves forward.",
    waitFor: 'auto',
    autoAdvanceMs: 2000,
    scriptedDefensiveCard: 'Block',
  },
  {
    id: 'l2-resolve',
    lesson: 2,
    stepIndex: 8,
    dialogue: "Hit 'Resolve Action' to see what happens!",
    spotlight: 'tutorial-resolve-btn',
    waitFor: 'click-spotlight',
    phase: 'TRAIT_WINDOW',
  },
  {
    id: 'l2-tie-result',
    lesson: 2,
    stepIndex: 9,
    dialogue: "Pass vs Block = Tie. You still have the puck! Now you get to draw again. Each draw costs a card from your Beaut's pile. Empty pile = exhausted Beaut.",
    waitFor: 'advance',
  },
];

// ── LESSON 3 — Scoring a Goal ─────────────────────────────────────────────

const lesson3Steps: TutorialStep[] = [
  {
    id: 'l3-can-shoot-intro',
    lesson: 3,
    stepIndex: 0,
    dialogue: "Here's the big rule: you can't shoot until canShoot is TRUE. You earn it by successfully completing a Pass or Skate first. See that indicator on the scoreboard?",
    spotlight: 'tutorial-can-shoot-indicator',
    waitFor: 'advance',
  },
  {
    id: 'l3-draw-pass',
    lesson: 3,
    stepIndex: 1,
    dialogue: "Draw your card. The scripted tutorial will give you a Pass this time — and it's going to win against their defense.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'click-spotlight',
    phase: 'OFFENSIVE_DRAW',
    scriptedOffensiveDraw: 'Pass',
  },
  {
    id: 'l3-defense-check-loses',
    lesson: 3,
    stepIndex: 2,
    dialogue: "Defense plays Check vs your Pass — but Check only stops Skate! Your Pass goes through untouched. canShoot just flipped ON!",
    waitFor: 'auto',
    autoAdvanceMs: 2000,
    scriptedDefensiveCard: 'Check',
  },
  {
    id: 'l3-resolve-pass',
    lesson: 3,
    stepIndex: 3,
    dialogue: "Resolve it!",
    spotlight: 'tutorial-resolve-btn',
    waitFor: 'click-spotlight',
    phase: 'TRAIT_WINDOW',
  },
  {
    id: 'l3-can-shoot-on',
    lesson: 3,
    stepIndex: 4,
    dialogue: "🎯 canShoot is ON! This means if you draw a Shoot card, it counts! Draw again — the tutorial will give you a Shoot.",
    spotlight: 'tutorial-can-shoot-indicator',
    waitFor: 'advance',
  },
  {
    id: 'l3-draw-shoot',
    lesson: 3,
    stepIndex: 5,
    dialogue: "Draw it. Shoot is loaded.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'click-spotlight',
    phase: 'OFFENSIVE_DRAW',
    scriptedOffensiveDraw: 'Shoot',
  },
  {
    id: 'l3-defense-steal',
    lesson: 3,
    stepIndex: 6,
    dialogue: "Defense plays Steal — bad read! Steal only works against Pass. Your Shoot goes right through it.",
    waitFor: 'auto',
    autoAdvanceMs: 2000,
    scriptedDefensiveCard: 'Steal',
  },
  {
    id: 'l3-resolve-shoot',
    lesson: 3,
    stepIndex: 7,
    dialogue: "Resolve the action!",
    spotlight: 'tutorial-resolve-btn',
    waitFor: 'click-spotlight',
    phase: 'TRAIT_WINDOW',
  },
  {
    id: 'l3-goal',
    lesson: 3,
    stepIndex: 8,
    dialogue: "GOAL! 🚨 That's 1-0. First to 3 wins. That's hockey, baby. Shoot + canShoot = goal. Simple once you know the flow.",
    spotlight: 'tutorial-scoreboard',
    waitFor: 'advance',
  },
];

// ── LESSON 4 — Traits & Line Changes ─────────────────────────────────────

const lesson4Steps: TutorialStep[] = [
  {
    id: 'l4-traits-intro',
    lesson: 4,
    stepIndex: 0,
    dialogue: "Your Beauts have Traits — special abilities that can flip a play. There are 14 of them. Some are Natural (drawn from the pile), some are Forced (held separately and activated manually).",
    waitFor: 'advance',
  },
  {
    id: 'l4-trait-card',
    lesson: 4,
    stepIndex: 1,
    dialogue: "See that purple glow? That's a Forced trait card. You choose WHEN to activate it — before resolution. Timing is everything. Waste it and it's gone.",
    spotlight: 'tutorial-turn-panel',
    waitFor: 'advance',
  },
  {
    id: 'l4-sniper-explain',
    lesson: 4,
    stepIndex: 2,
    dialogue: "The Sniper trait makes your Shoot card UNBLOCKABLE. Even a Block from the goalie can't stop it. Use it when you're about to shoot and you know they're going to block.",
    waitFor: 'advance',
  },
  {
    id: 'l4-trait-window',
    lesson: 4,
    stepIndex: 3,
    dialogue: "The Trait Activation Window opens AFTER defense picks their card but BEFORE resolution. Both players can activate their trait in that window. Then it resolves.",
    spotlight: 'tutorial-turn-panel',
    waitFor: 'advance',
  },
  {
    id: 'l4-line-change-intro',
    lesson: 4,
    stepIndex: 4,
    dialogue: "Line changes. Every 3 turns, you can swap a tired Beaut for a fresh one from the bench. Bench Beauts recover — they get new cards while resting.",
    spotlight: 'tutorial-rink-ice',
    waitFor: 'advance',
  },
  {
    id: 'l4-line-change-how',
    lesson: 4,
    stepIndex: 5,
    dialogue: "To line change: pick who goes to bench, pick who comes up from bench, then pick 1 bonus card the incoming Beaut brings. That bonus card is your choice — defense or offense. Be strategic.",
    spotlight: 'tutorial-turn-panel',
    waitFor: 'advance',
  },
  {
    id: 'l4-exhaustion',
    lesson: 4,
    stepIndex: 6,
    dialogue: "If a Beaut runs out of cards, they're exhausted. No more draws from them. If the whole on-ice crew is exhausted, the puck flips to the opponent. Don't let your stars run dry.",
    spotlight: 'tutorial-rink-ice',
    waitFor: 'advance',
  },
  {
    id: 'l4-preseason',
    lesson: 4,
    stepIndex: 7,
    dialogue: "One more thing: Pre-Season mode turns OFF all traits. Great for learning the base card matchups without trait complexity. Regular Season has the full suite.",
    waitFor: 'advance',
  },
];

// ── LESSON 5 — Catch-Up & Strategy ───────────────────────────────────────

const lesson5Steps: TutorialStep[] = [
  {
    id: 'l5-catchup-intro',
    lesson: 5,
    stepIndex: 0,
    dialogue: "Down by 2 goals? The game gives you 2 extra trait cards as a catch-up mechanic. It keeps games competitive right until the final whistle.",
    spotlight: 'tutorial-scoreboard',
    waitFor: 'advance',
  },
  {
    id: 'l5-read-opponent',
    lesson: 5,
    stepIndex: 1,
    dialogue: "Watch your opponent's card piles. If their Goalie is almost empty, attack! If their Defender has a stack of Blocks, be patient and wait for a Skate to open a lane.",
    spotlight: 'tutorial-rink-ice',
    waitFor: 'advance',
  },
  {
    id: 'l5-asymmetry',
    lesson: 5,
    stepIndex: 2,
    dialogue: "The core asymmetry is everything: offense draws randomly, defense chooses deliberately. The entire game is about the defensive player outsmarting the draw — and the offensive player managing card piles to keep good cards in rotation.",
    waitFor: 'advance',
  },
  {
    id: 'l5-ready',
    lesson: 5,
    stepIndex: 3,
    dialogue: "You've got the full playbook. 🏒 Draft your real roster, run the RPS, read the matchups, rotate your lines. You're ready for the real game. Let's go.",
    waitFor: 'advance',
  },
];

// ── Combined Script ────────────────────────────────────────────────────────

export const TUTORIAL_STEPS: TutorialStep[] = [
  ...lesson1Steps,
  ...lesson2Steps,
  ...lesson3Steps,
  ...lesson4Steps,
  ...lesson5Steps,
];

export const LESSON_NAMES: Record<number, string> = {
  1: 'The Roster',
  2: 'First Possession',
  3: 'Scoring a Goal',
  4: 'Traits & Line Changes',
  5: 'Catch-Up & Strategy',
};

export const LESSON_EMOJIS: Record<number, string> = {
  1: '📋',
  2: '🏒',
  3: '🎯',
  4: '✨',
  5: '🧠',
};

export function getStepsForLesson(lesson: number): TutorialStep[] {
  return TUTORIAL_STEPS.filter(s => s.lesson === lesson);
}

export function getTotalSteps(): number {
  return TUTORIAL_STEPS.length;
}

export function getStepByIndex(index: number): TutorialStep | null {
  return TUTORIAL_STEPS[index] || null;
}

export function getLessonStartIndex(lesson: number): number {
  return TUTORIAL_STEPS.findIndex(s => s.lesson === lesson);
}
