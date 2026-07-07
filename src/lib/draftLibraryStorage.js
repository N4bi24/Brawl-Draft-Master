const STORAGE_KEY = 'brawl-draft-library-v1';
const BOARD_STORAGE_KEY = 'brawl-draft-master-state-v3';
const DB_NAME = 'brawl-draft-library';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDrafts(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function encodeBase64(value) {
  const bytes = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(value)
    : Uint8Array.from(value, (char) => char.charCodeAt(0));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value) {
  const normalized = value.trim();
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return typeof TextDecoder !== 'undefined'
    ? new TextDecoder().decode(bytes)
    : binary;
}

export function createDraftRecord(payload = {}, overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || createId(),
    name: overrides.name || 'Untitled Draft',
    gameMode: payload.mode || payload.gameMode || '',
    mapName: payload.mapName || '',
    mapImage: payload.mapImage || '',
    opponentTeam: payload.opponentTeam || '',
    lastUpdated: payload.lastUpdated || now,
    description: payload.mapDescription || '',
    generalRules: payload.generalRules || '',
    notes: payload.mapNotes || '',
    strategy: payload.mapStrategy || '',
    tiers: payload.tiers || { priority: [], s: [], a: [], b: [], c: [], d: [] },
    bans: payload.bans || { banFirst: [], globalBan: [], banLast: [] },
    firstPicks: payload.firstPicks || [],
    combos: payload.combos || [],
    winConditions: payload.winConditions || [],
    counters: payload.counters || [],
    favorite: Boolean(overrides.favorite),
    createdAt: overrides.createdAt || now,
    modifiedAt: overrides.modifiedAt || now,
    lastOpenedAt: overrides.lastOpenedAt || now,
    contentVersion: 1,
  };
}

export function toBoardState(draft) {
  return {
    mode: draft.gameMode || 'Competitive',
    opponentTeam: draft.opponentTeam || '',
    mapName: draft.mapName || '',
    mapImage: draft.mapImage || '',
    mapDescription: draft.description || '',
    mapNotes: draft.notes || '',
    mapStrategy: draft.strategy || '',
    generalRules: draft.generalRules || '',
    lastUpdated: draft.lastUpdated || draft.modifiedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    drawerOpen: true,
    selectedSection: 's',
    tiers: draft.tiers || { priority: [], s: [], a: [], b: [], c: [], d: [] },
    bans: draft.bans || { banFirst: [], globalBan: [], banLast: [] },
    firstPicks: draft.firstPicks || [],
    combos: draft.combos || [],
    winConditions: draft.winConditions || [],
    counters: draft.counters || [],
  };
}

export function createSharePayload(draft) {
  const serialized = JSON.stringify({ ...draft, sharedAt: new Date().toISOString() });
  const code = encodeBase64(serialized);
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://example.com';
  return {
    code,
    url: `${baseUrl}?draft=${encodeURIComponent(code)}`,
  };
}

export function decodeDraftFromCode(input) {
  if (!input) return null;
  let code = input.trim();
  if (code.startsWith('http')) {
    try {
      const url = new URL(code);
      code = url.searchParams.get('draft') || url.searchParams.get('code') || code;
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(decodeBase64(code));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function readFromLocalStorage() {
  if (typeof window === 'undefined') return [];
  return parseDrafts(window.localStorage.getItem(STORAGE_KEY));
}

function writeToLocalStorage(drafts) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function loadBoardState(defaultState) {
  if (typeof window === 'undefined') return Promise.resolve(defaultState);
  try {
    const stored = window.localStorage.getItem(BOARD_STORAGE_KEY);
    if (!stored) return Promise.resolve(defaultState);
    const parsed = JSON.parse(stored);
    return Promise.resolve({ ...defaultState, ...parsed });
  } catch {
    return Promise.resolve(defaultState);
  }
}

export function saveBoardState(state) {
  if (typeof window === 'undefined') return Promise.resolve(true);
  try {
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(state));
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function loadDrafts() {
  try {
    const db = await openIndexedDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error || new Error('Failed to load drafts from IndexedDB'));
      transaction.oncomplete = () => db.close();
    });
  } catch {
    return readFromLocalStorage();
  }
}

export async function saveDrafts(drafts) {
  try {
    const db = await openIndexedDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      drafts.forEach((draft) => store.put(draft));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Failed to save drafts to IndexedDB'));
    });
    db.close();
    return true;
  } catch {
    writeToLocalStorage(drafts);
    return false;
  }
}
