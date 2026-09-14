import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ShieldAlert, ShieldCheck, BarChart3, Save, 
  Layers, FolderOpen, AlertTriangle, Sparkles, Search
} from 'lucide-react';
import { 
  type PokemonIndexEntry, TYPE_COLORS, formatName, getDefensiveEffectiveness,
  fetchPokemonMoves
} from '../services/pokeApi';
import { audio } from '../services/audioService';

interface TeamMember {
  pokemonId: number;
  moves: string[];
}

interface Team {
  id: string;
  name: string;
  members: (number | TeamMember)[]; // Array of IDs or structured members
}

interface TeamBuilderProps {
  pokemonList: PokemonIndexEntry[];
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({ pokemonList }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('My First Team');
  
  // Active team members state
  const [members, setMembers] = useState<(number | TeamMember)[]>([]);
  
  // Moves Editor state
  const [movesEditorSlot, setMovesEditorSlot] = useState<number | null>(null);
  const [availableMoves, setAvailableMoves] = useState<string[]>([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  
  // Search and filter state for adding member
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null); // Slot index currently being edited (0-5)
  const [showSearchModal, setShowSearchModal] = useState(false);

  // 1. Load saved teams from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pokedex-teams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Team[];
        setTeams(parsed);
        if (parsed.length > 0) {
          setActiveTeamId(parsed[0].id);
          setTeamName(parsed[0].name);
          setMembers(parsed[0].members);
        }
      } catch (e) {
        console.error("Failed to load teams", e);
      }
    }
  }, []);

  // 2. Map member IDs to actual Pokemon objects
  const teamPokemon = useMemo(() => {
    return members.map(m => {
      const id = typeof m === 'number' ? m : m.pokemonId;
      return pokemonList.find(p => p.id === id);
    }).filter((p): p is PokemonIndexEntry => !!p);
  }, [members, pokemonList]);

  // 3. Calculate Combined Team Stats
  const teamStats = useMemo(() => {
    const STAT_LABELS = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
    const sum = [0, 0, 0, 0, 0, 0];
    
    if (teamPokemon.length === 0) return { totals: sum.map((_, idx) => ({ name: STAT_LABELS[idx], value: 0 })), bst: 0 };

    teamPokemon.forEach(p => {
      p.stats.forEach((s, idx) => {
        sum[idx] += s;
      });
    });

    const totals = sum.map((val, idx) => ({
      name: STAT_LABELS[idx],
      value: Math.round(val / teamPokemon.length) // Average stat value of the team
    }));

    const bst = teamPokemon.reduce((acc, p) => acc + p.stats.reduce((sAcc, s) => sAcc + s, 0), 0);

    return { totals, bst };
  }, [teamPokemon]);

  // 4. Calculate Team Type Defensive Weaknesses & Coverage
  const typeWeaknessMatrix = useMemo(() => {
    const matrix: Record<string, { weak: number; resist: number; immune: number }> = {};
    
    // Seed matrix with all types
    Object.keys(TYPE_COLORS).forEach(type => {
      if (type !== 'unknown' && type !== 'shadow') {
        matrix[type] = { weak: 0, resist: 0, immune: 0 };
      }
    });

    teamPokemon.forEach(p => {
      const eff = getDefensiveEffectiveness(p.types);
      
      // Accumulate weaknesses
      [...eff.doubleDamageFrom, ...eff.quadrupleDamageFrom].forEach(t => {
        if (matrix[t]) matrix[t].weak++;
      });

      // Accumulate resistances
      [...eff.halfDamageFrom, ...eff.quarterDamageFrom].forEach(t => {
        if (matrix[t]) matrix[t].resist++;
      });

      // Accumulate immunities
      eff.noDamageFrom.forEach(t => {
        if (matrix[t]) matrix[t].immune++;
      });
    });

    return matrix;
  }, [teamPokemon]);

  // 5. Detect major vulnerabilities (e.g. 3 or more members weak to same type)
  const vulnerabilities = useMemo(() => {
    return Object.entries(typeWeaknessMatrix)
      .filter(([_, data]) => data.weak >= 3)
      .map(([type, data]) => ({ type, count: data.weak }));
  }, [typeWeaknessMatrix]);

  // Add a member to team slot
  const handleAddMember = (id: number) => {
    if (activeSlot === null) return;
    audio.playSelect();
    const updated = [...members];
    // Add as a structured object with empty moves
    updated[activeSlot] = { pokemonId: id, moves: [] };
    setMembers(updated.filter(Boolean));
    setShowSearchModal(false);
    setActiveSlot(null);
    setSearchQuery('');
    setTypeFilter('');
  };

  // Remove a member from slot
  const handleRemoveMember = (idx: number) => {
    audio.playSelect();
    const updated = members.filter((_, i) => i !== idx);
    setMembers(updated);
  };

  // Edit Moves handlers
  const handleOpenMovesEditor = async (slotIdx: number) => {
    const member = members[slotIdx];
    if (!member) return;
    
    const pokemonId = typeof member === 'number' ? member : member.pokemonId;
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    if (!pokemon) return;

    audio.playSelect();
    setMovesEditorSlot(slotIdx);
    setLoadingMoves(true);
    setMoveSearchQuery('');

    // Prepopulate selected moves
    const currentMoves = typeof member === 'number' ? [] : member.moves || [];
    setSelectedMoves(currentMoves);

    try {
      const movesList = await fetchPokemonMoves(pokemon.name);
      const uniqueNames = Array.from(new Set(movesList.map(m => m.name)));
      setAvailableMoves(uniqueNames);
    } catch (e) {
      console.error("Failed to load moves for builder", e);
    } finally {
      setLoadingMoves(false);
    }
  };

  const handleToggleMove = (moveName: string) => {
    audio.playSelect();
    if (selectedMoves.includes(moveName)) {
      setSelectedMoves(selectedMoves.filter(m => m !== moveName));
    } else {
      if (selectedMoves.length >= 4) {
        alert("You can select a maximum of 4 moves!");
        return;
      }
      setSelectedMoves([...selectedMoves, moveName]);
    }
  };

  const handleSaveMoves = () => {
    if (movesEditorSlot === null) return;
    audio.playSuccess();
    
    const updated = [...members];
    const currentMember = updated[movesEditorSlot];
    const pId = typeof currentMember === 'number' ? currentMember : currentMember.pokemonId;
    
    updated[movesEditorSlot] = {
      pokemonId: pId,
      moves: selectedMoves
    };
    
    setMembers(updated);
    setMovesEditorSlot(null);
  };

  // Save current team
  const handleSaveTeam = () => {
    audio.playSuccess();
    let updatedTeams = [...teams];
    const newTeam: Team = {
      id: activeTeamId || Math.random().toString(36).substring(2, 9),
      name: teamName || 'Unnamed Team',
      members
    };

    if (activeTeamId && teams.some(t => t.id === activeTeamId)) {
      updatedTeams = teams.map(t => t.id === activeTeamId ? newTeam : t);
    } else {
      updatedTeams.push(newTeam);
      setActiveTeamId(newTeam.id);
    }

    setTeams(updatedTeams);
    localStorage.setItem('pokedex-teams', JSON.stringify(updatedTeams));
    alert("Team saved successfully!");
  };

  // Load a team
  const handleLoadTeam = (team: Team) => {
    setActiveTeamId(team.id);
    setTeamName(team.name);
    setMembers(team.members);
  };

  // Delete a team
  const handleDeleteTeam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    localStorage.setItem('pokedex-teams', JSON.stringify(updated));

    if (activeTeamId === id) {
      if (updated.length > 0) {
        handleLoadTeam(updated[0]);
      } else {
        setActiveTeamId(null);
        setTeamName('New Team');
        setMembers([]);
      }
    }
  };

  // Clear current team editor
  const handleNewTeam = () => {
    setActiveTeamId(null);
    setTeamName('New Team');
    setMembers([]);
  };

  // Search filter matching name, id, and type
  const filteredSearchList = useMemo(() => {
    return pokemonList.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.id.toString() === searchQuery ||
        p.types.some(t => t.includes(searchQuery.toLowerCase().trim())); // Match type names directly from search bar
      const matchesType = typeFilter ? p.types.includes(typeFilter) : true;
      return matchesSearch && matchesType;
    }).slice(0, 8);
  }, [pokemonList, searchQuery, typeFilter]);

  const getArtwork = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-3 border border-red-500/25 shadow-md">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 light:text-slate-900 mb-2">
          Pokémon Team Builder
        </h1>
        <p className="text-sm font-medium text-slate-400 light:text-slate-600 max-w-lg">
          Assemble a battle-ready squad of up to 6 Pokémon, analyze their combined base statistics, and calculate defensive type vulnerabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Saved Teams list */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass rounded-2xl p-5 border border-slate-800 dark:border-white/5 light:border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-slate-400" /> Saved Teams
              </h3>
              <button 
                onClick={handleNewTeam}
                className="text-[10px] uppercase font-bold text-red-500 hover:text-red-400 transition-colors"
              >
                + New
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleLoadTeam(team)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs font-bold capitalize flex items-center justify-between transition-all group ${
                    activeTeamId === team.id
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700'
                  }`}
                >
                  <span className="truncate">{team.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">({team.members.length}/6)</span>
                    <Trash2 
                      onClick={(e) => handleDeleteTeam(team.id, e)}
                      className="w-3.5 h-3.5 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </button>
              ))}
              {teams.length === 0 && (
                <p className="text-[10px] font-bold text-slate-500 text-center py-4">No saved teams.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Team Editor Workspace */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Team Name Input & Save Action */}
          <div className="glass rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <input 
              type="text" 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-transparent text-lg font-display font-extrabold text-slate-100 light:text-slate-900 border-b border-transparent focus:border-red-500 focus:outline-none w-full sm:w-64 pb-1 capitalize"
              placeholder="Team Name..."
            />
            
            <button
              onClick={handleSaveTeam}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] shrink-0 w-full sm:w-auto justify-center cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Team
            </button>
          </div>

          {/* Slots Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => {
              const pokemon = teamPokemon[idx];
              
              if (pokemon) {
                return (
                  <div 
                    key={idx}
                    className="glass-card rounded-2xl p-4 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-between text-center relative group min-h-[170px]"
                  >
                    {/* Trash overlay */}
                    <button 
                      onClick={() => handleRemoveMember(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/60 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all border border-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <span className="text-[9px] font-mono text-slate-500">Slot {idx + 1}</span>
                    
                    <img 
                      src={getArtwork(pokemon.id)} 
                      alt={pokemon.name} 
                      className="w-16 h-16 object-contain my-2 drop-shadow-md" 
                    />
                    
                    <div className="truncate w-full">
                      <div className="text-xs font-black capitalize text-slate-200 light:text-slate-950">{formatName(pokemon.name)}</div>
                      
                      <div className="flex gap-1 justify-center mt-1">
                        {pokemon.types.map(t => (
                          <span 
                            key={t}
                            className="text-[8px] font-bold uppercase px-1 py-0.25 rounded border text-white"
                            style={{ backgroundColor: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}50` }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleOpenMovesEditor(idx)}
                        className="mt-3 text-[9px] font-extrabold uppercase py-1.5 px-2 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-200 border border-slate-800 hover:border-red-500/50 hover:text-red-500 text-slate-400 light:text-slate-600 transition-all cursor-pointer w-full text-center truncate"
                      >
                        {(() => {
                          const mObj = members[idx];
                          const count = mObj && typeof mObj !== 'number' ? mObj.moves?.length || 0 : 0;
                          return count > 0 ? `🛡️ ${count} Moves` : '⚙️ Set Moves';
                        })()}
                      </button>
                    </div>
                  </div>
                );
              }

              // Empty slot
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSlot(idx);
                    setShowSearchModal(true);
                  }}
                  className="glass-card rounded-2xl p-4 border border-dashed border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col items-center justify-center gap-2 text-center text-slate-500 hover:text-red-500 hover:border-red-500/50 transition-all min-h-[170px] cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-200 flex items-center justify-center border border-slate-800 dark:border-white/5 light:border-slate-300">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Slot {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Analysis Section */}
          {teamPokemon.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Stats averages */}
              <div className="md:col-span-5 glass rounded-2xl p-5 border border-slate-800 dark:border-white/5 light:border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-slate-400" /> Team Average Stats
                </h3>

                <div className="flex flex-col gap-3">
                  {teamStats.totals.map(stat => {
                    const percentage = Math.min((stat.value / 150) * 100, 100);
                    return (
                      <div key={stat.name} className="flex items-center gap-3">
                        <span className="w-16 text-[10px] font-bold text-slate-400 light:text-slate-600 uppercase tracking-wide truncate">{stat.name}</span>
                        <span className="w-7 text-xs font-extrabold text-slate-200 light:text-slate-900 text-right">{stat.value}</span>
                        <div className="flex-1 bg-slate-900/60 light:bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 my-1" />
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Cumulative BST:</span>
                    <span className="text-red-500 dark:text-red-400 font-extrabold">{teamStats.bst}</span>
                  </div>
                </div>
              </div>

              {/* Vulnerabilities & Strengths summary */}
              <div className="md:col-span-7 glass rounded-2xl p-5 border border-slate-800 dark:border-white/5 light:border-slate-200 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-400" /> Team Vulnerabilities
                </h3>

                {vulnerabilities.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="text-[10px] text-slate-500 font-bold">The following attack types deal super effective damage to 3 or more of your team members:</div>
                    <div className="flex flex-wrap gap-2">
                      {vulnerabilities.map(v => (
                        <div 
                          key={v.type}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-bold capitalize"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{v.type}</span>
                          <span className="px-1.5 py-0.25 bg-red-500 text-white rounded text-[9px] font-mono">{v.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-bold">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div>
                      <div>Excellent Balance!</div>
                      <div className="font-medium text-slate-400 light:text-slate-600 mt-0.5">Your team has no overlapping weaknesses across 3 or more members.</div>
                    </div>
                  </div>
                )}

                {/* Interactive Defensive Matrix */}
                <div className="h-px bg-slate-900/10 dark:bg-white/5 light:bg-slate-200 my-1" />
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Defense Matrix (Weaknesses / Resistances)</div>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                    {Object.entries(typeWeaknessMatrix).map(([type, data]) => {
                      const net = data.resist + data.immune - data.weak;
                      
                      let cellColor = 'border-slate-800 text-slate-400 light:border-slate-200';
                      if (net > 0) cellColor = 'border-green-500/30 text-green-400 bg-green-500/5';
                      if (net < 0) cellColor = 'border-red-500/30 text-red-400 bg-red-500/5';

                      return (
                        <div 
                          key={type}
                          className={`flex flex-col items-center justify-center p-1 rounded-lg border text-[9px] font-bold capitalize select-none cursor-help ${cellColor}`}
                          title={`${formatName(type)} defense: ${data.weak} Weak, ${data.resist} Resistant, ${data.immune} Immune`}
                        >
                          <span className="truncate w-full text-center text-[8px] opacity-75">{type.substring(0, 4)}</span>
                          <span className="text-[10px] mt-0.5">{net > 0 ? `+${net}` : net}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* SEARCH MODAL POP OVER */}
      {showSearchModal && activeSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              setShowSearchModal(false);
              setActiveSlot(null);
              setSearchQuery('');
              setTypeFilter('');
            }}
          />
          
          {/* Modal content */}
          <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200 w-full max-w-md relative z-10 animate-scale-up">
            <h3 className="font-display font-extrabold text-lg text-slate-100 light:text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500" /> Select Pokémon for Slot {activeSlot + 1}
            </h3>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-xs font-semibold text-slate-300 light:text-slate-700 cursor-pointer"
              >
                <option value="">All Types</option>
                {Object.keys(TYPE_COLORS).filter(t => t !== 'unknown' && t !== 'shadow').map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredSearchList.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddMember(p.id)}
                  className="w-full px-4 py-3 hover:bg-slate-900/40 dark:hover:bg-slate-900/50 light:hover:bg-slate-100 flex items-center justify-between text-left text-sm font-semibold capitalize text-slate-300 light:text-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-900/5 dark:border-white/5"
                >
                  <span className="flex items-center gap-3">
                    <img src={getArtwork(p.id)} alt={p.name} className="w-7 h-7 object-contain" />
                    {formatName(p.name)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">#{p.id.toString().padStart(4, '0')}</span>
                </button>
              ))}
              {filteredSearchList.length === 0 && (
                <div className="p-3 text-xs text-slate-500 text-center font-bold">No results found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOVES EDITOR MODAL */}
      {movesEditorSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMovesEditorSlot(null)}
          />
          
          <div className="glass rounded-3xl p-6 border border-slate-800 dark:border-white/5 light:border-slate-200 w-full max-w-lg relative z-10 animate-scale-up">
            <h3 className="font-display font-extrabold text-lg text-slate-100 light:text-slate-900 mb-2">
              Select Moves ({selectedMoves.length}/4)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Choose up to 4 moves for {(() => {
                const member = members[movesEditorSlot];
                const pId = typeof member === 'number' ? member : member?.pokemonId;
                const p = pokemonList.find(x => x.id === pId);
                return p ? formatName(p.name) : 'Pokémon';
              })()}.
            </p>

            {/* Selected moves list */}
            {selectedMoves.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4 p-3 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 rounded-xl border border-slate-850 dark:border-white/5">
                {selectedMoves.map(move => (
                  <span 
                    key={move}
                    onClick={() => handleToggleMove(move)}
                    className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] font-black text-red-500 uppercase flex items-center gap-1.5 cursor-pointer hover:bg-red-500/20"
                  >
                    {formatName(move)} <span className="text-[8px] font-normal">✕</span>
                  </span>
                ))}
              </div>
            )}

            {/* Search Move bar */}
            <div className="relative mb-4">
              <input
                type="text"
                value={moveSearchQuery}
                onChange={(e) => setMoveSearchQuery(e.target.value)}
                placeholder="Search moves list..."
                className="w-full px-4 py-2.5 bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            {loadingMoves ? (
              <div className="p-8 text-center text-xs font-bold text-slate-500 animate-pulse">Loading movesets...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 mb-6">
                {availableMoves
                  .filter(m => m.toLowerCase().includes(moveSearchQuery.toLowerCase()))
                  .map(move => {
                    const isSelected = selectedMoves.includes(move);
                    return (
                      <button
                        key={move}
                        onClick={() => handleToggleMove(move)}
                        className={`py-2 px-3 rounded-xl border text-left text-xs font-semibold capitalize transition-all cursor-pointer truncate ${
                          isSelected
                            ? 'bg-red-500/10 border-red-500/30 text-red-500'
                            : 'glass-card border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-350 light:text-slate-700 hover:border-red-500/30'
                        }`}
                      >
                        {formatName(move)}
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-900/10 dark:border-white/5 light:border-slate-200 pt-4">
              <button
                onClick={() => setMovesEditorSlot(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 light:hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMoves}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer"
              >
                Save Moves
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
