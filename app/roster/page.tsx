'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Position } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { searchBeautsByPosition } from '@/lib/nft/metadata';
import './roster.css';

const POSITIONS: Position[] = ['Winger', 'Center', 'Defender', 'Goaltender'];
const POSITION_TAG: Record<Position, 'W' | 'C' | 'D' | 'G'> = {
  Winger: 'W',
  Center: 'C',
  Defender: 'D',
  Goaltender: 'G',
};
const POSITION_LIMITS: Record<Position, number> = {
  Winger: 2,
  Center: 1,
  Defender: 2,
  Goaltender: 1,
};

type FilterPos = 'ALL' | Position;

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

  const [filterPos, setFilterPos] = useState<FilterPos>('Winger');
  const [browsingPlayer, setBrowsingPlayer] = useState<'player1' | 'player2'>('player1');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingBeauts(true);
      try {
        const beauts = await searchBeautsByPosition('Winger', 30);
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
    setFilterPos(pos);
    try {
      const beauts = await searchBeautsByPosition(pos, 30);
      setBrowsedBeauts(beauts);
    } catch (err) {
      console.error('Failed to load beauts:', err);
    } finally {
      setLoadingBeauts(false);
    }
  };

  const roster = browsingPlayer === 'player1' ? rosterSelection.player1 : rosterSelection.player2;
  const oppRoster = browsingPlayer === 'player1' ? rosterSelection.player2 : rosterSelection.player1;
  const oppLabel = browsingPlayer === 'player1' ? 'Player 2' : 'Player 1';

  const positionCounts = POSITIONS.reduce((acc, pos) => {
    acc[pos] = roster.filter(b => b.position === pos).length;
    return acc;
  }, {} as Record<Position, number>);

  const canAddMore = roster.length < 6;
  const canStart = rosterSelection.player1.length === 6 && rosterSelection.player2.length === 6;

  const filteredBeauts = browsedBeauts.filter(b => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const idMatch = String(b.token_id).includes(term);
      const traitMatch = (b.trait_archetype || '').toLowerCase().includes(term);
      const nameMatch = b.name.toLowerCase().includes(term);
      if (!idMatch && !traitMatch && !nameMatch) return false;
    }
    return true;
  });

  return (
    <main className="roster-stage">
      {/* Header */}
      <div className="roster-header">
        <button onClick={() => router.push('/')} className="crumb">← Home</button>
        <h1>Build Rosters</h1>
        <div style={{ width: 70 }} />
      </div>

      {/* Tabs: Player 1 / Player 2 */}
      <div className="roster-tabs">
        {(['player1', 'player2'] as const).map(p => (
          <button
            key={p}
            className={'roster-tab ' + (browsingPlayer === p ? 'cur' : '')}
            onClick={() => setBrowsingPlayer(p)}
          >
            {p === 'player1' ? 'Player 1' : 'Player 2'}
            <span className="ct">{rosterSelection[p].length}/6</span>
          </button>
        ))}
      </div>

      {/* Game mode */}
      <div className="mode-row">
        <button
          className={'mode-btn ' + (selectedGameMode === 'PreSeason' ? 'on' : '')}
          onClick={() => setGameMode('PreSeason')}
        >
          Pre-Season · No Traits
        </button>
        <button
          className={'mode-btn ' + (selectedGameMode === 'RegularSeason' ? 'on' : '')}
          onClick={() => setGameMode('RegularSeason')}
        >
          Regular Season · Full Rules
        </button>
      </div>

      {/* Browser + summary layout */}
      <div className="roster-layout">
        {/* Browser */}
        <div className="roster-browser">
          {/* Browse head: position chips + search */}
          <div className="browse-head">
            <div className="browse-filters">
              {POSITIONS.map(pos => (
                <button
                  key={pos}
                  className={'browse-chip ' + (filterPos === pos ? 'on' : '')}
                  onClick={() => loadByPosition(pos)}
                  disabled={isLoadingBeauts}
                >
                  {POSITION_TAG[pos]} · {pos}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="browse-search"
              placeholder="Search by # / trait / name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Beaut grid */}
          {isLoadingBeauts ? (
            <div className="beaut-loading">🔄 Loading beauts…</div>
          ) : filteredBeauts.length === 0 ? (
            <div className="beaut-empty">No beauts match. Try a different filter or search.</div>
          ) : (
            <div className="beaut-grid beaut-grid-scroll">
              {filteredBeauts.map(beaut => {
                const isSelected = roster.some(b => b.token_id === beaut.token_id);
                const posCount = positionCounts[beaut.position];
                const posLimit = POSITION_LIMITS[beaut.position];
                const canAddThis = canAddMore && (!isSelected ? posCount < posLimit : true);
                const tier = beaut.tier;

                return (
                  <div
                    key={beaut.token_id}
                    className={'bcard ' + (isSelected ? 'selected ' : '') + (!canAddThis && !isSelected ? 'disabled' : '')}
                    onClick={() => {
                      if (isSelected) {
                        removeBeautFromRoster(browsingPlayer, beaut.token_id);
                      } else if (canAddThis) {
                        addBeautToRoster(browsingPlayer, beaut);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '260px',
                    }}
                  >
                    <div
                      className="ph"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '220px',
                        minHeight: '220px',
                        maxHeight: '220px',
                        overflow: 'hidden',
                        background: '#000',
                        flex: '0 0 220px',
                      }}
                    >
                      <div className={`pos-tag ${POSITION_TAG[beaut.position]}`}>{POSITION_TAG[beaut.position]}</div>
                      <div className={`tier-tag t${tier}`}>T{tier}</div>
                      <img
                        src={beaut.image_url}
                        alt={beaut.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center 20%',
                          display: 'block',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23374151'><rect width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='14'>${beaut.token_id ?? '?'}</text></svg>`;
                        }}
                      />
                      <div className="num">#{beaut.token_id}</div>
                      {isSelected && <div className="selected-check">✓</div>}
                    </div>
                    <div className="nfo">
                      <div className="nm">{beaut.trait_archetype || beaut.position}</div>
                      <div className="meta">
                        <span>{beaut.name.replace('MetaBeauts ', '')}</span>
                        <span>T{tier}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary side panel */}
        <div className="roster-summary">
          <h3>{browsingPlayer === 'player1' ? 'Player 1' : 'Player 2'} Line</h3>
          <div className="sub">{roster.length}/6 Beauts · {selectedGameMode || 'PreSeason'} mode</div>

          {POSITIONS.map(pos => {
            const beautsInPos = roster.filter(b => b.position === pos);
            const limit = POSITION_LIMITS[pos];
            const isFull = beautsInPos.length === limit;
            return (
              <div key={pos} className="pos-section">
                <div className="pos-label">
                  <span>{POSITION_TAG[pos]} · {pos}</span>
                  <span className={isFull ? 'full' : ''}>{beautsInPos.length}/{limit}</span>
                </div>
                {beautsInPos.length === 0 ? (
                  <div className="pos-empty">— empty —</div>
                ) : (
                  <div className="pos-list">
                    {beautsInPos.map(b => (
                      <button
                        key={b.token_id}
                        className="pos-pill"
                        onClick={() => removeBeautFromRoster(browsingPlayer, b.token_id)}
                        title="Click to remove"
                      >
                        #{b.token_id} ✕
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="opp-summary">
            <div className="opp-label">{oppLabel}</div>
            <div className="opp-count">{oppRoster.length}/6</div>
            <div className={'opp-status ' + (oppRoster.length === 6 ? 'ready' : '')}>
              {oppRoster.length === 6 ? '✓ Ready' : 'Building roster…'}
            </div>
          </div>

          {canStart ? (
            <button
              onClick={() => {
                startGame();
                router.push('/pregame');
              }}
              className="start-btn"
            >
              🎮 Drop the Puck
            </button>
          ) : (
            <div className="start-locked">
              <div className={'row ' + (rosterSelection.player1.length === 6 ? 'done' : '')}>
                {rosterSelection.player1.length === 6 ? '✓' : '○'} P1 · {rosterSelection.player1.length}/6
              </div>
              <div className={'row ' + (rosterSelection.player2.length === 6 ? 'done' : '')}>
                {rosterSelection.player2.length === 6 ? '✓' : '○'} P2 · {rosterSelection.player2.length}/6
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
