'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
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
    const load = async () => {
      setLoadingBeauts(true);
      setSelectedPosition('Winger');
      try {
        const beauts = await searchBeautsByPosition('Winger', 25);
        setBrowsedBeauts(beauts);
      } catch (err) {
        console.error('Failed to load beauts:', err);
      } finally {
        setLoadingBeauts(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="min-h-screen bg-gray-950"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Fixed top bar on mobile */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-3 py-2 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white text-sm min-h-[44px] flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-base font-black text-white">🏒 Build Rosters</h1>
          {canStart && (
            <button
              onClick={() => { startGame(); router.push('/game'); }}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm min-h-[44px]"
            >
              Play! 🎮
            </button>
          )}
          {!canStart && (
            <div className="text-xs text-gray-400 text-right">
              <div>P1: {rosterSelection.player1.length}/6</div>
              <div>P2: {rosterSelection.player2.length}/6</div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-3 sm:p-4">
        {/* Desktop header */}
        <div className="mb-6 hidden sm:block">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">🏒 Build Your Rosters</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Each player picks 6 Beauts: 2 Wingers, 1 Center, 2 Defenders, 1 Goaltender
          </p>
        </div>

        {/* Game Mode Select */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => setGameMode('PreSeason')}
            className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-bold transition-all text-sm min-h-[48px] ${
              selectedGameMode === 'PreSeason'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pre-Season (No Traits)
          </button>
          <button
            onClick={() => setGameMode('RegularSeason')}
            className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-bold transition-all text-sm min-h-[48px] ${
              selectedGameMode === 'RegularSeason'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Regular Season (Full Rules)
          </button>
        </div>

        {/* Player selector — sticky on mobile */}
        <div className="sticky top-[58px] sm:top-0 z-20 bg-gray-950/95 backdrop-blur -mx-3 px-3 py-2 mb-3 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 border-b border-gray-800/50 sm:border-0">
          <div className="flex gap-2">
            {(['player1', 'player2'] as const).map(p => (
              <button
                key={p}
                onClick={() => setBrowsingPlayer(p)}
                className={`flex-1 py-2.5 rounded-lg font-bold transition-all text-sm min-h-[44px] ${
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

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
          {/* Beauts Browser */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold text-white mb-3">📋 Browse MetaBeauts</h2>

              {/* Position filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => loadByPosition(pos)}
                    disabled={isLoadingBeauts}
                    className={`px-3 py-2.5 rounded-lg font-bold transition-all text-sm min-h-[44px] ${
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
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto"
                  style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                >
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
                  No beauts found. Try another filter ⬆️
                </div>
              )}
            </div>
          </div>

          {/* Roster Summary — on mobile comes FIRST (order-1) */}
          <div className="order-1 lg:order-2 flex flex-col gap-3">
            {/* Current roster */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-white mb-3 text-sm sm:text-base">
                {browsingPlayer === 'player1' ? 'Player 1' : 'Player 2'} Roster ({roster.length}/6)
              </h3>

              {POSITIONS.map(pos => {
                const beautsInPos = roster.filter(b => b.position === pos);
                const limit = POSITION_LIMITS[pos];
                return (
                  <div key={pos} className="mb-2">
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
                            className="text-xs bg-gray-800 hover:bg-red-700 text-gray-300 hover:text-white px-2 py-1.5 rounded transition-all min-h-[36px]"
                            title="Tap to remove"
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

            {/* Player 2 roster preview (when viewing P1) */}
            {browsingPlayer === 'player1' && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4">
                <h3 className="font-bold text-white mb-2 text-sm sm:text-base">
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
            {canStart ? (
              <button
                onClick={() => {
                  startGame();
                  router.push('/game');
                }}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-base sm:text-lg transition-all hover:scale-105 shadow-lg min-h-[56px]"
              >
                🎮 Start Game!
              </button>
            ) : (
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400">
                  {rosterSelection.player1.length === 6 ? '✅' : '⏳'} Player 1: {rosterSelection.player1.length}/6
                </div>
                <div className="text-xs text-gray-400 mt-1">
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
