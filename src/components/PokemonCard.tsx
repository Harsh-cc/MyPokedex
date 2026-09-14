import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type PokemonIndexEntry, TYPE_COLORS, formatName } from '../services/pokeApi';

interface PokemonCardProps {
  pokemon: PokemonIndexEntry;
  isFavorite: boolean;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  isFavorite,
  onToggleFavorite,
}) => {
  const { id, name, types, stats } = pokemon;
  const primaryType = types[0] || 'normal';
  const typeColor = TYPE_COLORS[primaryType] || '#A8A77A';

  // Pad ID to 4 digits (e.g. 1 -> #0001)
  const paddedId = `#${id.toString().padStart(4, '0')}`;

  // Helper to get stat abbreviated details
  // Stats mapping in entry: [hp, attack, defense, spAtk, spDef, speed]
  const hp = stats[0];
  const atk = stats[1];
  const def = stats[2];
  const bst = stats.reduce((sum, s) => sum + s, 0);

  return (
    <div className="relative group animate-fade-in">
      {/* Favorite Button overlay */}
      <button
        onClick={(e) => onToggleFavorite(id, e)}
        className="absolute top-3.5 right-3.5 z-10 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 text-slate-400 hover:text-red-500 transition-all shadow-md cursor-pointer"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`w-4 h-4 transition-all ${
            isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 group-hover:scale-105'
          }`}
        />
      </button>

      {/* Main card link */}
      <Link
        to={`/pokemon/${id}`}
        className="block glass-card rounded-3xl p-5 border border-slate-800 dark:border-white/5 light:border-slate-200/80 hover:scale-[1.03] transition-all overflow-hidden h-full flex flex-col justify-between"
        style={{
          // Apply glow border on hover dynamically using Javascript inline style
          boxShadow: `0 0 0px rgba(0,0,0,0)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${typeColor}40`;
          e.currentTarget.style.boxShadow = `0 10px 30px -10px ${typeColor}25, 0 0 15px -3px ${typeColor}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Artwork Container */}
        <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-900/20 to-slate-900/40 dark:from-slate-900/20 dark:to-slate-900/50 light:from-slate-100 light:to-slate-200/50 flex items-center justify-center p-6 group-hover:bg-gradient-to-b transition-all">
          
          {/* Subtle colored background orb */}
          <div
            className="absolute inset-0 m-auto w-3/4 h-3/4 rounded-full filter blur-2xl opacity-15 dark:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:opacity-25 animate-pulse-slow"
            style={{ backgroundColor: typeColor }}
          />

          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
            alt={formatName(name)}
            loading="lazy"
            className="relative w-4/5 h-4/5 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_5px_8px_rgba(0,0,0,0.35)]"
          />
        </div>

        {/* Info */}
        <div className="mt-4 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold font-mono text-slate-500 tracking-wider">
              {paddedId}
            </span>
            <h3 className="font-display font-bold text-lg text-slate-100 light:text-slate-950 truncate capitalize group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
              {formatName(name)}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {types.map((type) => (
              <span
                key={type}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border text-white"
                style={{
                  backgroundColor: `${TYPE_COLORS[type]}20`,
                  borderColor: `${TYPE_COLORS[type]}35`,
                  color: TYPE_COLORS[type],
                }}
              >
                {type}
              </span>
            ))}
          </div>

          {/* Small Stat Preview */}
          <div className="mt-4 pt-3 border-t border-slate-900/10 dark:border-white/5 light:border-slate-200 grid grid-cols-4 gap-1 text-center">
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-500 light:text-slate-500">HP</div>
              <div className="text-xs font-bold text-slate-300 light:text-slate-800">{hp}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-500 light:text-slate-500">ATK</div>
              <div className="text-xs font-bold text-slate-300 light:text-slate-800">{atk}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-500 light:text-slate-500">DEF</div>
              <div className="text-xs font-bold text-slate-300 light:text-slate-800">{def}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-500 light:text-slate-500">BST</div>
              <div className="text-xs font-bold text-red-500 dark:text-red-400">{bst}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
