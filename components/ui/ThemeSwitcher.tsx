'use client';

import { useEffect, useState } from 'react';

const PRESETS = [
  { value: 'hud',   label: 'Modern HUD' },
  { value: 'retro', label: 'Retro 16-bit' },
  { value: 'vapor', label: 'Vapor' },
  { value: 'topps', label: 'Topps Card' },
] as const;

type Preset = typeof PRESETS[number]['value'];

const STORAGE_KEY = 'mb-preset';

export default function ThemeSwitcher() {
  const [preset, setPreset] = useState<Preset>('hud');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null) as Preset | null;
    if (saved && PRESETS.some(p => p.value === saved)) {
      setPreset(saved);
      document.body.dataset.preset = saved;
    }
  }, []);

  const select = (p: Preset) => {
    setPreset(p);
    document.body.dataset.preset = p;
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, p);
    setOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
        fontFamily: 'var(--mono-font)',
      }}
    >
      {open && (
        <div
          className="mb-panel"
          style={{
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 160,
          }}
        >
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => select(p.value)}
              className="mb-pill"
              style={{
                width: '100%',
                cursor: 'pointer',
                background: preset === p.value ? 'var(--accent)' : 'rgba(255,255,255,.04)',
                color: preset === p.value ? '#000' : 'var(--text-dim)',
                borderColor: preset === p.value ? 'var(--accent)' : 'var(--panel-border)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <button
        className="mb-pill"
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: 'pointer',
          background: 'var(--panel-bg)',
          borderColor: 'var(--accent)',
          color: 'var(--accent)',
        }}
      >
        🎨 {PRESETS.find(p => p.value === preset)?.label}
      </button>
    </div>
  );
}
