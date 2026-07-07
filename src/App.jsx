import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronUp,
  Crown,
  Home,
  ImagePlus,
  Library,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import DraftLibrary from './components/DraftLibrary';
import { loadBoardState, saveBoardState } from './lib/draftLibraryStorage';

const STORAGE_KEY = 'brawl-draft-master-state-v3';

const TIER_SECTIONS = [
  { id: 'priority', title: 'Priorities', accent: '#ff5f7d', hint: 'Core team focus' },
  { id: 's', title: 'S Tier', accent: '#ffca5e', hint: 'Meta-defining threats' },
  { id: 'a', title: 'A Tier', accent: '#7cd8ff', hint: 'Reliable anchors' },
  { id: 'b', title: 'B Tier', accent: '#9dff7c', hint: 'Flexible options' },
  { id: 'c', title: 'C Tier', accent: '#bda3ff', hint: 'Situational answers' },
  { id: 'd', title: 'D Tier', accent: '#ff8b6b', hint: 'Last-resort picks' },
];

const BOTTOM_SECTIONS = [
  { id: 'banFirst', title: 'Ban (First Pick)', description: 'Opening bans to deny the strongest counters' },
  { id: 'globalBan', title: 'Global Ban', description: 'Shared bans that shape both sides' },
  { id: 'banLast', title: 'Ban (Last Pick)', description: 'Late-game pivots and anti-comps' },
  { id: 'firstPicks', title: 'Best First Picks', description: 'The strongest opening lineups' },
];

const MAPS = [
  { id: 'stormy', name: 'Stormy Plains', image: 'https://cdn.brawlstars.com/brawl/maps/stormy-plains.png' },
  { id: 'canyon', name: 'Black Hole', image: 'https://cdn.brawlstars.com/brawl/maps/black-hole.png' },
  { id: 'aurora', name: 'Aurora Gardens', image: 'https://cdn.brawlstars.com/brawl/maps/aurora-gardens.png' },
];

const BRAWLERS = [
  { id: 'shelly', name: 'Shelly', icon: 'https://cdn.brawlstars.com/brawl/characters/shelly.png', rarity: 'Common', class: 'Frontline' },
  { id: 'nita', name: 'Nita', icon: 'https://cdn.brawlstars.com/brawl/characters/nita.png', rarity: 'Rare', class: 'Support' },
  { id: 'colt', name: 'Colt', icon: 'https://cdn.brawlstars.com/brawl/characters/colt.png', rarity: 'Common', class: 'Marksman' },
  { id: 'bull', name: 'Bull', icon: 'https://cdn.brawlstars.com/brawl/characters/bull.png', rarity: 'Common', class: 'Bruiser' },
  { id: 'jessie', name: 'Jessie', icon: 'https://cdn.brawlstars.com/brawl/characters/jessie.png', rarity: 'Rare', class: 'Artillery' },
  { id: 'brock', name: 'Brock', icon: 'https://cdn.brawlstars.com/brawl/characters/brock.png', rarity: 'Super Rare', class: 'Sniper' },
  { id: 'dynamike', name: 'Dynamike', icon: 'https://cdn.brawlstars.com/brawl/characters/dynamike.png', rarity: 'Rare', class: 'Splash' },
  { id: 'bo', name: 'Bo', icon: 'https://cdn.brawlstars.com/brawl/characters/bo.png', rarity: 'Super Rare', class: 'Support' },
  { id: 'el-primo', name: 'El Primo', icon: 'https://cdn.brawlstars.com/brawl/characters/el-primo.png', rarity: 'Rare', class: 'Bruiser' },
  { id: 'barley', name: 'Barley', icon: 'https://cdn.brawlstars.com/brawl/characters/barley.png', rarity: 'Rare', class: 'Area' },
  { id: 'poco', name: 'Poco', icon: 'https://cdn.brawlstars.com/brawl/characters/poco.png', rarity: 'Rare', class: 'Support' },
  { id: 'rosa', name: 'Rosa', icon: 'https://cdn.brawlstars.com/brawl/characters/rosa.png', rarity: 'Rare', class: 'Tank' },
  { id: 'rico', name: 'Rico', icon: 'https://cdn.brawlstars.com/brawl/characters/rico.png', rarity: 'Super Rare', class: 'Marksman' },
  { id: 'darryl', name: 'Darryl', icon: 'https://cdn.brawlstars.com/brawl/characters/darryl.png', rarity: 'Common', class: 'Tank' },
  { id: 'penny', name: 'Penny', icon: 'https://cdn.brawlstars.com/brawl/characters/penny.png', rarity: 'Rare', class: 'Artillery' },
  { id: 'carl', name: 'Carl', icon: 'https://cdn.brawlstars.com/brawl/characters/carl.png', rarity: 'Rare', class: 'Chaser' },
  { id: 'piper', name: 'Piper', icon: 'https://cdn.brawlstars.com/brawl/characters/piper.png', rarity: 'Epic', class: 'Sniper' },
  { id: 'pam', name: 'Pam', icon: 'https://cdn.brawlstars.com/brawl/characters/pam.png', rarity: 'Rare', class: 'Support' },
  { id: 'frank', name: 'Frank', icon: 'https://cdn.brawlstars.com/brawl/characters/frank.png', rarity: 'Rare', class: 'Tank' },
  { id: 'mortis', name: 'Mortis', icon: 'https://cdn.brawlstars.com/brawl/characters/mortis.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'tara', name: 'Tara', icon: 'https://cdn.brawlstars.com/brawl/characters/tara.png', rarity: 'Epic', class: 'Control' },
  { id: 'gene', name: 'Gene', icon: 'https://cdn.brawlstars.com/brawl/characters/gene.png', rarity: 'Epic', class: 'Support' },
  { id: 'max', name: 'Max', icon: 'https://cdn.brawlstars.com/brawl/characters/max.png', rarity: 'Rare', class: 'Speed' },
  { id: 'sprout', name: 'Sprout', icon: 'https://cdn.brawlstars.com/brawl/characters/sprout.png', rarity: 'Epic', class: 'Controller' },
  { id: 'sandy', name: 'Sandy', icon: 'https://cdn.brawlstars.com/brawl/characters/sandy.png', rarity: 'Epic', class: 'Control' },
  { id: 'meg', name: 'Meg', icon: 'https://cdn.brawlstars.com/brawl/characters/meg.png', rarity: 'Rare', class: 'Bruiser' },
  { id: 'gale', name: 'Gale', icon: 'https://cdn.brawlstars.com/brawl/characters/gale.png', rarity: 'Epic', class: 'Controller' },
  { id: 'surge', name: 'Surge', icon: 'https://cdn.brawlstars.com/brawl/characters/surge.png', rarity: 'Epic', class: 'Area' },
  { id: 'colette', name: 'Colette', icon: 'https://cdn.brawlstars.com/brawl/characters/colette.png', rarity: 'Epic', class: 'Marksman' },
  { id: 'amber', name: 'Amber', icon: 'https://cdn.brawlstars.com/brawl/characters/amber.png', rarity: 'Epic', class: 'Bruiser' },
  { id: 'mandy', name: 'Mandy', icon: 'https://cdn.brawlstars.com/brawl/characters/mandy.png', rarity: 'Epic', class: 'Controller' },
  { id: 'emz', name: 'Emz', icon: 'https://cdn.brawlstars.com/brawl/characters/emz.png', rarity: 'Epic', class: 'Control' },
  { id: 'mr-p', name: 'Mr. P', icon: 'https://cdn.brawlstars.com/brawl/characters/mr-p.png', rarity: 'Epic', class: 'Tank' },
  { id: 'jacky', name: 'Jacky', icon: 'https://cdn.brawlstars.com/brawl/characters/jacky.png', rarity: 'Rare', class: 'Tank' },
  { id: 'ace', name: 'Ace', icon: 'https://cdn.brawlstars.com/brawl/characters/ace.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'spike', name: 'Spike', icon: 'https://cdn.brawlstars.com/brawl/characters/spike.png', rarity: 'Epic', class: 'Area' },
  { id: 'crow', name: 'Crow', icon: 'https://cdn.brawlstars.com/brawl/characters/crow.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'leon', name: 'Leon', icon: 'https://cdn.brawlstars.com/brawl/characters/leon.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'sam', name: 'Sam', icon: 'https://cdn.brawlstars.com/brawl/characters/sam.png', rarity: 'Rare', class: 'Support' },
  { id: 'gwen', name: 'Gwen', icon: 'https://cdn.brawlstars.com/brawl/characters/gwen.png', rarity: 'Epic', class: 'Bruiser' },
  { id: 'mico', name: 'Mico', icon: 'https://cdn.brawlstars.com/brawl/characters/mico.png', rarity: 'Epic', class: 'Marksman' },
  { id: 'lumi', name: 'Lumi', icon: 'https://cdn.brawlstars.com/brawl/characters/lumi.png', rarity: 'Epic', class: 'Controller' },
  { id: 'ari', name: 'Ari', icon: 'https://cdn.brawlstars.com/brawl/characters/ari.png', rarity: 'Epic', class: 'Control' },
  { id: 'edgar', name: 'Edgar', icon: 'https://cdn.brawlstars.com/brawl/characters/edgar.png', rarity: 'Epic', class: 'Bruiser' },
  { id: 'lou', name: 'Lou', icon: 'https://cdn.brawlstars.com/brawl/characters/lou.png', rarity: 'Rare', class: 'Support' },
  { id: 'ruffs', name: 'Ruffs', icon: 'https://cdn.brawlstars.com/brawl/characters/ruffs.png', rarity: 'Epic', class: 'Tank' },
  { id: 'belle', name: 'Belle', icon: 'https://cdn.brawlstars.com/brawl/characters/belle.png', rarity: 'Epic', class: 'Sniper' },
  { id: 'buster', name: 'Buster', icon: 'https://cdn.brawlstars.com/brawl/characters/buster.png', rarity: 'Epic', class: 'Tank' },
  { id: 'moe', name: 'Moe', icon: 'https://cdn.brawlstars.com/brawl/characters/moe.png', rarity: 'Rare', class: 'Support' },
  { id: 'otis', name: 'Otis', icon: 'https://cdn.brawlstars.com/brawl/characters/otis.png', rarity: 'Rare', class: 'Tank' },
  { id: 'byron', name: 'Byron', icon: 'https://cdn.brawlstars.com/brawl/characters/byron.png', rarity: 'Rare', class: 'Support' },
  { id: 'clancy', name: 'Clancy', icon: 'https://cdn.brawlstars.com/brawl/characters/clancy.png', rarity: 'Epic', class: 'Bruiser' },
  { id: 'maggie', name: 'Maggie', icon: 'https://cdn.brawlstars.com/brawl/characters/maggie.png', rarity: 'Rare', class: 'Bruiser' },
  { id: 'grom', name: 'Grom', icon: 'https://cdn.brawlstars.com/brawl/characters/grom.png', rarity: 'Epic', class: 'Marksman' },
  { id: 'lola', name: 'Lola', icon: 'https://cdn.brawlstars.com/brawl/characters/lola.png', rarity: 'Epic', class: 'Marksman' },
  { id: 'gray', name: 'Gray', icon: 'https://cdn.brawlstars.com/brawl/characters/gray.png', rarity: 'Epic', class: 'Support' },
  { id: 'janet', name: 'Janet', icon: 'https://cdn.brawlstars.com/brawl/characters/janet.png', rarity: 'Epic', class: 'Controller' },
  { id: 'bibi', name: 'Bibi', icon: 'https://cdn.brawlstars.com/brawl/characters/bibi.png', rarity: 'Epic', class: 'Bruiser' },
  { id: 'bit', name: 'Bit', icon: 'https://cdn.brawlstars.com/brawl/characters/bit.png', rarity: 'Epic', class: 'Controller' },
  { id: 'bea', name: 'Bea', icon: 'https://cdn.brawlstars.com/brawl/characters/bea.png', rarity: 'Epic', class: 'Sniper' },
  { id: 'ash', name: 'Ash', icon: 'https://cdn.brawlstars.com/brawl/characters/ash.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'kaze', name: 'Kaze', icon: 'https://cdn.brawlstars.com/brawl/characters/kaze.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'lynx', name: 'Lynx', icon: 'https://cdn.brawlstars.com/brawl/characters/lynx.png', rarity: 'Epic', class: 'Speed' },
  { id: 'larry-and-lawrie', name: 'Larry & Lawrie', icon: 'https://cdn.brawlstars.com/brawl/characters/larry-and-lawrie.png', rarity: 'Rare', class: 'Support' },
  { id: 'fang', name: 'Fang', icon: 'https://cdn.brawlstars.com/brawl/characters/fang.png', rarity: 'Epic', class: 'Assassin' },
  { id: 'eve', name: 'Eve', icon: 'https://cdn.brawlstars.com/brawl/characters/eve.png', rarity: 'Epic', class: 'Marksman' },
  { id: 'bonnie', name: 'Bonnie', icon: 'https://cdn.brawlstars.com/brawl/characters/bonnie.png', rarity: 'Epic', class: 'Support' },
  { id: 'maisie', name: 'Maisie', icon: 'https://cdn.brawlstars.com/brawl/characters/maisie.png', rarity: 'Epic', class: 'Support' },
  { id: 'gus', name: 'Gus', icon: 'https://cdn.brawlstars.com/brawl/characters/gus.png', rarity: 'Epic', class: 'Controller' },
  { id: 'nani', name: 'Nani', icon: 'https://cdn.brawlstars.com/brawl/characters/nani.png', rarity: 'Epic', class: 'Support' },
  { id: 'doug', name: 'Doug', icon: 'https://cdn.brawlstars.com/brawl/characters/doug.png', rarity: 'Common', class: 'Tank' },
  { id: 'pearl', name: 'Pearl', icon: 'https://cdn.brawlstars.com/brawl/characters/pearl.png', rarity: 'Epic', class: 'Controller' },
  { id: 'squeak', name: 'Squeak', icon: 'https://cdn.brawlstars.com/brawl/characters/squeak.png', rarity: 'Rare', class: 'Marksman' },
  { id: 'hank', name: 'Hank', icon: 'https://cdn.brawlstars.com/brawl/characters/hank.png', rarity: 'Epic', class: 'Tank' },
];

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildDefaultState = () => ({
  mode: 'Competitive',
  opponentTeam: 'Nova Crew',
  mapName: 'Stormy Plains',
  mapImage: MAPS[0].image,
  mapDescription: 'Open lanes and high-control zones reward early pressure and map control.',
  mapNotes: 'Prioritize lane control before aggressive fights.',
  mapStrategy: 'Open with a lane-control composition and rotate with purpose.',
  generalRules: 'Keep your first pick focused on the map, then adapt after the enemy commits.',
  lastUpdated: getTimestamp(),
  drawerOpen: true,
  selectedSection: 's',
  tiers: Object.fromEntries(TIER_SECTIONS.map((section) => [section.id, []])),
  bans: { banFirst: [], globalBan: [], banLast: [] },
  firstPicks: [],
  combos: [{ id: createId(), brawlers: [] }],
  winConditions: [{ id: createId(), text: '' }],
  counters: [{ id: createId(), title: '', text: '', brawlers: [] }],
});

const getInitialState = async () => {
  const base = buildDefaultState();
  const stored = await loadBoardState(base);
  return {
    ...base,
    ...stored,
    tiers: { ...base.tiers, ...(stored.tiers || {}) },
    bans: { ...base.bans, ...(stored.bans || {}) },
    combos: stored.combos?.length ? stored.combos : base.combos,
    winConditions: stored.winConditions?.length ? stored.winConditions : base.winConditions,
    counters: stored.counters?.length ? stored.counters : base.counters,
    firstPicks: stored.firstPicks || base.firstPicks,
  };
};

function App() {
  const [state, setState] = useState(buildDefaultState);
  const [activeDrag, setActiveDrag] = useState(null);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [viewMode, setViewMode] = useState('board');

  useEffect(() => {
    let active = true;
    getInitialState().then((initialState) => {
      if (active) {
        setState(initialState);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveBoardState(state);
  }, [state]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredBrawlers = useMemo(() => {
    const term = drawerSearch.toLowerCase();
    return BRAWLERS.filter((brawler) => brawler.name.toLowerCase().includes(term));
  }, [drawerSearch]);

  const updateState = (updater) => {
    setState((prev) => ({ ...updater(prev), lastUpdated: getTimestamp() }));
  };

  const addDraftEntry = (target, brawlerId) => {
    updateState((prev) => {
      switch (target.type) {
        case 'tier':
          return {
            ...prev,
            tiers: { ...prev.tiers, [target.sectionId]: [...(prev.tiers[target.sectionId] || []), { id: createId(), brawlerId }] },
          };
        case 'ban':
          return {
            ...prev,
            bans: { ...prev.bans, [target.sectionId]: [...(prev.bans[target.sectionId] || []), { id: createId(), brawlerId }] },
          };
        case 'firstPicks':
          return { ...prev, firstPicks: [...prev.firstPicks, { id: createId(), brawlerId }] };
        case 'combo':
          return {
            ...prev,
            combos: prev.combos.map((row) => (row.id === target.rowId ? { ...row, brawlers: [...row.brawlers, brawlerId] } : row)),
          };
        case 'counter':
          return {
            ...prev,
            counters: prev.counters.map((row) => (row.id === target.rowId ? { ...row, brawlers: [...row.brawlers, brawlerId] } : row)),
          };
        default:
          return prev;
      }
    });
  };

  const addTierBrawler = (sectionId, brawlerId) => addDraftEntry({ type: 'tier', sectionId }, brawlerId);
  const addBan = (sectionId, brawlerId) => addDraftEntry({ type: 'ban', sectionId }, brawlerId);
  const addFirstPick = (brawlerId) => addDraftEntry({ type: 'firstPicks' }, brawlerId);

  const removeTierBrawler = (sectionId, itemId) => updateState((prev) => ({ ...prev, tiers: { ...prev.tiers, [sectionId]: (prev.tiers[sectionId] || []).filter((entry) => entry.id !== itemId) } }));
  const removeBan = (sectionId, itemId) => updateState((prev) => ({ ...prev, bans: { ...prev.bans, [sectionId]: (prev.bans[sectionId] || []).filter((entry) => entry.id !== itemId) } }));
  const removeFirstPick = (itemId) => updateState((prev) => ({ ...prev, firstPicks: prev.firstPicks.filter((entry) => entry.id !== itemId) }));

  const addComboRow = () => updateState((prev) => ({ ...prev, combos: [...prev.combos, { id: createId(), brawlers: [] }] }));
  const removeComboRow = (rowId) => updateState((prev) => ({ ...prev, combos: prev.combos.filter((row) => row.id !== rowId) }));
  const addComboBrawler = (rowId, brawlerId) => addDraftEntry({ type: 'combo', rowId }, brawlerId);
  const removeComboBrawler = (rowId, brawlerId) => updateState((prev) => ({ ...prev, combos: prev.combos.map((row) => (row.id === rowId ? { ...row, brawlers: row.brawlers.filter((entry) => entry !== brawlerId) } : row)) }));

  const addWinCondition = () => updateState((prev) => ({ ...prev, winConditions: [...prev.winConditions, { id: createId(), text: '' }] }));
  const updateWinCondition = (rowId, text) => updateState((prev) => ({ ...prev, winConditions: prev.winConditions.map((row) => (row.id === rowId ? { ...row, text } : row)) }));
  const removeWinCondition = (rowId) => updateState((prev) => ({ ...prev, winConditions: prev.winConditions.filter((row) => row.id !== rowId) }));

  const addCounter = () => updateState((prev) => ({ ...prev, counters: [...prev.counters, { id: createId(), title: '', text: '', brawlers: [] }] }));
  const updateCounter = (rowId, field, value) => updateState((prev) => ({ ...prev, counters: prev.counters.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)) }));
  const addCounterBrawler = (rowId, brawlerId) => addDraftEntry({ type: 'counter', rowId }, brawlerId);
  const removeCounterBrawler = (rowId, brawlerId) => updateState((prev) => ({ ...prev, counters: prev.counters.map((row) => (row.id === rowId ? { ...row, brawlers: row.brawlers.filter((entry) => entry !== brawlerId) } : row)) }));
  const removeCounter = (rowId) => updateState((prev) => ({ ...prev, counters: prev.counters.filter((row) => row.id !== rowId) }));

  const handleDragEnd = ({ active, over }) => {
    setActiveDrag(null);
    if (!active || !over) return;
    const draggedBrawlerId = active.data.current?.brawlerId;
    if (!draggedBrawlerId) return;
    const target = over.data.current?.target;
    if (!target) return;
    addDraftEntry(target, draggedBrawlerId);
  };

  const handleLibraryLoad = (nextState) => {
    setState((prev) => ({ ...prev, ...nextState, lastUpdated: getTimestamp() }));
    setViewMode('board');
  };

  if (viewMode === 'library') {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark"><Crown size={18} /></div>
            <div>
              <p className="eyebrow">Draft Library</p>
              <h1>Brawl Draft Master</h1>
            </div>
          </div>
          <div className="topbar-controls">
            <button className="ghost-button" onClick={() => setViewMode('board')}><ChevronUp size={15} /> Back to Draft Board</button>
          </div>
        </header>
        <DraftLibrary currentDraft={state} onLoadDraft={handleLibraryLoad} onGoHome={() => setViewMode('board')} />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={({ active }) => setActiveDrag(active.data.current?.brawlerId || null)} onDragCancel={() => setActiveDrag(null)}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark"><Crown size={18} /></div>
            <div>
              <p className="eyebrow">Competitive Draft Board</p>
              <h1>Brawl Draft Master</h1>
            </div>
          </div>

          <div className="topbar-controls">
            <button className="ghost-button" onClick={() => setViewMode('library')}><Library size={15} /> Draft Library</button>
            <label className="control-pill"><span>Mode</span><input value={state.mode} onChange={(event) => updateState((prev) => ({ ...prev, mode: event.target.value }))} /></label>
            <label className="control-pill"><span>Map</span><input value={state.mapName} onChange={(event) => updateState((prev) => ({ ...prev, mapName: event.target.value }))} /></label>
            <label className="control-pill"><span>Opponent Team</span><input value={state.opponentTeam} onChange={(event) => updateState((prev) => ({ ...prev, opponentTeam: event.target.value }))} /></label>
            <label className="control-pill status-pill"><span>Updated</span><input value={state.lastUpdated} onChange={(event) => updateState((prev) => ({ ...prev, lastUpdated: event.target.value }))} /></label>
          </div>
        </header>

        <main className="dashboard-grid">
          <section className="panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Priorities</p>
                <h2>Draft Tiers</h2>
              </div>
              <button className="ghost-button" onClick={() => updateState((prev) => ({ ...prev, drawerOpen: !prev.drawerOpen }))}>{state.drawerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            </div>

            <div className="tier-stack">
              {TIER_SECTIONS.map((section) => (
                <div className="tier-card" key={section.id}>
                  <button className={`tier-button ${state.selectedSection === section.id ? 'active' : ''}`} onClick={() => updateState((prev) => ({ ...prev, selectedSection: section.id }))}>
                    <span className="tier-dot" style={{ background: section.accent }} />
                    <span>{section.title}</span>
                  </button>
                  <p>{section.hint}</p>
                  <div className="chip-row compact-row">
                    {(state.tiers[section.id] || []).map((entry) => {
                      const brawler = BRAWLERS.find((item) => item.id === entry.brawlerId);
                      if (!brawler) return null;
                      return (
                        <div className="chip-card" key={entry.id}>
                          <span>{brawler.name}</span>
                          <button className="chip-remove" onClick={() => removeTierBrawler(section.id, entry.id)}><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-card">
              <div className="drawer-header">
                <div>
                  <p className="eyebrow">Brawler Drawer</p>
                  <h3>{state.drawerOpen ? 'Pick from the roster' : 'Collapsed'}</h3>
                </div>
                <button className="ghost-button" onClick={() => updateState((prev) => ({ ...prev, drawerOpen: !prev.drawerOpen }))}>{state.drawerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              </div>

              <div className={`drawer-panel ${state.drawerOpen ? 'open' : 'closed'}`}>
                <div className="search-wrap">
                  <Search size={16} />
                  <input value={drawerSearch} onChange={(event) => setDrawerSearch(event.target.value)} placeholder="Search all brawlers" />
                </div>
                <div className="section-switcher">
                  {TIER_SECTIONS.map((section) => (
                    <button key={section.id} className={`mini-pill ${state.selectedSection === section.id ? 'active' : ''}`} onClick={() => updateState((prev) => ({ ...prev, selectedSection: section.id }))}>{section.title}</button>
                  ))}
                </div>
                <div className="drawer-list">
                  {filteredBrawlers.map((brawler) => (
                    <DraggableBrawlerButton key={brawler.id} brawler={brawler} onAdd={() => addTierBrawler(state.selectedSection, brawler.id)} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="map-card">
              <div className="map-image-wrap">
                <img src={state.mapImage || MAPS[0].image} alt={state.mapName} />
                <div className="map-overlay">
                  <p className="eyebrow">Official Map</p>
                  <h2>{state.mapName}</h2>
                  <span>{state.mode}</span>
                </div>
              </div>

              <div className="map-meta">
                <label className="field-block"><span>Map name</span><input value={state.mapName} onChange={(event) => updateState((prev) => ({ ...prev, mapName: event.target.value }))} /></label>
                <label className="field-block">
                  <span>Map image</span>
                  <div className="upload-row">
                    <label className="upload-button"><ImagePlus size={16} /> <span>Upload image</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => updateState((prev) => ({ ...prev, mapImage: reader.result })); reader.readAsDataURL(file); }} /></label>
                    <button className="ghost-button" onClick={() => updateState((prev) => ({ ...prev, mapImage: '' }))}>Reset</button>
                  </div>
                </label>
                <label className="field-block"><span>Map description</span><textarea value={state.mapDescription} onChange={(event) => updateState((prev) => ({ ...prev, mapDescription: event.target.value }))} rows={3} /></label>
                <label className="field-block"><span>Notes</span><textarea value={state.mapNotes} onChange={(event) => updateState((prev) => ({ ...prev, mapNotes: event.target.value }))} rows={3} /></label>
                <label className="field-block"><span>Strategy</span><textarea value={state.mapStrategy} onChange={(event) => updateState((prev) => ({ ...prev, mapStrategy: event.target.value }))} rows={3} /></label>
                <label className="field-block"><span>General rules</span><textarea value={state.generalRules} onChange={(event) => updateState((prev) => ({ ...prev, generalRules: event.target.value }))} rows={4} /></label>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title-row">
              <div><p className="eyebrow">Best Combos</p><h2>Build your lineup</h2></div>
              <div className="panel-badge">Live</div>
            </div>
            <div className="combo-stack">
              {state.combos.map((row) => (
                <article key={row.id} className="combo-card">
                  <div className="chip-row">
                    {row.brawlers.map((brawlerId) => {
                      const brawler = BRAWLERS.find((item) => item.id === brawlerId);
                      if (!brawler) return null;
                      return <div className="chip-card" key={`${row.id}-${brawler.id}`}><span>{brawler.name}</span><button className="chip-remove" onClick={() => removeComboBrawler(row.id, brawler.id)}><X size={14} /></button></div>;
                    })}
                  </div>
                  <BrawlerPicker dropTarget={{ type: 'combo', rowId: row.id }} onSelect={(brawlerId) => addComboBrawler(row.id, brawlerId)} />
                  <button className="ghost-button remove-row" onClick={() => removeComboRow(row.id)}><Trash2 size={14} /> Remove row</button>
                </article>
              ))}
              <button className="ghost-button" onClick={addComboRow}><PlusCircle size={15} /> Add combo row</button>
            </div>
          </section>
        </main>

        <section className="bottom-grid">
          {BOTTOM_SECTIONS.map((section) => (
            <article className="bottom-card" key={section.id}>
              <div className="panel-title-row">
                <div><p className="eyebrow">{section.title}</p><h3>{section.description}</h3></div>
              </div>
              {section.id === 'firstPicks' ? (
                <BrawlerListEditor dropTarget={{ type: 'firstPicks' }} items={state.firstPicks} onAdd={addFirstPick} onRemove={removeFirstPick} placeholder="Add first pick" />
              ) : (
                <BrawlerListEditor dropTarget={{ type: 'ban', sectionId: section.id }} items={state.bans[section.id] || []} onAdd={(brawlerId) => addBan(section.id, brawlerId)} onRemove={(itemId) => removeBan(section.id, itemId)} placeholder={`Add to ${section.title}`} />
              )}
            </article>
          ))}

          <article className="bottom-card wide-card">
            <div className="panel-title-row"><div><p className="eyebrow">Win Conditions</p><h3>Write the paths to victory</h3></div></div>
            <div className="stack-list">
              {state.winConditions.map((row) => (
                <div className="text-editor-row" key={row.id}>
                  <textarea value={row.text} onChange={(event) => updateWinCondition(row.id, event.target.value)} rows={3} placeholder="Type a win condition" />
                  <button className="ghost-button" onClick={() => removeWinCondition(row.id)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button className="ghost-button" onClick={addWinCondition}><PlusCircle size={15} /> Add win condition</button>
            </div>
          </article>

          <article className="bottom-card wide-card">
            <div className="panel-title-row"><div><p className="eyebrow">How To Counter</p><h3>Record response plans</h3></div></div>
            <div className="stack-list">
              {state.counters.map((row) => (
                <div className="counter-card" key={row.id}>
                  <div className="counter-row">
                    <input value={row.title} onChange={(event) => updateCounter(row.id, 'title', event.target.value)} placeholder="Counter title" />
                    <button className="ghost-button" onClick={() => removeCounter(row.id)}><Trash2 size={14} /></button>
                  </div>
                  <textarea value={row.text} onChange={(event) => updateCounter(row.id, 'text', event.target.value)} rows={3} placeholder="Describe the counter plan" />
                  <div className="chip-row">
                    {row.brawlers.map((brawlerId) => {
                      const brawler = BRAWLERS.find((item) => item.id === brawlerId);
                      if (!brawler) return null;
                      return <div className="chip-card" key={`${row.id}-${brawler.id}`}><span>{brawler.name}</span><button className="chip-remove" onClick={() => removeCounterBrawler(row.id, brawler.id)}><X size={14} /></button></div>;
                    })}
                  </div>
                  <BrawlerPicker dropTarget={{ type: 'counter', rowId: row.id }} onSelect={(brawlerId) => addCounterBrawler(row.id, brawlerId)} />
                </div>
              ))}
              <button className="ghost-button" onClick={addCounter}><PlusCircle size={15} /> Add counter row</button>
            </div>
          </article>
        </section>

        <DragOverlay>{activeDrag ? <div className="overlay-chip"><img src={BRAWLERS.find((item) => item.id === activeDrag)?.icon} alt="" /><span>{BRAWLERS.find((item) => item.id === activeDrag)?.name}</span></div> : null}</DragOverlay>
      </div>
    </DndContext>
  );
}

function BrawlerListEditor({ items, onAdd, onRemove, placeholder, dropTarget }) {
  const [search, setSearch] = useState('');
  const { setNodeRef } = useDroppable({ id: `list-${placeholder}`, data: { type: 'draft-list', target: dropTarget } });
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return BRAWLERS.filter((brawler) => brawler.name.toLowerCase().includes(term));
  }, [search]);

  return (
    <div ref={setNodeRef} className="editor-stack">
      <div className="search-wrap">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} />
      </div>
      <div className="chip-row">
        {items.map((entry) => {
          const brawler = BRAWLERS.find((item) => item.id === entry.brawlerId || item.id === entry);
          if (!brawler) return null;
          return (
            <div className="chip-card" key={entry.id || brawler.id}>
              <span>{brawler.name}</span>
              <button className="chip-remove" onClick={() => onRemove(entry.id || entry)}><X size={14} /></button>
            </div>
          );
        })}
      </div>
      <div className="drawer-list compact-list">
        {filtered.map((brawler) => (
          <DraggableBrawlerButton key={brawler.id} brawler={brawler} onAdd={() => onAdd(brawler.id)} compact />
        ))}
      </div>
    </div>
  );
}

function BrawlerPicker({ onSelect, dropTarget }) {
  const [search, setSearch] = useState('');
  const { setNodeRef } = useDroppable({ id: `picker-${dropTarget?.type || 'picker'}`, data: { type: 'draft-list', target: dropTarget } });
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return BRAWLERS.filter((brawler) => brawler.name.toLowerCase().includes(term));
  }, [search]);

  return (
    <div ref={setNodeRef} className="editor-stack compact-picker">
      <div className="search-wrap">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Add a brawler" />
      </div>
      <div className="drawer-list compact-list">
        {filtered.map((brawler) => (
          <DraggableBrawlerButton key={brawler.id} brawler={brawler} onAdd={() => onSelect(brawler.id)} compact />
        ))}
      </div>
    </div>
  );
}

function DraggableBrawlerButton({ brawler, onAdd, compact = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: `brawler-${brawler.id}`,
    data: { type: 'brawler', brawlerId: brawler.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.75 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`drawer-item ${compact ? 'compact-item' : ''}`}>
      <button className="drawer-item" onClick={onAdd} {...attributes} {...listeners}>
        <img src={brawler.icon} alt={brawler.name} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <div>
          <strong>{brawler.name}</strong>
          <span>{brawler.class} • {brawler.rarity}</span>
        </div>
        <PlusCircle size={16} />
      </button>
    </div>
  );
}

export default App;
