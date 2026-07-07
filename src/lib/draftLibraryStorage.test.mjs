import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftRecord, createSharePayload, decodeDraftFromCode, loadBoardState, saveBoardState } from './draftLibraryStorage.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('creates and decodes a share payload', () => {
  const draft = createDraftRecord({}, { name: 'Test Draft', gameMode: 'Showdown' });
  const payload = createSharePayload(draft);
  const decoded = decodeDraftFromCode(payload.code);

  assert.equal(decoded.name, 'Test Draft');
  assert.match(payload.url, /draft=/);
});

test('loads and saves board state using localStorage fallback', async () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };

  const defaults = { mode: 'Competitive', mapName: 'Stormy Plains' };
  await saveBoardState(defaults);
  const loaded = await loadBoardState(defaults);

  assert.deepEqual(loaded, defaults);
});
