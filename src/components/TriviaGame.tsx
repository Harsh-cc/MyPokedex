import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Flame, ArrowRight, HelpCircle, Gamepad2, Info } from 'lucide-react';
import { type PokemonIndexEntry, formatName, TYPE_COLORS } from '../services/pokeApi';
import { audio } from '../services/audioService';

interface TriviaGameProps {
  pokemonList: PokemonIndexEntry[];
}

export const TriviaGame: React.FC<TriviaGameProps> = ({ pokemonList }) => {
  const [currentPokemon, setCurrentPokemon] = useState<PokemonIndexEntry | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficultyGen, setDifficultyGen] = useState<string>('all'); // 'all' or '1' through '9'

  // Load highscore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pokedex-game-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Filter Pokemon pool based on selected generation
  const pokemonPool = useMemo(() => {
    if (difficultyGen === 'all') return pokemonList;
    const genNum = parseInt(difficultyGen, 10);
    return pokemonList.filter(p => p.generation === genNum);
  }, [pokemonList, difficultyGen]);

  // Start a new round
  const startNewRound = (playSound = false) => {
    if (pokemonPool.length < 4) return;
    if (playSound) {
      audio.playSelect(); // Play select click!
    }
    setIsRevealed(false);
    setSelectedOption(null);

    // Pick a random target Pokemon
    const targetIdx = Math.floor(Math.random() * pokemonPool.length);
    const target = pokemonPool[targetIdx];
    setCurrentPokemon(target);

    // Generate 3 random distractors (unique and not equal to target)
    const distractors: string[] = [];
    while (distractors.length < 3) {
      const randIdx = Math.floor(Math.random() * pokemonPool.length);
      const candidate = pokemonPool[randIdx].name;
      if (candidate !== target.name && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    // Combine and shuffle options
    const allOptions = [target.name, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  // Trigger first round when pool is ready
  useEffect(() => {
    if (pokemonList.length > 0) {
      startNewRound(false); // Do not play audio on mount!
    }
  }, [pokemonList, difficultyGen]);

  const handleGuess = (optionName: string) => {
    if (isRevealed || !currentPokemon) return;
    
    setSelectedOption(optionName);
    setIsRevealed(true);

    if (optionName === currentPokemon.name) {
      audio.playSuccess(); // Play correct guess chimes!
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highScore) {
        setHighScore(newStreak);
        localStorage.setItem('pokedex-game-highscore', newStreak.toString());
      }
    } else {
      audio.playFailure(); // Play sad buzz!
      setStreak(0);
    }
  };

  const getArtwork = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  if (pokemonList.length === 0 || !currentPokemon) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center glass rounded-3xl border border-slate-800">
        <HelpCircle className="w-12 h-12 text-red-500 mx-auto animate-pulse mb-3" />
        <h2 className="text-xl font-display font-extrabold text-slate-100">Loading Database...</h2>
      </div>
    );
  }

  const primaryType = currentPokemon.types[0] || 'normal';
  const typeColor = TYPE_COLORS[primaryType] || '#A8A77A';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-3 border border-red-500/25 shadow-md">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 light:text-slate-900 mb-2">
          Who's That Pokémon?
        </h1>
        <p className="text-sm font-medium text-slate-400 light:text-slate-600 max-w-sm">
          Test your Pokémon knowledge! Can you guess the Pokémon from its silhouette?
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-center text-center">
          <Flame className="w-5 h-5 text-orange-500 mb-1 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Streak</span>
          <span className="text-lg font-black text-slate-200 light:text-slate-900">{streak}</span>
        </div>

        <div className="glass rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-center text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Best Streak</span>
          <span className="text-lg font-black text-slate-200 light:text-slate-900">{highScore}</span>
        </div>

        {/* Difficulty Gen selector */}
        <div className="glass rounded-2xl p-3 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Generation Pool</span>
          <select
            value={difficultyGen}
            onChange={(e) => {
              setDifficultyGen(e.target.value);
              setStreak(0); // Reset streak on pool change
            }}
            className="w-full text-center px-2 py-1 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-xs font-bold text-slate-300 light:text-slate-700 cursor-pointer"
          >
            <option value="all">All Generations (1025)</option>
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
      </div>

      {/* Game Core Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Column: Silhouette Display Card */}
        <div className="flex flex-col items-center">
          <div 
            className="glass rounded-3xl p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 w-full aspect-square max-w-sm flex items-center justify-center relative overflow-hidden"
            style={{
              boxShadow: isRevealed ? `0 10px 30px -10px ${typeColor}20, 0 0 30px -5px ${typeColor}05` : 'none',
            }}
          >
            {/* Glowing Orb */}
            {isRevealed && (
              <div 
                className="absolute inset-0 m-auto w-3/4 h-3/4 rounded-full filter blur-3xl opacity-20 animate-pulse" 
                style={{ backgroundColor: typeColor }}
              />
            )}

            {/* Silhouette Image */}
            <img
              src={getArtwork(currentPokemon.id)}
              alt="Silhouette"
              className={`w-60 h-60 object-contain drop-shadow-md select-none transition-all duration-700 ${
                isRevealed ? 'brightness-100 scale-105' : 'brightness-0 contrast-200 scale-100'
              }`}
              draggable="false"
            />
          </div>
        </div>

        {/* Right Column: Multiple Choice Buttons */}
        <div className="flex flex-col gap-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Guess Name:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const isCorrectOpt = opt === currentPokemon.name;
              const isSelectedOpt = opt === selectedOption;
              
              let btnClass = 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-200 light:text-slate-800 hover:border-red-500/50 hover:text-red-500 hover:scale-[1.02]';
              
              if (isRevealed) {
                if (isCorrectOpt) {
                  // Correct button turns green
                  btnClass = 'bg-green-500/20 border-green-500/40 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] font-black scale-[1.01]';
                } else if (isSelectedOpt) {
                  // Selected incorrect button turns red
                  btnClass = 'bg-red-500/15 border-red-500/30 text-red-500 font-bold';
                } else {
                  // Other buttons go dim
                  btnClass = 'opacity-40 border-slate-850 dark:border-slate-900 light:border-slate-200 text-slate-500 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={isRevealed}
                  onClick={() => handleGuess(opt)}
                  className={`w-full py-4 px-6 rounded-2xl border text-sm font-semibold capitalize text-center transition-all cursor-pointer ${btnClass}`}
                >
                  {formatName(opt)}
                </button>
              );
            })}
          </div>

          {/* Reveal & Play Next controls */}
          {isRevealed && (
            <div className="mt-4 p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 animate-scale-up border-slate-850 dark:border-white/5 light:border-slate-200 bg-slate-950/20">
              <div className="text-center sm:text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedOption === currentPokemon.name ? '🎉 Splendid Guess!' : '❌ Incorrect!'}
                </div>
                <div className="text-base font-extrabold capitalize text-slate-100 light:text-slate-900 mt-0.5">
                  It's <span style={{ color: typeColor }}>{formatName(currentPokemon.name)}</span>!
                </div>
                <div className="flex gap-1.5 mt-2 justify-center sm:justify-start">
                  {currentPokemon.types.map(t => (
                    <span 
                      key={t}
                      className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border text-white"
                      style={{ backgroundColor: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}50` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startNewRound(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-red-500/25 shrink-0"
              >
                Next Pokémon <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
