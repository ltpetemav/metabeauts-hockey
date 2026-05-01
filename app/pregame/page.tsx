'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { HandoffScreen } from '@/components/game/HandoffScreen';
import type { BeautEntity, RPSChoice } from '@/types/game';
import './pregame.css';

const RPS_OPTIONS: { v: RPSChoice; ic: string; label: string }[] = [
  { v: 'rock', ic: '🪨', label: 'Rock' },
  { v: 'paper', ic: '📄', label: 'Paper' },
  { v: 'scissors', ic: '✂️', label: 'Scissors' },
];

type SubPhase = 'vs' | 'rps' | 'transition';

export default function PregamePage() {
  const router = useRouter();
  const gameState = useGameStore(s => s.gameState);
  const currentViewingPlayer = useGameStore(s => s.currentViewingPlayer);
  const pendingHandoff = useGameStore(s => s.pendingHandoff);
  const submitRPSChoice = useGameStore(s => s.submitRPSChoice);
  const confirmHandoff = useGameStore(s => s.confirmHandoff);

  const [subPhase, setSubPhase] = useState<SubPhase>('vs');

  useEffect(() => {
    if (!gameState) {
      router.replace('/roster');
    }
  }, [gameState, router]);

  useEffect(() => {
    if (!gameState) return;
    const phase = gameState.phase;
    if (phase === 'POSSESSION_START' || phase === 'LINE_CHANGE_OFFENSIVE' || phase === 'LINE_CHANGE_DEFENSIVE') {
      setSubPhase('transition');
      const t = setTimeout(() => router.push('/game'), 1400);
      return () => clearTimeout(t);
    }
    if (phase === 'OFFENSIVE_DRAW' || phase === 'DEFENSIVE_RESPONSE' || phase === 'HYBRID_CHOICE' || phase === 'SIMULTANEOUS_REVEAL' || phase === 'FORCED_LINE_CHANGE') {
      router.push('/game');
    }
    if (phase === 'MATCH_END') {
      router.push('/results');
    }
  }, [gameState, gameState?.phase, router]);

  useEffect(() => {
    if (subPhase === 'vs') {
      const t = setTimeout(() => setSubPhase('rps'), 4200);
      return () => clearTimeout(t);
    }
  }, [subPhase]);

  if (!gameState) return null;

  return (
    <main className="pregame-stage">
      <div className="phase-tabs">
        <div className={'pt ' + (subPhase === 'vs' ? 'cur' : 'done')}>
          <span className="n">1</span><span>Opponent Reveal</span>
        </div>
        <div className={'pt ' + (subPhase === 'rps' ? 'cur' : subPhase === 'transition' ? 'done' : '')}>
          <span className="n">2</span><span>RPS · Coin Flip</span>
        </div>
        <div className={'pt ' + (subPhase === 'transition' ? 'cur' : '')}>
          <span className="n">3</span><span>Drop the Puck</span>
        </div>
      </div>

      {subPhase === 'vs' && <RealVsReveal />}
      {subPhase === 'rps' && <RealRps onPicked={(player, choice) => submitRPSChoice(player, choice)} viewingPlayer={currentViewingPlayer} />}
      {subPhase === 'transition' && <Transition />}

      {pendingHandoff && (
        <HandoffScreen toPlayer={pendingHandoff} onReady={confirmHandoff} />
      )}
    </main>
  );
}

function RealVsReveal() {
  const gameState = useGameStore(s => s.gameState);
  if (!gameState) return null;

  const STEPS = [
    { id: 'crash', ms: 0 },
    { id: 'vs', ms: 900 },
    { id: 'lines', ms: 1900 },
    { id: 'ready', ms: 3500 },
  ];

  const [step, setStep] = useState(0);
  const [shock, setShock] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerShock = () => {
    setShock(true);
    timersRef.current.push(setTimeout(() => setShock(false), 1100));
  };

  useEffect(() => {
    timersRef.current = [];
    setStep(0);
    STEPS.slice(1).forEach((s, i) => {
      const t = setTimeout(() => {
        setStep(i + 1);
        if (s.id === 'vs') triggerShock();
      }, s.ms);
      timersRef.current.push(t);
    });
    return () => { timersRef.current.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passed = (id: string) => step >= STEPS.findIndex(s => s.id === id);

  const p1 = gameState.player1.beauts;
  const p2 = gameState.player2.beauts;

  return (
    <div className={'vs-stage' + (shock ? ' shock' : '')}>
      <div className={'team p1' + (passed('crash') ? ' crash' : '')}>
        <div className="team-badge">P1</div>
        <div className="team-name">Player 1</div>
        <div className="team-wallet">Hat Trick</div>
        <div className="team-stats">
          <div className="s"><div className="v">{p1.length}</div><div className="l">Beauts</div></div>
          <div className="s"><div className="v">{p1.reduce((sum, b) => sum + b.action_pile.length, 0)}</div><div className="l">Cards</div></div>
        </div>
        <div className="team-line">
          {p1.slice(0, 6).map((b, i) => (
            <div
              key={b.id}
              className={'lineup-card' + (passed('lines') ? ' show' : '')}
              style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
            >
              <img src={b.image_url} alt={b.name} onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
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
          <div className="s"><div className="v">{p2.reduce((sum, b) => sum + b.action_pile.length, 0)}</div><div className="l">Cards</div></div>
        </div>
        <div className="team-line">
          {p2.slice(0, 6).map((b, i) => (
            <div
              key={b.id}
              className={'lineup-card' + (passed('lines') ? ' show' : '')}
              style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
            >
              <img src={b.image_url} alt={b.name} onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
              <div className="num">#{b.token_id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RpsProps {
  viewingPlayer: 'player1' | 'player2';
  onPicked: (player: 'player1' | 'player2', choice: RPSChoice) => void;
}

function RealRps({ viewingPlayer, onPicked }: RpsProps) {
  const gameState = useGameStore(s => s.gameState);
  const [pick, setPick] = useState<RPSChoice | null>(null);

  if (!gameState) return null;

  const myChoice = viewingPlayer === 'player1' ? gameState.rps_choice_p1 : gameState.rps_choice_p2;
  const oppChoice = viewingPlayer === 'player1' ? gameState.rps_choice_p2 : gameState.rps_choice_p1;
  const winner = gameState.rps_winner;
  const revealed = winner !== null;

  const submit = () => {
    if (!pick || myChoice) return;
    onPicked(viewingPlayer, pick);
  };

  const youWon = winner === viewingPlayer;
  const oppLabel = viewingPlayer === 'player1' ? 'Ice Cold' : 'Hat Trick';

  return (
    <div className="rps">
      <div className={'rps-side p1' + (winner === viewingPlayer ? ' winner' : winner ? ' loser' : '')}>
        <div className="crown">👑</div>
        <div className="rps-mini">{viewingPlayer === 'player1' ? 'P1' : 'P2'}</div>
        <div className={'rps-pick ' + (myChoice ? 'locked ' : '') + (revealed ? 'revealed' : '')}>
          {revealed && myChoice ? RPS_OPTIONS.find(o => o.v === myChoice)?.ic : (myChoice ? '✓' : '?')}
        </div>
        <div className="rps-label">You</div>
        <div className="rps-status">{revealed ? 'Revealed' : myChoice ? 'Locked' : 'Pick'}</div>
      </div>

      <div className="rps-vs">
        <div className="rps-clock">{revealed ? (youWon ? '🏆' : '🥲') : (myChoice ? '✓' : '?')}</div>
        <div className="rps-prompt">{revealed ? (youWon ? 'You Drop the Puck' : 'Defending First') : myChoice ? 'Waiting for opponent' : 'Choose Your Hand'}</div>
        {!myChoice && (
          <>
            <div className="rps-options">
              {RPS_OPTIONS.map(o => (
                <div key={o.v} className={'rps-opt ' + (pick === o.v ? 'picked' : '')} onClick={() => setPick(o.v)}>
                  {o.ic}
                </div>
              ))}
            </div>
            <button className="ctrl" disabled={!pick} onClick={submit} style={{ marginTop: 14, opacity: pick ? 1 : 0.4 }}>
              Lock In
            </button>
          </>
        )}
        {myChoice && !revealed && (
          <div className="rps-status" style={{ marginTop: 14 }}>Hand the device to the other player</div>
        )}
      </div>

      <div className={'rps-side p2' + (winner && winner !== viewingPlayer ? ' winner' : winner ? ' loser' : '')}>
        <div className="crown">👑</div>
        <div className="rps-mini">{viewingPlayer === 'player1' ? 'P2' : 'P1'}</div>
        <div className={'rps-pick ' + (oppChoice ? 'locked ' : '') + (revealed ? 'revealed' : '')}>
          {revealed && oppChoice ? RPS_OPTIONS.find(o => o.v === oppChoice)?.ic : '?'}
        </div>
        <div className="rps-label">{oppLabel}</div>
        <div className="rps-status">{revealed ? 'Revealed' : oppChoice ? 'Locked' : 'Pending'}</div>
      </div>

      {revealed && (
        <div className="rps-banner show">
          {youWon ? '⚡ You drop the puck' : `${oppLabel} drops the puck`}
        </div>
      )}
    </div>
  );
}

function Transition() {
  return (
    <div className="vs-stage" style={{ display: 'grid', placeItems: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="vs-glyph" style={{ fontSize: 96 }}>GO!</div>
        <div className="vs-meta">
          <div className="stk">Setting Starting Lines</div>
          <div className="pt2">Drop the Puck</div>
        </div>
      </div>
    </div>
  );
}
