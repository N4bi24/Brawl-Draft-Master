import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createDraftRecord, createSharePayload, decodeDraftFromCode, loadDrafts, saveDrafts, toBoardState } from '../lib/draftLibraryStorage';
import ShareDraftPanel from './library/ShareDraftPanel';
import { Copy, Download, FolderOpen, Heart, PencilLine, Plus, Save, Search, Sparkles, Trash2, Upload } from 'lucide-react';

const sortOptions = [
  { value: 'modified', label: 'Last Modified' },
  { value: 'created', label: 'Creation Date' },
  { value: 'name', label: 'Name' },
];

const TIER_KEYS = ['priority', 's', 'a', 'b', 'c', 'd'];
const BAN_KEYS = ['banFirst', 'globalBan', 'banLast'];

function DraftLibrary({ onLoadDraft, currentDraft }) {
  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('modified');
  const [ready, setReady] = useState(false);
  const [draftForm, setDraftForm] = useState(createDraftRecord());
  const [importCode, setImportCode] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    loadDrafts().then((items) => {
      if (!mounted) return;
      const normalized = items.map((draft) => createDraftRecord({}, draft));
      setDrafts(normalized);
      if (normalized.length) {
        setSelectedId(normalized[0].id);
        setDraftForm(normalized[0]);
      } else {
        const starter = createDraftRecord({
          mode: currentDraft?.mode || 'Competitive',
          mapName: currentDraft?.mapName || '',
          mapImage: currentDraft?.mapImage || '',
          opponentTeam: currentDraft?.opponentTeam || '',
          mapDescription: currentDraft?.mapDescription || '',
          mapNotes: currentDraft?.mapNotes || '',
          mapStrategy: currentDraft?.mapStrategy || '',
          generalRules: currentDraft?.generalRules || '',
          tiers: currentDraft?.tiers || { priority: [], s: [], a: [], b: [], c: [], d: [] },
          bans: currentDraft?.bans || { banFirst: [], globalBan: [], banLast: [] },
          firstPicks: currentDraft?.firstPicks || [],
          combos: currentDraft?.combos || [],
          winConditions: currentDraft?.winConditions || [],
          counters: currentDraft?.counters || [],
        });
        setDraftForm(starter);
      }
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [currentDraft]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      saveDrafts(drafts);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [drafts, ready]);

  const selectedDraft = useMemo(() => drafts.find((draft) => draft.id === selectedId) || draftForm, [drafts, selectedId, draftForm]);
  const sharePayload = useMemo(() => (selectedDraft ? createSharePayload(selectedDraft) : { code: '', url: '' }), [selectedDraft]);
  const recentDrafts = useMemo(() => [...drafts].sort((a, b) => new Date(b.lastOpenedAt || b.modifiedAt) - new Date(a.lastOpenedAt || a.modifiedAt)).slice(0, 4), [drafts]);

  const updateSelectedDraft = (changes) => {
    if (!selectedId && !draftForm.id) {
      const starter = createDraftRecord({}, { ...draftForm, ...changes });
      setDraftForm(starter);
      return;
    }
    const now = new Date().toISOString();
    const nextDraft = { ...(selectedDraft || draftForm), ...changes, modifiedAt: now, lastUpdated: now };
    setDrafts((prev) => prev.map((draft) => (draft.id === (selectedDraft?.id || draftForm.id) ? nextDraft : draft)));
    setDraftForm(nextDraft);
  };

  const syncSelection = (draft) => {
    setSelectedId(draft.id);
    setDraftForm(draft);
  };

  const createNewDraft = () => {
    const newDraft = createDraftRecord({
      mode: currentDraft?.mode || 'Competitive',
      mapName: currentDraft?.mapName || '',
      mapImage: currentDraft?.mapImage || '',
      opponentTeam: currentDraft?.opponentTeam || '',
      mapDescription: currentDraft?.mapDescription || '',
      mapNotes: currentDraft?.mapNotes || '',
      mapStrategy: currentDraft?.mapStrategy || '',
      generalRules: currentDraft?.generalRules || '',
      tiers: currentDraft?.tiers || { priority: [], s: [], a: [], b: [], c: [], d: [] },
      bans: currentDraft?.bans || { banFirst: [], globalBan: [], banLast: [] },
      firstPicks: currentDraft?.firstPicks || [],
      combos: currentDraft?.combos || [],
      winConditions: currentDraft?.winConditions || [],
      counters: currentDraft?.counters || [],
    }, { name: 'Untitled Draft' });
    const nextDrafts = [newDraft, ...drafts];
    setDrafts(nextDrafts);
    syncSelection(newDraft);
  };

  const saveCurrentDraft = () => {
    const payload = {
      ...(selectedDraft || draftForm),
      modifiedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };
    const nextDrafts = drafts.some((draft) => draft.id === payload.id)
      ? drafts.map((draft) => (draft.id === payload.id ? payload : draft))
      : [payload, ...drafts];
    setDrafts(nextDrafts);
    syncSelection(payload);
  };

  const saveAsDraft = () => {
    const clone = createDraftRecord({}, {
      ...(selectedDraft || draftForm),
      id: undefined,
      name: `${(selectedDraft || draftForm).name || 'Untitled Draft'} Copy`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    });
    const nextDrafts = [clone, ...drafts];
    setDrafts(nextDrafts);
    syncSelection(clone);
  };

  const renameDraft = () => {
    const nextName = window.prompt('Rename draft', selectedDraft?.name || 'Untitled Draft');
    if (!nextName) return;
    updateSelectedDraft({ name: nextName });
  };

  const duplicateDraft = () => {
    const clone = createDraftRecord({}, {
      ...(selectedDraft || draftForm),
      id: undefined,
      name: `${(selectedDraft || draftForm).name || 'Untitled Draft'} Copy`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    });
    const nextDrafts = [clone, ...drafts];
    setDrafts(nextDrafts);
    syncSelection(clone);
  };

  const deleteDraft = () => {
    if (!selectedDraft) return;
    const nextDrafts = drafts.filter((draft) => draft.id !== selectedDraft.id);
    setDrafts(nextDrafts);
    if (nextDrafts.length) {
      syncSelection(nextDrafts[0]);
    } else {
      const emptyDraft = createDraftRecord();
      setSelectedId('');
      setDraftForm(emptyDraft);
    }
  };

  const toggleFavorite = () => {
    updateSelectedDraft({ favorite: !selectedDraft?.favorite });
  };

  const loadSelectedDraft = () => {
    if (!selectedDraft) return;
    onLoadDraft?.(toBoardState(selectedDraft), selectedDraft);
    const nextDrafts = drafts.map((draft) => (draft.id === selectedDraft.id ? { ...draft, lastOpenedAt: new Date().toISOString() } : draft));
    setDrafts(nextDrafts);
    syncSelection({ ...selectedDraft, lastOpenedAt: new Date().toISOString() });
  };

  const copyText = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setShareStatus(`${label} copied`);
    } catch {
      setShareStatus('Clipboard unavailable');
    }
  };

  const importFromCode = () => {
    const decoded = decodeDraftFromCode(importCode);
    if (!decoded) {
      setShareStatus('Unable to import a draft from that code.');
      return;
    }
    const importedDraft = createDraftRecord({}, decoded);
    const nextDrafts = [importedDraft, ...drafts.filter((draft) => draft.id !== importedDraft.id)];
    setDrafts(nextDrafts);
    syncSelection(importedDraft);
    setImportCode('');
    setShareStatus('Draft imported successfully.');
  };

  const exportDrafts = () => {
    const blob = new Blob([JSON.stringify(drafts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brawl-draft-library.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = JSON.parse(text);
    const normalized = Array.isArray(imported) ? imported.map((draft) => createDraftRecord({}, draft)) : [];
    const nextDrafts = [...normalized, ...drafts.filter((draft) => !normalized.some((item) => item.id === draft.id))];
    setDrafts(nextDrafts);
    if (nextDrafts.length) {
      syncSelection(nextDrafts[0]);
    }
    event.target.value = '';
  };

  const filteredDrafts = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return [...drafts]
      .filter((draft) => `${draft.name} ${draft.gameMode} ${draft.mapName} ${draft.opponentTeam}`.toLowerCase().includes(query))
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return Number(b.favorite) - Number(a.favorite);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
        return new Date(b.lastOpenedAt || b.modifiedAt) - new Date(a.lastOpenedAt || a.modifiedAt);
      });
  }, [drafts, searchTerm, sortBy]);

  return (
    <div className="library-shell">
      <div className="library-toolbar">
        <div className="library-toolbar__left">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <p className="eyebrow">Draft Library</p>
            <h2>Manage every plan from one polished dashboard</h2>
          </div>
        </div>
        <div className="library-actions">
          <button className="ghost-button" onClick={createNewDraft}><Plus size={15} /> New Draft</button>
          <button className="ghost-button" onClick={saveCurrentDraft}><Save size={15} /> Save Draft</button>
          <button className="ghost-button" onClick={saveAsDraft}><Copy size={15} /> Save As</button>
          <button className="ghost-button" onClick={loadSelectedDraft}><FolderOpen size={15} /> Load Draft</button>
          <button className="ghost-button" onClick={renameDraft}><PencilLine size={15} /> Rename Draft</button>
          <button className="ghost-button" onClick={duplicateDraft}><Copy size={15} /> Duplicate Draft</button>
          <button className="ghost-button" onClick={deleteDraft}><Trash2 size={15} /> Delete Draft</button>
          <button className="ghost-button" onClick={exportDrafts}><Download size={15} /> Export Draft</button>
          <button className="ghost-button" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Import Draft</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="sr-only" onChange={handleImport} />
        </div>
      </div>

      <div className="library-grid">
        <aside className="library-sidebar card-panel">
          <div className="search-wrap">
            <Search size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search drafts" />
          </div>
          <label className="field-block">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <div className="recent-panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Recently Opened</p>
                <h4>Recent drafts</h4>
              </div>
            </div>
            <div className="recent-list">
              {recentDrafts.map((draft) => (
                <button key={draft.id} className="recent-item" onClick={() => syncSelection(draft)}>
                  <strong>{draft.name}</strong>
                  <span>{draft.mapName || 'No map yet'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="draft-list">
            {filteredDrafts.map((draft) => (
              <div key={draft.id} className={`draft-card ${selectedDraft?.id === draft.id ? 'active' : ''}`}>
                <button className="draft-card__button" onClick={() => syncSelection(draft)}>
                  <div className="draft-card__top">
                    <strong>{draft.name}</strong>
                    <span className="draft-card__fav">{draft.favorite ? '★' : '☆'}</span>
                  </div>
                  <span>{draft.gameMode || 'Untitled mode'}</span>
                  <small>{draft.mapName || 'No map yet'}</small>
                  <p>{new Date(draft.modifiedAt).toLocaleString()}</p>
                </button>
                <button className="chip-remove draft-card__icon" onClick={() => { const nextDraft = { ...draft, favorite: !draft.favorite }; setDrafts((prev) => prev.map((item) => (item.id === draft.id ? nextDraft : item))); setDraftForm(nextDraft); }}><Heart size={14} fill={draft.favorite ? '#ff5f7d' : 'none'} /></button>
              </div>
            ))}
          </div>
        </aside>

        <section className="library-main card-panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Draft Editor</p>
              <h3>{selectedDraft?.name || 'New Draft'}</h3>
            </div>
            <div className="panel-badge">Auto-save • 1s</div>
          </div>

          <div className="library-form-grid">
            <label className="field-block"><span>Draft Name</span><input value={selectedDraft?.name || ''} onChange={(event) => updateSelectedDraft({ name: event.target.value })} /></label>
            <label className="field-block"><span>Game Mode</span><input value={selectedDraft?.gameMode || ''} onChange={(event) => updateSelectedDraft({ gameMode: event.target.value })} /></label>
            <label className="field-block"><span>Map Name</span><input value={selectedDraft?.mapName || ''} onChange={(event) => updateSelectedDraft({ mapName: event.target.value })} /></label>
            <label className="field-block"><span>Map Image</span><input value={selectedDraft?.mapImage || ''} onChange={(event) => updateSelectedDraft({ mapImage: event.target.value })} /></label>
            <label className="field-block"><span>Opponent Team</span><input value={selectedDraft?.opponentTeam || ''} onChange={(event) => updateSelectedDraft({ opponentTeam: event.target.value })} /></label>
            <label className="field-block"><span>Last Updated</span><input value={selectedDraft?.lastUpdated || ''} onChange={(event) => updateSelectedDraft({ lastUpdated: event.target.value })} /></label>
            <label className="field-block full-span"><span>Description</span><textarea value={selectedDraft?.description || ''} onChange={(event) => updateSelectedDraft({ description: event.target.value })} rows={3} /></label>
            <label className="field-block full-span"><span>General Rules</span><textarea value={selectedDraft?.generalRules || ''} onChange={(event) => updateSelectedDraft({ generalRules: event.target.value })} rows={3} /></label>
            <label className="field-block full-span"><span>Notes</span><textarea value={selectedDraft?.notes || ''} onChange={(event) => updateSelectedDraft({ notes: event.target.value })} rows={3} /></label>
            <label className="field-block full-span"><span>Strategy</span><textarea value={selectedDraft?.strategy || ''} onChange={(event) => updateSelectedDraft({ strategy: event.target.value })} rows={3} /></label>
          </div>

          <div className="library-section-grid">
            <TierSectionEditor draft={selectedDraft} onChange={(next) => updateSelectedDraft({ tiers: next })} />
            <BanSectionEditor draft={selectedDraft} onChange={(next) => updateSelectedDraft({ bans: next })} />
            <StringListSection title="First Picks" value={selectedDraft?.firstPicks || []} onChange={(next) => updateSelectedDraft({ firstPicks: next })} />
            <ComboSectionEditor value={selectedDraft?.combos || []} onChange={(next) => updateSelectedDraft({ combos: next })} />
            <StringListSection title="Win Conditions" value={selectedDraft?.winConditions || []} onChange={(next) => updateSelectedDraft({ winConditions: next })} />
            <CounterSectionEditor value={selectedDraft?.counters || []} onChange={(next) => updateSelectedDraft({ counters: next })} />
          </div>

          <ShareDraftPanel
            draft={selectedDraft}
            importCode={importCode}
            onImportCodeChange={setImportCode}
            onImportFromCode={importFromCode}
            shareCode={sharePayload.code}
            shareUrl={sharePayload.url}
            onCopyCode={() => copyText(sharePayload.code, 'Draft code')}
            onCopyUrl={() => copyText(sharePayload.url, 'Share URL')}
            status={shareStatus}
          />
        </section>
      </div>
    </div>
  );
}

function StringListSection({ title, value, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  return (
    <article className="library-section card-panel">
      <div className="panel-title-row"><div><p className="eyebrow">{title}</p><h4>{title}</h4></div></div>
      <div className="search-wrap">
        <input value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder={`Add ${title.toLowerCase()}`} />
        <button className="ghost-button" onClick={addItem}>Add</button>
      </div>
      <div className="chip-row">
        {(value || []).map((item, index) => (
          <div className="chip-card" key={`${title}-${index}`}>
            <span>{item}</span>
            <button className="chip-remove" onClick={() => onChange((value || []).filter((_, entryIndex) => entryIndex !== index))}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </article>
  );
}

function TierSectionEditor({ draft, onChange }) {
  const tiers = draft?.tiers || { priority: [], s: [], a: [], b: [], c: [], d: [] };

  return (
    <article className="library-section card-panel">
      <div className="panel-title-row"><div><p className="eyebrow">Tier List</p><h4>Tier List</h4></div></div>
      <div className="tier-editor-list">
        {TIER_KEYS.map((key) => (
          <div key={key} className="tier-editor-block">
            <strong>{key.toUpperCase()}</strong>
            <StringListEditor value={tiers[key] || []} onChange={(next) => onChange({ ...tiers, [key]: next })} />
          </div>
        ))}
      </div>
    </article>
  );
}

function BanSectionEditor({ draft, onChange }) {
  const bans = draft?.bans || { banFirst: [], globalBan: [], banLast: [] };

  return (
    <article className="library-section card-panel">
      <div className="panel-title-row"><div><p className="eyebrow">Ban</p><h4>Ban</h4></div></div>
      <div className="tier-editor-list">
        {BAN_KEYS.map((key) => (
          <div key={key} className="tier-editor-block">
            <strong>{key}</strong>
            <StringListEditor value={bans[key] || []} onChange={(next) => onChange({ ...bans, [key]: next })} />
          </div>
        ))}
      </div>
    </article>
  );
}

function StringListEditor({ value, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...(value || []), trimmed]);
    setInputValue('');
  };

  return (
    <div className="list-editor">
      <div className="search-wrap">
        <input value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder="Add brawler" />
        <button className="ghost-button" onClick={addItem}>Add</button>
      </div>
      <div className="chip-row">
        {(value || []).map((item, index) => (
          <div className="chip-card" key={`${item}-${index}`}>
            <span>{item}</span>
            <button className="chip-remove" onClick={() => onChange((value || []).filter((_, entryIndex) => entryIndex !== index))}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComboSectionEditor({ value, onChange }) {
  const addCombo = () => onChange([...(value || []), { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, label: '', brawlers: [] }]);

  return (
    <article className="library-section card-panel">
      <div className="panel-title-row"><div><p className="eyebrow">Best Combos</p><h4>Best Combos</h4></div><button className="ghost-button" onClick={addCombo}>Add</button></div>
      <div className="stack-list">
        {(value || []).map((combo, index) => (
          <div key={combo.id || index} className="combo-editor-row">
            <input value={combo.label || ''} onChange={(event) => onChange((value || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} placeholder="Combo label" />
            <StringListEditor value={combo.brawlers || []} onChange={(next) => onChange((value || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, brawlers: next } : entry))} />
            <button className="ghost-button" onClick={() => onChange((value || []).filter((_, entryIndex) => entryIndex !== index))}><Trash2 size={14} /> Remove</button>
          </div>
        ))}
      </div>
    </article>
  );
}

function CounterSectionEditor({ value, onChange }) {
  const addCounter = () => onChange([...(value || []), { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: '', text: '', brawlers: [] }]);

  return (
    <article className="library-section card-panel">
      <div className="panel-title-row"><div><p className="eyebrow">How To Counter</p><h4>How To Counter</h4></div><button className="ghost-button" onClick={addCounter}>Add</button></div>
      <div className="stack-list">
        {(value || []).map((counter, index) => (
          <div key={counter.id || index} className="combo-editor-row">
            <input value={counter.title || ''} onChange={(event) => onChange((value || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, title: event.target.value } : entry))} placeholder="Counter title" />
            <textarea value={counter.text || ''} onChange={(event) => onChange((value || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, text: event.target.value } : entry))} rows={3} placeholder="Describe the counter plan" />
            <StringListEditor value={counter.brawlers || []} onChange={(next) => onChange((value || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, brawlers: next } : entry))} />
            <button className="ghost-button" onClick={() => onChange((value || []).filter((_, entryIndex) => entryIndex !== index))}><Trash2 size={14} /> Remove</button>
          </div>
        ))}
      </div>
    </article>
  );
}

export default DraftLibrary;
