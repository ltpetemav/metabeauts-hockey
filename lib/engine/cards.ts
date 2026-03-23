/**
 * Action card definitions, position compositions, deck building, and card cycling.
 * New Action Deck system: cards return to a shared pool after use.
 */

import { Position, CardType, ActionCard, TraitName, BeautEntity } from '@/types/game';
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

// Primary Action per position (for Two-Way, Two-Timer, Defensive/Offensive archetype)
export const PRIMARY_ACTION: Record<Position, CardType> = {
  Winger: 'Shoot',
  Center: 'Pass',
  Defender: 'Skate',
  Goaltender: 'Block',
};

// Backup Action per position (for Two-Timer fallback)
export const BACKUP_ACTION: Record<Position, CardType> = {
  Winger: 'Pass',
  Center: 'Skate',
  Defender: 'Block',
  Goaltender: 'Catch',
};

// Position's default defensive action (for "Position Action" traits on defense)
export const POSITION_DEFENSE_ACTION: Record<Position, CardType | null> = {
  Winger: null, // Wingers have no defensive cards
  Center: 'Steal',
  Defender: 'Check',
  Goaltender: 'Catch',
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

export function createActionCard(card_type: CardType, trait_name?: TraitName): ActionCard {
  return {
    id: uuidv4(),
    card_type,
    is_trait: card_type === 'Trait',
    trait_name,
  };
}

/**
 * Build the full 24-card Action Deck for a player.
 * 18 position-based action cards + 6 trait cards (one per Beaut's archetype).
 */
export function buildFullDeck(beauts: BeautEntity[]): ActionCard[] {
  const cards: ActionCard[] = [];

  for (const beaut of beauts) {
    // Each beaut contributes 3 action cards based on their position's on-ice defaults
    const positionCards = getDefaultOnIceCards(beaut.position);
    for (const ct of positionCards) {
      cards.push(createActionCard(ct));
    }
    // Plus 1 trait card for this beaut's archetype
    if (beaut.trait_archetype) {
      cards.push(createActionCard('Trait', beaut.trait_archetype as TraitName));
    }
  }

  return cards; // Should be 24 cards (6 * 3 + 6)
}

/**
 * Setup the Action Deck and Beaut piles.
 * - Player auto-selects first 2 ice Beauts' traits as active (rest reserved)
 * - Ice Beauts get 3 cards each, bench Beauts get 2 cards each
 * - Remaining cards stay in the Action Deck
 */
export function setupActionDeck(
  beauts: BeautEntity[],
  onIceIds: string[],
  _onBenchIds: string[]
): {
  updatedBeauts: BeautEntity[];
  actionDeck: ActionCard[];
  reservedTraits: ActionCard[];
} {
  const fullDeck = buildFullDeck(beauts);

  // Separate trait cards and action cards
  const traitCards = fullDeck.filter(c => c.is_trait);
  const actionCards = fullDeck.filter(c => !c.is_trait);

  // Auto-select first 2 on-ice Beauts' trait cards as active
  const iceBeauts = beauts.filter(b => onIceIds.includes(b.id));
  const activeTraitNames = new Set(iceBeauts.slice(0, 2).map(b => b.trait_archetype));
  const activeTraits: ActionCard[] = [];
  const reservedTraits: ActionCard[] = [];

  for (const tc of traitCards) {
    if (activeTraitNames.has(tc.trait_name!) && activeTraits.length < 2) {
      activeTraits.push(tc);
    } else {
      reservedTraits.push(tc);
    }
  }

  // Pool = actionCards + activeTraits
  let pool = shuffleArray([...actionCards, ...activeTraits]);

  // Load cards onto Beauts
  const updatedBeauts = beauts.map(b => {
    const isOnIce = onIceIds.includes(b.id);
    const cardCount = isOnIce ? 3 : 2;
    const defaultCards = isOnIce
      ? getDefaultOnIceCards(b.position)
      : getDefaultBenchCards(b.position);

    // Try to find matching cards from pool for this position
    const pile: ActionCard[] = [];
    for (const needed of defaultCards) {
      const idx = pool.findIndex(c => c.card_type === needed);
      if (idx !== -1) {
        pile.push(pool[idx]);
        pool.splice(idx, 1);
      } else {
        // Fallback: create the card (shouldn't happen with balanced deck)
        pile.push(createActionCard(needed));
      }
    }

    // If we have an active trait for this Beaut and room, add it
    if (pile.length < cardCount) {
      const traitIdx = pool.findIndex(c => c.is_trait && c.trait_name === b.trait_archetype);
      if (traitIdx !== -1) {
        pile.push(pool[traitIdx]);
        pool.splice(traitIdx, 1);
      }
    }

    return {
      ...b,
      action_pile: shuffleArray(pile.slice(0, 3)), // Enforce max 3
      is_exhausted: false,
    };
  });

  // Remaining pool cards become the Action Deck
  const actionDeck = pool;

  return { updatedBeauts, actionDeck, reservedTraits };
}

// Deterministic shuffle using Fisher-Yates
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Draw a random card from a pile
export function drawFromPile(pile: ActionCard[]): { drawn: ActionCard; remaining: ActionCard[] } | null {
  if (pile.length === 0) return null;
  const idx = Math.floor(Math.random() * pile.length);
  const drawn = pile[idx];
  const remaining = pile.filter((_, i) => i !== idx);
  return { drawn, remaining };
}

// All cards in pile are available (no state tracking needed)
export function availableCards(pile: ActionCard[]): ActionCard[] {
  return pile;
}

// Return a card to the Action Deck
export function returnCardToDeck(deck: ActionCard[], card: ActionCard): ActionCard[] {
  return [...deck, { ...card }];
}

// Draw N cards from the Action Deck for a Beaut
export function drawFromDeck(deck: ActionCard[], count: number): { drawn: ActionCard[]; remaining: ActionCard[] } {
  const shuffled = shuffleArray(deck);
  const drawn = shuffled.slice(0, count);
  const remaining = shuffled.slice(count);
  return { drawn, remaining };
}

// Is a card type legal for a position?
export function isCardLegalForPosition(cardType: CardType, position: Position): boolean {
  if (cardType === 'Trait') return true;
  return POSITION_LEGAL_CARDS[position].includes(cardType);
}

// Max cards under a Beaut
export const MAX_CARDS_PER_BEAUT = 3;
