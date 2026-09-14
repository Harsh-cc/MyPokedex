import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Scale, Ruler, Sparkles, BookOpen, 
  BarChart3, GitFork, Sword, ShieldAlert, Copy, Check, HelpCircle, Compass
} from 'lucide-react';
import { 
  fetchPokemonDetail, fetchPokemonMoves, type PokemonDetail, type MoveDetail,
  TYPE_COLORS, formatName, getDefensiveEffectiveness, getOffensiveEffectiveness,
  flattenEvolutionChain
} from '../services/pokeApi';
import { audio } from '../services/audioService';

interface PokemonDetailsProps {
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}

export const PokemonDetails: React.FC<PokemonDetailsProps> = ({
  favorites,
  onToggleFavorite,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [moves, setMoves] = useState<MoveDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'evolution' | 'moves' | 'effectiveness'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShiny, setIsShiny] = useState(false);
  
  // Catch Simulator states
  const [ballType, setBallType] = useState<'pokeball' | 'greatball' | 'ultraball' | 'masterball'>('pokeball');
  const [hpPercent, setHpPercent] = useState<number>(100);
  const [statusCondition, setStatusCondition] = useState<'none' | 'minor' | 'major'>('none');
  const [simulationState, setSimulationState] = useState<'idle' | 'throwing' | 'shake1' | 'shake2' | 'shake3' | 'caught' | 'escaped'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // Moves table states
  const [moveSearch, setMoveSearch] = useState('');
  const [moveMethodFilter, setMoveMethodFilter] = useState('');
  
  // URL Share feedback state
  const [copied, setCopied] = useState(false);

  const [hasCampaignSave, setHasCampaignSave] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('pokedex-campaign-save');
    setHasCampaignSave(!!saved);
  }, [id, simulationState]);

  useEffect(() => {
    if (!id) return;
    
    const loadPokemonData = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchPokemonDetail(id);
        setPokemon(detail);
        setIsShiny(false); // Reset shiny mode on pokemon switch
        setSimulationState('idle'); // Reset catch simulator state
        setHpPercent(100);
        setStatusCondition('none');
        setBallType('pokeball');
        setLogs([]);
        
        // Load moves as well
        const movesList = await fetchPokemonMoves(detail.name);
        setMoves(movesList);
      } catch (err) {
        console.error(err);
        setError('Could not fetch Pokémon details. Please check your connection or try another Pokémon.');
      } finally {
        setLoading(false);
      }
    };

    loadPokemonData();
    // Scroll to top when loading new pokemon
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !pokemon) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center glass rounded-3xl border border-red-500/20 animate-scale-up">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">Error Loading Pokémon</h2>
        <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6">{error || 'Something went wrong.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const isFavorite = favorites.includes(pokemon.id);
  const primaryType = pokemon.types[0] || 'normal';
  const typeColor = TYPE_COLORS[primaryType] || '#A8A77A';
  const paddedId = `#${pokemon.id.toString().padStart(4, '0')}`;

  // Shiny artwork and animated sprite urls
  const artworkUrl = isShiny 
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`
    : pokemon.artwork;

  const animatedSpriteUrl = isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${pokemon.id}.gif`
    : pokemon.animatedSprite;

  // Physical specs conversion
  const heightInMeters = pokemon.height / 10;
  const heightInFeet = (heightInMeters * 3.28084).toFixed(1);
  const weightInKg = pokemon.weight / 10;
  const weightInLbs = (weightInKg * 2.20462).toFixed(1);

  // Type Effectiveness Calculations
  const defensiveEffectiveness = getDefensiveEffectiveness(pokemon.types);
  
  // Copy URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter moves
  const filteredMoves = moves.filter(move => {
    const matchesSearch = move.name.toLowerCase().includes(moveSearch.toLowerCase());
    const matchesMethod = moveMethodFilter ? move.method === moveMethodFilter : true;
    return matchesSearch && matchesMethod;
  });

  // Extract unique learning methods for dropdown filter
  const moveMethods = Array.from(new Set(moves.map(m => m.method)));

  // Sleep utility helper for animation timeouts
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Catch Simulator throw logic
  const handleThrow = async () => {
    if (['throwing', 'shake1', 'shake2', 'shake3'].includes(simulationState)) return;
    
    setSimulationState('throwing');
    setLogs([]);
    audio.playThrow(); // Play throw swoosh!
    
    const capRate = pokemon.species.captureRate || 45;
    let ballMult = 1.0;
    if (ballType === 'greatball') ballMult = 1.5;
    else if (ballType === 'ultraball') ballMult = 2.0;
    else if (ballType === 'masterball') ballMult = 255.0;

    let statusMult = 1.0;
    if (statusCondition === 'minor') statusMult = 1.5;
    else if (statusCondition === 'major') statusMult = 2.0;

    const hpFactor = (3 * 100 - 2 * hpPercent) / (3 * 100);
    const a = hpFactor * capRate * ballMult * statusMult;
    
    const pCaught = Math.min(1.0, a / 255);
    const pShake = Math.pow(pCaught, 0.25);
    
    let finalShakes = 0;
    if (ballType === 'masterball') {
      finalShakes = 4;
    } else {
      for (let i = 0; i < 4; i++) {
        if (Math.random() < pShake) {
          finalShakes++;
        } else {
          break;
        }
      }
    }

    const logMessages = [
      `Base Catch Rate: ${capRate}`,
      `Ball Multiplier: ${ballMult}x`,
      `Status Multiplier: ${statusMult}x`,
      `HP Factor: ${hpFactor.toFixed(2)}`,
      `Catch Coefficient (a): ${a.toFixed(1)}`,
      `Catch Probability: ${(pCaught * 100).toFixed(1)}%`,
      `Per-Shake Pass Rate: ${(pShake * 100).toFixed(1)}%`
    ];
    setLogs(logMessages);

    await sleep(800); // Ball fly time
    
    if (finalShakes === 0) {
      audio.playFailure(); // Play breakout fail buzz!
      setSimulationState('escaped');
      return;
    }

    setSimulationState('shake1');
    audio.playShake(); // Play shake thud!
    await sleep(800);
    if (finalShakes === 1) {
      audio.playFailure(); // Play breakout fail buzz!
      setSimulationState('escaped');
      return;
    }

    setSimulationState('shake2');
    audio.playShake(); // Play shake thud!
    await sleep(800);
    if (finalShakes === 2) {
      audio.playFailure(); // Play breakout fail buzz!
      setSimulationState('escaped');
      return;
    }

    setSimulationState('shake3');
    audio.playShake(); // Play shake thud!
    await sleep(800);
    if (finalShakes === 3) {
      audio.playFailure(); // Play breakout fail buzz!
      setSimulationState('escaped');
      return;
    }

    audio.playCatch(); // Play triumphant catch fanfare!
    setSimulationState('caught');
  };

  const calcHpForLevel = (baseHp: number, level: number) => {
    return Math.floor((baseHp * 2 * level) / 100) + level + 10;
  };

  const calcStatForLevel = (baseStat: number, level: number) => {
    return Math.floor((baseStat * 2 * level) / 100) + 5;
  };

  const getMoveDetails = (moveName: string, primaryType: string) => {
    const db: Record<string, { type: string; power: number; isSpecial: boolean }> = {
      tackle: { type: 'normal', power: 40, isSpecial: false },
      flamethrower: { type: 'fire', power: 90, isSpecial: true },
      surf: { type: 'water', power: 90, isSpecial: true },
      thunderbolt: { type: 'electric', power: 90, isSpecial: true },
      energyball: { type: 'grass', power: 90, isSpecial: true },
      icebeam: { type: 'ice', power: 90, isSpecial: true },
      closecombat: { type: 'fighting', power: 120, isSpecial: false },
      sludgebomb: { type: 'poison', power: 90, isSpecial: true },
      earthquake: { type: 'ground', power: 100, isSpecial: false },
      airslash: { type: 'flying', power: 75, isSpecial: true },
      psychic: { type: 'psychic', power: 90, isSpecial: true },
      bugbuzz: { type: 'bug', power: 90, isSpecial: true },
      stoneedge: { type: 'rock', power: 100, isSpecial: false },
      shadowball: { type: 'ghost', power: 80, isSpecial: true },
      dragonpulse: { type: 'dragon', power: 85, isSpecial: true },
      darkpulse: { type: 'dark', power: 80, isSpecial: true },
      flashcannon: { type: 'steel', power: 80, isSpecial: true },
      moonblast: { type: 'fairy', power: 95, isSpecial: true },
      bodyslam: { type: 'normal', power: 85, isSpecial: false },
      quickattack: { type: 'normal', power: 40, isSpecial: false },
      scratch: { type: 'normal', power: 40, isSpecial: false }
    };
    const key = moveName.toLowerCase().replace(/\s/g, '').replace('-', '');
    if (db[key]) {
      return { name: moveName, ...db[key] };
    }
    return { name: moveName, type: primaryType, power: 80, isSpecial: true };
  };

  const handleRecruitToCampaign = () => {
    const savedCampaign = localStorage.getItem('pokedex-campaign-save');
    if (!savedCampaign) return;
    
    try {
      const campaign = JSON.parse(savedCampaign);
      if (campaign.team.length >= 6) {
        alert("Your Campaign Team is full! You can only have up to 6 Pokémon in your team.");
        return;
      }
      
      const maxLvl = Math.max(...campaign.team.map((m: any) => m.level), 5);
      const levelToSet = Math.max(5, maxLvl - Math.floor(Math.random() * 3));
      
      const hp = calcHpForLevel(pokemon.stats[0].value, levelToSet);
      const att = calcStatForLevel(pokemon.stats[1].value, levelToSet);
      const def = calcStatForLevel(pokemon.stats[2].value, levelToSet);
      const spAtt = calcStatForLevel(pokemon.stats[3].value, levelToSet);
      const spDef = calcStatForLevel(pokemon.stats[4].value, levelToSet);
      const speed = calcStatForLevel(pokemon.stats[5].value, levelToSet);
      
      const defaultMoves = [
        { name: 'Tackle', type: 'normal', power: 40, isSpecial: false },
        getMoveDetails(pokemon.types[0] === 'normal' ? 'Quick Attack' : pokemon.types[0] === 'fire' ? 'Flamethrower' : pokemon.types[0] === 'water' ? 'Surf' : 'Body Slam', pokemon.types[0]),
        { name: 'Quick Attack', type: 'normal', power: 40, isSpecial: false },
        { name: 'Scratch', type: 'normal', power: 40, isSpecial: false }
      ];

      const newMember = {
        id: pokemon.id,
        name: pokemon.name,
        level: levelToSet,
        xp: 0,
        xpNeeded: levelToSet * 100,
        maxHp: hp,
        hp: hp,
        moves: defaultMoves,
        types: pokemon.types,
        stats: [hp, att, def, spAtt, spDef, speed]
      };

      campaign.team.push(newMember);
      localStorage.setItem('pokedex-campaign-save', JSON.stringify(campaign));
      audio.playSuccess();
      alert(`🎉 Successfully recruited ${formatName(pokemon.name)} (Level ${levelToSet}) to your Campaign Team!`);
      setSimulationState('idle');
    } catch (e) {
      console.error(e);
    }
  };

  const getPokeballSvg = () => {
    const isShaking = ['shake1', 'shake2', 'shake3'].includes(simulationState);
    let topColor = '#EF4444'; // Red
    let extraGfx = null;

    if (ballType === 'greatball') {
      topColor = '#3B82F6'; // Blue
      extraGfx = (
        <>
          <path d="M 22 23 L 34 14 L 38 24 Z" fill="#EF4444" />
          <path d="M 78 23 L 66 14 L 62 24 Z" fill="#EF4444" />
        </>
      );
    } else if (ballType === 'ultraball') {
      topColor = '#1E293B'; // Slate-800
      extraGfx = (
        <>
          <path d="M 23 15 Q 50 40 77 15" fill="none" stroke="#F59E0B" strokeWidth="6" />
          <path d="M 50 10 L 50 25" fill="none" stroke="#F59E0B" strokeWidth="6" />
        </>
      );
    } else if (ballType === 'masterball') {
      topColor = '#8B5CF6'; // Purple
      extraGfx = (
        <>
          <circle cx="30" cy="30" r="5" fill="#EC4899" />
          <circle cx="70" cy="30" r="5" fill="#EC4899" />
          <text x="50" y="34" fontSize="12" fontWeight="black" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">M</text>
        </>
      );
    }

    return (
      <svg className={`w-14 h-14 ${isShaking ? 'animate-pokeball-shake' : ''} ${simulationState === 'throwing' ? 'animate-bounce' : ''}`} viewBox="0 0 100 100">
        <ellipse cx="50" cy="88" rx="22" ry="4" fill="rgba(0,0,0,0.15)" />
        <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#334155" strokeWidth="4" />
        <path d="M 12 50 A 38 38 0 0 1 88 50 Z" fill={topColor} />
        {extraGfx}
        <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#334155" strokeWidth="4" />
        <line x1="12" y1="50" x2="88" y2="50" stroke="#334155" strokeWidth="5" />
        <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#334155" strokeWidth="4" />
        <circle cx="50" cy="50" r="4.5" fill={simulationState === 'caught' ? '#EF4444' : '#ffffff'} stroke="#475569" strokeWidth="1" />
      </svg>
    );
  };

  // Flattened evolution chain for simple list display
  const evoList = flattenEvolutionChain(pokemon.evolutionChain);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
      {/* Back button + Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-card border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-red-500 font-bold transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Pokédex
        </Link>

        <div className="flex gap-2">
          {/* Share / Copy URL button */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-card border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-slate-100 dark:hover:text-white light:hover:text-slate-900 font-medium transition-all text-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Share URL</span>
              </>
            )}
          </button>

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(pokemon.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-sm font-semibold cursor-pointer ${
              isFavorite
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Card Artwork Left / Detailed Tabs Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Artwork, name, animated sprite, quick badges */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div 
            className="glass rounded-3xl p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 relative overflow-hidden flex flex-col items-center"
            style={{
              boxShadow: `0 10px 30px -10px ${typeColor}15, 0 0 30px -5px ${typeColor}05`,
            }}
          >
            {/* Glowing Orb */}
            <div 
              className="absolute -top-24 -left-24 w-64 h-64 rounded-full filter blur-3xl opacity-10 dark:opacity-15 animate-pulse-slow" 
              style={{ backgroundColor: typeColor }}
            />
            
            {/* National ID Badge */}
            <span className="text-sm font-mono font-bold tracking-wider text-slate-500 mb-2">
              {paddedId}
            </span>

            {/* Title */}
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 light:text-slate-950 capitalize text-center mb-4">
              {formatName(pokemon.name)}
            </h1>

            {/* Type Badges */}
            <div className="flex gap-2 mb-4">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1 rounded-xl border text-white shadow-sm"
                  style={{
                    backgroundColor: TYPE_COLORS[type],
                    borderColor: `${TYPE_COLORS[type]}80`,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Shiny Toggle Button */}
            <button
              onClick={() => setIsShiny(!isShiny)}
              className={`mb-6 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                isShiny
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                  : 'glass-card border-slate-800 dark:border-slate-805 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-white light:hover:text-slate-900'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isShiny ? 'fill-amber-500 text-amber-500 animate-spin-slow' : ''}`} />
              <span>{isShiny ? 'Shiny Mode ON' : 'Shiny Mode OFF'}</span>
            </button>

            {/* Large Artwork */}
            <div className="relative aspect-square w-64 max-w-full flex items-center justify-center mb-8">
              <div 
                className="absolute inset-0 m-auto w-4/5 h-4/5 rounded-full filter blur-2xl opacity-15 dark:opacity-20 animate-pulse" 
                style={{ backgroundColor: typeColor }}
              />
              
              {/* Floating Sparkles when Shiny is Active */}
              {isShiny && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-3.5 h-3.5 text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }}><Sparkles className="w-full h-full fill-amber-400" /></div>
                  <div className="absolute top-1/3 right-1/4 w-4 h-4 text-amber-300 animate-pulse" style={{ animationDelay: '0.5s' }}><Sparkles className="w-full h-full fill-amber-300" /></div>
                  <div className="absolute bottom-1/3 left-1/3 w-3 h-3 text-yellow-400 animate-bounce" style={{ animationDelay: '0.8s' }}><Sparkles className="w-full h-full fill-yellow-400" /></div>
                  <div className="absolute bottom-1/4 right-1/3 w-3.5 h-3.5 text-amber-400 animate-pulse" style={{ animationDelay: '0s' }}><Sparkles className="w-full h-full fill-amber-400" /></div>
                </div>
              )}

              <img 
                src={artworkUrl}
                alt={formatName(pokemon.name)}
                className="relative w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Animated Sprite if available */}
            {animatedSpriteUrl && (
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/30 dark:bg-slate-900/50 light:bg-slate-100/50 border border-slate-900/10 dark:border-white/5 light:border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Battle Sprite</span>
                <img 
                  src={animatedSpriteUrl} 
                  alt={`${pokemon.name} animated`} 
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    // Fallback to static front default if animated GIF fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Forms Switcher if multiple varieties exist */}
            {pokemon.varieties && pokemon.varieties.length > 1 && (
              <div className="w-full mt-6 pt-6 border-t border-slate-900/10 dark:border-white/5 light:border-slate-200/80 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Alternate Forms
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {pokemon.varieties.map((v) => {
                    const isActive = pokemon.name === v.name;
                    const baseName = pokemon.varieties[0].name;
                    let displayName = v.name;
                    if (v.name === baseName) {
                      displayName = 'Standard';
                    } else {
                      displayName = v.name.replace(`${baseName}-`, '');
                    }
                    
                    return (
                      <button
                        key={v.name}
                        onClick={() => navigate(`/pokemon/${v.name}`)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-red-500 border-red-500 text-white shadow-sm'
                            : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-white light:hover:text-slate-900 hover:scale-[1.02]'
                        }`}
                      >
                        {displayName.replace(/-/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-200/50 text-red-500">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Height</div>
                <div className="text-sm font-extrabold text-slate-200 light:text-slate-900">{heightInMeters} m <span className="text-xs font-medium text-slate-500 font-sans">({heightInFeet}')</span></div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-200/50 text-amber-500">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weight</div>
                <div className="text-sm font-extrabold text-slate-200 light:text-slate-900">{weightInKg} kg <span className="text-xs font-medium text-slate-500 font-sans">({weightInLbs} lbs)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-200/50 p-1.5 rounded-2xl border border-slate-800 dark:border-white/5 light:border-slate-200 overflow-x-auto whitespace-nowrap">
            {(['overview', 'stats', 'evolution', 'moves', 'effectiveness'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-800 text-slate-100 dark:bg-slate-800 dark:text-slate-100 light:bg-white light:text-slate-900 light:shadow-sm border border-slate-700/50 dark:border-slate-700/50 light:border-slate-200'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="glass rounded-3xl p-6 sm:p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 min-h-[400px]">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-red-500" /> Pokédex Entry
                  </h3>
                  <p className="text-base leading-relaxed text-slate-200 light:text-slate-800 font-medium italic">
                    "{pokemon.species.description}"
                  </p>
                </div>

                <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200" />

                {/* Characteristics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Abilities</div>
                      <div className="flex flex-col gap-1">
                        {pokemon.abilities.map((ab, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-300 light:text-slate-800">
                            <span>{ab.name}</span>
                            {ab.isHidden && (
                              <span className="text-[9px] bg-slate-900 text-slate-400 light:bg-slate-200 light:text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Hidden</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Egg Groups</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {pokemon.species.eggGroups.map((group) => (
                          <span key={group} className="text-xs font-semibold bg-slate-900/50 dark:bg-slate-900/60 light:bg-slate-200/50 px-2.5 py-1 rounded-lg capitalize text-slate-300 light:text-slate-700">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Gender Ratio</div>
                      {pokemon.species.genderRatio ? (
                        <div className="flex items-center gap-3 w-full text-xs font-bold">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-blue-400">♂ {pokemon.species.genderRatio.male.toFixed(1)}%</span>
                              <span className="text-pink-400">♀ {pokemon.species.genderRatio.female.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-900/60 light:bg-slate-200 h-2 rounded-full overflow-hidden flex">
                              <div className="bg-blue-400 h-full" style={{ width: `${pokemon.species.genderRatio.male}%` }} />
                              <div className="bg-pink-400 h-full flex-1" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600">Genderless</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Habitat</div>
                      <span className="text-sm font-semibold capitalize text-slate-300 light:text-slate-800">
                        {pokemon.species.habitat}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Generation</div>
                      <span className="text-sm font-semibold text-slate-300 light:text-slate-800">
                        {pokemon.species.generation}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Base Experience</div>
                      <span className="text-sm font-semibold text-slate-300 light:text-slate-800">
                        {pokemon.baseExperience} XP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Capture Rate</div>
                        <span className="text-sm font-semibold text-slate-300 light:text-slate-800">
                          {pokemon.species.captureRate} <span className="text-xs font-normal text-slate-500">/ 255</span>
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Growth Rate</div>
                        <span className="text-sm font-semibold capitalize text-slate-300 light:text-slate-800">
                          {pokemon.species.growthRate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 my-4" />

                {/* Catch Simulator Card */}
                <div className="glass rounded-2xl p-5 border border-slate-900/10 dark:border-white/5 light:border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Interactive Catch Simulator
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* Left Column: Adjust parameters */}
                    <div className="flex flex-col gap-4">
                      {/* Pokéball Type Select */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Select Pokéball</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['pokeball', 'greatball', 'ultraball', 'masterball'] as const).map((type) => (
                            <button
                              key={type}
                              disabled={['throwing', 'shake1', 'shake2', 'shake3'].includes(simulationState)}
                              onClick={() => {
                                audio.playSelect(); // Play select click!
                                setBallType(type);
                              }}
                              className={`py-2 px-1 rounded-xl border text-[9px] font-extrabold uppercase text-center transition-all cursor-pointer truncate ${
                                ballType === type
                                  ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-sm'
                                  : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-white light:hover:text-slate-900'
                              }`}
                            >
                              {type.replace('ball', '')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current HP Slider */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          <span>Target HP</span>
                          <span className="text-slate-300 light:text-slate-800">{hpPercent}% HP</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          disabled={['throwing', 'shake1', 'shake2', 'shake3'].includes(simulationState)}
                          value={hpPercent}
                          onChange={(e) => setHpPercent(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>

                      {/* Status Condition Select */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Status Condition</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['none', 'minor', 'major'] as const).map((status) => {
                            const labels = { none: 'Healthy', minor: 'BRN/PAR/PSN', major: 'SLP/FRZ' };
                            return (
                              <button
                                key={status}
                                disabled={['throwing', 'shake1', 'shake2', 'shake3'].includes(simulationState)}
                                onClick={() => {
                                  audio.playSelect(); // Play select click!
                                  setStatusCondition(status);
                                }}
                                className={`py-2 px-1 rounded-xl border text-[9px] font-extrabold uppercase text-center transition-all cursor-pointer ${
                                  statusCondition === status
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-sm'
                                    : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-white light:hover:text-slate-900'
                                }`}
                              >
                                {labels[status]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Catch Arena & Ball Thrower */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/20 dark:bg-slate-950/20 light:bg-slate-50 border border-slate-900/10 dark:border-white/5 light:border-slate-200 rounded-2xl min-h-[170px] text-center relative overflow-hidden">
                      
                      {/* Interactive Arena State */}
                      <div className="flex flex-col items-center gap-3">
                        {/* Pokéball Graphic */}
                        {getPokeballSvg()}

                        {/* Status Label */}
                        <div className="text-xs font-black uppercase tracking-widest text-slate-200 light:text-slate-950 mt-1 min-h-[16px]">
                          {simulationState === 'idle' && `THROW A ${ballType.toUpperCase()}!`}
                          {simulationState === 'throwing' && 'THROWING BALL...'}
                          {simulationState === 'shake1' && '* SHAKE 1 *'}
                          {simulationState === 'shake2' && '* SHAKE 2 *'}
                          {simulationState === 'shake3' && '* SHAKE 3 *'}
                          {simulationState === 'caught' && '🎉 GOTCHA! CAUGHT! 🎉'}
                          {simulationState === 'escaped' && '❌ OH NO! IT BROKE FREE! ❌'}
                        </div>

                        {/* Throw Button */}
                        <div className="flex gap-2 flex-wrap justify-center">
                          <button
                            disabled={['throwing', 'shake1', 'shake2', 'shake3'].includes(simulationState)}
                            onClick={handleThrow}
                            className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
                          >
                            {simulationState === 'caught' || simulationState === 'escaped' ? 'Try Again' : 'Throw Ball'}
                          </button>
                          {simulationState === 'caught' && hasCampaignSave && (
                            <button
                              onClick={handleRecruitToCampaign}
                              className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                            >
                              <Compass className="w-3.5 h-3.5" /> Recruit to Campaign
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display catch probability badge */}
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-900/50 text-[10px] font-black font-mono text-amber-500">
                        CHANCE: {ballType === 'masterball' ? '100.0' : Math.min(100, Math.max(0.1, ((((3 * 100 - 2 * hpPercent) / (3 * 100)) * (pokemon.species.captureRate || 45) * (ballType === 'greatball' ? 1.5 : ballType === 'ultraball' ? 2.0 : 1.0) * (statusCondition === 'minor' ? 1.5 : statusCondition === 'major' ? 2.0 : 1.0)) / 255) * 100)).toFixed(1)}%
                      </div>
                    </div>

                  </div>

                  {/* Math Formula Log toggler */}
                  <div className="mt-4 pt-4 border-t border-slate-900/10 dark:border-white/5 light:border-slate-200">
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 light:hover:text-slate-850 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showLogs ? 'Hide Capture Mechanics (Math)' : 'Show Capture Mechanics (Math)'}</span>
                    </button>

                    {showLogs && logs.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-900 dark:border-slate-900 light:border-slate-200 rounded-xl font-mono text-[9px] text-slate-400 light:text-slate-600 flex flex-col gap-1.5 animate-slide-down">
                        <div className="font-extrabold uppercase text-slate-300 light:text-slate-800 text-[10px] border-b border-slate-900 pb-1 mb-1">Game Capture Calculations:</div>
                        {logs.map((log, lIdx) => (
                          <div key={lIdx} className="truncate">{log}</div>
                        ))}
                        <div className="text-[8px] text-slate-500 mt-1 italic">Calculated using the official Gen 3/4 capture probability formulas.</div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 2. STATS TAB */}
            {activeTab === 'stats' && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-red-500" /> Base Stats
                </h3>

                <div className="flex flex-col gap-4">
                  {pokemon.stats.map((stat) => {
                    const value = stat.value;
                    // Max standard stat is 255 (e.g. Blissey HP)
                    const percentage = Math.min((value / 255) * 100, 100);
                    
                    // Determine stat color based on value
                    let barColor = 'bg-red-500';
                    if (value >= 150) barColor = 'bg-cyan-500';
                    else if (value >= 110) barColor = 'bg-green-500';
                    else if (value >= 80) barColor = 'bg-yellow-500';
                    else if (value >= 50) barColor = 'bg-orange-500';

                    return (
                      <div key={stat.name} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-bold text-slate-400 light:text-slate-600 uppercase tracking-wide truncate">
                          {stat.name}
                        </span>
                        <span className="w-8 text-sm font-extrabold text-right text-slate-200 light:text-slate-900">
                          {value}
                        </span>
                        <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Base Stat Total */}
                  <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 mt-2" />
                  <div className="flex items-center gap-3 mt-1">
                    <span className="w-20 text-xs font-extrabold text-slate-400 light:text-slate-700 uppercase tracking-wide">
                      Total
                    </span>
                    <span className="w-8 text-sm font-black text-right text-red-500 dark:text-red-400">
                      {pokemon.stats.reduce((sum, s) => sum + s.value, 0)}
                    </span>
                    <div className="flex-1 text-xs text-slate-500 font-medium">
                      The sum of all base stats. Average is around 400.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. EVOLUTION TAB */}
            {activeTab === 'evolution' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-red-500" /> Evolution Chain
                </h3>

                {evoList.length > 0 ? (
                  <div className="flex flex-col gap-8 justify-center py-4">
                    {evoList.map((evoGroup, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                        {/* Current Stage */}
                        <Link 
                          to={`/pokemon/${evoGroup.current.id}`}
                          className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center gap-2 w-32 hover:scale-105 transition-all"
                        >
                          <img src={evoGroup.current.artwork} alt={evoGroup.current.name} className="w-16 h-16 object-contain" />
                          <span className="text-xs font-extrabold capitalize text-center text-slate-200 light:text-slate-900">{formatName(evoGroup.current.name)}</span>
                          <span className="text-[9px] font-mono text-slate-500">#{evoGroup.current.id.toString().padStart(4, '0')}</span>
                        </Link>

                        {/* Transition arrows + evolution triggers */}
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-red-500 text-lg md:rotate-0 rotate-90">➜</span>
                        </div>

                        {/* Next Stages */}
                        <div className="flex flex-wrap justify-center gap-4">
                          {evoGroup.next.map((nxt, nIdx) => {
                            const detail = evoGroup.details[nIdx];
                            return (
                              <div key={nIdx} className="flex flex-col items-center gap-1">
                                <Link 
                                  to={`/pokemon/${nxt.id}`}
                                  className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center gap-2 w-32 hover:scale-105 transition-all"
                                >
                                  <img src={nxt.artwork} alt={nxt.name} className="w-16 h-16 object-contain" />
                                  <span className="text-xs font-extrabold capitalize text-center text-slate-200 light:text-slate-900">{formatName(nxt.name)}</span>
                                  <span className="text-[9px] font-mono text-slate-500">#{nxt.id.toString().padStart(4, '0')}</span>
                                </Link>
                                
                                {/* Evolution Conditions Trigger */}
                                {detail && (
                                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 capitalize max-w-[120px] text-center mt-1">
                                    {detail.minLevel && `Lvl ${detail.minLevel}`}
                                    {detail.item && `${detail.item}`}
                                    {detail.happiness && `Happiness ${detail.happiness}`}
                                    {detail.timeOfDay && ` (${detail.timeOfDay})`}
                                    {detail.knownMove && `Knows ${detail.knownMove}`}
                                    {!detail.minLevel && !detail.item && !detail.happiness && !detail.knownMove && detail.trigger}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    This Pokémon does not evolve.
                  </div>
                )}
              </div>
            )}

            {/* 4. MOVES TAB */}
            {activeTab === 'moves' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sword className="w-3.5 h-3.5 text-red-500" /> Moves List
                  </h3>
                  
                  {/* Search and Filters inside Moves */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={moveSearch}
                      onChange={(e) => setMoveSearch(e.target.value)}
                      placeholder="Search moves..."
                      className="px-3 py-1.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-lg text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-red-500 w-full sm:w-36"
                    />

                    <select
                      value={moveMethodFilter}
                      onChange={(e) => setMoveMethodFilter(e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-lg text-xs font-semibold text-slate-300 light:text-slate-700 cursor-pointer"
                    >
                      <option value="">All Methods</option>
                      {moveMethods.map(m => (
                        <option key={m} value={m}>{formatName(m)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredMoves.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-800 dark:border-white/5 light:border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50 dark:bg-slate-900/60 light:bg-slate-200/50 border-b border-slate-800 dark:border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 font-bold">
                          <th className="p-3">Move</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 text-center">Lvl</th>
                          <th className="p-3 text-center">Type</th>
                          <th className="p-3 text-center">Pwr</th>
                          <th className="p-3 text-center">Acc</th>
                          <th className="p-3 text-center">PP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/10 dark:divide-white/5 light:divide-slate-200">
                        {filteredMoves.slice(0, 50).map((move, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/10 dark:hover:bg-slate-900/20 light:hover:bg-slate-100 font-medium text-slate-300 light:text-slate-800">
                            <td className="p-3 font-bold capitalize text-slate-200 light:text-slate-950">{move.name}</td>
                            <td className="p-3 text-slate-500 capitalize">{move.method}</td>
                            <td className="p-3 text-center font-semibold font-mono text-slate-400">{move.level > 0 ? move.level : '-'}</td>
                            <td className="p-3 text-center">
                              <span 
                                className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider text-white"
                                style={{ backgroundColor: TYPE_COLORS[move.type] }}
                              >
                                {move.type}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold font-mono text-slate-200 light:text-slate-900">{move.power !== null ? move.power : '-'}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{move.accuracy !== null ? `${move.accuracy}%` : '-'}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{move.pp !== null ? move.pp : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredMoves.length > 50 && (
                      <div className="p-3 text-center text-[10px] text-slate-500 font-bold bg-slate-900/10 border-t border-slate-800 dark:border-white/5 light:border-slate-200">
                        Showing first 50 of {filteredMoves.length} moves. Filter to narrow down.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    No moves match the search filters.
                  </div>
                )}
              </div>
            )}

            {/* 5. TYPE EFFECTIVENESS TAB */}
            {activeTab === 'effectiveness' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Defensive Weaknesses */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Defensive Weaknesses & Resistances
                  </h3>

                  <div className="flex flex-col gap-4">
                    {/* Quadruple Damage From (4x) */}
                    {defensiveEffectiveness.quadrupleDamageFrom.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Takes 4x Damage From (Extreme Weakness)</div>
                        <div className="flex gap-2 flex-wrap">
                          {defensiveEffectiveness.quadrupleDamageFrom.map(type => (
                            <span 
                              key={type} 
                              className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider border border-red-500/20 text-white"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Double Damage From (2x) */}
                    {defensiveEffectiveness.doubleDamageFrom.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1.5">Takes 2x Damage From (Weakness)</div>
                        <div className="flex gap-2 flex-wrap">
                          {defensiveEffectiveness.doubleDamageFrom.map(type => (
                            <span 
                              key={type} 
                              className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider border border-orange-500/20 text-white"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Half Damage From (0.5x) */}
                    {defensiveEffectiveness.halfDamageFrom.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1.5">Takes 0.5x Damage From (Resistance)</div>
                        <div className="flex gap-2 flex-wrap">
                          {defensiveEffectiveness.halfDamageFrom.map(type => (
                            <span 
                              key={type} 
                              className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider border border-green-500/20 text-white"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quarter Damage From (0.25x) */}
                    {defensiveEffectiveness.quarterDamageFrom.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5">Takes 0.25x Damage From (High Resistance)</div>
                        <div className="flex gap-2 flex-wrap">
                          {defensiveEffectiveness.quarterDamageFrom.map(type => (
                            <span 
                              key={type} 
                              className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider border border-cyan-500/20 text-white"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Damage From (0x) */}
                    {defensiveEffectiveness.noDamageFrom.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Takes 0x Damage From (Immune)</div>
                        <div className="flex gap-2 flex-wrap">
                          {defensiveEffectiveness.noDamageFrom.map(type => (
                            <span 
                              key={type} 
                              className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider border border-slate-500/20 text-white"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 my-2" />

                {/* Offensive strengths */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
                    <Sword className="w-3.5 h-3.5 text-red-500" /> Offensive Effectiveness (By Primary Type: {formatName(primaryType)})
                  </h3>
                  
                  {(() => {
                    const offEff = getOffensiveEffectiveness(primaryType);
                    return (
                      <div className="flex flex-col gap-4">
                        {/* Deals Double Damage To */}
                        {offEff.doubleDamageTo.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1.5">Deals 2x Damage To (Super Effective)</div>
                            <div className="flex gap-2 flex-wrap">
                              {offEff.doubleDamageTo.map(type => (
                                <span 
                                  key={type} 
                                  className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider text-white"
                                  style={{ backgroundColor: TYPE_COLORS[type] }}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deals Half Damage To */}
                        {offEff.halfDamageTo.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1.5">Deals 0.5x Damage To (Not Very Effective)</div>
                            <div className="flex gap-2 flex-wrap">
                              {offEff.halfDamageTo.map(type => (
                                <span 
                                  key={type} 
                                  className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider text-white"
                                  style={{ backgroundColor: TYPE_COLORS[type] }}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deals No Damage To */}
                        {offEff.noDamageTo.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deals 0x Damage To (No Effect)</div>
                            <div className="flex gap-2 flex-wrap">
                              {offEff.noDamageTo.map(type => (
                                <span 
                                  key={type} 
                                  className="px-2.5 py-1 rounded-xl text-xs uppercase font-extrabold tracking-wider text-white"
                                  style={{ backgroundColor: TYPE_COLORS[type] }}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// SKELETON COMPONENT FOR LOADING STATE
const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Back & actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="w-24 h-9 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
        <div className="flex gap-2">
          <div className="w-24 h-9 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
          <div className="w-24 h-9 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass rounded-3xl p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 h-[480px] flex flex-col items-center justify-between">
            <div className="w-16 h-4 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded" />
            <div className="w-48 h-8 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded mt-2" />
            <div className="flex gap-2 mt-2">
              <div className="w-16 h-6 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-full" />
              <div className="w-16 h-6 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-full" />
            </div>
            <div className="w-48 h-48 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-full my-6 shimmer-wrapper" />
            <div className="w-20 h-10 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
            <div className="h-16 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="h-12 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded-2xl" />
          <div className="glass rounded-3xl p-8 border border-slate-800 dark:border-white/5 light:border-slate-200 h-[400px] shimmer-wrapper">
            <div className="w-24 h-4 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded mb-4" />
            <div className="w-full h-20 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded" />
              <div className="h-8 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded" />
              <div className="h-8 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded" />
              <div className="h-8 bg-slate-900 dark:bg-slate-900 light:bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
