// PokéAPI Service with caching, type effectiveness calculators, and runtime index initialization

// Type declarations
export interface PokemonIndexEntry {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  stats: number[]; // [hp, attack, defense, spAtk, spDef, speed]
  habitat: string;
  generation: number;
  isLegendary: boolean;
  isMythical: boolean;
}

export interface PokemonVariety {
  name: string;
  isDefault: boolean;
  pokemonId: number;
}

export interface PokemonDetail {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number;
  abilities: { name: string; isHidden: boolean }[];
  stats: { name: string; value: number }[];
  artwork: string;
  animatedSprite: string | null;
  sprites: {
    frontDefault: string | null;
    backDefault: string | null;
    frontShiny: string | null;
    backShiny: string | null;
  };
  species: {
    habitat: string;
    generation: string;
    captureRate: number;
    growthRate: string;
    eggGroups: string[];
    genderRatio: { male: number; female: number } | null; // null if genderless
    description: string;
  };
  evolutionChain: EvolutionNode[];
  varieties: PokemonVariety[];
}

export interface EvolutionNode {
  id: number;
  name: string;
  artwork: string;
  details: {
    trigger: string;
    minLevel?: number;
    item?: string;
    heldItem?: string;
    location?: string;
    timeOfDay?: string;
    happiness?: number;
    knownMove?: string;
  } | null;
  evolvesTo: EvolutionNode[];
}

export interface MoveDetail {
  name: string;
  level: number;
  method: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
}

// In-memory caches for fetched data
const detailCache: Record<number | string, PokemonDetail> = {};
const rawCache: Record<string, any> = {};

// Helper to fetch and cache raw API requests
async function fetchWithCache<T>(url: string): Promise<T> {
  if (rawCache[url]) {
    return rawCache[url] as T;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const data = await response.json();
  rawCache[url] = data;
  return data as T;
}

// Extract ID from PokéAPI URL
export function extractIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
}

// Format Name for presentation (e.g. "bulbasaur" -> "Bulbasaur")
export function formatName(name: string): string {
  if (!name) return '';
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get high-res official artwork URL
export function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Get animated showdown sprite or fallback
export function getAnimatedSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
}

// Parse evolution chain recursively
function parseEvolutionChain(chain: any): EvolutionNode[] {
  if (!chain) return [];

  const id = extractIdFromUrl(chain.species.url);
  const name = chain.species.name;
  const artwork = getArtworkUrl(id);

  let details = null;
  if (chain.evolution_details && chain.evolution_details.length > 0) {
    const detail = chain.evolution_details[0];
    details = {
      trigger: detail.trigger.name.replace('-', ' '),
      minLevel: detail.min_level || undefined,
      item: detail.item?.name.replace('-', ' ') || undefined,
      heldItem: detail.held_item?.name.replace('-', ' ') || undefined,
      location: detail.location?.name.replace('-', ' ') || undefined,
      timeOfDay: detail.time_of_day || undefined,
      happiness: detail.min_happiness || undefined,
      knownMove: detail.known_move?.name.replace('-', ' ') || undefined,
    };
  }

  const evolvesTo = chain.evolves_to.flatMap((subChain: any) => parseEvolutionChain(subChain));

  return [{
    id,
    name,
    artwork,
    details,
    evolvesTo,
  }];
}

// Flatten evolution nodes into lists for simple sequential rendering
export function flattenEvolutionChain(nodes: EvolutionNode[]): { current: EvolutionNode; next: EvolutionNode[]; details: any }[] {
  const result: { current: EvolutionNode; next: EvolutionNode[]; details: any }[] = [];
  
  function traverse(node: EvolutionNode) {
    if (node.evolvesTo.length > 0) {
      result.push({
        current: node,
        next: node.evolvesTo,
        details: node.evolvesTo.map(n => n.details)
      });
      node.evolvesTo.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

// Type colors mapping
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D899AF',
  unknown: '#68A090',
  shadow: '#493963'
};

const TYPE_WEAKNESSES: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, font: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

// Calculate defensive type effectiveness for dual/single types
export interface TypeEffectiveness {
  quadrupleDamageFrom: string[];
  doubleDamageFrom: string[];
  halfDamageFrom: string[];
  quarterDamageFrom: string[];
  noDamageFrom: string[];
}

export function getDefensiveEffectiveness(types: string[]): TypeEffectiveness {
  const multipliers: Record<string, number> = {};
  
  Object.keys(TYPE_COLORS).forEach(type => {
    if (type !== 'unknown' && type !== 'shadow') {
      multipliers[type] = 1.0;
    }
  });

  types.forEach(defType => {
    Object.keys(TYPE_WEAKNESSES).forEach(atkType => {
      const effect = TYPE_WEAKNESSES[atkType][defType];
      if (effect !== undefined) {
        multipliers[atkType] *= effect;
      }
    });
  });

  const result: TypeEffectiveness = {
    quadrupleDamageFrom: [],
    doubleDamageFrom: [],
    halfDamageFrom: [],
    quarterDamageFrom: [],
    noDamageFrom: []
  };

  Object.entries(multipliers).forEach(([type, value]) => {
    if (value === 4.0) result.quadrupleDamageFrom.push(type);
    else if (value === 2.0) result.doubleDamageFrom.push(type);
    else if (value === 0.5) result.halfDamageFrom.push(type);
    else if (value === 0.25) result.quarterDamageFrom.push(type);
    else if (value === 0.0) result.noDamageFrom.push(type);
  });

  return result;
}

// Get offensive effectiveness
export interface OffensiveEffectiveness {
  doubleDamageTo: string[];
  halfDamageTo: string[];
  noDamageTo: string[];
}

export function getOffensiveEffectiveness(type: string): OffensiveEffectiveness {
  const weaknesses = TYPE_WEAKNESSES[type.toLowerCase()] || {};
  const doubleDamageTo: string[] = [];
  const halfDamageTo: string[] = [];
  const noDamageTo: string[] = [];

  Object.entries(weaknesses).forEach(([defType, value]) => {
    if (value === 2.0) doubleDamageTo.push(defType);
    else if (value === 0.5) halfDamageTo.push(defType);
    else if (value === 0.0) noDamageTo.push(defType);
  });

  return { doubleDamageTo, halfDamageTo, noDamageTo };
}

// Fetch Detailed Pokemon details
export async function fetchPokemonDetail(idOrName: string | number): Promise<PokemonDetail> {
  const query = idOrName.toString().toLowerCase().trim();
  
  if (detailCache[query]) {
    return detailCache[query];
  }

  try {
    const pokeData = await fetchWithCache<any>(`https://pokeapi.co/api/v2/pokemon/${query}`);
    const pokemonId = pokeData.id;

    if (detailCache[pokemonId]) {
      return detailCache[pokemonId];
    }

    const speciesData = await fetchWithCache<any>(pokeData.species.url);
    const evoChainUrl = speciesData.evolution_chain.url;
    const evoChainData = await fetchWithCache<any>(evoChainUrl);
    const parsedEvo = parseEvolutionChain(evoChainData.chain);

    const eggGroups = speciesData.egg_groups.map((eg: any) => eg.name);

    let genderRatio = null;
    if (speciesData.gender_rate !== -1) {
      const femalePercentage = (speciesData.gender_rate / 8) * 100;
      genderRatio = {
        female: femalePercentage,
        male: 100 - femalePercentage
      };
    }

    const englishDesc = speciesData.flavor_text_entries.find(
      (entry: any) => entry.language.name === 'en'
    );
    const description = englishDesc
      ? englishDesc.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
      : 'No description available.';

    const abilities = pokeData.abilities.map((ab: any) => ({
      name: ab.ability.name.replace('-', ' '),
      isHidden: ab.is_hidden
    }));

    const statsMap: Record<string, string> = {
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      'special-attack': 'Sp. Atk',
      'special-defense': 'Sp. Def',
      speed: 'Speed'
    };
    
    const stats = pokeData.stats.map((s: any) => ({
      name: statsMap[s.stat.name] || s.stat.name,
      value: s.base_stat
    }));

    const artwork = getArtworkUrl(pokemonId);
    const animatedSprite = getAnimatedSpriteUrl(pokemonId);

    const varieties: PokemonVariety[] = speciesData.varieties.map((v: any) => ({
      name: v.pokemon.name,
      isDefault: v.is_default,
      pokemonId: extractIdFromUrl(v.pokemon.url)
    }));

    const detail: PokemonDetail = {
      id: pokemonId,
      name: pokeData.name,
      types: pokeData.types.map((t: any) => t.type.name),
      height: pokeData.height,
      weight: pokeData.weight,
      baseExperience: pokeData.base_experience || 0,
      abilities,
      stats,
      artwork,
      animatedSprite,
      sprites: {
        frontDefault: pokeData.sprites.front_default,
        backDefault: pokeData.sprites.back_default,
        frontShiny: pokeData.sprites.front_shiny,
        backShiny: pokeData.sprites.back_shiny,
      },
      species: {
        habitat: speciesData.habitat ? speciesData.habitat.name : 'unknown',
        generation: speciesData.generation.name.replace('generation-', 'Generation ').toUpperCase(),
        captureRate: speciesData.capture_rate,
        growthRate: speciesData.growth_rate.name.replace('-', ' '),
        eggGroups,
        genderRatio,
        description
      },
      evolutionChain: parsedEvo,
      varieties
    };

    detailCache[pokemonId] = detail;
    detailCache[pokeData.name] = detail;

    return detail;
  } catch (error) {
    console.error(`Error in fetchPokemonDetail for query ${query}:`, error);
    throw error;
  }
}

// Fetch Moves for a Pokemon
export async function fetchPokemonMoves(pokemonName: string): Promise<MoveDetail[]> {
  try {
    const pokeData = await fetchWithCache<any>(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    
    // Separate G-Max / Max moves so they are never sliced out
    const gmaxMoves = pokeData.moves.filter((m: any) => 
      m.move.name.startsWith('g-max') || m.move.name.startsWith('max-')
    );
    const regularMoves = pokeData.moves.filter((m: any) => 
      !m.move.name.startsWith('g-max') && !m.move.name.startsWith('max-')
    );
    
    // Cap regular moves at 50 to maintain fast page load, but always append G-Max/Max moves
    const selectedMoves = [...regularMoves.slice(0, 50), ...gmaxMoves];
    
    const movesPromises = selectedMoves.map(async (m: any) => {
      const versionDetails = m.version_group_details[0] || { level_learned_at: 0, move_learn_method: { name: 'special' } };
      const moveUrl = m.move.url;
      const moveRaw = await fetchWithCache<any>(moveUrl);

      return {
        name: m.move.name.replace(/-/g, ' '),
        level: versionDetails.level_learned_at,
        method: versionDetails.move_learn_method.name.replace(/-/g, ' '),
        type: moveRaw.type.name,
        power: moveRaw.power,
        accuracy: moveRaw.accuracy,
        pp: moveRaw.pp
      };
    });

    const moves = await Promise.all(movesPromises);
    return moves.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching pokemon moves:', error);
    return [];
  }
}

import pokemonIndexRaw from '../data/pokemonIndex.json';

// Dynamic Browser-runtime Index Initializer (loads pre-compiled 1025 index instantly)
export async function loadPokemonIndex(onProgress?: (progress: number) => void): Promise<PokemonIndexEntry[]> {
  if (onProgress) {
    onProgress(100);
  }
  return pokemonIndexRaw as PokemonIndexEntry[];
}
