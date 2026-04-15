import { describe, it, expect } from 'vitest';
import { normalizeCategoryForMatch, categoriesMatch } from './categoryMatch';

describe('normalizeCategoryForMatch', () => {
  it('returns category key as-is when already a valid key', () => {
    expect(normalizeCategoryForMatch('firstTeam')).toBe('firstteam');
  });

  it('lowercases the key for case-insensitive matching', () => {
    expect(normalizeCategoryForMatch('FirstTeam')).toBe('firstteam');
    expect(normalizeCategoryForMatch('U23')).toBe('u23');
  });

  it('trims whitespace', () => {
    expect(normalizeCategoryForMatch('  u18  ')).toBe('u18');
  });
});

describe('categoriesMatch', () => {
  it('matches when session category key equals goalkeeper category key', () => {
    expect(categoriesMatch(['firstTeam'], 'firstTeam')).toBe(true);
    expect(categoriesMatch(['u23'], 'u23')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(categoriesMatch(['FirstTeam'], 'firstTeam')).toBe(true);
  });

  it('matches when session has translated Portuguese value against gk key', () => {
    // This is the actual bug: session stores "Time Principal" but gk has "firstTeam"
    expect(categoriesMatch(['Time Principal'], 'firstTeam')).toBe(true);
    expect(categoriesMatch(['Sub-23'], 'u23')).toBe(true);
    expect(categoriesMatch(['Sub-21'], 'u21')).toBe(true);
    expect(categoriesMatch(['Sub-18'], 'u18')).toBe(true);
    expect(categoriesMatch(['Sub-16'], 'u16')).toBe(true);
    expect(categoriesMatch(['Academia'], 'academy')).toBe(true);
  });

  it('matches when session has translated English value against gk key', () => {
    expect(categoriesMatch(['First Team'], 'firstTeam')).toBe(true);
    expect(categoriesMatch(['U23'], 'u23')).toBe(true);
    expect(categoriesMatch(['Academy'], 'academy')).toBe(true);
  });

  it('returns false when no categories match', () => {
    expect(categoriesMatch(['u23'], 'firstTeam')).toBe(false);
    expect(categoriesMatch(['Sub-18'], 'u23')).toBe(false);
  });

  it('handles multiple session categories (any match = true)', () => {
    expect(categoriesMatch(['u23', 'firstTeam'], 'firstTeam')).toBe(true);
    expect(categoriesMatch(['Sub-23', 'Time Principal'], 'u23')).toBe(true);
  });

  it('handles empty session categories', () => {
    expect(categoriesMatch([], 'firstTeam')).toBe(false);
  });

  it('handles string session category (not array)', () => {
    expect(categoriesMatch('firstTeam', 'firstTeam')).toBe(true);
    expect(categoriesMatch('Time Principal', 'firstTeam')).toBe(true);
  });
});
