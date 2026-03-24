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
    dialogue: "Position matters. Wingers are your scoring threat — they carry Shoot and Pass cards. Centers are flexible with a mix of offense and defense. Defenders carry Skate plus defensive cards like Block, Check, and Steal. Goalies only have Block and Catch — pure shot-stopping.",
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
    dialogue: "Tiers go from Rookie (1) to Legend (4). Higher tiers mean rarer, more powerful Beauts. In the NFT version, tier affects what you can wager and trade. All Beauts start with the same card count — 3 on ice, 2 on bench.",
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
    dialogue: "You won! You've got the puck. See the 🏒 indicator? That means you're on offense. The other team is on defense.",
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
    dialogue: "Now you're on offense — but you don't CHOOSE your card. You DRAW one at random from your active Beaut's pile. And here's the twist: defense picks their counter BLIND. They know WHICH Beaut you're using, but NOT what card you drew.",
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
    scriptedOffensiveDraw: 'Skate',
    scriptedDefensiveCard: 'Steal',
  },
  {
    id: 'l2-drew-skate',
    lesson: 2,
    stepIndex: 6,
    dialogue: "You drew Skate! That's a rush up ice — you keep the puck and push forward. Now the defense picks their counter card BLIND. They can see which Beaut is attacking, but NOT what card you drew. They have to guess.",
    spotlight: 'tutorial-drawn-card',
    waitFor: 'advance',
  },
  {
    id: 'l2-defense-responds',
    lesson: 2,
    stepIndex: 7,
    dialogue: "Defense guessed wrong and played Steal... but Steal only stops Pass! Your Skate blows right past it. That's the blind read in action. Let's see the result!",
    waitFor: 'advance',
  },
  {
    id: 'l2-result',
    lesson: 2,
    stepIndex: 8,
    dialogue: "Offense wins! Skate beats Steal. You still have the puck AND canShoot just turned ON. Every successful Pass or Skate unlocks your ability to shoot next turn.",
    waitFor: 'advance',
  },
];

// ── LESSON 3 — Scoring a Goal ─────────────────────────────────────────────

const lesson3Steps: TutorialStep[] = [
  {
    id: 'l3-can-shoot-recap',
    lesson: 3,
    stepIndex: 0,
    dialogue: "canShoot is the key to scoring. You can't shoot until it's TRUE — earn it with a successful Pass or Skate. Let's score a goal in two plays.",
    spotlight: 'tutorial-can-shoot-indicator',
    waitFor: 'advance',
  },
  {
    id: 'l3-draw-pass',
    lesson: 3,
    stepIndex: 1,
    dialogue: "Draw your card — the tutorial gives you a Pass. Let's activate canShoot.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'click-spotlight',
    phase: 'OFFENSIVE_DRAW',
    scriptedOffensiveDraw: 'Pass',
    scriptedDefensiveCard: 'Check',
  },
  {
    id: 'l3-resolve-pass',
    lesson: 3,
    stepIndex: 2,
    dialogue: "Defense picked Check blind — but Check only stops Skate! Your Pass goes right through. Let's see the result!",
    waitFor: 'advance',
  },
  {
    id: 'l3-can-shoot-on',
    lesson: 3,
    stepIndex: 3,
    dialogue: "🎯 canShoot is ON! Now if you draw Shoot, it counts. Let's go for the goal.",
    spotlight: 'tutorial-can-shoot-indicator',
    waitFor: 'advance',
  },
  {
    id: 'l3-draw-shoot',
    lesson: 3,
    stepIndex: 4,
    dialogue: "Draw it. Shoot is loaded.",
    spotlight: 'tutorial-draw-btn',
    waitFor: 'click-spotlight',
    phase: 'OFFENSIVE_DRAW',
    scriptedOffensiveDraw: 'Shoot',
    scriptedDefensiveCard: 'Steal',
  },
  {
    id: 'l3-resolve-shoot',
    lesson: 3,
    stepIndex: 5,
    dialogue: "Defense guessed Steal — bad read! Steal only stops Pass. Your Shoot goes right through!",
    waitFor: 'advance',
  },
  {
    id: 'l3-goal',
    lesson: 3,
    stepIndex: 6,
    dialogue: "GOAL! 🚨 That's 1-0. First to 3 wins. Shoot + canShoot = goal. Pass/Skate → Shoot. That's the scoring flow.",
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
    dialogue: "The Sniper trait makes your Shoot card UNBLOCKABLE — Block can't stop it. But Catch still works! And if defense plays Steal or Check before you shoot, those still prevent the shot entirely. Sniper beats Block, nothing else.",
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
    dialogue: "Line changes. At the start of every possession, both teams can swap Beauts between ice and bench. When a Beaut goes to bench, they lose ALL their cards. When they come back to ice later, they get 2 fresh cards plus 1 bonus card of your choice.",
    spotlight: 'tutorial-rink-ice',
    waitFor: 'advance',
  },
  {
    id: 'l4-line-change-how',
    lesson: 4,
    stepIndex: 5,
    dialogue: "To line change: pick who goes to bench, pick who comes up from bench. You can swap multiple Beauts at once — just keep 3 on ice and 3 on bench. Each incoming Beaut picks 1 bonus card — offense or defense, your choice.",
    spotlight: 'tutorial-turn-panel',
    waitFor: 'advance',
  },
  {
    id: 'l4-exhaustion',
    lesson: 4,
    stepIndex: 6,
    dialogue: "If a Beaut runs out of cards, they're exhausted. No more draws from them — if they're on offense, possession flips. If they're on defense, the offense auto-succeeds. Bench them at the next line change to refresh with 2 new cards.",
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
    dialogue: "Every time your opponent scores, YOU get 2 bonus Trait Cards to distribute to your Beauts. Down 1-0? You get 2 extra traits. Down 2-0? That's 4 total bonus traits. It keeps games competitive right until the end.",
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
    dialogue: "The core asymmetry is everything: offense draws randomly, defense picks BLIND. Defense knows which Beaut is attacking and can count remaining cards — but never sees the actual draw. The game is about reading your opponent's pile and making educated guesses.",
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
