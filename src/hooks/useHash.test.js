import { describe, it, expect } from 'vitest';
import { hashStartsWith } from './useHash.js';

describe('hashStartsWith', () => {
  it('matches the root path', () => {
    expect(hashStartsWith('#/', '/')).toBe(true);
  });

  it('matches the exact path', () => {
    expect(hashStartsWith('#/dm', '/dm')).toBe(true);
  });

  it('matches deeper paths under the prefix', () => {
    expect(hashStartsWith('#/dm/characters', '/dm')).toBe(true);
  });

  it('does not match a different sibling', () => {
    expect(hashStartsWith('#/player', '/dm')).toBe(false);
  });

  it('does not match a partial path segment', () => {
    expect(hashStartsWith('#/dmx', '/dm')).toBe(false);
  });

  it('tolerates an empty hash', () => {
    expect(hashStartsWith('', '/')).toBe(false);
    expect(hashStartsWith('#', '/')).toBe(false);
  });
});
