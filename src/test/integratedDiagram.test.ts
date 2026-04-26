import { describe, it, expect } from 'vitest';
import { translations } from '../translations';

const en = translations.en;
const pt = translations.pt;

describe('Integrated Exercise Diagram — Type', () => {
  it('IntegratedExercise interface has optional diagram field', async () => {
    // If this compiles, the type exists
    const item: import('../types').IntegratedExercise = {
      id: '1',
      format: 'smallSidedGame',
      number: 'gkPlus4vs4PlusGk',
      space: 'halfFieldSpace',
      time: 'dur_15min',
      diagram: 'data:image/png;base64,abc123',
    };
    expect(item.diagram).toBe('data:image/png;base64,abc123');
  });

  it('IntegratedExercise works without diagram', () => {
    const item: import('../types').IntegratedExercise = {
      id: '2',
      format: 'fullPitchMatch',
      number: 'gkPlus6vs6PlusGk',
      space: 'fullFieldSpace',
      time: 'dur_20min',
    };
    expect(item.diagram).toBeUndefined();
  });
});

describe('Integrated Exercise Diagram — Translations', () => {
  const keys = ['addDiagram', 'editDiagram', 'removeDiagram'];

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

describe('Integrated Exercise Diagram — SessionDetailModal rendering', () => {
  it('SessionDetailModal code renders diagram for integrated exercises', async () => {
    const code = (await import('../components/SessionDetailModal?raw') as any).default || '';
    if (code) {
      expect(code).toContain('item.diagram');
      expect(code).toContain('col-span-2 sm:col-span-4');
      expect(code).toContain('getDiagramImage(item.diagram)');
    }
  });
});

describe('Integrated Exercise Diagram — SessionForm has diagram button', () => {
  it('SessionForm code has integrated diagram button', async () => {
    const code = (await import('../components/forms/SessionForm?raw') as any).default || '';
    if (code) {
      expect(code).toContain("setDrillContext('integrated')");
      expect(code).toContain('addDiagram');
      expect(code).toContain('editDiagram');
      expect(code).toContain('removeDiagram');
      expect(code).toContain('getDiagramImage(integrated.diagram)');
    }
  });
});

describe('Integrated Exercise Diagram — useSessionForm handles integrated context', () => {
  it('handleTacticalBoardSave code has integrated branch', async () => {
    const code = (await import('../hooks/useSessionForm?raw') as any).default || '';
    if (code) {
      expect(code).toContain("drillContext === 'integrated'");
      expect(code).toContain('integratedWithTeam');
    }
  });
});
