import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PokemonDetails } from './components/PokemonDetails';
import { ComparePage } from './components/ComparePage';
import { StatsDashboard } from './components/StatsDashboard';
import { TeamBuilder } from './components/TeamBuilder';
import { TriviaGame } from './components/TriviaGame';
import { loadPokemonIndex, type PokemonIndexEntry, formatName } from './services/pokeApi';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

function AppContent() {
  const location = useLocation();
  
  // App initialization states
  const [pokemonList, setPokemonList] = useState<PokemonIndexEntry[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbProgress, setDbProgress] = useState(0);

  // User preference states
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  
  // Custom toast notification system
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 1. Initialize Theme, Favorites & Recent items on mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('pokedex-theme') as 'dark' | 'light';
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(initialTheme);

    // Favorites
    const savedFavorites = localStorage.getItem('pokedex-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error(e);
      }
    }

    // Recently Viewed
    const savedRecent = localStorage.getItem('pokedex-recently-viewed');
    if (savedRecent) {
      try {
        setRecentlyViewed(JSON.parse(savedRecent));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 2. Load PokéAPI Index on mount
  useEffect(() => {
    const initializeDb = async () => {
      try {
        const list = await loadPokemonIndex((progress) => {
          setDbProgress(progress);
        });
        setPokemonList(list);
        setDbLoading(false);
      } catch (err) {
        console.error("Failed to load Pokédex index:", err);
        showToast("Initialization error. Check connection and reload.", "error");
      }
    };
    
    initializeDb();
  }, []);

  // 3. Handle tracking recently viewed on route change
  useEffect(() => {
    // Check if we are on details page
    const match = location.pathname.match(/\/pokemon\/(\d+|\w+)/);
    if (match && match[1] && pokemonList.length > 0) {
      let pokemonId: number | null = null;
      const param = match[1].toLowerCase().trim();

      // Find by ID or Name
      if (/^\d+$/.test(param)) {
        pokemonId = parseInt(param, 10);
      } else {
        const entry = pokemonList.find(p => p.name === param);
        if (entry) pokemonId = entry.id;
      }

      if (pokemonId && pokemonId <= 251) {
        addToRecentlyViewed(pokemonId);
      }
    }
  }, [location, pokemonList]);

  // Toast Trigger Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];

    setFavorites(updated);
    localStorage.setItem('pokedex-favorites', JSON.stringify(updated));

    const match = pokemonList.find(p => p.id === id);
    const name = match ? formatName(match.name) : `Pokémon #${id}`;

    if (favorites.includes(id)) {
      showToast(`${name} removed from Favorites`, 'info');
    } else {
      showToast(`${name} added to Favorites!`, 'success');
    }
  };

  const handleToggleFavoriteDetail = (id: number) => {
    handleToggleFavorite(id);
  };

  // Add to recently viewed
  const addToRecentlyViewed = (id: number) => {
    const list = [id, ...recentlyViewed.filter(recentId => recentId !== id)].slice(0, 5);
    setRecentlyViewed(list);
    localStorage.setItem('pokedex-recently-viewed', JSON.stringify(list));
  };

  // 4. Loading screen
  if (dbLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        {/* Glowing Pokéball spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-spin mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="3" fill="currentColor" className="text-slate-950" />
          </svg>
        </div>

        <h2 className="font-display font-extrabold text-2xl tracking-wide mb-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          INITIALIZING POKÉDEX PRO
        </h2>
        
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
          Caching Gen 1 & 2 Database Index...
        </p>

        {/* Progress bar */}
        <div className="w-64 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full transition-all duration-300"
            style={{ width: `${dbProgress}%` }}
          />
        </div>
        
        <span className="text-sm font-bold text-slate-400 mt-2">
          {dbProgress}%
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header theme={theme} setTheme={setTheme} />
        
        <main className="pb-16">
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  pokemonList={pokemonList} 
                  favorites={favorites} 
                  onToggleFavorite={handleToggleFavorite}
                  recentlyViewed={recentlyViewed}
                />
              } 
            />
            <Route 
              path="/pokemon/:id" 
              element={
                <PokemonDetails 
                  favorites={favorites} 
                  onToggleFavorite={handleToggleFavoriteDetail}
                />
              } 
            />
            <Route 
              path="/compare" 
              element={<ComparePage pokemonList={pokemonList} />} 
            />
            <Route 
              path="/teambuilder" 
              element={<TeamBuilder pokemonList={pokemonList} />} 
            />
            <Route 
              path="/game" 
              element={<TriviaGame pokemonList={pokemonList} />} 
            />
            <Route 
              path="/dashboard" 
              element={<StatsDashboard pokemonList={pokemonList} />} 
            />
          </Routes>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900/10 dark:border-white/5 bg-slate-900/10 text-center text-xs font-semibold text-slate-500">
        Pokédex Pro is a fan project utilizing data from the <a href="https://pokeapi.co/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-300 transition-colors">PokéAPI</a>. Pokémon © Nintendo.
      </footer>

      {/* Floating Toast Notification container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = 'border-slate-800 text-slate-200';
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'border-green-500/25 text-green-400 bg-green-500/5';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'border-red-500/25 text-red-400 bg-red-500/5';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-4.5 py-3 rounded-2xl border glass shadow-lg animate-scale-up ${colorClass}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold font-sans">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
