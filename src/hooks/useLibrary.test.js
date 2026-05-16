import { describe, it, expect } from 'vitest';
import { addItem, updateItem, removeItem, generateId } from './useLibrary.js';

describe('addItem', () => {
  it('appends a new item with an assigned id', () => {
    const next = addItem([], { name: 'A' }, () => 'fake-1');
    expect(next).toEqual([{ id: 'fake-1', name: 'A' }]);
  });

  it('preserves a caller-provided id', () => {
    const next = addItem([], { id: 'given', name: 'A' }, () => 'fake');
    expect(next[0].id).toBe('given');
  });

  it('does not mutate the input array', () => {
    const before = [{ id: '1', name: 'A' }];
    const after = addItem(before, { name: 'B' }, () => '2');
    expect(before).toEqual([{ id: '1', name: 'A' }]);
    expect(after).toHaveLength(2);
  });
});

describe('updateItem', () => {
  it('patches the matching item by id', () => {
    const result = updateItem(
      [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
      '2',
      { name: 'B-new' }
    );
    expect(result).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B-new' },
    ]);
  });

  it('returns an equivalent list when the id does not match anything', () => {
    const before = [{ id: '1', name: 'A' }];
    const after = updateItem(before, 'missing', { name: 'X' });
    expect(after).toEqual(before);
  });

  it('does not mutate the original objects', () => {
    const before = [{ id: '1', name: 'A' }];
    const after = updateItem(before, '1', { name: 'B' });
    expect(before[0].name).toBe('A');
    expect(after[0].name).toBe('B');
  });
});

describe('removeItem', () => {
  it('drops the item with the given id', () => {
    const after = removeItem(
      [{ id: '1' }, { id: '2' }, { id: '3' }],
      '2'
    );
    expect(after).toEqual([{ id: '1' }, { id: '3' }]);
  });

  it('returns the same items when no id matches', () => {
    const before = [{ id: '1' }];
    expect(removeItem(before, 'missing')).toEqual(before);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns distinct values on successive calls', () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) seen.add(generateId());
    expect(seen.size).toBe(50);
  });
});
