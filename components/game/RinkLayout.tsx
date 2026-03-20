'use client';

import React, { useState } from 'react';
import { GameState, BeautEntity, Position } from '@/types/game';
import { BeautCard, BeautMini } from '@/components/ui/BeautCard';
import { availableCards } from '@/lib/engine/cards';

interface RinkLayoutProps {
  gameState: GameState;
  viewingPlayer: 'player1' | 'player2';
  onSelectOffensiveBeaut?: (id: string) => void;
  onSelectDefensiveBeaut?: (id: string) => void;
}

export function RinkLayout({
  gameState,
  viewingPlayer,
  onSelectOffensiveBeaut,
  onSelectDefensiveBeaut,
}: RinkLayoutProps) {
  const { player1, player2, possession, active_offensive_beaut_id, active_defensive_beaut_id, phase } = gameState;

  const [topBenchOpen, setTopBenchOpen] = useState(false);
  const [bottomBenchOpen, setBottomBenchOpen] = useState(false);

  // For hot-seat: "bottom" player is the current viewing player
  const bottomRoster = viewingPlayer === 'player1' ? player1 : player2;
  const topRoster = viewingPlayer === 'player1' ? player2 : player1;
  const bottomPlayer = viewingPlayer;
  const topPlayer = viewingPlayer === 'player1' ? 'player2' : 'player1';

  const bottomHasPuck = possession === bottomPlayer;
  const topHasPuck = possession === topPlayer;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top player (opponent in hot-seat) */}
      <div className={`rounded-xl border ${topHasPuck ? 'border-green-600 bg-green-950/20' : 'border-gray-700 bg-gray-900/30'} p-2 sm:p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs sm:text-sm font-semibold text-gray-300">
            {topPlayer === 'player1' ? 'Player 1' : 'Player 2'}
            {topHasPuck && <span className="ml-2 text-green-400 animate-pulse">🏒 Puck</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              On Ice: {topRoster.on_ice.length}
            </div>
            {topRoster.on_bench.length > 0 && (
              <button
                onClick={() => setTopBenchOpen(v => !v)}
                className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-all min-h-[32px]"
              >
                Bench ({topRoster.on_bench.length}) {topBenchOpen ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>

        {/* On-ice beauts (opponent) */}
        <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
          {topRoster.on_ice.map(id => {
            const b = topRoster.beauts.find(x => x.id === id);
            if (!b) return null;
            const isActive = id === active_offensive_beaut_id || id === active_defensive_beaut_id;
            const isOffActive = id === active_offensive_beaut_id;
            const isDefActive = id === active_defensive_beaut_id;
            return (
              <div key={id} className="flex flex-col items-center gap-0.5">
                <BeautMini
                  beaut={b}
                  isActive={isActive}
                  cardCount={availableCards(b.action_pile).length}
                  onClick={() => {
                    if (topPlayer === getDefensivePlayer(gameState) && onSelectDefensiveBeaut) {
                      onSelectDefensiveBeaut(id);
                    }
                  }}
                />
                {isOffActive && <span className="text-xs text-green-400">⚔️</span>}
                {isDefActive && <span className="text-xs text-blue-400">🛡️</span>}
              </div>
            );
          })}
        </div>

        {/* Bench (opponent) — collapsible on mobile */}
        {topRoster.on_bench.length > 0 && topBenchOpen && (
          <div className="mt-2 border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-500 mb-1">Bench:</div>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {topRoster.on_bench.map(id => {
                const b = topRoster.beauts.find(x => x.id === id);
                if (!b) return null;
                return (
                  <BeautMini
                    key={id}
                    beaut={b}
                    cardCount={availableCards(b.action_pile).length}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ice Rink Center */}
      <div className="relative rounded-xl border-2 border-blue-700 bg-blue-950/20 p-3 sm:p-4 min-h-[80px] sm:min-h-[100px]">
        {/* Ice texture lines */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="w-full h-px bg-blue-700/30 absolute top-1/2" />
          <div className="w-px h-full bg-blue-700/20 absolute left-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-blue-700/40" />
        </div>

        {/* Center content */}
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {active_offensive_beaut_id && (
            <ActiveBeautDisplay
              gameState={gameState}
              beautId={active_offensive_beaut_id}
              role="OFFENSE"
            />
          )}

          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl sm:text-3xl">{bottomHasPuck || topHasPuck ? '🏒' : '⚪'}</div>
            <div className="text-xs text-gray-400 text-center">
              {possession === bottomPlayer ? '↓ Your Puck' : '↑ Their Puck'}
            </div>
          </div>

          {active_defensive_beaut_id && (
            <ActiveBeautDisplay
              gameState={gameState}
              beautId={active_defensive_beaut_id}
              role="DEFENSE"
            />
          )}
        </div>
      </div>

      {/* Bottom player (current viewing player) */}
      <div className={`rounded-xl border ${bottomHasPuck ? 'border-green-600 bg-green-950/20' : 'border-gray-700 bg-gray-900/30'} p-2 sm:p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs sm:text-sm font-semibold text-gray-300">
            {bottomPlayer === 'player1' ? 'Player 1 (You)' : 'Player 2 (You)'}
            {bottomHasPuck && <span className="ml-2 text-green-400 animate-pulse">🏒 Puck</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              On Ice: {bottomRoster.on_ice.length}
            </div>
            {bottomRoster.on_bench.length > 0 && (
              <button
                onClick={() => setBottomBenchOpen(v => !v)}
                className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-all min-h-[32px]"
              >
                Bench ({bottomRoster.on_bench.length}) {bottomBenchOpen ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>

        {/* On-ice beauts (current player) */}
        <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
          {bottomRoster.on_ice.map(id => {
            const b = bottomRoster.beauts.find(x => x.id === id);
            if (!b) return null;
            const isActive = id === active_offensive_beaut_id || id === active_defensive_beaut_id;
            const isOffActive = id === active_offensive_beaut_id;
            const isDefActive = id === active_defensive_beaut_id;
            return (
              <div key={id} className="flex flex-col items-center gap-0.5">
                <BeautMini
                  beaut={b}
                  isActive={isActive}
                  cardCount={availableCards(b.action_pile).length}
                  onClick={() => {
                    if (bottomPlayer === getOffensivePlayer(gameState) && onSelectOffensiveBeaut) {
                      onSelectOffensiveBeaut(id);
                    } else if (bottomPlayer === getDefensivePlayer(gameState) && onSelectDefensiveBeaut) {
                      onSelectDefensiveBeaut(id);
                    }
                  }}
                />
                {isOffActive && <span className="text-xs text-green-400">⚔️</span>}
                {isDefActive && <span className="text-xs text-blue-400">🛡️</span>}
              </div>
            );
          })}
        </div>

        {/* Bench — collapsible on mobile */}
        {bottomRoster.on_bench.length > 0 && bottomBenchOpen && (
          <div className="mt-2 border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-500 mb-1">Bench:</div>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {bottomRoster.on_bench.map(id => {
                const b = bottomRoster.beauts.find(x => x.id === id);
                if (!b) return null;
                return (
                  <BeautMini
                    key={id}
                    beaut={b}
                    cardCount={availableCards(b.action_pile).length}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveBeautDisplay({ gameState, beautId, role }: { gameState: GameState; beautId: string; role: 'OFFENSE' | 'DEFENSE' }) {
  const p1beaut = gameState.player1.beauts.find(b => b.id === beautId);
  const p2beaut = gameState.player2.beauts.find(b => b.id === beautId);
  const b = p1beaut || p2beaut;
  if (!b) return null;

  const cardCount = availableCards(b.action_pile).length;

  return (
    <div className="flex flex-col items-center">
      <div className={`text-xs font-bold mb-1 ${role === 'OFFENSE' ? 'text-orange-400' : 'text-blue-400'}`}>
        {role === 'OFFENSE' ? '⚔️' : '🛡️'}
        <span className="hidden sm:inline"> {role === 'OFFENSE' ? 'OFFENSE' : 'DEFENSE'}</span>
      </div>
      <img
        src={b.image_url}
        alt={b.name}
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-white/20"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23374151'><rect width='64' height='64'/></svg>`;
        }}
      />
      <div className="text-white text-xs truncate max-w-[64px] sm:max-w-[80px] text-center mt-0.5">{b.name.replace('MetaBeauts #', '#')}</div>
      <div className={`text-xs ${cardCount === 0 ? 'text-red-400' : 'text-green-400'}`}>{cardCount} cards</div>
    </div>
  );
}

function getOffensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession;
}

function getDefensivePlayer(state: GameState): 'player1' | 'player2' {
  return state.possession === 'player1' ? 'player2' : 'player1';
}
