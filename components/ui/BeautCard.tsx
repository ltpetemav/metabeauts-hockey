'use client';

import React from 'react';
import Image from 'next/image';
import { BeautEntity, BeautMetadata, Position, Tier } from '@/types/game';
import { availableCards } from '@/lib/engine/cards';

interface BeautCardProps {
  beaut: BeautEntity | BeautMetadata;
  isActive?: boolean;
  isOnIce?: boolean;
  isExhausted?: boolean;
  showCardCount?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isSelected?: boolean;
}

const TIER_COLORS: Record<number, string> = {
  1: 'mb-tier-1',
  2: 'mb-tier-2',
  3: 'mb-tier-3',
  4: 'mb-tier-4',
};

const TIER_BADGE: Record<number, string> = {
  1: 'mb-tier-badge-1',
  2: 'mb-tier-badge-2',
  3: 'mb-tier-badge-3',
  4: 'mb-tier-badge-4',
};

const TIER_NAMES: Record<number, string> = {
  1: 'Rookie',
  2: 'Pro',
  3: 'All-Star',
  4: 'Legend',
};

const POSITION_ICONS: Record<Position, string> = {
  Winger: '🏒',
  Center: '⭐',
  Defender: '🛡️',
  Goaltender: '🥅',
};

const POSITION_COLORS: Record<Position, string> = {
  Winger: 'text-orange-400',
  Center: 'text-yellow-400',
  Defender: 'text-blue-400',
  Goaltender: 'text-green-400',
};

function isBeautEntity(b: BeautEntity | BeautMetadata): b is BeautEntity {
  return 'action_pile' in b;
}

export function BeautCard({
  beaut,
  isActive = false,
  isOnIce = false,
  isExhausted = false,
  showCardCount = false,
  onClick,
  size = 'md',
  className = '',
  isSelected = false,
}: BeautCardProps) {
  const tier = beaut.tier as Tier;
  const entity = isBeautEntity(beaut) ? beaut : null;
  const cardCount = entity ? availableCards(entity.action_pile).length : null;
  const exhausted = entity ? entity.is_exhausted : isExhausted;
  const hasTrait = entity ? entity.action_pile.some(c => c.is_trait) : false;

  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-28 h-38',
    lg: 'w-36 h-48',
  };

  const imageSize = {
    sm: { w: 80, h: 80 },
    md: { w: 112, h: 112 },
    lg: { w: 144, h: 144 },
  };

  return (
    <div
      className={`
        mb-beautcard relative flex flex-col rounded-xl overflow-hidden
        transition-all duration-200 hover:scale-105 select-none
        ${TIER_COLORS[tier]}
        ${isActive ? 'mb-card-active scale-105' : ''}
        ${isSelected ? 'mb-card-selected' : ''}
        ${exhausted ? 'opacity-50 grayscale' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={onClick}
    >
      {/* NFT Image */}
      <div className="relative w-full flex-1 min-h-0 overflow-hidden mb-card-image">
        <img
          src={beaut.image_url}
          alt={beaut.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23374151'><rect width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='14'>${beaut.token_id ?? '?'}</text></svg>`;
          }}
        />

        {/* On Ice indicator */}
        {isOnIce && (
          <div className="mb-card-on-ice">ON ICE</div>
        )}

        {/* Exhausted overlay */}
        {exhausted && (
          <div className="mb-card-exhausted">
            <span>EXHAUSTED</span>
          </div>
        )}

        {/* Trait badge */}
        {hasTrait && (
          <div className="mb-card-trait">✨</div>
        )}
      </div>

      {/* Card info */}
      <div className="mb-card-info">
        <p className="mb-card-name truncate">{beaut.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`mb-card-pos pos-${beaut.position}`}>
            {POSITION_ICONS[beaut.position]} {beaut.position}
          </span>
          <span className={`mb-card-tier-badge ${TIER_BADGE[tier]}`}>
            {TIER_NAMES[tier]}
          </span>
        </div>
        {beaut.trait_archetype && (
          <p className="mb-card-trait-name truncate">{beaut.trait_archetype}</p>
        )}
        {showCardCount && cardCount !== null && (
          <div className={`mb-card-count ${cardCount === 0 ? 'depleted' : ''}`}>
            {cardCount} cards
          </div>
        )}
      </div>
      <div className="tier-foil" data-tier={tier} />
    </div>
  );
}

// Mini version for bench/scoreboard — touch-friendly
export function BeautMini({
  beaut,
  isActive = false,
  onClick,
  cardCount,
}: {
  beaut: BeautEntity | BeautMetadata;
  isActive?: boolean;
  onClick?: () => void;
  cardCount?: number;
}) {
  const entity = isBeautEntity(beaut) ? beaut : null;
  const cards = cardCount ?? (entity ? availableCards(entity.action_pile).length : 0);
  const exhausted = entity?.is_exhausted || cards === 0;

  return (
    <div
      className={`mb-beautmini ${onClick ? 'cursor-pointer' : 'cursor-default'} ${isActive ? 'active' : ''} ${exhausted ? 'exhausted' : ''}`}
      onClick={onClick}
      title={`${beaut.name} — ${beaut.position} (${beaut.trait_archetype}) — ${cards} cards`}
    >
      <img
        src={beaut.image_url}
        alt={beaut.name}
        className="mb-beautmini-img"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='%23374151'><rect width='40' height='40'/><text x='20' y='25' text-anchor='middle' fill='%239ca3af' font-size='10'>${beaut.token_id ?? '?'}</text></svg>`;
        }}
      />
      <span className="mb-beautmini-name">{beaut.name.replace('MetaBeauts #', '#')}</span>
      <span className={`mb-beautmini-cards ${cards === 0 ? 'depleted' : ''}`}>
        {POSITION_ICONS[beaut.position]} {cards}
      </span>
    </div>
  );
}
