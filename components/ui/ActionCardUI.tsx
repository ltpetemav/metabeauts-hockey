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
    sm: 'w-14 h-20 sm:w-16 sm:h-20 text-xs',
    md: 'w-16 h-24 sm:w-20 sm:h-28 text-xs sm:text-sm min-h-[60px]',
    lg: 'w-20 h-28 sm:w-24 sm:h-32 text-sm sm:text-base',
  };

  if (isFaceDown) {
    return (
      <div className={`${sizeClasses[size]} mb-actioncard mb-actioncard-back`}>
        <div className="text-center">
          <div className="text-2xl">🔒</div>
          <div className="mb-actioncard-back-label">MB:H</div>
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
        mb-actioncard rounded-xl border-2 bg-gradient-to-br cursor-pointer select-none
        flex flex-col items-center justify-between p-2
        transition-all duration-150 hover:scale-105
        ${colorClass}
        ${isSelected ? 'mb-actioncard-selected' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''}
        ${highlighted ? 'mb-actioncard-highlighted' : ''}
      `}
      onClick={disabled ? undefined : onClick}
      title={description}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-center">
        <div className="mb-actioncard-name">{displayType}</div>
        {size !== 'sm' && (
          <div className="mb-actioncard-desc line-clamp-2">{description}</div>
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
      {count > 2 && <div className="mb-cardpile-shadow" style={{ top: '6px', left: '6px' }} />}
      {count > 1 && <div className="mb-cardpile-shadow" style={{ top: '3px', left: '3px' }} />}
      {count > 0 ? (
        <div className="mb-cardpile">
          <div className="text-center">
            <div className="text-xl">🔒</div>
            <div className="mb-cardpile-count">{count}</div>
          </div>
        </div>
      ) : (
        <div className="mb-cardpile-empty">
          <div>💀</div>
          <div>Empty</div>
        </div>
      )}
    </div>
  );
}
