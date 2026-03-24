'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TUTORIAL_STEPS, LESSON_NAMES, LESSON_EMOJIS, getStepsForLesson } from '@/lib/tutorial/tutorialScript';
import { useTutorialStore } from '@/store/tutorialStore';

// ── Typing animation hook ──────────────────────────────────────────────────

function useTypingText(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

// ── Spotlight rect tracker ─────────────────────────────────────────────────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useSpotlightRect(spotlightId: string | undefined): SpotlightRect | null {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!spotlightId) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(`[data-tutorial-id="${spotlightId}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // Use raw viewport coords — overlay uses fixed positioning
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    const el = document.querySelector(`[data-tutorial-id="${spotlightId}"]`);
    if (el) observer.observe(el);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [spotlightId]);

  return rect;
}

// ── Progress Dots ─────────────────────────────────────────────────────────

function ProgressDots({ lesson }: { lesson: number }) {
  const lessons = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1.5">
      {lessons.map(l => (
        <div
          key={l}
          className={`transition-all duration-300 rounded-full ${
            l < lesson
              ? 'w-2.5 h-2.5 bg-green-400'
              : l === lesson
              ? 'w-3 h-3 bg-blue-400 ring-2 ring-blue-300/40'
              : 'w-2 h-2 bg-gray-600'
          }`}
          title={LESSON_NAMES[l]}
        />
      ))}
    </div>
  );
}

// ── Coach Widget ───────────────────────────────────────────────────────────

interface CoachWidgetProps {
  dialogue: string;
  lesson: number;
  stepIndex: number;
  totalStepsInLesson: number;
  waitFor: 'click-spotlight' | 'advance' | 'auto';
  onAdvance: () => void;
  onSkipLesson: () => void;
}

function CoachWidget({
  dialogue,
  lesson,
  stepIndex,
  totalStepsInLesson,
  waitFor,
  onAdvance,
  onSkipLesson,
}: CoachWidgetProps) {
  const { displayed, done } = useTypingText(dialogue);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    setTypingDone(false);
  }, [dialogue]);

  useEffect(() => {
    if (done) setTypingDone(true);
  }, [done]);

  const canAdvance = waitFor === 'advance' && typingDone;
  const isAutoStep = waitFor === 'auto';
  const isClickStep = waitFor === 'click-spotlight';

  return (
    <motion.div
      key={dialogue}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      <div className="bg-gray-900 border border-blue-500 rounded-2xl shadow-2xl shadow-blue-900/40 overflow-hidden max-w-lg mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏒</span>
            <div>
              <div className="text-white font-bold text-sm leading-none">Coach B</div>
              <div className="text-blue-400 text-xs leading-none mt-0.5">
                {LESSON_EMOJIS[lesson]} Lesson {lesson}: {LESSON_NAMES[lesson]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ProgressDots lesson={lesson} />
            <button
              onClick={onSkipLesson}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Skip to lesson select"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dialogue */}
        <div className="px-4 py-3">
          <div className="min-h-[3rem] text-white text-sm leading-relaxed">
            {displayed}
            {!typingDone && (
              <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse" />
            )}
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: totalStepsInLesson }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  i < stepIndex ? 'bg-green-500' : i === stepIndex ? 'bg-blue-400' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-4 pb-3">
          {canAdvance && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onAdvance}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 min-h-[48px]"
            >
              Got it →
            </motion.button>
          )}
          {isClickStep && typingDone && (
            <div className="text-center text-blue-300 text-xs animate-pulse py-1">
              👆 Tap the highlighted area to continue
            </div>
          )}
          {isAutoStep && (
            <div className="text-center text-gray-500 text-xs py-1">
              ⏳ Watch the action unfold...
            </div>
          )}
          {!typingDone && (
            <button
              onClick={() => {
                setTypingDone(true);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-400 py-1 text-center"
            >
              Skip text
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Spotlight Overlay ──────────────────────────────────────────────────────

interface SpotlightOverlayProps {
  spotlightId: string | undefined;
  onSpotlightClick: () => void;
  waitFor: 'click-spotlight' | 'advance' | 'auto';
}

function SpotlightOverlay({ spotlightId, onSpotlightClick, waitFor }: SpotlightOverlayProps) {
  const rect = useSpotlightRect(spotlightId);
  const PADDING = 8;

  if (!spotlightId || !rect) {
    // Full dim, no spotlight
    return (
      <div
        className="fixed inset-0 z-40 bg-black/60 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  const top = rect.top - PADDING;
  const left = rect.left - PADDING;
  const width = rect.width + PADDING * 2;
  const height = rect.height + PADDING * 2;

  return (
    <>
      {/* Top overlay */}
      <div
        className="fixed z-40 bg-black/60 pointer-events-auto"
        style={{ top: 0, left: 0, right: 0, height: `${top}px` }}
      />
      {/* Left overlay */}
      <div
        className="fixed z-40 bg-black/60 pointer-events-auto"
        style={{
          top: `${top}px`,
          left: 0,
          width: `${left}px`,
          height: `${height}px`,
        }}
      />
      {/* Right overlay */}
      <div
        className="fixed z-40 bg-black/60 pointer-events-auto"
        style={{
          top: `${top}px`,
          left: `${left + width}px`,
          right: 0,
          height: `${height}px`,
        }}
      />
      {/* Bottom overlay */}
      <div
        className="fixed z-40 bg-black/60 pointer-events-auto"
        style={{
          top: `${top + height}px`,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Spotlight cutout — clicks pass through to game elements underneath */}
      <div
        className={`fixed z-40 rounded-xl transition-all ${
          waitFor === 'click-spotlight'
            ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent cursor-pointer tutorial-spotlight-pulse'
            : 'ring-2 ring-yellow-400/60 ring-offset-1 ring-offset-transparent'
        }`}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ── Lesson Select Screen ───────────────────────────────────────────────────

interface LessonSelectProps {
  onSelectLesson: (lesson: number) => void;
}

export function LessonSelectScreen({ onSelectLesson }: LessonSelectProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-blue-950 p-4 sm:p-6"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-3">🏒</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Learn the Game</h1>
          <p className="text-gray-400 text-sm sm:text-base">Coach B walks you through every mechanic. Do them in order for the full experience.</p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4, 5].map(lesson => (
            <motion.button
              key={lesson}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLesson(lesson)}
              className="w-full flex items-center gap-3 sm:gap-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-600 rounded-xl px-4 sm:px-5 py-3 sm:py-4 transition-all text-left group min-h-[64px]"
            >
              <div className="text-3xl">{LESSON_EMOJIS[lesson]}</div>
              <div className="flex-1">
                <div className="text-white font-bold group-hover:text-blue-300 transition-colors">
                  Lesson {lesson}: {LESSON_NAMES[lesson]}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {getStepsForLesson(lesson).length} steps
                </div>
              </div>
              <div className="text-gray-600 group-hover:text-blue-400 transition-colors">→</div>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a href="/roster" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Skip tutorial → Start Real Game
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Congratulations Screen ─────────────────────────────────────────────────

interface CongratulationsProps {
  onStartRealGame: () => void;
  onReplay: () => void;
}

export function CongratulationsScreen({ onStartRealGame, onReplay }: CongratulationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-blue-950 p-6"
    >
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-7xl mb-4"
        >
          🏆
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-black text-yellow-400 mb-3"
        >
          You&apos;re Ready!
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-300 mb-8 text-lg"
        >
          You&apos;ve got the full MetaBeauts playbook. Draft your roster, run the RPS, read the matchups, rotate your lines.
        </motion.p>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={onStartRealGame}
            className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-green-900/40"
          >
            🎮 Start Real Game
          </button>
          <button
            onClick={onReplay}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold transition-all"
          >
            🔁 Replay Tutorial
          </button>
        </motion.div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg mb-1">🎯</div>
            <div>canShoot = Pass or Skate first</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg mb-1">🎲</div>
            <div>Offense draws. Defense picks blind.</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg mb-1">✨</div>
            <div>Traits activate in the window</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Tutorial Overlay ──────────────────────────────────────────────────

interface TutorialOverlayProps {
  children: React.ReactNode;
}

export function TutorialOverlay({ children }: TutorialOverlayProps) {
  const {
    tutorialPhase,
    currentStepIndex,
    currentLesson,
    advanceStep,
    handleSpotlightClick,
    startLesson,
    resetTutorial,
    completeTutorial,
  } = useTutorialStore();

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const stepsInLesson = currentStep
    ? TUTORIAL_STEPS.filter(s => s.lesson === currentStep.lesson)
    : [];
  const stepIndexInLesson = currentStep
    ? stepsInLesson.findIndex(s => s.id === currentStep.id)
    : 0;

  if (tutorialPhase === 'LESSON_SELECT') {
    return <LessonSelectScreen onSelectLesson={startLesson} />;
  }

  if (tutorialPhase === 'COMPLETE') {
    return (
      <CongratulationsScreen
        onStartRealGame={() => (window.location.href = '/roster')}
        onReplay={resetTutorial}
      />
    );
  }

  if (!currentStep) {
    completeTutorial();
    return null;
  }

  return (
    <div className="relative">
      {/* Game content (partially dimmed by overlay) */}
      {children}

      {/* Spotlight overlay */}
      <SpotlightOverlay
        spotlightId={currentStep.spotlight}
        onSpotlightClick={handleSpotlightClick}
        waitFor={currentStep.waitFor}
      />

      {/* Coach widget */}
      <AnimatePresence mode="wait">
        <CoachWidget
          key={currentStep.id}
          dialogue={currentStep.dialogue}
          lesson={currentLesson}
          stepIndex={stepIndexInLesson}
          totalStepsInLesson={stepsInLesson.length}
          waitFor={currentStep.waitFor}
          onAdvance={advanceStep}
          onSkipLesson={resetTutorial}
        />
      </AnimatePresence>
    </div>
  );
}
