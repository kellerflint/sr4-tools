import { useEffect, useState } from 'react';

// Returns the current location hash, kept in sync via the hashchange
// event. Defaults to '#/' when no hash is present so callers can pattern
// match without juggling empty strings.
export default function useHash() {
  const [hash, setHash] = useState(() => {
    if (typeof window === 'undefined') return '#/';
    return window.location.hash || '#/';
  });

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

// Tiny path-matcher: returns true if the current hash route starts with
// the given prefix (after the leading '#').
export function hashStartsWith(hash, prefix) {
  const path = hash.replace(/^#/, '');
  return path === prefix || path.startsWith(prefix + '/');
}
