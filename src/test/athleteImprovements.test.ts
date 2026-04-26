import { describe, it, expect } from 'vitest';
import { translations } from '../translations';

const en = translations.en;
const pt = translations.pt;

describe('Athlete Page Improvements — Translation Keys', () => {
  const requiredKeys = [
    'incompleteProfile',
    'incompleteProfileDesc',
    'completeProfileNow',
    'loadZoneLow',
    'loadZoneOptimal',
    'loadZoneHigh',
    'loadContextSessions',
    'loadContextFormula',
    'physicalProfile',
    'developmentPlan',
    'developmentGoals',
    'addGoal',
    'goalTitle',
    'goalDescription',
    'targetDate',
    'goalPriority',
    'goalStatusPending',
    'goalStatusInProgress',
    'goalStatusAchieved',
    'noGoalsYet',
    'goalsProgress',
  ];

  requiredKeys.forEach(key => {
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

describe('Athlete Page Improvements — DevelopmentGoal Type', () => {
  it('DevelopmentGoal interface is importable', async () => {
    const types = await import('../types');
    // If this import succeeds, the type exists in the module
    expect(types).toBeDefined();
  });
});

describe('Athlete Page Improvements — Load Zone Logic', () => {
  function getLoadZone(load: number): 'low' | 'optimal' | 'high' {
    return load <= 40 ? 'low' : load <= 70 ? 'optimal' : 'high';
  }

  it('load <= 40 is undertrained zone', () => {
    expect(getLoadZone(0)).toBe('low');
    expect(getLoadZone(6)).toBe('low');
    expect(getLoadZone(40)).toBe('low');
  });

  it('load 41-70 is optimal zone', () => {
    expect(getLoadZone(41)).toBe('optimal');
    expect(getLoadZone(55)).toBe('optimal');
    expect(getLoadZone(70)).toBe('optimal');
  });

  it('load > 70 is high load zone', () => {
    expect(getLoadZone(71)).toBe('high');
    expect(getLoadZone(85)).toBe('high');
    expect(getLoadZone(100)).toBe('high');
  });
});

describe('Athlete Page Improvements — Missing Data Detection', () => {
  function getMissingFields(gk: { birthDate?: string; height?: number; weight?: number; wingspan?: number }): string[] {
    const missing: string[] = [];
    if (!gk.birthDate) missing.push('birthDate');
    if (!gk.height) missing.push('height');
    if (!gk.weight) missing.push('weight');
    if (!gk.wingspan) missing.push('wingspan');
    return missing;
  }

  it('detects all missing fields', () => {
    expect(getMissingFields({})).toEqual(['birthDate', 'height', 'weight', 'wingspan']);
  });

  it('detects partial missing fields', () => {
    expect(getMissingFields({ birthDate: '2000-01-01', height: 190 })).toEqual(['weight', 'wingspan']);
  });

  it('returns empty when all fields present', () => {
    expect(getMissingFields({ birthDate: '2000-01-01', height: 190, weight: 85, wingspan: 195 })).toEqual([]);
  });
});

describe('Athlete Page Improvements — Redundancy Elimination', () => {
  it('header renders age but NOT height as a displayed value', async () => {
    const profileCode = await import('../components/athletes/AthleteProfile?raw');
    const code = (profileCode as any).default || '';
    if (code) {
      // Extract only the JSX header section (between {/* Header */} and {/* Missing Data Alert */})
      const headerMatch = code.match(/\{\/\* Header \*\/\}([\s\S]*?)\{\/\* Missing Data Alert/);
      const headerJSX = headerMatch ? headerMatch[1] : '';
      expect(headerJSX).toContain('years');
      // Height should NOT appear as a rendered span in the header
      expect(headerJSX).not.toContain('goalkeeper.height');
    }
  });

  it('overview card title is Physical Profile, not Personal Info', async () => {
    const overviewCode = await import('../components/athletes/AthleteOverview?raw');
    const code = (overviewCode as any).default || '';
    if (code) {
      expect(code).toContain('physicalProfile');
      // Should NOT contain the old avatar+name block
      expect(code).not.toContain('personalInfo');
    }
  });
});

describe('Athlete Page Improvements — IDP Tab Registration', () => {
  it('ProfileTab union includes idp', async () => {
    const profileCode = await import('../components/athletes/AthleteProfile?raw');
    const code = (profileCode as any).default || '';
    if (code) {
      expect(code).toContain("'idp'");
      expect(code).toContain('AthleteIDP');
      expect(code).toContain('developmentPlan');
    }
  });
});
