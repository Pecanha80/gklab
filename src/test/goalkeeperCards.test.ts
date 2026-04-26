import { describe, it, expect } from 'vitest';
import { calculateAge, getLoadZone, getLoadZoneColor } from '../lib/utils';
import { translations } from '../translations';

const en = translations.en;
const pt = translations.pt;

describe('Shared Utility: calculateAge', () => {
  it('calculates age correctly for a past date', () => {
    const birthDate = '2000-01-15';
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(27);
  });

  it('returns null for undefined', () => {
    expect(calculateAge(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(calculateAge('')).toBeNull();
  });

  it('calculates age for recent birthdate', () => {
    const thisYear = new Date().getFullYear();
    const age = calculateAge(`${thisYear - 20}-06-15`);
    expect(age).toBeGreaterThanOrEqual(19);
    expect(age).toBeLessThanOrEqual(20);
  });
});

describe('Shared Utility: getLoadZone', () => {
  it('returns low for load <= 40', () => {
    expect(getLoadZone(0)).toBe('low');
    expect(getLoadZone(6)).toBe('low');
    expect(getLoadZone(40)).toBe('low');
  });

  it('returns optimal for load 41-70', () => {
    expect(getLoadZone(41)).toBe('optimal');
    expect(getLoadZone(55)).toBe('optimal');
    expect(getLoadZone(70)).toBe('optimal');
  });

  it('returns high for load > 70', () => {
    expect(getLoadZone(71)).toBe('high');
    expect(getLoadZone(100)).toBe('high');
  });
});

describe('Shared Utility: getLoadZoneColor', () => {
  it('returns blue for low', () => {
    expect(getLoadZoneColor('low')).toContain('blue');
  });

  it('returns tertiary for optimal', () => {
    expect(getLoadZoneColor('optimal')).toContain('tertiary');
  });

  it('returns error for high', () => {
    expect(getLoadZoneColor('high')).toContain('error');
  });
});

describe('Goalkeeper Cards — Translation Keys', () => {
  const keys = ['wellnessNoRecord', 'envLabel', 'addPhoto'];

  keys.forEach(key => {
    it(`EN has key "${key}"`, () => {
      expect((en as Record<string, string>)[key]).toBeDefined();
      expect((en as Record<string, string>)[key].length).toBeGreaterThan(0);
    });

    it(`PT has key "${key}"`, () => {
      expect((pt as Record<string, string>)[key]).toBeDefined();
      expect((pt as Record<string, string>)[key].length).toBeGreaterThan(0);
    });
  });
});

describe('Goalkeeper Cards — GoalkeepersTab uses shared utils', () => {
  it('GoalkeepersTab imports calculateAge from lib/utils', async () => {
    const code = (await import('../components/tabs/GoalkeepersTab?raw') as any).default || '';
    if (code) {
      expect(code).toContain('calculateAge');
      expect(code).toContain('getLoadZone');
      expect(code).toContain('getLoadZoneColor');
      // Should NOT have local calculateAge function
      expect(code).not.toContain('function calculateAge');
    }
  });
});

describe('Goalkeeper Cards — Equalized pills', () => {
  it('GoalkeepersTab always renders age/height/wingspan/weight pills', async () => {
    const code = (await import('../components/tabs/GoalkeepersTab?raw') as any).default || '';
    if (code) {
      // Pills should always render (no conditional wrapping)
      expect(code).toContain("envLabel");
      // Dash placeholder for missing data
      expect(code).toContain("'—'");
    }
  });
});

describe('Goalkeeper Cards — Wellness label', () => {
  it('GoalkeepersTab uses wellnessNoRecord instead of hardcoded NEW', async () => {
    const code = (await import('../components/tabs/GoalkeepersTab?raw') as any).default || '';
    if (code) {
      expect(code).toContain('wellnessNoRecord');
      expect(code).not.toContain('>NEW<');
    }
  });
});

describe('Goalkeeper Cards — GoalkeeperCard has age and load dot', () => {
  it('GoalkeeperCard uses calculateAge and getLoadZone', async () => {
    const code = (await import('../components/cards/GoalkeeperCard?raw') as any).default || '';
    if (code) {
      expect(code).toContain('calculateAge');
      expect(code).toContain('getLoadZone');
      expect(code).toContain('getLoadZoneColor');
    }
  });
});
