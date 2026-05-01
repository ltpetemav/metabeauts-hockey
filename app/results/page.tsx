'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import './results.css';

export default function ResultsPage() {
  const router = useRouter();
  const gameState = useGameStore(s => s.gameState);
  const currentViewingPlayer = useGameStore(s => s.currentViewingPlayer);
  const resetGame = useGameStore(s => s.resetGame);

  useEffect(() => {
    if (!gameState) {
      router.replace('/');
    }
  }, [gameState, router]);

  if (!gameState) return null;

  const won = gameState.winner === currentViewingPlayer;
  const myScore = currentViewingPlayer === 'player1' ? gameState.player1_score : gameState.player2_score;
  const oppScore = currentViewingPlayer === 'player1' ? gameState.player2_score : gameState.player1_score;
  const myLabel = currentViewingPlayer === 'player1' ? 'Player 1' : 'Player 2';
  const oppLabel = currentViewingPlayer === 'player1' ? 'Player 2' : 'Player 1';

  // Top scorer per team (by Beauts with most goals — derived from action_pile or just show roster summary)
  const myTeam = currentViewingPlayer === 'player1' ? gameState.player1 : gameState.player2;
  const oppTeam = currentViewingPlayer === 'player1' ? gameState.player2 : gameState.player1;

  const myStarters = myTeam.beauts.slice(0, 6);
  const oppStarters = oppTeam.beauts.slice(0, 6);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/roster');
  };

  return (
    <main className="results-stage">
      {/* Hero */}
      <div className="results-hero">
        <div className="hero-grid">
          <div className={'hero-side ' + (won ? 'win' : 'lose')}>
            <div className="hero-badge">P{currentViewingPlayer === 'player1' ? '1' : '2'}</div>
            <div className="hero-name">{myLabel}</div>
            <div className={'hero-tag ' + (won ? 'win' : 'lose')}>{won ? 'Winner' : 'Defeated'}</div>
            <div className="hero-score">{myScore}</div>
          </div>

          <div className="hero-center">
            <div className="hero-eyebrow">· Final ·</div>
            <div className="hero-final">{won ? 'Victory' : 'Defeat'}</div>
            <div className="period-strip">
              <div className="period">
                <div className="l">Final</div>
                <div className="v">{myScore}–{oppScore}</div>
              </div>
              <div className="period">
                <div className="l">Turns</div>
                <div className="v">{gameState.turn_number}</div>
              </div>
              <div className="period">
                <div className="l">Mode</div>
                <div className="v" style={{ fontSize: 12 }}>{gameState.mode === 'PreSeason' ? 'PreSn' : 'Reg'}</div>
              </div>
            </div>
          </div>

          <div className={'hero-side ' + (won ? 'lose' : 'win')}>
            <div className="hero-badge">P{currentViewingPlayer === 'player1' ? '2' : '1'}</div>
            <div className="hero-name">{oppLabel}</div>
            <div className={'hero-tag ' + (won ? 'lose' : 'win')}>{won ? 'Defeated' : 'Winner'}</div>
            <div className="hero-score">{oppScore}</div>
          </div>
        </div>
      </div>

      {/* Mid row: rosters side by side */}
      <div className="mid-row">
        <div className="results-panel">
          <div className="panel-h">
            <h3>{myLabel} · Final Roster</h3>
            <div className="pill">{myTeam.beauts.length} Beauts</div>
          </div>
          <div className="stats-table">
            <div className="stats-row head">
              <div></div>
              <div>Beaut</div>
              <div>Pos</div>
              <div>Tier</div>
              <div>Cards Left</div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            {myStarters.map((b) => (
              <div key={b.id} className="stats-row">
                <div className="cap">
                  <img src={b.image_url} alt={b.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="nm">
                  <b>#{b.token_id}</b> {b.trait_archetype || b.position}
                </div>
                <div className="v">{b.position[0]}</div>
                <div className="v">{b.tier}</div>
                <div className="v">{b.action_pile.length}</div>
                <div className="v">{b.is_exhausted ? '💀' : '✓'}</div>
                <div className="v">—</div>
                <div className="v">—</div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-panel">
          <div className="panel-h">
            <h3>{oppLabel} · Final Roster</h3>
            <div className="pill">{oppTeam.beauts.length} Beauts</div>
          </div>
          <div className="stats-table">
            <div className="stats-row head">
              <div></div>
              <div>Beaut</div>
              <div>Pos</div>
              <div>Tier</div>
              <div>Cards Left</div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            {oppStarters.map((b) => (
              <div key={b.id} className="stats-row">
                <div className="cap">
                  <img src={b.image_url} alt={b.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="nm">
                  <b>#{b.token_id}</b> {b.trait_archetype || b.position}
                </div>
                <div className="v">{b.position[0]}</div>
                <div className="v">{b.tier}</div>
                <div className="v">{b.action_pile.length}</div>
                <div className="v">{b.is_exhausted ? '💀' : '✓'}</div>
                <div className="v">—</div>
                <div className="v">—</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="mb-btn" onClick={handlePlayAgain}>🎮 Play Again</button>
        <button className="mb-btn alt" onClick={() => router.push('/')}>Back to Home</button>
      </div>
    </main>
  );
}
