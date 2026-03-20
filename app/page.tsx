'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-blue-950 p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="text-6xl mb-4">🏒</div>

        {/* Title */}
        <h1 className="text-5xl font-black text-white mb-2">MetaBeauts: Hockey</h1>
        <p className="text-xl text-gray-300 mb-8">
          A 2-player PvP digital card game. Random offense, deliberate defense. First to 3 goals wins.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-bold text-white mb-1">Action Resolution</h3>
            <p className="text-sm text-gray-400">6 card types, asymmetric offense/defense, full trait system</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-white mb-1">Real Rosters</h3>
            <p className="text-sm text-gray-400">Browse and pick from 9,997 real MetaBeauts NFTs</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-bold text-white mb-1">Line Changes</h3>
            <p className="text-sm text-gray-400">Swap ice/bench, refresh cards, strategic substitutions</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-bold text-white mb-1">14 Traits</h3>
            <p className="text-sm text-gray-400">Two-Way, Sniper, Butterfly, Playmaker, and more</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/roster')}
            className="px-8 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            🎮 Start Game
          </button>
          <button
            onClick={() => router.push('/tutorial')}
            className="px-8 py-4 rounded-xl bg-transparent hover:bg-blue-900/30 text-blue-300 font-bold text-lg transition-all hover:scale-105 border-2 border-blue-500 hover:border-blue-400"
          >
            🎓 Learn to Play
          </button>
          <button
            onClick={() => router.push('/game')}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all hover:scale-105"
          >
            📖 Rules
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-gray-500 text-sm border-t border-gray-800 pt-4">
          <p>🏒 MB:H Phase 1 MVP — Local 2-Player Hot-Seat Mode</p>
          <p className="text-xs text-gray-600 mt-2">Real MetaBeauts NFT data • Server-authoritative game engine • No wallet required</p>
        </div>
      </div>
    </div>
  );
}
