import React from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { TYPE_COLORS, formatName } from '../services/pokeApi';

export interface FilterState {
  search: string;
  type: string;
  generation: string;
  habitat: string;
  rarity: 'all' | 'legendary' | 'mythical' | 'special';
  sortBy: 'id' | 'name' | 'height' | 'weight' | 'bst';
  sortOrder: 'asc' | 'desc';
}

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  habitats: string[];
  totalResults: number;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  setFilters,
  habitats,
  totalResults,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleSelectChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      generation: '',
      habitat: '',
      rarity: 'all',
      sortBy: 'id',
      sortOrder: 'asc',
    });
  };

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    (filters.generation ? 1 : 0) +
    (filters.habitat ? 1 : 0) +
    (filters.rarity !== 'all' ? 1 : 0);

  return (
    <div className="w-full flex flex-col gap-4 animate-slide-up">
      {/* Search and Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 light:text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by Pokémon name or ID number..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-slate-500"
            aria-label="Search Pokémon"
          />
        </div>

        <div className="flex gap-2">
          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Reset Button */}
          {(activeFilterCount > 0 || filters.search || filters.sortBy !== 'id') && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center p-3 rounded-2xl glass-card border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 hover:text-red-500 dark:hover:text-red-500 light:text-slate-600 transition-all cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-scale-up">
          {/* Type Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500">Type</label>
            <select
              value={filters.type}
              onChange={e => handleSelectChange('type', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm text-slate-200 light:text-slate-800 focus:outline-none focus:border-red-500 transition-all"
            >
              <option value="">All Types</option>
              {Object.keys(TYPE_COLORS).filter(t => t !== 'unknown' && t !== 'shadow').map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Generation Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500">Generation</label>
            <select
              value={filters.generation}
              onChange={e => handleSelectChange('generation', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm text-slate-200 light:text-slate-800 focus:outline-none focus:border-red-500 transition-all"
            >
              <option value="">All Generations</option>
              <option value="1">Gen I (Kanto)</option>
              <option value="2">Gen II (Johto)</option>
              <option value="3">Gen III (Hoenn)</option>
              <option value="4">Gen IV (Sinnoh)</option>
              <option value="5">Gen V (Unova)</option>
              <option value="6">Gen VI (Kalos)</option>
              <option value="7">Gen VII (Alola)</option>
              <option value="8">Gen VIII (Galar)</option>
              <option value="9">Gen IX (Paldea)</option>
            </select>
          </div>

          {/* Habitat Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500">Habitat</label>
            <select
              value={filters.habitat}
              onChange={e => handleSelectChange('habitat', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm text-slate-200 light:text-slate-800 focus:outline-none focus:border-red-500 transition-all"
            >
              <option value="">All Habitats</option>
              {habitats.map(h => (
                <option key={h} value={h}>
                  {formatName(h)}
                </option>
              ))}
            </select>
          </div>

          {/* Legendary/Mythical Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500">Rarity / Status</label>
            <select
              value={filters.rarity}
              onChange={e => handleSelectChange('rarity', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-sm text-slate-200 light:text-slate-800 focus:outline-none focus:border-red-500 transition-all"
            >
              <option value="all">All Rarity</option>
              <option value="legendary">Legendary Only</option>
              <option value="mythical">Mythical Only</option>
              <option value="special">Legendary & Mythical</option>
            </select>
          </div>
        </div>
      )}

      {/* Sorting bar & Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm px-1.5">
        <span className="text-slate-400 light:text-slate-600 font-medium">
          Showing <span className="text-slate-200 light:text-slate-900 font-bold">{totalResults}</span> Pokémon
        </span>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-slate-500 font-medium">Sort by:</span>
          
          <select
            value={filters.sortBy}
            onChange={e => handleSelectChange('sortBy', e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-lg text-xs font-semibold text-slate-300 light:text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="id">Pokédex Number</option>
            <option value="name">Name</option>
            <option value="height">Height</option>
            <option value="weight">Weight</option>
            <option value="bst">Base Stat Total</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="p-1.5 rounded-lg glass-card border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200 dark:hover:text-white light:hover:text-slate-900 transition-all cursor-pointer font-bold text-xs"
            title="Toggle Sort Order"
          >
            {filters.sortOrder.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
