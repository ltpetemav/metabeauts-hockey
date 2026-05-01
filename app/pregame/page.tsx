'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import './pregame.css';

export default function PregamePage() {
  const router = useRouter();
  const gameState = useGameStore(s => s.gameState);

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

  if (!gameState) return null;

  return (
    <main className="pregame-stage">
      <div className="phase-tabs">
        <div className="pt cur"><span className="n">1</span><span>Pregame</span></div>
      </div>
      <div className="vs-stage" style={{ display: 'grid', placeItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="vs-glyph">VS</div>
          <div className="vs-meta">
            <div className="stk">Phase</div>
            <div className="pt2">{gameState.phase}</div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="ctrl" onClick={() => router.push('/game')}>
              → Continue to Game
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
