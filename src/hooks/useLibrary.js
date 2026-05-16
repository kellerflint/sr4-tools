import { useCallback } from 'react';
import usePersistentState from './usePersistentState.js';

// Generic CRUD hook for a list of objects persisted to localStorage.
// Each item gets an id assigned by generateId on insert if one wasn't
// already provided.

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Pure helpers — exported for unit tests so we don't have to render the
// hook to exercise the logic.
export function addItem(items, data, makeId = generateId) {
  const item = { id: data.id || makeId(), ...data };
  return [...items, item];
}

export function updateItem(items, id, patch) {
  return items.map((it) => (it.id === id ? { ...it, ...patch } : it));
}

export function removeItem(items, id) {
  return items.filter((it) => it.id !== id);
}

export default function useLibrary(storageKey) {
  const [items, setItems] = usePersistentState(storageKey, []);

  const add = useCallback(
    (data) => {
      let newItem;
      setItems((curr) => {
        const next = addItem(curr, data);
        newItem = next[next.length - 1];
        return next;
      });
      return newItem;
    },
    [setItems]
  );

  const update = useCallback(
    (id, patch) => setItems((curr) => updateItem(curr, id, patch)),
    [setItems]
  );

  const remove = useCallback(
    (id) => setItems((curr) => removeItem(curr, id)),
    [setItems]
  );

  return { items, add, update, remove };
}
