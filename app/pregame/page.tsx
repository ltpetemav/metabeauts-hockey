'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import './pregame.css';

const VS_STEPS = [
  { id: 'crash', ms: 0 },
  { id: 'vs', ms: 900 },
  { id: 'lines', ms: 1900 },
  { id: 'ready', ms: 3500 },
];

export default function PregamePage() {
  const router = useRouter();
  const gameState = useGameStore(s => s.gameState);

  const [step, setStep] = useState(0);
  const [shock, setShock] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!gameState) {
      router.replace('/roster');
      return;
    }
    const phase = gameState.phase;
    if (phase !== 'RPS' && phase !== 'POSSESSION_START') {
      router.replace('/game');
    }
  }, [gameState, router]);

  useEffect(() => {
    timersRef.current = [];
    setStep(0);
    VS_STEPS.slice(1).forEach((s, i) => {
      const t = setTimeout(() => {
        setStep(i + 1);
        if (s.id === 'vs') {
          setShock(true);
          const tt = setTimeout(() => setShock(false), 1100);
          timersRef.current.push(tt);
        }
      }, s.ms);
      timersRef.current.push(t);
    });
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  if (!gameState) return null;

  const passed = (id: string) => step >= VS_STEPS.findIndex(s => s.id === id);
  const p1 = gameState.player1.beauts;
  const p2 = gameState.player2.beauts;

  return (
    <main className="pregame-stage">
      <div className="phase-tabs">
        <div className="pt cur"><span className="n">1</span><span>Opponent Reveal</span></div>
      </div>

      <div className={'vs-stage' + (shock ? ' shock' : '')}>
        <div className={'team p1' + (passed('crash') ? ' crash' : '')}>
          <div className="team-badge">P1</div>
          <div className="team-name">Player 1</div>
          <div className="team-wallet">Hat Trick</div>
          <div className="team-stats">
            <div className="s"><div className="v">{p1.length}</div><div className="l">Beauts</div></div>
          </div>
          <div className="team-line">
            {p1.slice(0, 6).map((b, i) => (
              <div
                key={b.id}
                className={'lineup-card' + (passed('lines') ? ' show' : '')}
                style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
              >
                <img src={b.image_url} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="num">#{b.token_id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={'vs-center' + (passed('vs') ? ' show' : '')}>
          <div className="vs-glyph">VS</div>
          <div className="vs-meta">
            <div className="stk">First to</div>
            <div className="pt2">3 Goals</div>
          </div>
        </div>

        <div className={'team p2' + (passed('crash') ? ' crash' : '')}>
          <div className="team-badge">P2</div>
          <div className="team-name">Player 2</div>
          <div className="team-wallet">Ice Cold</div>
          <div className="team-stats">
            <div className="s"><div className="v">{p2.length}</div><div className="l">Beauts</div></div>
          </div>
          <div className="team-line">
            {p2.slice(0, 6).map((b, i) => (
              <div
                key={b.id}
                className={'lineup-card' + (passed('lines') ? ' show' : '')}
                style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
              >
                <img src={b.image_url} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="num">#{b.token_id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={'vs-bottom' + (passed('ready') ? ' show' : '')}>
        <div className="left">
          <div className="nfo">Phase · <b>{gameState.phase}</b></div>
        </div>
        <button className="ctrl" onClick={() => router.push('/game')}>→ To Rink</button>
      </div>
    </main>
  );
}
