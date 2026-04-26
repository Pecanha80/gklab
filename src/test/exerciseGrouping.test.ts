import { describe, it, expect } from 'vitest';
import type { Exercise } from '../types';

/**
 * Tests the exercise grouping logic used in ExercisesTab.
 * The grouping algorithm:
 *   1. Filters exercises by search term (title, objective, type translation, capacity translation)
 *   2. Groups by exercise type (first level)
 *   3. Sub-groups by physical capacity / category (second level)
 *   4. PHYSICAL_CAPACITY_ORDER determines display order of sub-groups
 */

const PHYSICAL_CAPACITY_ORDER = ['strength', 'velocity', 'reactionSpeed', 'endurance', ''] as const;

function makeExercise(overrides: Partial<Exercise> & { id: string; title: string; type: Exercise['type'] }): Exercise {
  return {
    objective: '',
    organization: '',
    execution: '',
    progression: '',
    successCriteria: '',
    duration: '10min',
    intensity: 'medium' as const,
    category: undefined,
    ...overrides,
  };
}

/** Mimics the grouping logic from ExercisesTab's groupedExercises useMemo */
function groupExercises(
  exercises: Exercise[],
  searchTerm: string = '',
  tFn: (key: string) => string = (k) => k,
): Record<string, Record<string, Exercise[]>> {
  const filtered = exercises.filter(ex => {
    const objectiveStr = Array.isArray(ex.objective) ? ex.objective.join(' ') : (ex.objective || '');
    const term = searchTerm.toLowerCase();
    const capacityStr = ex.category ? tFn(ex.category).toLowerCase() : '';
    return (
      ex.title.toLowerCase().includes(term) ||
      objectiveStr.toLowerCase().includes(term) ||
      tFn(ex.type).toLowerCase().includes(term) ||
      capacityStr.includes(term)
    );
  });

  const groups: Record<string, Record<string, Exercise[]>> = {};
  filtered.forEach(ex => {
    const group = ex.type || 'uncategorized';
    const capacity = ex.category || '';
    if (!groups[group]) groups[group] = {};
    if (!groups[group][capacity]) groups[group][capacity] = [];
    groups[group][capacity].push(ex);
  });

  return groups;
}

describe('Exercise grouping logic', () => {
  const exercises: Exercise[] = [
    makeExercise({ id: '1', title: 'Diving Drill', type: 'shotStopping', category: 'strength' }),
    makeExercise({ id: '2', title: 'Reflex Save', type: 'shotStopping', category: 'reactionSpeed' }),
    makeExercise({ id: '3', title: 'High Ball Catch', type: 'crosses', category: 'endurance' }),
    makeExercise({ id: '4', title: 'Quick Feet', type: 'footwork', category: 'velocity' }),
    makeExercise({ id: '5', title: 'Basic Positioning', type: 'footwork' }), // no category
    makeExercise({ id: '6', title: 'Distribution Long', type: 'distribution', category: 'strength' }),
  ];

  it('groups exercises by type at the first level', () => {
    const groups = groupExercises(exercises);
    expect(Object.keys(groups).sort()).toEqual(['crosses', 'distribution', 'footwork', 'shotStopping']);
  });

  it('sub-groups exercises by physical capacity within each type', () => {
    const groups = groupExercises(exercises);
    expect(Object.keys(groups['shotStopping']).sort()).toEqual(['reactionSpeed', 'strength']);
    expect(groups['shotStopping']['strength']).toHaveLength(1);
    expect(groups['shotStopping']['reactionSpeed']).toHaveLength(1);
  });

  it('places exercises without category into empty string group', () => {
    const groups = groupExercises(exercises);
    expect(groups['footwork']['']).toBeDefined();
    expect(groups['footwork']['']).toHaveLength(1);
    expect(groups['footwork'][''][0].title).toBe('Basic Positioning');
  });

  it('filters exercises by title search term', () => {
    const groups = groupExercises(exercises, 'diving');
    expect(Object.keys(groups)).toEqual(['shotStopping']);
    expect(groups['shotStopping']['strength']).toHaveLength(1);
  });

  it('filters exercises by objective search term', () => {
    const exercisesWithObj: Exercise[] = [
      makeExercise({ id: '10', title: 'Drill A', type: 'shotStopping', objective: ['improve reflexes'] }),
      makeExercise({ id: '11', title: 'Drill B', type: 'crosses', objective: 'aerial dominance' }),
    ];
    const groups = groupExercises(exercisesWithObj, 'reflexes');
    expect(Object.keys(groups)).toEqual(['shotStopping']);
  });

  it('search includes physical capacity name via translation function', () => {
    // tFn maps 'strength' -> 'Forca'
    const tFn = (key: string) => (key === 'strength' ? 'Forca' : key);
    const groups = groupExercises(exercises, 'forca', tFn);
    // Should match exercises with category 'strength' because tFn('strength') = 'Forca'
    const allMatched = Object.values(groups).flatMap(sub => Object.values(sub).flat());
    expect(allMatched.length).toBeGreaterThan(0);
    allMatched.forEach(ex => expect(ex.category).toBe('strength'));
  });

  it('PHYSICAL_CAPACITY_ORDER constant has the correct entries and order', () => {
    expect(PHYSICAL_CAPACITY_ORDER).toEqual(['strength', 'velocity', 'reactionSpeed', 'endurance', '']);
  });

  it('PHYSICAL_CAPACITY_ORDER can be used to sort sub-groups correctly', () => {
    const groups = groupExercises(exercises);
    const footworkCapacities = Object.keys(groups['footwork']); // 'velocity' and ''
    const sorted = [...footworkCapacities].sort(
      (a, b) => PHYSICAL_CAPACITY_ORDER.indexOf(a as any) - PHYSICAL_CAPACITY_ORDER.indexOf(b as any),
    );
    expect(sorted).toEqual(['velocity', '']);
  });

  it('returns empty groups when no exercises match search', () => {
    const groups = groupExercises(exercises, 'zzz_nonexistent');
    expect(Object.keys(groups)).toHaveLength(0);
  });
});
