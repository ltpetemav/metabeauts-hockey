'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pregame', label: 'Lobby' },
  { href: '/game', label: 'Game' },
  { href: '/roster', label: 'Roster' },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/rules', label: 'Rules' },
];

interface MbNavProps {
  wallet?: string;
}

export default function MbNav({ wallet = '0x9f7a…42c8' }: MbNavProps) {
  const pathname = usePathname();
  return (
    <nav className="mb-nav">
      <Link href="/" className="mb-nav-logo">
        <span className="mark">
          <svg viewBox="0 0 24 24">
            <path d="M5 4 L19 4 L19 7 L13 7 L13 20 L11 20 L11 7 L5 7 Z" fill="white" />
          </svg>
        </span>
        <span>MetaBeauts</span>
      </Link>
      <div className="mb-nav-links">
        {NAV_LINKS.map((l) => {
          const isCurrent = l.href === '/' ? pathname === '/' : pathname?.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={isCurrent ? 'current' : ''}>
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="mb-nav-wallet">
        <span className="dot" />
        {wallet}
      </div>
    </nav>
  );
}
