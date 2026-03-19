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
// On-chain uses: Forward, Center, Defense, Goalie, MetaBeauts (special 1-of-1s), Winger
const POSITION_MAP: Record<string, Position> = {
  Forward: 'Winger',
  Winger: 'Winger',
  Center: 'Center',
  Defense: 'Defender',
  Defender: 'Defender',
  Goalie: 'Goaltender',
  Goaltender: 'Goaltender',
  MetaBeauts: 'Goaltender', // Special 1-of-1 legendaries
};

// Tier mapping from on-chain to game
const TIER_MAP: Record<string, Tier> = {
  Rookie: 1,
  Pro: 2,
  'All-Star': 3,
  Legend: 4,
};

// Archetype → Trait mapping (spec Section 3.10)
// On-chain archetypes verified from Bueno metadata sample (March 2026):
//   Winger: Enforcer Forward, Grinder, Playmaker, Sniper, Dangler, Two-Way Forward
//   Center: Playmaker, Dangler, Power Forward, Sniper
//   Defense: Two-Way Defenseman, Enforcer Defenseman, Puck-Moving Defenseman, Defensive Defenseman
//   Goalie: Butterfly, Stand-Up, Hybrid
//   MetaBeauts (1-of-1s): Number 1, Big Swede, Burner, TBoz, DocG, El Teegs
const ARCHETYPE_MAP: Record<string, TraitName> = {
  // Goalie archetypes
  'Number 1': 'Stand Up',
  'Stand-Up': 'Stand Up',
  'Stand Up': 'Stand Up',
  Butterfly: 'Butterfly',
  Hybrid: 'Hybrid',
  // Forward/Winger archetypes
  'Enforcer Forward': 'Enforcer',
  Enforcer: 'Enforcer',
  Sniper: 'Sniper',
  'Power Forward': 'Power Fwd',
  'Power Fwd': 'Power Fwd',
  Dangler: 'Dangler',
  Grinder: 'Grinder',
  Playmaker: 'Playmaker',
  'Two-Way Forward': 'Two-Way',
  // Defense archetypes
  'Two-Way Defenseman': 'Two-Way',
  'Two-Way': 'Two-Way',
  'Enforcer Defenseman': 'Enforcer',
  'Puck-Moving Defenseman': 'Puck Mover',
  'Puck Mover': 'Puck Mover',
  'Defensive Defenseman': 'Defensive',
  Defensive: 'Defensive',
  Offensive: 'Offensive',
  'Two-Timer': 'Two-Timer',
  // 1-of-1 MetaBeauts legendaries — unique traits
  'Big Swede': 'Power Fwd',
  Burner: 'Sniper',
  TBoz: 'Playmaker',
  DocG: 'Two-Way',
  'El Teegs': 'Dangler',
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

// Position counts — verified sample token IDs from Bueno metadata (March 2026)
export const POSITION_DISTRIBUTION: Record<Position, { min: number; max: number; sample: number[] }> = {
  Winger: {
    min: 1,
    max: 9997,
    sample: [10, 30, 35, 50, 60, 80, 110, 160, 500, 600, 700, 1000, 2000, 3000, 5000],
  },
  Center: {
    min: 1,
    max: 9997,
    sample: [7, 15, 48, 70, 90, 100, 150, 200, 550, 650, 800, 1500, 2500, 4000, 7000],
  },
  Defender: {
    min: 1,
    max: 9997,
    sample: [20, 50, 120, 130, 170, 180, 250, 350, 750, 850, 950, 3500, 4500, 7500, 8500],
  },
  Goaltender: {
    min: 1,
    max: 9997,
    sample: [22, 55, 65, 85, 140, 190, 300, 400, 900, 1100, 1200, 5500, 6000, 8000, 9000],
  },
};
