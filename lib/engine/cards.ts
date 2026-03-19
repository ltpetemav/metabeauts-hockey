/**
 * Action card definitions, position compositions, and deck building.
 * Based on spec Section 2.4
 */

import { Position, CardType, ActionCard, TraitName, TraitType } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

// Position-legal card types (which cards each position can hold)
export const POSITION_OFFENSIVE_CARDS: Record<Position, CardType[]> = {
  Winger: ['Shoot', 'Pass'],
  Center: ['Shoot', 'Pass', 'Skate'],
  Defender: ['Pass', 'Skate', 'Block', 'Catch', 'Steal', 'Check'],
  Goaltender: ['Block', 'Catch'],
};

export const POSITION_DEFENSIVE_CARDS: Record<Position, CardType[]> = {
  Winger: [],
  Center: ['Block', 'Steal'],
  Defender: ['Block', 'Catch', 'Steal', 'Check'],
  Goaltender: ['Block', 'Catch'],
};

// All legal cards per position (union of offense + defense)
export const POSITION_LEGAL_CARDS: Record<Position, CardType[]> = {
  Winger: ['Shoot', 'Pass'],
  Center: ['Shoot', 'Pass', 'Skate', 'Block', 'Steal'],
  Defender: ['Pass', 'Skate', 'Block', 'Catch', 'Steal', 'Check'],
  Goaltender: ['Block', 'Catch'],
};

// Default starting card compositions per position for on-ice beauts (3 cards)
export function getDefaultOnIceCards(position: Position): CardType[] {
  switch (position) {
    case 'Winger':
      return ['Shoot', 'Shoot', 'Pass'];
    case 'Center':
      return ['Pass', 'Skate', 'Steal'];
    case 'Defender':
      return ['Skate', 'Block', 'Check'];
    case 'Goaltender':
      return ['Block', 'Block', 'Catch'];
  }
}

// Default starting card compositions per position for bench beauts (2 cards)
export function getDefaultBenchCards(position: Position): CardType[] {
  switch (position) {
    case 'Winger':
      return ['Shoot', 'Pass'];
    case 'Center':
      return ['Pass', 'Steal'];
    case 'Defender':
      return ['Skate', 'Block'];
    case 'Goaltender':
      return ['Block', 'Catch'];
  }
}

// Trait type mapping from trait name
export const TRAIT_TYPES: Record<string, TraitType> = {
  'Two-Way': 'Forced',
  'Enforcer': 'Forced',
  'Power Fwd': 'Forced',
  'Sniper': 'Natural',
  'Stand Up': 'Forced',
  'Two-Timer': 'Natural',
  'Hybrid': 'Forced',
  'Dangler': 'Forced',
  'Playmaker': 'Forced',
  'Grinder': 'Forced',
  'Puck Mover': 'Forced',
  'Butterfly': 'Natural',
  'Offensive': 'Forced',
  'Defensive': 'Forced',
};

// Which traits go in the draw pile vs held separately
export function isNaturalTrait(traitName: string): boolean {
  const type = TRAIT_TYPES[traitName];
  return type === 'Natural';
}

export function createActionCard(card_type: CardType, trait_name?: TraitName): ActionCard {
  return {
    id: uuidv4(),
    card_type,
    is_trait: card_type === 'Trait',
    trait_name,
    trait_type: trait_name ? (TRAIT_TYPES[trait_name] as TraitType) : undefined,
    state: 'in_pile',
    returns_to_pile: trait_name === 'Butterfly',
  };
}

export function createTraitCard(traitName: TraitName, acquiredFrom: 'setup' | 'catch_up') {
  return {
    id: uuidv4(),
    trait_name: traitName,
    trait_type: (TRAIT_TYPES[traitName] || 'Forced') as TraitType,
    is_spent: false,
    returns_to_pile: traitName === 'Butterfly',
    acquired_from: acquiredFrom,
  };
}

// Build initial action card pile for a beaut
// Natural traits go IN the pile; Forced traits are held separately
export function buildActionPile(
  position: Position,
  isOnIce: boolean,
  traitName?: string | null
): ActionCard[] {
  const cardTypes = isOnIce
    ? getDefaultOnIceCards(position)
    : getDefaultBenchCards(position);

  const cards: ActionCard[] = cardTypes.map(ct => createActionCard(ct));

  // If this beaut has a Natural trait, add it to the pile
  if (traitName && isNaturalTrait(traitName)) {
    cards.push(createActionCard('Trait', traitName as TraitName));
  }

  // Shuffle the pile
  return shuffleArray(cards);
}

// Deterministic shuffle using Fisher-Yates
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use Math.random for client-side preview; server uses CSPRNG
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Server-side RNG draw from a pile (top card drawn)
export function drawFromPile(pile: ActionCard[]): { drawn: ActionCard; remaining: ActionCard[] } | null {
  const inPile = pile.filter(c => c.state === 'in_pile');
  if (inPile.length === 0) return null;

  // Server uses crypto.randomInt equivalent — here we use Math.random for client
  const idx = Math.floor(Math.random() * inPile.length);
  const drawn = { ...inPile[idx], state: 'played' as const };
  const remaining = pile.filter(c => c.id !== inPile[idx].id);
  return { drawn, remaining };
}

// Count available (in_pile) cards
export function availableCards(pile: ActionCard[]): ActionCard[] {
  return pile.filter(c => c.state === 'in_pile');
}

// Is a card type legal for a position?
export function isCardLegalForPosition(cardType: CardType, position: Position): boolean {
  if (cardType === 'Trait') return true; // Trait always legal
  return POSITION_LEGAL_CARDS[position].includes(cardType);
}
