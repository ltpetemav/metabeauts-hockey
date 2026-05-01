'use client';

import { useEffect, useRef, useState } from 'react';
import './pregame.css';

// ─────────────────────────────────────────────
// Data (mirrors design handoff shared.jsx)
// ─────────────────────────────────────────────

type Position = 'W' | 'C' | 'D' | 'G';

interface Beaut {
  tok: number;
  pos: Position;
  position: string;
  tier: number;
  name: string;
  trait: string;
  num: string;
  cards: number;
}

const beautImg = (id: number) =>
  `https://assets.bueno.art/images/b93fd12b-3c56-4f5d-9277-fa952f95cffb/default/${id}`;

const P1_ROSTER: Beaut[] = [
  { tok: 42,  pos: 'W', position: 'Winger',     tier: 3, name: 'Beaut #42',  trait: 'Sniper',     num: '07', cards: 5 },
  { tok: 155, pos: 'W', position: 'Winger',     tier: 2, name: 'Beaut #155', trait: 'Two-Way',    num: '14', cards: 5 },
  { tok: 88,  pos: 'C', position: 'Center',     tier: 4, name: 'Beaut #88',  trait: 'Playmaker',  num: '19', cards: 6 },
  { tok: 314, pos: 'D', position: 'Defender',   tier: 3, name: 'Beaut #314', trait: 'Stand Up',   num: '27', cards: 5 },
  { tok: 501, pos: 'D', position: 'Defender',   tier: 2, name: 'Beaut #501', trait: 'Enforcer',   num: '44', cards: 4 },
  { tok: 777, pos: 'G', position: 'Goaltender', tier: 4, name: 'Beaut #777', trait: 'Butterfly',  num: '31', cards: 6 },
];

const P2_ROSTER: Beaut[] = [
  { tok: 1234, pos: 'W', position: 'Winger',     tier: 3, name: 'Beaut #1234', trait: 'Dangler',    num: '09', cards: 5 },
  { tok: 1500, pos: 'W', position: 'Winger',     tier: 2, name: 'Beaut #1500', trait: 'Power Fwd',  num: '22', cards: 4 },
  { tok: 999,  pos: 'C', position: 'Center',     tier: 3, name: 'Beaut #999',  trait: 'Hybrid',     num: '11', cards: 5 },
  { tok: 2000, pos: 'D', position: 'Defender',   tier: 4, name: 'Beaut #2000', trait: 'Two-Timer',  num: '04', cards: 6 },
  { tok: 2500, pos: 'D', position: 'Defender',   tier: 2, name: 'Beaut #2500', trait: 'Grinder',    num: '55', cards: 4 },
  { tok: 1,    pos: 'G', position: 'Goaltender', tier: 3, name: 'Beaut #1',    trait: 'Stand Up',   num: '30', cards: 5 },
];

const EXTRA: Beaut[] = [
  { tok: 101,  pos: 'W', position: 'Winger',     tier: 1, name: 'Beaut #101',  trait: 'Grinder',    num: '08', cards: 4 },
  { tok: 222,  pos: 'C', position: 'Center',     tier: 3, name: 'Beaut #222',  trait: 'Faceoff',    num: '21', cards: 5 },
  { tok: 1337, pos: 'D', position: 'Defender',   tier: 4, name: 'Beaut #1337', trait: 'Two-Way',    num: '33', cards: 6 },
  { tok: 420,  pos: 'W', position: 'Winger',     tier: 2, name: 'Beaut #420',  trait: 'Speedster',  num: '69', cards: 4 },
  { tok: 911,  pos: 'G', position: 'Goaltender', tier: 3, name: 'Beaut #911',  trait: 'Reflex',     num: '35', cards: 5 },
];

const COLLECTION: Beaut[] = [...P1_ROSTER, ...EXTRA];

// ─────────────────────────────────────────────
// Phase definitions
// ─────────────────────────────────────────────

type Phase = 'vs' | 'rps' | 'line';

const PHASES: { value: Phase; label: string }[] = [
  { value: 'vs',   label: 'Opponent Reveal' },
  { value: 'rps',  label: 'RPS · Coin Flip' },
  { value: 'line', label: 'Line Selection' },
];

const RPS_OPTIONS = [
  { v: 'rock',     ic: '🪨', label: 'Rock' },
  { v: 'paper',    ic: '📄', label: 'Paper' },
  { v: 'scissors', ic: '✂️', label: 'Scissors' },
] as const;

type RpsPick = typeof RPS_OPTIONS[number]['v'];

// ─────────────────────────────────────────────
// 1. VS REVEAL
// ─────────────────────────────────────────────

function VsReveal() {
  const STEPS = [
    { id: 'crash', label: 'Teams Crash In', ms: 0 },
    { id: 'vs',    label: 'VS Drop',        ms: 900 },
    { id: 'lines', label: 'Lineups',        ms: 1900 },
    { id: 'ready', label: 'Ready',          ms: 3500 },
  ];

  const [step, setStep] = useState(0);
  const [shock, setShock] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearT = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const triggerShock = () => {
    setShock(true);
    timersRef.current.push(setTimeout(() => setShock(false), 1100));
  };

  const play = (from = 0) => {
    clearT();
    setStep(from);
    if (STEPS[from].id === 'vs') triggerShock();
    STEPS.slice(from + 1).forEach((s, i) => {
      const tm = setTimeout(() => {
        setStep(from + 1 + i);
        if (s.id === 'vs') triggerShock();
      }, s.ms - STEPS[from].ms);
      timersRef.current.push(tm);
    });
  };

  useEffect(() => {
    play(0);
    return clearT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passed = (id: string) => step >= STEPS.findIndex(s => s.id === id);

  return (
    <>
      <div className="seq-bar">
        <span className="label">VS Sequence</span>
        <div className="steps">
          {STEPS.slice(0, -1).map((s, i) => (
            <div
              key={s.id}
              className={'step ' + (i === step ? 'cur' : '') + (i < step ? ' done' : '')}
              onClick={() => { clearT(); setStep(i); if (s.id === 'vs') triggerShock(); }}
            >
              {i + 1}. {s.label}
            </div>
          ))}
        </div>
        <button className="ctrl" onClick={() => play(0)}>↻ Replay</button>
      </div>

      <div className={'vs-stage' + (shock ? ' shock' : '')}>
        <div className={'team p1' + (passed('crash') ? ' crash' : '')}>
          <div className="team-badge">HT</div>
          <div className="team-name">Hat Trick</div>
          <div className="team-wallet">0x9f7a…42c8</div>
          <div className="team-stats">
            <div className="s"><div className="v">12-3-1</div><div className="l">Record</div></div>
            <div className="s"><div className="v">#47</div><div className="l">Rank</div></div>
            <div className="s"><div className="v">2,180</div><div className="l">ELO</div></div>
          </div>
          <div className="team-line">
            {P1_ROSTER.map((b, i) => (
              <div
                key={b.tok}
                className={'lineup-card' + (passed('lines') ? ' show' : '')}
                style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
              >
                <img src={beautImg(b.tok)} alt="" />
                <div className="num">#{b.num}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={'vs-center' + (passed('vs') ? ' show' : '')}>
          <div className="vs-glyph">VS</div>
          <div className="vs-meta">
            <div className="stk">Stake</div>
            <div className="pt2">+50 PTS</div>
          </div>
        </div>

        <div className={'team p2' + (passed('crash') ? ' crash' : '')}>
          <div className="team-badge">IC</div>
          <div className="team-name">Ice Cold</div>
          <div className="team-wallet">0x3b1d…88af</div>
          <div className="team-stats">
            <div className="s"><div className="v">9-5-2</div><div className="l">Record</div></div>
            <div className="s"><div className="v">#112</div><div className="l">Rank</div></div>
            <div className="s"><div className="v">1,940</div><div className="l">ELO</div></div>
          </div>
          <div className="team-line">
            {P2_ROSTER.map((b, i) => (
              <div
                key={b.tok}
                className={'lineup-card' + (passed('lines') ? ' show' : '')}
                style={{ animationDelay: passed('lines') ? `${i * 0.08}s` : '0s' }}
              >
                <img src={beautImg(b.tok)} alt="" />
                <div className="num">#{b.num}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={'vs-bottom' + (passed('ready') ? ' show' : '')}>
        <div className="left">
          <div className="nfo">Mode · <b>Ranked · S1</b></div>
          <div className="nfo">Period Length · <b>3 × 8 turns</b></div>
          <div className="nfo">Stake · <b>50 PTS each</b></div>
        </div>
        <div className="ready-pulse"><span className="dot" />Both players ready</div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// 2. RPS
// ─────────────────────────────────────────────

function Rps() {
  const STEPS = [
    { id: 'choose',  label: 'Choose',  ms: 0 },
    { id: 'count3',  label: '3',       ms: 600 },
    { id: 'count2',  label: '2',       ms: 1300 },
    { id: 'count1',  label: '1',       ms: 2000 },
    { id: 'reveal',  label: 'Reveal',  ms: 2700 },
    { id: 'winner',  label: 'Winner',  ms: 3300 },
  ];

  const [step, setStep] = useState(0);
  const [pick, setPick] = useState<RpsPick>('rock');
  const oppPick: RpsPick = 'scissors';
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearT = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const play = (from = 0) => {
    clearT();
    setStep(from);
    STEPS.slice(from + 1).forEach((s, i) => {
      const tm = setTimeout(() => setStep(from + 1 + i), s.ms - STEPS[from].ms);
      timersRef.current.push(tm);
    });
  };

  useEffect(() => {
    play(0);
    return clearT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passed = (id: string) => step >= STEPS.findIndex(s => s.id === id);
  const countdown = passed('count3') && !passed('reveal') ? (3 - (step - 1)) : null;
  const revealed = passed('reveal');
  const winner = (passed('winner') ? 'p1' : null) as 'p1' | 'p2' | null;

  return (
    <>
      <div className="seq-bar">
        <span className="label">RPS Sequence</span>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={'step ' + (i === step ? 'cur' : '') + (i < step ? ' done' : '')}
              onClick={() => { clearT(); setStep(i); }}
            >
              {i + 1}. {s.label}
            </div>
          ))}
        </div>
        <button className="ctrl" onClick={() => play(0)}>↻ Replay</button>
      </div>

      <div className="rps">
        <div className={'rps-side p1' + (winner === 'p1' ? ' winner' : '') + (winner === 'p2' ? ' loser' : '')}>
          <div className="crown">👑</div>
          <div className="rps-mini">HT</div>
          <div className={
            'rps-pick ' +
            (pick ? 'locked ' : '') +
            (passed('count3') && !revealed ? 'shaking ' : '') +
            (revealed ? 'revealed' : '')
          }>
            {revealed ? RPS_OPTIONS.find(o => o.v === pick)?.ic : '?'}
          </div>
          <div className="rps-label">You</div>
          <div className="rps-status">{revealed ? 'Revealed' : pick ? 'Locked' : 'Pick'}</div>
        </div>

        <div className="rps-vs">
          <div className={'rps-clock' + (countdown !== null ? ' tick' : '')}>
            {revealed ? 'GO!' : (countdown !== null ? countdown : '0:08')}
          </div>
          <div className="rps-prompt">{revealed ? 'Drop the Puck' : 'Choose Your Hand'}</div>
          <div className="rps-options">
            {RPS_OPTIONS.map(o => (
              <div
                key={o.v}
                className={'rps-opt ' + (pick === o.v ? 'picked' : '')}
                onClick={() => !passed('reveal') && setPick(o.v)}
              >
                {o.ic}
              </div>
            ))}
          </div>
        </div>

        <div className={'rps-side p2' + (winner === 'p2' ? ' winner' : '') + (winner === 'p1' ? ' loser' : '')}>
          <div className="crown">👑</div>
          <div className="rps-mini">IC</div>
          <div className={
            'rps-pick ' +
            (passed('count3') ? 'locked ' : '') +
            (passed('count3') && !revealed ? 'shaking ' : '') +
            (revealed ? 'revealed' : '')
          }>
            {revealed ? RPS_OPTIONS.find(o => o.v === oppPick)?.ic : '?'}
          </div>
          <div className="rps-label">Ice Cold</div>
          <div className="rps-status">{revealed ? 'Revealed' : 'Locked'}</div>
        </div>

        <div className={'rps-banner' + (winner ? ' show' : '')}>
          Hat Trick wins · First Drop
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// 3. LINE SELECTION
// ─────────────────────────────────────────────

const SLOTS: { key: string; pos: Position }[] = [
  { key: 'W1', pos: 'W' },
  { key: 'W2', pos: 'W' },
  { key: 'C',  pos: 'C' },
  { key: 'D1', pos: 'D' },
  { key: 'D2', pos: 'D' },
  { key: 'G',  pos: 'G' },
];

interface ProjectileState {
  tok: number;
  from: { left: number; top: number };
  to:   { left: number; top: number };
  animating?: boolean;
}

function LineSelection() {
  const [filter, setFilter] = useState<'ALL' | Position>('ALL');
  const [line, setLine] = useState<Record<string, number | null>>({
    W1: null, W2: null, C: null, D1: null, D2: null, G: null,
  });
  const [justFilled, setJustFilled] = useState<string | null>(null);
  const [projectile, setProjectile] = useState<ProjectileState | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearT = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const filteredRoster: Beaut[] = filter === 'ALL'
    ? COLLECTION
    : COLLECTION.filter(b => b.pos === filter);

  const inLine = new Set(Object.values(line).filter((v): v is number => v !== null));

  const flyToSlot = (b: Beaut) => {
    const targets = SLOTS.filter(s => s.pos === b.pos).map(s => s.key);
    const open = targets.find(k => !line[k]);
    const slotKey = open || targets[0];
    const cardEl = cardRefs.current[b.tok];
    const slotEl = slotRefs.current[slotKey];
    if (!cardEl || !slotEl) return;
    const cR = cardEl.getBoundingClientRect();
    const sR = slotEl.getBoundingClientRect();

    setProjectile({
      tok: b.tok,
      from: { left: cR.left, top: cR.top },
      to:   { left: sR.left + (sR.width - 80) / 2, top: sR.top + (sR.height - 112) / 2 },
    });

    timersRef.current.push(setTimeout(() => {
      setProjectile(p => p ? { ...p, animating: true } : null);
    }, 30));

    timersRef.current.push(setTimeout(() => {
      setLine(prev => ({ ...prev, [slotKey]: b.tok }));
      setJustFilled(slotKey);
      setProjectile(null);
      setTimeout(() => setJustFilled(null), 700);
    }, 700));
  };

  const togglePick = (b: Beaut) => {
    if (inLine.has(b.tok)) {
      setLine(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { if (next[k] === b.tok) next[k] = null; });
        return next;
      });
      return;
    }
    flyToSlot(b);
  };

  const autoFill = () => {
    setLine({ W1: null, W2: null, C: null, D1: null, D2: null, G: null });
    clearT();
    const picks = [42, 155, 88, 314, 501, 777]
      .map(tok => P1_ROSTER.find(b => b.tok === tok))
      .filter((b): b is Beaut => Boolean(b));
    picks.forEach((b, i) => {
      timersRef.current.push(setTimeout(() => flyToSlot(b), i * 900));
    });
  };

  useEffect(() => {
    const t = setTimeout(autoFill, 400);
    return () => { clearTimeout(t); clearT(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filled = Object.values(line).filter(Boolean).length;

  return (
    <>
      <div className="seq-bar">
        <span className="label">Line Sequence</span>
        <div className="steps">
          <div className="step cur">Auto-fill demo · {filled}/6</div>
        </div>
        <button className="ctrl" onClick={autoFill}>↻ Replay Auto-Pick</button>
      </div>

      <div className="line-stage">
        <div className="line-pool">
          <div className="pool-head">
            <h3>Your Roster · 11 Beauts</h3>
            <div className="pool-filter">
              {(['ALL', 'W', 'C', 'D', 'G'] as const).map(f => (
                <button
                  key={f}
                  className={'chip ' + (filter === f ? 'on' : '')}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="pool-grid">
            {filteredRoster.map(b => (
              <div
                key={b.tok}
                ref={el => { cardRefs.current[b.tok] = el; }}
                className={'pcard' + (inLine.has(b.tok) ? ' in-line' : '')}
                onClick={() => togglePick(b)}
              >
                <div className="ph">
                  <div className={'pos-tag ' + b.pos}>{b.pos}</div>
                  <img src={beautImg(b.tok)} alt={b.name} />
                </div>
                <div className="nfo">
                  <div className="nm">{b.trait}</div>
                  <div className="meta"><span>#{b.num}</span><span>T{b.tier}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="line-builder">
          <div className="lb-head">
            <h3>Starting Line</h3>
            <div className="sub">2W · 1C · 2D · 1G  ·  {filled}/6 filled</div>
          </div>
          <div className="lb-slots">
            {SLOTS.map(({ key, pos }) => {
              const tok = line[key];
              const b = tok ? COLLECTION.concat(P1_ROSTER).find(x => x.tok === tok) : null;
              return (
                <div
                  key={key}
                  ref={el => { slotRefs.current[key] = el; }}
                  className={'slot ' + pos + (b ? ' filled' : '') + (justFilled === key ? ' just-filled' : '')}
                >
                  <div className="role-badge">{key}</div>
                  {b ? (
                    <div className="filled-card">
                      <img src={beautImg(b.tok)} alt={b.name} />
                      <div className="nfo">
                        <b>#{b.num}</b><span>T{b.tier} · {b.trait}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">
                      <div className="lab">{pos}</div>
                      EMPTY
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="lb-foot">
            <div className="ready">
              {filled === 6 ? (
                <>Line Set · <span className="ok">READY</span></>
              ) : (
                <>Pick {6 - filled} more</>
              )}
            </div>
            <button className="mb-btn">Confirm Line</button>
          </div>
        </div>
      </div>

      {projectile && (
        <div
          className="projectile"
          style={{
            left: projectile.animating ? projectile.to.left : projectile.from.left,
            top:  projectile.animating ? projectile.to.top  : projectile.from.top,
            transform: projectile.animating ? 'rotate(720deg) scale(1.05)' : 'rotate(0) scale(1)',
            opacity: 1,
          }}
        >
          <img src={beautImg(projectile.tok)} alt="" />
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PregamePage() {
  const [phase, setPhase] = useState<Phase>('vs');

  return (
    <main className="pregame-stage">
      <div className="phase-tabs">
        {PHASES.map((p, i) => {
          const cur = phase === p.value;
          const idx = PHASES.findIndex(x => x.value === phase);
          const done = i < idx;
          return (
            <div
              key={p.value}
              className={'pt ' + (cur ? 'cur' : '') + (done ? ' done' : '')}
              onClick={() => setPhase(p.value)}
            >
              <span className="n">{i + 1}</span>
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>

      {phase === 'vs'   && <VsReveal key="vs" />}
      {phase === 'rps'  && <Rps key="rps" />}
      {phase === 'line' && <LineSelection key="line" />}
    </main>
  );
}
