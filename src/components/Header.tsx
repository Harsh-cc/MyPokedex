import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Database, BarChart3, ArrowLeftRight, Layers, Gamepad2 } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('pokedex-theme', newTheme);
  };

  const linkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200/50'
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg border-b border-slate-900/10 dark:border-white/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-transform duration-500 group-hover:rotate-180">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-5 h-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="currentColor" className="text-slate-950 dark:text-slate-950 light:text-white" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            POKÉDEX<span className="text-slate-500 dark:text-slate-400 font-medium">PRO</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <Link to="/" className={linkClass('/')}>
            <Database className="w-4 h-4" />
            Pokédex
          </Link>
          <Link to="/compare" className={linkClass('/compare')}>
            <ArrowLeftRight className="w-4 h-4" />
            Compare
          </Link>
          <Link to="/teambuilder" className={linkClass('/teambuilder')}>
            <Layers className="w-4 h-4" />
            Team Builder
          </Link>
          <Link to="/game" className={linkClass('/game')}>
            <Gamepad2 className="w-4 h-4" />
            Play Trivia
          </Link>
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            <BarChart3 className="w-4 h-4" />
            Stats Dashboard
          </Link>
        </nav>

        {/* Theme Toggle + Favorites Link */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-slate-100 dark:hover:text-white dark:text-slate-400 light:text-slate-600 light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200 cursor-pointer transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex justify-around mt-3 border-t border-slate-900/10 dark:border-white/5 pt-2 px-4 bg-slate-950/20">
        <Link to="/" className={`${linkClass('/')} flex-1 justify-center py-2 rounded-none border-0`}>
          <Database className="w-4 h-4" />
          <span className="text-xs">Pokédex</span>
        </Link>
        <Link to="/compare" className={`${linkClass('/compare')} flex-1 justify-center py-2 rounded-none border-0`}>
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-xs">Compare</span>
        </Link>
        <Link to="/teambuilder" className={`${linkClass('/teambuilder')} flex-1 justify-center py-2 rounded-none border-0`}>
          <Layers className="w-4 h-4" />
          <span className="text-xs">Team</span>
        </Link>
        <Link to="/game" className={`${linkClass('/game')} flex-1 justify-center py-2 rounded-none border-0`}>
          <Gamepad2 className="w-4 h-4" />
          <span className="text-xs">Trivia</span>
        </Link>
        <Link to="/dashboard" className={`${linkClass('/dashboard')} flex-1 justify-center py-2 rounded-none border-0`}>
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs">Stats</span>
        </Link>
      </div>
    </header>
  );
};
