'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Position } from '@/types/game';
import { BeautCard } from '@/components/ui/BeautCard';
import { useGameStore } from '@/store/gameStore';
import { fetchBeautBatch, searchBeautsByPosition } from '@/lib/nft/metadata';

export default function RosterPage() {
  const router = useRouter();
  const {
    rosterSelection,
    selectedGameMode,
    addBeautToRoster,
    removeBeautFromRoster,
    setGameMode,
    setLoadingBeauts,
    setBrowsedBeauts,
    browsedBeauts,
    isLoadingBeauts,
    startGame,
  } = useGameStore();

  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [browsingPlayer, setBrowsingPlayer] = useState<'player1' | 'player2'>('player1');

  const POSITIONS: Position[] = ['Winger', 'Center', 'Defender', 'Goaltender'];
  const POSITION_ICONS: Record<Position, string> = {
    Winger: '🏒',
    Center: '⭐',
    Defender: '🛡️',
    Goaltender: '🥅',
  };
  const POSITION_LIMITS: Record<Position, number> = {
    Winger: 2,
    Center: 1,
    Defender: 2,
    Goaltender: 1,
  };

  useEffect(() => {
    // Load initial beauts
    const load = async () => {
      setLoadingBeauts(true);
      try {
        const beauts = await fetchBeautBatch(1, 30);
        setBrowsedBeauts(beauts);
      } catch (err) {
        console.error('Failed to load beauts:', err);
      } finally {
        setLoadingBeauts(false);
      }
    };
    load();
  }, [setLoadingBeauts, setBrowsedBeauts]);

  const loadByPosition = async (pos: Position) => {
    setLoadingBeauts(true);
    setSelectedPosition(pos);
    try {
      const beauts = await searchBeautsByPosition(pos, 25);
      setBrowsedBeauts(beauts);
    } catch (err) {
      console.error('Failed to load beauts:', err);
    } finally {
      setLoadingBeauts(false);
    }
  };

  const roster = browsingPlayer === 'player1' ? rosterSelection.player1 : rosterSelection.player2;
  const positionCounts = POSITIONS.reduce((acc, pos) => {
    acc[pos] = roster.filter(b => b.position === pos).length;
    return acc;
  }, {} as Record<Position, number>);

  const canAddMore = roster.length < 6;
  const canStart = rosterSelection.player1.length === 6 && rosterSelection.player2.length === 6;

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-black text-white mb-2">🏒 Build Your Rosters</h1>
          <p className="text-gray-400">
            Each player picks 6 Beauts: 2 Wingers, 1 Center, 2 Defenders, 1 Goaltender
          </p>
        </div>

        {/* Game Mode Select */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setGameMode('PreSeason')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedGameMode === 'PreSeason'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pre-Season (No Traits)
          </button>
          <button
            onClick={() => setGameMode('RegularSeason')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedGameMode === 'RegularSeason'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Regular Season (Full Rules)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beauts Browser */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="text-xl font-bold text-white mb-4">📋 Browse MetaBeauts</h2>

              {/* Position filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => loadByPosition(pos)}
                    disabled={isLoadingBeauts}
                    className={`px-3 py-2 rounded-lg font-bold transition-all ${
                      selectedPosition === pos
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } disabled:opacity-50`}
                  >
                    {POSITION_ICONS[pos]} {pos}
                  </button>
                ))}
              </div>

              {/* Beaut grid */}
              {isLoadingBeauts ? (
                <div className="text-center py-8 text-gray-400">🔄 Loading beauts...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[600px] overflow-y-auto">
                  {browsedBeauts.map(beaut => {
                    const isSelected = roster.some(b => b.token_id === beaut.token_id);
                    const posCount = positionCounts[beaut.position];
                    const posLimit = POSITION_LIMITS[beaut.position];
                    const canAdd = canAddMore && (!isSelected || posCount < posLimit);

                    return (
                      <div
                        key={beaut.token_id}
                        onClick={() => {
                          if (isSelected) {
                            removeBeautFromRoster(browsingPlayer, beaut.token_id);
                          } else if (canAdd) {
                            addBeautToRoster(browsingPlayer, beaut);
                          }
                        }}
                        className={canAdd || isSelected ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
                      >
                        <BeautCard beaut={beaut} isSelected={isSelected} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}

              {browsedBeauts.length === 0 && !isLoadingBeauts && (
                <div className="text-center py-8 text-gray-400">
                  ⬆️ Select a position to browse beauts
                </div>
              )}
            </div>
          </div>

          {/* Roster Summary */}
          <div className="flex flex-col gap-4">
            {/* Player selector */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">Editing Roster:</h3>
              <div className="flex gap-2">
                {(['player1', 'player2'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setBrowsingPlayer(p)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      browsingPlayer === p
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {p === 'player1' ? 'Player 1' : 'Player 2'} ({rosterSelection[p].length}/6)
                  </button>
                ))}
              </div>
            </div>

            {/* Current roster */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-white mb-3">
                {browsingPlayer === 'player1' ? 'Player 1' : 'Player 2'} Roster ({roster.length}/6)
              </h3>

              {POSITIONS.map(pos => {
                const beautsInPos = roster.filter(b => b.position === pos);
                const limit = POSITION_LIMITS[pos];
                return (
                  <div key={pos} className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">
                      {POSITION_ICONS[pos]} {pos} ({beautsInPos.length}/{limit})
                    </div>
                    {beautsInPos.length === 0 ? (
                      <div className="text-xs text-gray-600 italic">— empty —</div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {beautsInPos.map(b => (
                          <button
                            key={b.token_id}
                            onClick={() => removeBeautFromRoster(browsingPlayer, b.token_id)}
                            className="text-xs bg-gray-800 hover:bg-red-700 text-gray-300 hover:text-white px-2 py-1 rounded transition-all"
                            title="Click to remove"
                          >
                            {b.name.replace('MetaBeauts #', '#')} ✕
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Player 2 roster preview */}
            {browsingPlayer === 'player1' && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">
                  Player 2 Roster ({rosterSelection.player2.length}/6)
                </h3>
                {rosterSelection.player2.length === 0 ? (
                  <div className="text-xs text-gray-600 italic">— empty —</div>
                ) : (
                  <div className="text-xs text-gray-400">
                    {rosterSelection.player2.map(b => b.name.replace('MetaBeauts #', '#')).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Start button */}
            {canStart && (
              <button
                onClick={() => {
                  startGame();
                  router.push('/game');
                }}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-lg transition-all hover:scale-105 shadow-lg"
              >
                🎮 Start Game!
              </button>
            )}

            {!canStart && (
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400">
                  {rosterSelection.player1.length === 6 ? '✅' : '⏳'} Player 1: {rosterSelection.player1.length}/6
                </div>
                <div className="text-xs text-gray-400">
                  {rosterSelection.player2.length === 6 ? '✅' : '⏳'} Player 2: {rosterSelection.player2.length}/6
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
