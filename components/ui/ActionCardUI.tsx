'use client';

import React from 'react';
import { ActionCard, CardType } from '@/types/game';

const CARD_ICONS: Record<CardType, string> = {
  Shoot: '🎯',
  Pass: '🏒',
  Skate: '⛸️',
  Block: '🛡️',
  Catch: '🧤',
  Steal: '💨',
  Check: '💪',
  Trait: '✨',
};

const CARD_COLORS: Record<CardType, string> = {
  Shoot: 'from-red-800 to-red-600 border-red-400',
  Pass: 'from-blue-800 to-blue-600 border-blue-400',
  Skate: 'from-cyan-800 to-cyan-600 border-cyan-400',
  Block: 'from-gray-700 to-gray-600 border-gray-400',
  Catch: 'from-green-800 to-green-600 border-green-400',
  Steal: 'from-orange-800 to-orange-600 border-orange-400',
  Check: 'from-yellow-800 to-yellow-700 border-yellow-400',
  Trait: 'from-purple-800 to-purple-600 border-purple-400',
};

const CARD_DESCRIPTIONS: Record<CardType, string> = {
  Shoot: 'Score a goal! (requires canShoot)',
  Pass: 'Switch Beaut; enables canShoot',
  Skate: 'Keep puck; enables canShoot',
  Block: 'Stops Shoot; puck returns to shooter',
  Catch: 'Stops Shoot; puck transfers to you',
  Steal: 'Stops Pass; puck transfers to you',
  Check: 'Stops Skate; puck transfers to you',
  Trait: 'Special ability',
};

interface ActionCardUIProps {
  card?: ActionCard;
  cardType?: CardType;
  isFaceDown?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  highlighted?: boolean;
}

export function ActionCardUI({
  card,
  cardType,
  isFaceDown = false,
  isSelected = false,
  onClick,
  size = 'md',
  disabled = false,
  highlighted = false,
}: ActionCardUIProps) {
  const type = card?.card_type ?? cardType;

  const sizeClasses = {
    sm: 'w-16 h-20 text-xs',
    md: 'w-20 h-28 text-sm',
    lg: 'w-24 h-32 text-base',
  };

  if (isFaceDown) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          rounded-xl border-2 border-gray-600 bg-gradient-to-br from-gray-800 to-gray-700
          flex items-center justify-center cursor-default select-none
          shadow-lg
        `}
      >
        <div className="text-center">
          <div className="text-2xl">🔒</div>
          <div className="text-gray-400 text-xs mt-1">MB:H</div>
        </div>
      </div>
    );
  }

  if (!type) return null;

  const displayType = card?.is_trait && card.trait_name ? `${card.trait_name}` : type;
  const icon = card?.is_trait ? '✨' : CARD_ICONS[type];
  const colorClass = CARD_COLORS[type];
  const description = card?.is_trait && card.trait_name
    ? `${card.trait_name} trait`
    : CARD_DESCRIPTIONS[type];

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-xl border-2 bg-gradient-to-br cursor-pointer select-none
        flex flex-col items-center justify-between p-2
        transition-all duration-150 hover:scale-105 shadow-lg
        ${colorClass}
        ${isSelected ? 'ring-2 ring-white scale-110 shadow-white/30' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''}
        ${highlighted ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
      `}
      onClick={disabled ? undefined : onClick}
      title={description}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-center">
        <div className="font-bold text-white leading-tight">{displayType}</div>
        {size !== 'sm' && (
          <div className="text-gray-300 text-xs mt-0.5 leading-tight line-clamp-2">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

// Face-down card pile indicator
export function CardPile({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <div
      className="relative cursor-pointer group"
      onClick={onClick}
      title={`${count} cards remaining`}
    >
      {count > 2 && (
        <div className="absolute top-1.5 left-1.5 w-16 h-20 rounded-xl border-2 border-gray-600 bg-gray-800/60" />
      )}
      {count > 1 && (
        <div className="absolute top-1 left-1 w-16 h-20 rounded-xl border-2 border-gray-600 bg-gray-800/70" />
      )}
      {count > 0 ? (
        <div className="relative w-16 h-20 rounded-xl border-2 border-gray-500 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center shadow-lg group-hover:border-gray-300 transition-colors">
          <div className="text-center">
            <div className="text-xl">🔒</div>
            <div className="text-white font-bold text-sm">{count}</div>
          </div>
        </div>
      ) : (
        <div className="w-16 h-20 rounded-xl border-2 border-dashed border-red-700 bg-red-950/30 flex items-center justify-center">
          <div className="text-red-400 text-xs text-center">
            <div>💀</div>
            <div>Empty</div>
          </div>
        </div>
      )}
    </div>
  );
}
