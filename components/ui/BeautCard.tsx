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
  1: 'border-gray-400 bg-gray-900/80',
  2: 'border-blue-400 bg-blue-950/80',
  3: 'border-purple-400 bg-purple-950/80',
  4: 'border-yellow-400 bg-yellow-950/80',
};

const TIER_BADGE: Record<number, string> = {
  1: 'bg-gray-600 text-gray-200',
  2: 'bg-blue-700 text-blue-200',
  3: 'bg-purple-700 text-purple-200',
  4: 'bg-yellow-600 text-yellow-100',
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
        relative flex flex-col rounded-xl border-2 overflow-hidden cursor-pointer
        transition-all duration-200 hover:scale-105 select-none
        ${TIER_COLORS[tier]}
        ${isActive ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-105' : ''}
        ${isSelected ? 'ring-2 ring-green-400 ring-offset-1' : ''}
        ${exhausted ? 'opacity-50 grayscale' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={onClick}
    >
      {/* NFT Image */}
      <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-gray-800">
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
          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded font-bold">
            ON ICE
          </div>
        )}

        {/* Exhausted overlay */}
        {exhausted && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold text-center">EXHAUSTED</span>
          </div>
        )}

        {/* Trait badge */}
        {hasTrait && (
          <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1 rounded">
            ✨
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-1 bg-black/60">
        <p className="text-white text-xs font-semibold truncate leading-tight">
          {beaut.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xs ${POSITION_COLORS[beaut.position]}`}>
            {POSITION_ICONS[beaut.position]} {beaut.position}
          </span>
          <span className={`text-xs px-1 rounded ${TIER_BADGE[tier]}`}>
            {TIER_NAMES[tier]}
          </span>
        </div>
        {beaut.trait_archetype && (
          <p className="text-purple-300 text-xs mt-0.5 truncate">
            {beaut.trait_archetype}
          </p>
        )}
        {showCardCount && cardCount !== null && (
          <div className={`text-xs mt-0.5 font-bold ${cardCount === 0 ? 'text-red-400' : 'text-green-400'}`}>
            {cardCount} cards
          </div>
        )}
      </div>
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
      className={`
        relative flex flex-col items-center p-1 rounded-lg border
        transition-all duration-150 hover:scale-105 active:scale-95
        min-w-[52px] min-h-[52px]
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${isActive ? 'border-white bg-white/20 scale-105' : 'border-gray-600 bg-gray-800/60'}
        ${exhausted ? 'opacity-40 grayscale' : ''}
      `}
      onClick={onClick}
      title={`${beaut.name} — ${beaut.position} (${beaut.trait_archetype}) — ${cards} cards`}
    >
      <img
        src={beaut.image_url}
        alt={beaut.name}
        className="w-10 h-10 sm:w-10 sm:h-10 rounded object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='%23374151'><rect width='40' height='40'/><text x='20' y='25' text-anchor='middle' fill='%239ca3af' font-size='10'>${beaut.token_id ?? '?'}</text></svg>`;
        }}
      />
      <span className="text-xs text-gray-300 truncate max-w-[52px] text-center">{beaut.name.replace('MetaBeauts #', '#')}</span>
      <span className={`text-xs font-bold ${cards === 0 ? 'text-red-400' : 'text-green-400'}`}>
        {POSITION_ICONS[beaut.position]} {cards}
      </span>
    </div>
  );
}
