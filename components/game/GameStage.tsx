'use client';

import type { ReactNode } from 'react';

interface GameStageProps {
  topBar?: ReactNode;
  children: ReactNode;
  bottomBar?: ReactNode;
}

/**
 * Game stage shell — fixed-position on desktop, scrollable on mobile.
 * Renders themed background + arena spotlight + CRT scan/grain overlay.
 * Scan/grain intensity driven by `--scan` and `--grain` body theme variables.
 */
export default function GameStage({ topBar, children, bottomBar }: GameStageProps) {
  return (
    <div className="game-stage">
      <div className="game-stage-spotlight" aria-hidden />
      <div className="game-stage-crt" aria-hidden />
      <div className="game-stage-frame">
        {topBar && <div className="game-stage-top">{topBar}</div>}
        <div className="game-stage-center">{children}</div>
        {bottomBar && <div className="game-stage-bottom">{bottomBar}</div>}
      </div>
    </div>
  );
}
