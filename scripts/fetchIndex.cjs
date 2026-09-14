const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'pokemonIndex.json');
const LIMIT = 1025; // Generation 1-9 Pokémon

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(url, 12000);
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
      console.warn(`[Warn] Fetch failed for ${url} (Status: ${res.status}). Retry ${i + 1}/${retries}...`);
    } catch (err) {
      console.warn(`[Warn] Fetch error for ${url}: ${err.message}. Retry ${i + 1}/${retries}...`);
    }
    if (i < retries - 1) await sleep(delay * (i + 1));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function fetchDetail(id) {
  try {
    const pokeData = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!pokeData) return null;
    
    const speciesData = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!speciesData) {
      return {
        id: pokeData.id,
        name: pokeData.name,
        types: pokeData.types.map(t => t.type.name),
        height: pokeData.height,
        weight: pokeData.weight,
        stats: pokeData.stats.map(s => s.base_stat),
        habitat: 'unknown',
        generation: 1,
        isLegendary: false,
        isMythical: false
      };
    }
    
    const genName = speciesData.generation?.name || 'generation-i';
    const genMap = {
      'generation-i': 1,
      'generation-ii': 2,
      'generation-iii': 3,
      'generation-iv': 4,
      'generation-v': 5,
      'generation-vi': 6,
      'generation-vii': 7,
      'generation-viii': 8,
      'generation-ix': 9
    };
    const generation = genMap[genName] || 1;
    
    return {
      id: pokeData.id,
      name: pokeData.name,
      types: pokeData.types.map(t => t.type.name),
      height: pokeData.height,
      weight: pokeData.weight,
      stats: pokeData.stats.map(s => s.base_stat),
      habitat: speciesData.habitat ? speciesData.habitat.name : 'unknown',
      generation,
      isLegendary: !!speciesData.is_legendary,
      isMythical: !!speciesData.is_mythical
    };
  } catch (error) {
    console.error(`[Error] Failed to fetch Pokémon ID ${id}:`, error.message);
    return null;
  }
}

async function fetchPokemonData() {
  console.log(`Starting metadata extraction for ${LIMIT} Pokémon...`);
  const pokemonList = [];
  const batchSize = 10; // Safer batch size to avoid rate limits
  
  for (let i = 1; i <= LIMIT; i += batchSize) {
    const end = Math.min(i + batchSize - 1, LIMIT);
    const progress = Math.round(((i - 1) / LIMIT) * 100);
    console.log(`[Progress: ${progress}%] Fetching IDs ${i} to ${end}...`);
    
    const batchPromises = [];
    for (let id = i; id <= end; id++) {
      batchPromises.push(fetchDetail(id));
    }
    
    const results = await Promise.all(batchPromises);
    pokemonList.push(...results.filter(Boolean));
    
    await sleep(100); // Cool-off period
  }
  
  pokemonList.sort((a, b) => a.id - b.id);
  
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pokemonList, null, 2));
  console.log(`[Success] Wrote ${pokemonList.length} entries to ${OUTPUT_PATH}`);
}

fetchPokemonData();
