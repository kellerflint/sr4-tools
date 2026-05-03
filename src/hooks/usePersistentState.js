import { useEffect, useState } from 'react';

// Drop-in replacement for useState that persists the value to
// localStorage under `key`. Stored values are shallow-merged onto the
// `initial` object so new fields added later get sensible defaults
// without breaking existing saves.
export default function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored == null) return initial;
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...initial, ...parsed };
      }
      return parsed;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or storage disabled — silently skip
    }
  }, [key, value]);

  return [value, setValue];
}
