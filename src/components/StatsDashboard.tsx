import React, { useMemo } from 'react';
import { BarChart3, Trophy, Compass, Percent, Layers } from 'lucide-react';
import { type PokemonIndexEntry, TYPE_COLORS, formatName } from '../services/pokeApi';

interface StatsDashboardProps {
  pokemonList: PokemonIndexEntry[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ pokemonList }) => {
  
  // 1. Calculate General Metrics
  const metrics = useMemo(() => {
    const total = pokemonList.length;
    let legendaryCount = 0;
    let mythicalCount = 0;
    const typeCounts: Record<string, number> = {};

    pokemonList.forEach(p => {
      if (p.isLegendary) legendaryCount++;
      if (p.isMythical) mythicalCount++;
      p.types.forEach(t => {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
    });

    // Find most common type
    let mostCommonType = 'normal';
    let maxTypeCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        mostCommonType = type;
      }
    });

    return {
      total,
      legendaryCount,
      mythicalCount,
      mostCommonType,
      maxTypeCount,
      typeCounts
    };
  }, [pokemonList]);

  // 2. Calculate Type Distribution data sorted by count descending
  const sortedTypeDistribution = useMemo(() => {
    return Object.entries(metrics.typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [metrics]);

  // 3. Calculate Average Stats
  const averageStats = useMemo(() => {
    if (pokemonList.length === 0) return [];
    
    const sum = [0, 0, 0, 0, 0, 0]; // [hp, attack, defense, spAtk, spDef, speed]
    pokemonList.forEach(p => {
      p.stats.forEach((s, idx) => {
        sum[idx] += s;
      });
    });

    const count = pokemonList.length;
    const STAT_LABELS = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

    return sum.map((val, idx) => ({
      name: STAT_LABELS[idx],
      value: Math.round(val / count)
    }));
  }, [pokemonList]);

  // 4. Find Strongest Pokémon by stat
  const strongestPokemon = useMemo(() => {
    const STAT_LABELS = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
    
    return STAT_LABELS.map((label, statIdx) => {
      let maxVal = -1;
      let winner: PokemonIndexEntry | null = null;
      
      pokemonList.forEach(p => {
        const val = p.stats[statIdx] || 0;
        if (val > maxVal) {
          maxVal = val;
          winner = p;
        }
      });

      return {
        statName: label,
        value: maxVal,
        pokemon: winner as PokemonIndexEntry | null
      };
    });
  }, [pokemonList]);

  // 5. Calculate Generation Distribution
  const genDistribution = useMemo(() => {
    const genCounts: Record<number, number> = {};
    // Seed 1-9
    for (let i = 1; i <= 9; i++) genCounts[i] = 0;
    
    pokemonList.forEach(p => {
      if (p.generation >= 1 && p.generation <= 9) {
        genCounts[p.generation]++;
      }
    });

    return Object.entries(genCounts).map(([gen, count]) => ({
      gen: `Gen ${gen}`,
      count
    }));
  }, [pokemonList]);

  const getArtwork = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-3 border border-red-500/25 shadow-md">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 light:text-slate-900 mb-2">
          Pokédex Analytics
        </h1>
        <p className="text-sm font-medium text-slate-400 light:text-slate-600 max-w-lg">
          Live calculated statistics and distribution charts across the entire database of {metrics.total} Pokémon.
        </p>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass p-5 rounded-2xl border border-slate-800 dark:border-white/5 light:border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pokémon</div>
          <div className="text-3xl font-black text-slate-100 light:text-slate-950 font-display">{metrics.total}</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-800 dark:border-white/5 light:border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Legendaries</div>
          <div className="text-3xl font-black text-red-500 dark:text-red-400 font-display">{metrics.legendaryCount}</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-800 dark:border-white/5 light:border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mythicals</div>
          <div className="text-3xl font-black text-amber-500 dark:text-amber-400 font-display">{metrics.mythicalCount}</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-800 dark:border-white/5 light:border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Most Common Type</div>
          <div className="flex items-center gap-2 mt-1">
            <span 
              className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-lg border text-white"
              style={{ backgroundColor: TYPE_COLORS[metrics.mostCommonType], borderColor: `${TYPE_COLORS[metrics.mostCommonType]}80` }}
            >
              {metrics.mostCommonType}
            </span>
            <span className="text-xs font-bold text-slate-400">({metrics.maxTypeCount})</span>
          </div>
        </div>
      </div>

      {/* Main Stats Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        
        {/* Left Column: Type distribution */}
        <div className="lg:col-span-6 glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200">
          <h3 className="font-display font-extrabold text-lg text-slate-200 light:text-slate-900 mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5 text-red-500" /> Type Distribution
          </h3>
          
          <div className="flex flex-col gap-3.5 max-h-[480px] overflow-y-auto pr-2">
            {sortedTypeDistribution.map(entry => {
              const max = sortedTypeDistribution[0]?.count || 1;
              const percentage = (entry.count / max) * 100;
              const typeColor = TYPE_COLORS[entry.type] || '#A8A77A';

              return (
                <div key={entry.type} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-bold uppercase tracking-wide text-slate-400 light:text-slate-600 truncate text-left">
                    {entry.type}
                  </span>
                  <span className="w-8 text-xs font-extrabold text-right text-slate-300 light:text-slate-800">
                    {entry.count}
                  </span>
                  <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: typeColor,
                        boxShadow: `0 0 8px ${typeColor}60`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Averages + Generation Distribution */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          
          {/* Average Stats */}
          <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200">
            <h3 className="font-display font-extrabold text-lg text-slate-200 light:text-slate-900 mb-6 flex items-center gap-2">
              <Compass className="w-5 h-5 text-red-500" /> Average Stat Values
            </h3>

            <div className="flex flex-col gap-4">
              {averageStats.map(stat => {
                const percentage = Math.min((stat.value / 120) * 100, 100);

                return (
                  <div key={stat.name} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-600">
                      {stat.name}
                    </span>
                    <span className="w-8 text-sm font-extrabold text-slate-200 light:text-slate-900 text-right">
                      {stat.value}
                    </span>
                    <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generation distribution chart */}
          <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200">
            <h3 className="font-display font-extrabold text-lg text-slate-200 light:text-slate-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-500" /> Generation Distribution
            </h3>

            {/* Vertical column SVG Chart */}
            <div className="h-44 w-full flex items-end justify-between px-2 pt-6">
              {genDistribution.map(entry => {
                const max = Math.max(...genDistribution.map(g => g.count));
                const heightPercentage = max > 0 ? (entry.count / max) * 100 : 0;

                return (
                  <div key={entry.gen} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.count}
                    </div>
                    <div className="w-4 sm:w-6 bg-slate-900/60 light:bg-slate-200 rounded-t-lg h-28 flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-red-600 to-red-500 rounded-t-lg transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 light:text-slate-600">
                      {entry.gen.replace('Gen ', 'G')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Strongest Pokémon list */}
      {pokemonList.length > 0 && (
        <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200">
          <h3 className="font-display font-extrabold text-lg text-slate-200 light:text-slate-900 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Strongest Pokémon by Category
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {strongestPokemon.map((entry, idx) => {
              if (!entry.pokemon) return null;
              const primaryType = entry.pokemon.types[0] || 'normal';

              return (
                <div 
                  key={idx}
                  className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-between text-center relative overflow-hidden"
                >
                  {/* Glowing Orb */}
                  <div 
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full filter blur-xl opacity-10" 
                    style={{ backgroundColor: TYPE_COLORS[primaryType] }}
                  />

                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{entry.statName}</span>
                  <span className="text-lg font-black text-red-500 dark:text-red-400 mb-2">{entry.value}</span>
                  
                  <img 
                    src={getArtwork(entry.pokemon.id)} 
                    alt={entry.pokemon.name} 
                    className="w-16 h-16 object-contain mb-3 drop-shadow-md transition-transform duration-300 hover:scale-110" 
                  />
                  
                  <div className="text-xs font-extrabold capitalize text-slate-200 light:text-slate-900 truncate w-full">
                    {formatName(entry.pokemon.name)}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">#{entry.pokemon.id.toString().padStart(4, '0')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
