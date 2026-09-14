import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, History, ArrowUp, AlertCircle } from 'lucide-react';
import { type PokemonIndexEntry, formatName } from '../services/pokeApi';
import { Filters, type FilterState } from './Filters';
import { PokemonCard } from './PokemonCard';

interface HomePageProps {
  pokemonList: PokemonIndexEntry[];
  favorites: number[];
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
  recentlyViewed: number[];
}

export const HomePage: React.FC<HomePageProps> = ({
  pokemonList,
  favorites,
  onToggleFavorite,
  recentlyViewed,
}) => {
  const navigate = useNavigate();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    generation: '',
    habitat: '',
    rarity: 'all',
    sortBy: 'id',
    sortOrder: 'asc',
  });

  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Pagination / Infinite scroll
  const [visibleCount, setVisibleCount] = useState(24);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Extract unique habitats from pokemon list for the filter options
  const habitats = useMemo(() => {
    const set = new Set(pokemonList.map(p => p.habitat));
    return Array.from(set).filter(h => h && h !== 'unknown');
  }, [pokemonList]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter & Sort Pokemon List
  const filteredAndSortedPokemon = useMemo(() => {
    let list = [...pokemonList];

    // Filter by favorites only
    if (favoritesOnly) {
      list = list.filter(p => favorites.includes(p.id));
    }

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.name.includes(q) || 
        p.id.toString() === q ||
        p.types.some(t => t.includes(q)) // Match type names directly from search bar
      );
    }

    // Type filter
    if (filters.type) {
      list = list.filter(p => p.types.includes(filters.type));
    }

    // Generation filter
    if (filters.generation) {
      list = list.filter(p => p.generation === parseInt(filters.generation, 10));
    }

    // Habitat filter
    if (filters.habitat) {
      list = list.filter(p => p.habitat === filters.habitat);
    }

    // Rarity / Status filter
    if (filters.rarity === 'legendary') {
      list = list.filter(p => p.isLegendary);
    } else if (filters.rarity === 'mythical') {
      list = list.filter(p => p.isMythical);
    } else if (filters.rarity === 'special') {
      list = list.filter(p => p.isLegendary || p.isMythical);
    }

    // Sorting logic
    list.sort((a, b) => {
      let comparison = 0;
      
      if (filters.sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (filters.sortBy === 'height') {
        comparison = a.height - b.height;
      } else if (filters.sortBy === 'weight') {
        comparison = a.weight - b.weight;
      } else if (filters.sortBy === 'bst') {
        const bstA = a.stats.reduce((sum, s) => sum + s, 0);
        const bstB = b.stats.reduce((sum, s) => sum + s, 0);
        comparison = bstA - bstB;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [pokemonList, filters, favoritesOnly, favorites]);

  // Infinite Scroll Observer Setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => prev + 24);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [observerTarget, filteredAndSortedPokemon]);

  // Reset page size when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [filters, favoritesOnly]);

  // Trigger Surprise Me (navigates to random Pokémon details)
  const triggerSurpriseMe = () => {
    if (pokemonList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    const randomPokemon = pokemonList[randomIndex];
    if (randomPokemon) {
      navigate(`/pokemon/${randomPokemon.id}`);
    }
  };

  const getArtwork = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 relative">
      
      {/* Hero section */}
      <div className="text-center py-6 sm:py-10 flex flex-col items-center">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-100 light:text-slate-900 mb-3 animate-fade-in">
          Explore the <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Pokéverse</span>
        </h1>
        <p className="text-sm sm:text-base font-medium text-slate-400 light:text-slate-600 max-w-lg mb-6 animate-fade-in">
          A premium archive detailing generation types, stats, base experience, habitat regions, and evolution pathways.
        </p>

        {/* Global actions: Surprise me / Favorites toggle */}
        <div className="flex gap-3 animate-fade-in">
          <button
            onClick={triggerSurpriseMe}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold transition-all shadow-[0_4px_15px_rgba(239,68,68,0.35)] cursor-pointer hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Surprise Me!
          </button>
          
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold transition-all cursor-pointer hover:-translate-y-0.5 ${
              favoritesOnly
                ? 'bg-red-500/10 border-red-500/35 text-red-500 shadow-md shadow-red-500/5'
                : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-red-500'
            }`}
          >
            <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-red-500 text-red-500' : ''}`} />
            {favoritesOnly ? 'Showing Favorites' : 'My Favorites'}
            {favorites.length > 0 && !favoritesOnly && (
              <span className="flex items-center justify-center bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Primary Layout: Main Grid Left / Recently Viewed Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Main Grid */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          {/* Filters Area */}
          <Filters
            filters={filters}
            setFilters={setFilters}
            habitats={habitats}
            totalResults={filteredAndSortedPokemon.length}
          />

          {/* Cards Grid */}
          {filteredAndSortedPokemon.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredAndSortedPokemon.slice(0, visibleCount).map((pokemon) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  isFavorite={favorites.includes(pokemon.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border border-slate-800 dark:border-white/5 light:border-slate-200">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <h3 className="font-display font-bold text-lg text-slate-300 light:text-slate-900 mb-1">No Pokémon Found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          )}

          {/* Observer Target for Infinite scroll */}
          {filteredAndSortedPokemon.length > visibleCount && (
            <div ref={observerTarget} className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-red-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Sidebar: Recently Viewed */}
        <div className="xl:col-span-3 flex flex-col gap-5 xl:sticky xl:top-[88px] animate-slide-up">
          <div className="glass rounded-3xl p-5 border border-slate-800 dark:border-white/5 light:border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" /> Recently Viewed
            </h3>
            
            {recentlyViewed.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentlyViewed.slice(0, 5).map((id) => {
                  const match = pokemonList.find(p => p.id === id);
                  if (!match) return null;
                  
                  return (
                    <button
                      key={id}
                      onClick={() => navigate(`/pokemon/${id}`)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/20 dark:bg-slate-900/30 light:bg-slate-100 hover:bg-slate-900/50 dark:hover:bg-slate-900/60 light:hover:bg-slate-200 border border-slate-900/5 dark:border-white/5 light:border-slate-200/50 text-left transition-all cursor-pointer group"
                    >
                      <img src={getArtwork(id)} alt={match.name} className="w-8 h-8 object-contain" />
                      <div className="truncate flex-1">
                        <div className="text-[9px] font-bold font-mono text-slate-500">#{id.toString().padStart(4, '0')}</div>
                        <div className="text-xs font-extrabold capitalize text-slate-200 light:text-slate-950 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">{formatName(match.name)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500 text-center py-4">No recently viewed entries.</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 cursor-pointer z-30 transition-all hover:scale-105"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
