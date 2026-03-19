/**
 * NFT metadata fetching from Bueno.art API.
 * Based on spec Section 3.10.
 */

import { BeautMetadata, Position, Tier, TraitName } from '@/types/game';

const BUENO_METADATA_BASE =
  'https://app.bueno.art/api/contract/moknE9lNh3g0L4sjQn1LG/chain/1/metadata';
const BUENO_IMAGE_BASE =
  'https://assets.bueno.art/images/b93fd12b-3c56-4f5d-9277-fa952f95cffb/default';

// Position mapping from on-chain to game (spec Section 3.10)
const POSITION_MAP: Record<string, Position> = {
  Forward: 'Winger',
  Center: 'Center',
  Defense: 'Defender',
  MetaBeauts: 'Goaltender',
};

// Tier mapping from on-chain to game
const TIER_MAP: Record<string, Tier> = {
  Rookie: 1,
  Pro: 2,
  'All-Star': 3,
  Legend: 4,
};

// Archetype → Trait mapping (spec Section 3.10)
const ARCHETYPE_MAP: Record<string, TraitName> = {
  'Number 1': 'Stand Up', // Goaltender archetype
  'Two-Way Defenseman': 'Two-Way',
  'Two-Way': 'Two-Way',
  Sniper: 'Sniper',
  'Power Forward': 'Power Fwd',
  'Power Fwd': 'Power Fwd',
  Enforcer: 'Enforcer',
  Dangler: 'Dangler',
  'Two-Timer': 'Two-Timer',
  Hybrid: 'Hybrid',
  Playmaker: 'Playmaker',
  Grinder: 'Grinder',
  'Puck Mover': 'Puck Mover',
  Butterfly: 'Butterfly',
  Offensive: 'Offensive',
  Defensive: 'Defensive',
};

interface OnChainAttribute {
  trait_type: string;
  value: string;
}

interface OnChainMetadata {
  name: string;
  image: string;
  attributes: OnChainAttribute[];
}

export function getImageUrl(tokenId: number): string {
  return `${BUENO_IMAGE_BASE}/${tokenId}`;
}

export async function fetchBeautMetadata(tokenId: number): Promise<BeautMetadata> {
  const res = await fetch(`${BUENO_METADATA_BASE}/${tokenId}`);
  if (!res.ok) {
    throw new Error(`Metadata fetch failed for token ${tokenId}: ${res.status}`);
  }

  const metadata: OnChainMetadata = await res.json();
  const attrs = new Map(metadata.attributes.map((a) => [a.trait_type, a.value]));

  const rawPosition = attrs.get('Position') ?? 'Forward';
  const position: Position = POSITION_MAP[rawPosition] ?? 'Winger';

  const rawTier = attrs.get('Tier') ?? 'Rookie';
  const tier: Tier = TIER_MAP[rawTier] ?? 1;

  const rawArchetype = attrs.get('Archetype') ?? '';
  const traitArchetype = (ARCHETYPE_MAP[rawArchetype] ?? rawArchetype) as TraitName;

  return {
    token_id: tokenId,
    name: metadata.name,
    image_url: `${BUENO_IMAGE_BASE}/${tokenId}`,
    position,
    tier,
    trait_archetype: traitArchetype,
    team: attrs.get('Team') ?? 'Unknown',
    jersey: attrs.get('Jersey') ?? 'Unknown',
    visual_traits: {
      skin: attrs.get('Skin Color') ?? '',
      hair_top: attrs.get('Hair Top Beaut') ?? '',
      eyes: attrs.get('Eyes Beaut') ?? '',
      mouth: attrs.get('Mouth Beaut') ?? '',
      helmet: attrs.get('Helmet') ?? '',
      glove: attrs.get('Glove') ?? '',
    },
  };
}

export async function fetchRosterMetadata(tokenIds: number[]): Promise<BeautMetadata[]> {
  const results = await Promise.allSettled(tokenIds.map((id) => fetchBeautMetadata(id)));
  return results
    .filter((r): r is PromiseFulfilledResult<BeautMetadata> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// Search beauts by position using a sample of token IDs
// For MVP: returns a curated set by sampling tokens
export async function searchBeautsByPosition(
  position: Position,
  limit: number = 20
): Promise<BeautMetadata[]> {
  // Sample token IDs across the collection
  const sampleIds: number[] = [];
  const totalSupply = 9997;
  
  // Generate evenly spread sample IDs
  const step = Math.floor(totalSupply / (limit * 10));
  for (let i = 1; i <= totalSupply && sampleIds.length < limit * 10; i += step) {
    sampleIds.push(i);
  }

  const results = await Promise.allSettled(
    sampleIds.slice(0, Math.min(50, sampleIds.length)).map((id) => fetchBeautMetadata(id))
  );

  const beauts = results
    .filter((r): r is PromiseFulfilledResult<BeautMetadata> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((b) => b.position === position);

  return beauts.slice(0, limit);
}

// Fetch a specific batch of beauts
export async function fetchBeautBatch(
  startId: number,
  count: number = 20
): Promise<BeautMetadata[]> {
  const ids = Array.from({ length: count }, (_, i) => startId + i).filter(
    (id) => id >= 1 && id <= 9997
  );
  return fetchRosterMetadata(ids);
}

// Position counts (approximate from collection distribution)
export const POSITION_DISTRIBUTION: Record<Position, { min: number; max: number; sample: number[] }> = {
  Winger: {
    min: 1,
    max: 9997,
    sample: [3, 7, 15, 22, 35, 48, 56, 67, 89, 102, 115, 128, 134, 156, 178],
  },
  Center: {
    min: 1,
    max: 9997,
    sample: [5, 12, 18, 30, 43, 57, 71, 84, 96, 110, 123, 140, 155, 170, 185],
  },
  Defender: {
    min: 1,
    max: 9997,
    sample: [2, 9, 17, 26, 38, 50, 63, 75, 88, 100, 116, 130, 145, 160, 175],
  },
  Goaltender: {
    min: 1,
    max: 9997,
    sample: [1, 4, 10, 20, 33, 46, 58, 70, 82, 95, 108, 120, 135, 150, 165],
  },
};
