'use client';

import { useState } from 'react';
import './results.css';

const beautImg = (id: number) =>
  `https://assets.bueno.art/images/b93fd12b-3c56-4f5d-9277-fa952f95cffb/default/${id}`;

interface StatLine {
  tok: number;
  num: string;
  trait: string;
  G: number; A: number; S: number; B: number;
  P: string;
  sv?: string;
  mvp?: boolean;
}

const STAT_LINES_P1: StatLine[] = [
  { tok: 42,  num: '07', trait: 'Sniper',     G: 2, A: 1, S: 6, B: 0, P: '+2', mvp: true },
  { tok: 155, num: '14', trait: 'Two-Way',    G: 0, A: 1, S: 3, B: 1, P: '+1' },
  { tok: 88,  num: '19', trait: 'Playmaker',  G: 1, A: 2, S: 4, B: 0, P: '+3' },
  { tok: 314, num: '27', trait: 'Stand Up',   G: 0, A: 0, S: 1, B: 3, P: '-1' },
  { tok: 501, num: '44', trait: 'Enforcer',   G: 0, A: 0, S: 0, B: 2, P: '+0' },
  { tok: 777, num: '31', trait: 'Butterfly',  G: 0, A: 0, S: 0, B: 0, P: '+0', sv: '18/20' },
];

interface Reward {
  ic: string;
  l: string;
  v: string;
  d: string;
  up?: boolean;
  feat?: boolean;
}

const REWARDS_WIN: Reward[] = [
  { ic: '⭐', l: 'XP Earned',   v: '+340', d: 'lvl 12 → 13', up: true, feat: true },
  { ic: '🏆', l: 'Rank Points', v: '+24',  d: '#52 → #47',   up: true },
  { ic: '🪙', l: '$BEAUT',      v: '+50',  d: 'Match wager', up: true },
  { ic: '📦', l: 'Loot Drop',   v: '2x',   d: 'T2 + T3 cards' },
];

const REWARDS_LOSE: Reward[] = [
  { ic: '⭐', l: 'XP Earned',   v: '+120', d: 'lvl 12 → 12', up: true },
  { ic: '🏆', l: 'Rank Points', v: '-18',  d: '#42 → #47' },
  { ic: '🪙', l: '$BEAUT',      v: '-50',  d: 'Match wager' },
  { ic: '📦', l: 'Loot Drop',   v: '1x',   d: 'T1 card' },
];

type Outcome = 'win' | 'lose';

export default function ResultsPage() {
  const [outcome, setOutcome] = useState<Outcome>('win');

  const won = outcome === 'win';
  const finalP1 = won ? 4 : 2;
  const finalP2 = won ? 2 : 4;
  const rewards = won ? REWARDS_WIN : REWARDS_LOSE;

  const periods = [
    { l: 'P1', p1: won ? 2 : 1, p2: won ? 1 : 2 },
    { l: 'P2', p1: won ? 1 : 0, p2: 1 },
    { l: 'P3', p1: won ? 1 : 1, p2: won ? 0 : 1 },
  ];

  const mvp = STAT_LINES_P1.find(b => b.mvp)!;

  return (
    <main className="results-stage">
      {/* Outcome toggle (dev convenience while previewing) */}
      <div className="results-actions">
        <button
          className={'mb-pill' + (outcome === 'win' ? ' on' : '')}
          onClick={() => setOutcome('win')}
          style={outcome === 'win' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
        >
          Victory
        </button>
        <button
          className={'mb-pill' + (outcome === 'lose' ? ' on' : '')}
          onClick={() => setOutcome('lose')}
          style={outcome === 'lose' ? { color: '#ff3b5c', borderColor: '#ff3b5c' } : undefined}
        >
          Defeat
        </button>
      </div>

      {/* Hero */}
      <div className="results-hero">
        <div className="hero-grid">
          <div className={'hero-side ' + (won ? 'win' : 'lose')}>
            <div className="hero-badge">HT</div>
            <div className="hero-name">Hat Trick</div>
            <div className={'hero-tag ' + (won ? 'win' : 'lose')}>{won ? 'Winner' : 'Defeated'}</div>
            <div className="hero-score">{finalP1}</div>
          </div>

          <div className="hero-center">
            <div className="hero-eyebrow">{won ? '· Final ·' : '· Final ·'}</div>
            <div className="hero-final">{won ? 'Victory' : 'Defeat'}</div>
            <div className="period-strip">
              {periods.map((p) => (
                <div key={p.l} className="period">
                  <div className="l">{p.l}</div>
                  <div className="v">{p.p1}–{p.p2}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={'hero-side ' + (won ? 'lose' : 'win')}>
            <div className="hero-badge">IC</div>
            <div className="hero-name">Ice Cold</div>
            <div className={'hero-tag ' + (won ? 'lose' : 'win')}>{won ? 'Defeated' : 'Winner'}</div>
            <div className="hero-score">{finalP2}</div>
          </div>
        </div>
      </div>

      {/* Mid row: stats + MVP */}
      <div className="mid-row">
        <div className="results-panel">
          <div className="panel-h">
            <h3>Player Stats — Hat Trick</h3>
            <div className="pill">P1</div>
          </div>
          <div className="stats-table">
            <div className="stats-row head">
              <div></div>
              <div>Beaut</div>
              <div>G</div>
              <div>A</div>
              <div>S</div>
              <div>B</div>
              <div>+/-</div>
              <div>SV%</div>
            </div>
            {STAT_LINES_P1.map((b) => (
              <div key={b.tok} className={'stats-row' + (b.mvp ? ' mvp-row' : '')}>
                <div className="cap">
                  <img src={beautImg(b.tok)} alt={b.trait} />
                </div>
                <div className="nm">
                  <b>#{b.num}</b> {b.trait}
                </div>
                <div className="v">{b.G}</div>
                <div className="v">{b.A}</div>
                <div className="v">{b.S}</div>
                <div className="v">{b.B}</div>
                <div className="p">{b.P}</div>
                <div className="v">{b.sv ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-panel">
          <div className="panel-h">
            <h3>Match MVP</h3>
            <div className="pill">⭐ MVP</div>
          </div>
          <div className="mvp-section">
            <div className="mvp-card">
              <div className="imgw">
                <div className="star">★</div>
                <img src={beautImg(mvp.tok)} alt={mvp.trait} />
              </div>
              <div className="nm">#{mvp.num} · {mvp.trait}</div>
              <div className="meta">
                <span>Tier 3</span>
                <span>Winger</span>
              </div>
            </div>
            <div className="mvp-stats">
              <div className="head">Match line</div>
              <div className="stat-line"><span className="l">Goals</span><span className="v">{mvp.G}</span></div>
              <div className="stat-line"><span className="l">Assists</span><span className="v">{mvp.A}</span></div>
              <div className="stat-line"><span className="l">Shots</span><span className="v">{mvp.S}</span></div>
              <div className="stat-line"><span className="l">+/-</span><span className="v">{mvp.P}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="rewards-row">
        {rewards.map((r) => (
          <div
            key={r.l}
            className={'reward' + (r.up ? ' up' : '') + (r.feat ? ' feat' : '')}
          >
            <div className="icon">{r.ic}</div>
            <div className="l">{r.l}</div>
            <div className="v">{r.v}</div>
            <div className="d">{r.d}</div>
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button className="mb-btn">Rematch</button>
        <button className="mb-btn alt">Back to Lobby</button>
      </div>
    </main>
  );
}
