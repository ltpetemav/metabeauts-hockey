'use client';

import React from 'react';

interface HandoffScreenProps {
  toPlayer: 'player1' | 'player2';
  onReady: () => void;
}

export function HandoffScreen({ toPlayer, onReady }: HandoffScreenProps) {
  const playerLabel = toPlayer === 'player1' ? 'Player 1' : 'Player 2';
  const playerEmoji = toPlayer === 'player1' ? '🔵' : '🔴';
  const playerColor = toPlayer === 'player1' ? 'text-blue-400' : 'text-red-400';
  const buttonColor =
    toPlayer === 'player1'
      ? 'bg-blue-600 hover:bg-blue-500 border-blue-400'
      : 'bg-red-600 hover:bg-red-500 border-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Hockey rink ice texture hints */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-600" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* Hockey puck icon */}
        <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">🏒</div>

        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          Pass the device to
        </h1>

        <div className={`text-3xl sm:text-5xl font-black mb-6 sm:mb-8 ${playerColor} drop-shadow-lg`}>
          {playerEmoji} {playerLabel}
        </div>

        <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
          The other player must look away while you hand off the device.
        </p>

        <button
          onClick={onReady}
          className={`w-full py-5 rounded-2xl font-black text-xl sm:text-2xl text-white border-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg min-h-[64px] ${buttonColor}`}
        >
          I&apos;m Ready — Let&apos;s Play! 🎮
        </button>

        <p className={`mt-6 text-sm font-semibold ${playerColor} opacity-70`}>
          {playerLabel}&apos;s turn
        </p>
      </div>
    </div>
  );
}
