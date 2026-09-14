import React, { useState, useEffect } from 'react';
import { Search, ArrowLeftRight, HelpCircle } from 'lucide-react';
import { TYPE_COLORS, formatName } from '../services/pokeApi';
import type { PokemonIndexEntry } from '../services/pokeApi';

interface ComparePageProps {
  pokemonList: PokemonIndexEntry[];
}

export const ComparePage: React.FC<ComparePageProps> = ({ pokemonList }) => {
  const [poke1Search, setPoke1Search] = useState('');
  const [poke2Search, setPoke2Search] = useState('');
  
  const [poke1, setPoke1] = useState<PokemonIndexEntry | null>(null);
  const [poke2, setPoke2] = useState<PokemonIndexEntry | null>(null);
  
  const [poke1DropdownOpen, setPoke1DropdownOpen] = useState(false);
  const [poke2DropdownOpen, setPoke2DropdownOpen] = useState(false);

  // Set default pokemon for initial comparison (Pikachu vs Eevee)
  useEffect(() => {
    if (pokemonList.length === 0) return;
    const pikachu = pokemonList.find(p => p.name === 'pikachu') || pokemonList[24] || null;
    const eevee = pokemonList.find(p => p.name === 'eevee') || pokemonList[132] || null;
    setPoke1(pikachu);
    setPoke2(eevee);
  }, [pokemonList]);

  const filteredPoke1 = pokemonList.filter(p => 
    p.name.toLowerCase().includes(poke1Search.toLowerCase()) || 
    p.id.toString() === poke1Search
  ).slice(0, 8);

  const filteredPoke2 = pokemonList.filter(p => 
    p.name.toLowerCase().includes(poke2Search.toLowerCase()) || 
    p.id.toString() === poke2Search
  ).slice(0, 8);

  const STAT_NAMES = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

  const getArtwork = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  const getBst = (p: PokemonIndexEntry) => p.stats.reduce((sum, s) => sum + s, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-3 border border-red-500/25 shadow-md">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 light:text-slate-900 mb-2">
          Compare Pokémon
        </h1>
        <p className="text-sm font-medium text-slate-400 light:text-slate-600 max-w-lg">
          Select any two Pokémon from the search bars below to compare their types, physical traits, and base stats.
        </p>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Selector 1 */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500 mb-2">First Pokémon</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={poke1Search}
              onChange={(e) => {
                setPoke1Search(e.target.value);
                setPoke1DropdownOpen(true);
              }}
              onFocus={() => setPoke1DropdownOpen(true)}
              placeholder="Search by name or number..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {poke1DropdownOpen && poke1Search && (
            <div className="absolute z-20 w-full mt-1.5 glass border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl max-h-60 overflow-y-auto shadow-xl">
              {filteredPoke1.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPoke1(p);
                    setPoke1Search('');
                    setPoke1DropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-slate-900/40 dark:hover:bg-slate-900/50 light:hover:bg-slate-100 flex items-center justify-between text-left text-sm font-semibold capitalize text-slate-300 light:text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <img src={getArtwork(p.id)} alt={p.name} className="w-6 h-6 object-contain" />
                    {formatName(p.name)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">#{p.id.toString().padStart(4, '0')}</span>
                </button>
              ))}
              {filteredPoke1.length === 0 && (
                <div className="p-3 text-xs text-slate-500 text-center font-bold">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* Selector 2 */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500 mb-2">Second Pokémon</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={poke2Search}
              onChange={(e) => {
                setPoke2Search(e.target.value);
                setPoke2DropdownOpen(true);
              }}
              onFocus={() => setPoke2DropdownOpen(true)}
              placeholder="Search by name or number..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {poke2DropdownOpen && poke2Search && (
            <div className="absolute z-20 w-full mt-1.5 glass border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl max-h-60 overflow-y-auto shadow-xl">
              {filteredPoke2.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPoke2(p);
                    setPoke2Search('');
                    setPoke2DropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-slate-900/40 dark:hover:bg-slate-900/50 light:hover:bg-slate-100 flex items-center justify-between text-left text-sm font-semibold capitalize text-slate-300 light:text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <img src={getArtwork(p.id)} alt={p.name} className="w-6 h-6 object-contain" />
                    {formatName(p.name)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">#{p.id.toString().padStart(4, '0')}</span>
                </button>
              ))}
              {filteredPoke2.length === 0 && (
                <div className="p-3 text-xs text-slate-500 text-center font-bold">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Close click handles */}
      {(poke1DropdownOpen || poke2DropdownOpen) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setPoke1DropdownOpen(false);
            setPoke2DropdownOpen(false);
          }}
        />
      )}

      {/* Comparison Workspace */}
      {poke1 && poke2 ? (
        <div className="glass rounded-3xl p-6 sm:p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative overflow-hidden">
          
          {/* Card Left: Pokémon 1 */}
          <div className="md:col-span-4 flex flex-col items-center p-6 bg-slate-900/10 dark:bg-slate-900/25 light:bg-slate-100/50 rounded-2xl border border-slate-900/10 dark:border-white/5 light:border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-500 mb-1">#{poke1.id.toString().padStart(4, '0')}</span>
            <h2 className="font-display font-extrabold text-2xl capitalize text-slate-100 light:text-slate-950 mb-3">{formatName(poke1.name)}</h2>
            
            {/* Badges */}
            <div className="flex gap-1.5 mb-6">
              {poke1.types.map(t => (
                <span 
                  key={t} 
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border text-white"
                  style={{ backgroundColor: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}80` }}
                >
                  {t}
                </span>
              ))}
            </div>

            <img src={getArtwork(poke1.id)} alt={poke1.name} className="w-48 h-48 object-contain drop-shadow-lg transition-transform duration-500 hover:scale-105" />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6 text-center text-xs border-t border-slate-800 dark:border-white/5 light:border-slate-200 pt-4">
              <div>
                <div className="font-medium text-slate-500">Height</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">{(poke1.height / 10)} m</div>
              </div>
              <div>
                <div className="font-medium text-slate-500">Weight</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">{(poke1.weight / 10)} kg</div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-slate-500">Habitat</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800 capitalize">{poke1.habitat}</div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-slate-500">Generation</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">Gen {poke1.generation}</div>
              </div>
            </div>
          </div>

          {/* Stats Comparison Center Panel */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <h3 className="text-center font-display font-extrabold text-base text-slate-400 light:text-slate-600 uppercase tracking-wider flex items-center justify-center gap-1.5">
              Stat Comparisons
            </h3>

            <div className="flex flex-col gap-5">
              {STAT_NAMES.map((name, idx) => {
                const val1 = poke1.stats[idx] || 0;
                const val2 = poke2.stats[idx] || 0;
                const max = Math.max(val1, val2);
                
                // Percentages for bars
                const pct1 = max > 0 ? (val1 / max) * 100 : 0;
                const pct2 = max > 0 ? (val2 / max) * 100 : 0;

                // Color highlights
                const isPoke1Winner = val1 > val2;
                const isPoke2Winner = val2 > val1;

                return (
                  <div key={name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold px-1">
                      <span className={`${isPoke1Winner ? 'text-red-500 dark:text-red-400 scale-105' : 'text-slate-400 light:text-slate-600 font-medium'}`}>{val1}</span>
                      <span className="uppercase tracking-wider font-extrabold text-[10px] text-slate-500">{name}</span>
                      <span className={`${isPoke2Winner ? 'text-red-500 dark:text-red-400 scale-105' : 'text-slate-400 light:text-slate-600 font-medium'}`}>{val2}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Left bar (Pokemon 1) */}
                      <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-2.5 rounded-full overflow-hidden flex justify-end">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isPoke1Winner 
                              ? 'bg-gradient-to-l from-red-500 to-orange-500' 
                              : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-400/80'
                          }`}
                          style={{ width: `${pct1}%` }}
                        />
                      </div>

                      {/* Right bar (Pokemon 2) */}
                      <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isPoke2Winner 
                              ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                              : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-400/80'
                          }`}
                          style={{ width: `${pct2}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Base Stat Total Comparison */}
              <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 my-1" />
              
              {(() => {
                const bst1 = getBst(poke1);
                const bst2 = getBst(poke2);
                const isBst1Win = bst1 > bst2;
                const isBst2Win = bst2 > bst1;

                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm font-black px-1">
                      <span className={`${isBst1Win ? 'text-red-500 dark:text-red-400' : 'text-slate-400 light:text-slate-500'}`}>{bst1}</span>
                      <span className="uppercase text-xs tracking-wider text-slate-500 font-extrabold">TOTAL BST</span>
                      <span className={`${isBst2Win ? 'text-red-500 dark:text-red-400' : 'text-slate-400 light:text-slate-500'}`}>{bst2}</span>
                    </div>
                    <div className="text-[10px] text-center text-slate-500 font-medium">
                      {bst1 === bst2 ? (
                        "It's a perfect tie in overall base power!"
                      ) : (
                        `${formatName(isBst1Win ? poke1.name : poke2.name)} has a stat advantage of ${Math.abs(bst1 - bst2)} points.`
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Card Right: Pokémon 2 */}
          <div className="md:col-span-4 flex flex-col items-center p-6 bg-slate-900/10 dark:bg-slate-900/25 light:bg-slate-100/50 rounded-2xl border border-slate-900/10 dark:border-white/5 light:border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-500 mb-1">#{poke2.id.toString().padStart(4, '0')}</span>
            <h2 className="font-display font-extrabold text-2xl capitalize text-slate-100 light:text-slate-950 mb-3">{formatName(poke2.name)}</h2>
            
            {/* Badges */}
            <div className="flex gap-1.5 mb-6">
              {poke2.types.map(t => (
                <span 
                  key={t} 
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border text-white"
                  style={{ backgroundColor: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}80` }}
                >
                  {t}
                </span>
              ))}
            </div>

            <img src={getArtwork(poke2.id)} alt={poke2.name} className="w-48 h-48 object-contain drop-shadow-lg transition-transform duration-500 hover:scale-105" />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6 text-center text-xs border-t border-slate-800 dark:border-white/5 light:border-slate-200 pt-4">
              <div>
                <div className="font-medium text-slate-500">Height</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">{(poke2.height / 10)} m</div>
              </div>
              <div>
                <div className="font-medium text-slate-500">Weight</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">{(poke2.weight / 10)} kg</div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-slate-500">Habitat</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800 capitalize">{poke2.habitat}</div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-slate-500">Generation</div>
                <div className="font-extrabold text-slate-300 light:text-slate-800">Gen {poke2.generation}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 glass rounded-3xl border border-slate-800">
          <HelpCircle className="w-12 h-12 mx-auto mb-2 text-slate-500" />
          Select Pokémon above to load comparison dashboard.
        </div>
      )}
    </div>
  );
};
