/**
 * TDD: useSessionForm — handleAddSession (Save Session button logic)
 *
 * RED  -> run tests, all fail (no implementation changes yet)
 * GREEN -> tests pass because implementation already exists
 * REFACTOR -> tests stay green
 *
 * Mocking strategy:
 *  - vi.mock('@/lib/supabase')        prevents the env-var throw at import time
 *  - vi.mock('@/hooks/useAuth')       supplies a fake authenticated user
 *  - vi.mock('@/hooks/useCustomPresets') removes Supabase writes from preset saving
 *  - useTranslation uses its default context (key pass-through), no mock needed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionForm, emptySession } from '@/hooks/useSessionForm';
import type { TrainingSession, Exercise } from '@/types';

// ---------------------------------------------------------------------------
// Module-level mocks (must be declared before any import that triggers them)
// ---------------------------------------------------------------------------

// Prevent supabase.ts from throwing due to missing env vars
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Provide a stable authenticated user without real Supabase calls
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'coach@gklab.test' },
    session: null,
    isLoading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Prevent useCustomPresets from making Supabase round-trips during preset saves
vi.mock('@/hooks/useCustomPresets', () => ({
  useCustomPresets: () => ({
    customPresets: {},
    isLoading: false,
    getOptions: vi.fn().mockReturnValue([]),
    addCustomPreset: vi.fn(),
    removeCustomPreset: vi.fn(),
    moveCustomPreset: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeFakeEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

function makeMinimalSession(): Omit<TrainingSession, 'id'> {
  return {
    ...emptySession,
    date: '2026-04-22',
    category: ['firstTeam'],
    numAthletes: 2,
    duration: ['90min'],
    generalObjectives: [],
    objectives: { technical: [], tactical: [], physical: [], cognitive: [] },
    warmup: [],
    exercises: [],
    integratedWithTeam: [],
    coolDown: [],
    observations: { positives: [], adjustments: [], individualEval: [] },
    athleteObservations: [],
    titles: ['Test Session'],
    focus: [],
    time: '10:00',
    attending: [],
  };
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    type: 'shotStopping',
    title: 'Diving Save',
    objective: ['react to low shot'],
    organization: ['2 posts, 1 server'],
    execution: ['Server plays in, GK dives'],
    progression: [],
    successCriteria: [],
    duration: ['15min'],
    intensity: 'medium',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSessionForm — handleAddSession (Save Session button)', () => {
  let addSession: ReturnType<typeof vi.fn<(session: Omit<TrainingSession, 'id'>) => Promise<boolean>>>;
  let updateSession: ReturnType<typeof vi.fn<(session: TrainingSession) => Promise<void>>>;
  let addExerciseToLibrary: ReturnType<typeof vi.fn<(exercise: Omit<Exercise, 'id'>) => Promise<void>>>;

  beforeEach(() => {
    addSession = vi.fn<(session: Omit<TrainingSession, 'id'>) => Promise<boolean>>().mockResolvedValue(true);
    updateSession = vi.fn<(session: TrainingSession) => Promise<void>>().mockResolvedValue(undefined);
    addExerciseToLibrary = vi.fn<(exercise: Omit<Exercise, 'id'>) => Promise<void>>().mockResolvedValue(undefined);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderSessionForm() {
    return renderHook(() =>
      useSessionForm(addSession, updateSession, addExerciseToLibrary, [])
    );
  }

  // -------------------------------------------------------------------------
  // 1. Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with isAddingSession false', () => {
      const { result } = renderSessionForm();
      expect(result.current.isAddingSession).toBe(false);
    });

    it('starts with editingSessionId null', () => {
      const { result } = renderSessionForm();
      expect(result.current.editingSessionId).toBeNull();
    });

    it('starts with newSession matching emptySession shape', () => {
      const { result } = renderSessionForm();
      expect(result.current.newSession).toMatchObject({
        category: [],
        warmup: [],
        exercises: [],
        generalObjectives: [],
        objectives: {
          technical: [],
          tactical: [],
          physical: [],
          cognitive: [],
        },
        observations: {
          positives: [],
          adjustments: [],
          individualEval: [],
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. handleAddSession — happy path (new session)
  // -------------------------------------------------------------------------
  describe('handleAddSession — new session (happy path)', () => {
    it('calls e.preventDefault() to block native form submission', async () => {
      const { result } = renderSessionForm();
      const event = makeFakeEvent();

      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('calls addSession with the current newSession data', async () => {
      const { result } = renderSessionForm();

      // Pre-populate with a minimal valid session
      act(() => {
        result.current.setNewSession(makeMinimalSession());
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(addSession).toHaveBeenCalledTimes(1);
      expect(addSession).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-04-22',
          category: ['firstTeam'],
          numAthletes: 2,
        })
      );
    });

    it('sets isAddingSession to false after a successful save', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsAddingSession(true);
        result.current.setNewSession(makeMinimalSession());
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(result.current.isAddingSession).toBe(false);
    });

    it('resets newSession to emptySession shape after a successful save', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setNewSession(makeMinimalSession());
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      // After reset, category and exercises should be empty again
      expect(result.current.newSession.category).toEqual([]);
      expect(result.current.newSession.exercises).toEqual([]);
      expect(result.current.newSession.warmup).toEqual([]);
    });

    it('does not call updateSession when editingSessionId is null', async () => {
      const { result } = renderSessionForm();
      const event = makeFakeEvent();

      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(updateSession).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. handleAddSession — error path
  // -------------------------------------------------------------------------
  describe('handleAddSession — addSession returns false (Supabase error)', () => {
    it('shows an alert when addSession returns false', async () => {
      addSession.mockResolvedValueOnce(false);
      const { result } = renderSessionForm();
      const event = makeFakeEvent();

      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });

    it('does NOT reset isAddingSession when addSession fails', async () => {
      addSession.mockResolvedValueOnce(false);
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsAddingSession(true);
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(result.current.isAddingSession).toBe(true);
    });

    it('does NOT reset newSession content when addSession fails', async () => {
      addSession.mockResolvedValueOnce(false);
      const { result } = renderSessionForm();
      const session = makeMinimalSession();

      act(() => {
        result.current.setNewSession(session);
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      // Data is preserved so the user does not lose their work
      expect(result.current.newSession.category).toEqual(['firstTeam']);
    });
  });

  // -------------------------------------------------------------------------
  // 4. handleAddSession — update path (editingSessionId set)
  // -------------------------------------------------------------------------
  describe('handleAddSession — update existing session', () => {
    it('calls updateSession instead of addSession when editingSessionId is set', async () => {
      const existingSession: TrainingSession = {
        ...makeMinimalSession(),
        id: 'session-abc-123',
      };
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleEditSession(existingSession);
      });

      expect(result.current.editingSessionId).toBe('session-abc-123');

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(updateSession).toHaveBeenCalledTimes(1);
      expect(updateSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'session-abc-123' })
      );
      expect(addSession).not.toHaveBeenCalled();
    });

    it('clears editingSessionId after a successful update', async () => {
      const existingSession: TrainingSession = {
        ...makeMinimalSession(),
        id: 'session-abc-123',
      };
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleEditSession(existingSession);
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(result.current.editingSessionId).toBeNull();
    });

    it('sets isAddingSession to false after a successful update', async () => {
      const existingSession: TrainingSession = {
        ...makeMinimalSession(),
        id: 'session-xyz-456',
      };
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleEditSession(existingSession);
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(result.current.isAddingSession).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. handleAddSession — session with exercises (preset-save side-effects)
  // -------------------------------------------------------------------------
  describe('handleAddSession — session with warmup and main exercises', () => {
    it('passes warmup and exercises in the addSession payload', async () => {
      const { result } = renderSessionForm();

      const warmupDrill = makeExercise({ id: 'w1', type: 'warmup', title: 'Ladder Footwork' });
      const mainDrill = makeExercise({ id: 'e1', type: 'shotStopping', title: 'Low Dive' });

      act(() => {
        result.current.setNewSession({
          ...makeMinimalSession(),
          warmup: [warmupDrill],
          exercises: [mainDrill],
        });
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(addSession).toHaveBeenCalledWith(
        expect.objectContaining({
          warmup: expect.arrayContaining([expect.objectContaining({ title: 'Ladder Footwork' })]),
          exercises: expect.arrayContaining([expect.objectContaining({ title: 'Low Dive' })]),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 6. Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles an empty session (all defaults) without throwing', async () => {
      const { result } = renderSessionForm();
      const event = makeFakeEvent();

      await expect(
        act(async () => {
          await result.current.handleAddSession(event);
        })
      ).resolves.not.toThrow();

      expect(addSession).toHaveBeenCalledTimes(1);
    });

    it('handles integratedWithTeam array with entries', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setNewSession({
          ...makeMinimalSession(),
          integratedWithTeam: [
            { id: 'int-1', format: 'crossingDuel', number: '4v4', space: 'halfField', time: '20min' },
          ],
        });
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(addSession).toHaveBeenCalledWith(
        expect.objectContaining({
          integratedWithTeam: expect.arrayContaining([
            expect.objectContaining({ format: 'crossingDuel' }),
          ]),
        })
      );
    });

    it('resets date to today after a successful save (not to a stale date)', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), date: '2020-01-01' });
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      // After reset the date should be today (not the old '2020-01-01')
      expect(result.current.newSession.date).not.toBe('2020-01-01');
      // And it should look like a valid YYYY-MM-DD string
      expect(result.current.newSession.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('does not mutate the session object passed in via setNewSession', async () => {
      const { result } = renderSessionForm();
      const original = makeMinimalSession();
      const snapshot = JSON.stringify(original);

      act(() => {
        result.current.setNewSession(original);
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      // The object we passed in must be unchanged after handleAddSession ran
      expect(JSON.stringify(original)).toBe(snapshot);
    });

    it('passes the full generalObjectives array to addSession', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setNewSession({
          ...makeMinimalSession(),
          generalObjectives: ['crossesAerialDominance', 'oneVOneSituations'],
        });
      });

      const event = makeFakeEvent();
      await act(async () => {
        await result.current.handleAddSession(event);
      });

      expect(addSession).toHaveBeenCalledWith(
        expect.objectContaining({
          generalObjectives: ['crossesAerialDominance', 'oneVOneSituations'],
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 7. translateContent
  // -------------------------------------------------------------------------
  describe('translateContent', () => {
    it('returns empty string for undefined input', () => {
      const { result } = renderSessionForm();
      expect(result.current.translateContent(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      const { result } = renderSessionForm();
      expect(result.current.translateContent('')).toBe('');
    });

    it('joins array items with newline', () => {
      const { result } = renderSessionForm();
      // t() passes unknown keys through as-is
      const out = result.current.translateContent(['alpha', 'beta']);
      expect(out).toBe('alpha\nbeta');
    });

    it('returns the key string for a scalar string input', () => {
      const { result } = renderSessionForm();
      expect(result.current.translateContent('someKey')).toBe('someKey');
    });
  });

  // -------------------------------------------------------------------------
  // 8. handleAddDrill
  // -------------------------------------------------------------------------
  describe('handleAddDrill', () => {
    it('does nothing when currentDrill.title is empty', async () => {
      const { result } = renderSessionForm();

      await act(async () => {
        await result.current.handleAddDrill();
      });

      // exercises and warmup stay empty — nothing was added
      expect(result.current.newSession.exercises).toHaveLength(0);
      expect(result.current.newSession.warmup).toHaveLength(0);
    });

    it('adds a drill to exercises when drillContext is "main"', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setDrillContext('main');
        result.current.setCurrentDrill({
          type: 'shotStopping',
          title: 'High Ball Catch',
          objective: ['catch high ball'],
          organization: ['box + server'],
          execution: ['server chips ball'],
          progression: [],
          successCriteria: [],
          duration: ['10min'],
          intensity: 'medium',
        });
      });

      await act(async () => {
        await result.current.handleAddDrill();
      });

      expect(result.current.newSession.exercises).toHaveLength(1);
      expect(result.current.newSession.exercises[0].title).toBe('High Ball Catch');
    });

    it('adds a drill to warmup when drillContext is "warmup"', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setDrillContext('warmup');
        result.current.setCurrentDrill({
          type: 'warmup',
          title: 'Dynamic Stretch',
          objective: [],
          organization: [],
          execution: [],
          progression: [],
          successCriteria: [],
          duration: ['5min'],
          intensity: 'low',
        });
      });

      await act(async () => {
        await result.current.handleAddDrill();
      });

      expect(result.current.newSession.warmup).toHaveLength(1);
      expect(result.current.newSession.warmup[0].title).toBe('Dynamic Stretch');
    });

    it('resets currentDrill and closes form after adding', async () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsAddingDrill(true);
        result.current.setCurrentDrill({
          type: 'shotStopping',
          title: 'Penalty Save',
          objective: [],
          organization: [],
          execution: [],
          progression: [],
          successCriteria: [],
          duration: [],
          intensity: 'high',
        });
      });

      await act(async () => {
        await result.current.handleAddDrill();
      });

      expect(result.current.isAddingDrill).toBe(false);
      expect(result.current.currentDrill.title).toBe('');
    });

    it('updates an existing drill in exercises when editingDrillId is set', async () => {
      const { result } = renderSessionForm();
      const existingDrill = makeExercise({ id: 'drill-to-edit', title: 'Old Title' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), exercises: [existingDrill] });
        result.current.handleEditDrill(existingDrill, 'main');
        result.current.setCurrentDrill({ ...existingDrill, title: 'New Title' });
      });

      await act(async () => {
        await result.current.handleAddDrill();
      });

      expect(result.current.newSession.exercises[0].title).toBe('New Title');
    });

    it('updates an existing drill in warmup when editingDrillId is set and context is warmup', async () => {
      const { result } = renderSessionForm();
      const warmupDrill = makeExercise({ id: 'warmup-to-edit', type: 'warmup', title: 'Old Warmup' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), warmup: [warmupDrill] });
        result.current.handleEditDrill(warmupDrill, 'warmup');
        result.current.setCurrentDrill({ ...warmupDrill, title: 'Updated Warmup' });
      });

      await act(async () => {
        await result.current.handleAddDrill();
      });

      expect(result.current.newSession.warmup[0].title).toBe('Updated Warmup');
    });
  });

  // -------------------------------------------------------------------------
  // 9. handleCancelDrill
  // -------------------------------------------------------------------------
  describe('handleCancelDrill', () => {
    it('resets currentDrill and closes the drill form', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsAddingDrill(true);
        result.current.setCurrentDrill({ ...makeExercise(), title: 'Partial Entry' });
      });

      act(() => {
        result.current.handleCancelDrill();
      });

      expect(result.current.isAddingDrill).toBe(false);
      expect(result.current.currentDrill.title).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // 10. handleRemoveDrill
  // -------------------------------------------------------------------------
  describe('handleRemoveDrill', () => {
    it('removes a drill from exercises by id', () => {
      const { result } = renderSessionForm();
      const drillA = makeExercise({ id: 'a', title: 'Drill A' });
      const drillB = makeExercise({ id: 'b', title: 'Drill B' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), exercises: [drillA, drillB] });
      });

      act(() => {
        result.current.handleRemoveDrill('a');
      });

      expect(result.current.newSession.exercises).toHaveLength(1);
      expect(result.current.newSession.exercises[0].id).toBe('b');
    });

    it('removes a drill from warmup by id', () => {
      const { result } = renderSessionForm();
      const warmupDrill = makeExercise({ id: 'w1', type: 'warmup', title: 'Warmup A' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), warmup: [warmupDrill] });
      });

      act(() => {
        result.current.handleRemoveDrill('w1');
      });

      expect(result.current.newSession.warmup).toHaveLength(0);
    });

    it('is a no-op when id does not exist', () => {
      const { result } = renderSessionForm();
      const drill = makeExercise({ id: 'keep-me' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), exercises: [drill] });
      });

      act(() => {
        result.current.handleRemoveDrill('non-existent-id');
      });

      expect(result.current.newSession.exercises).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 11. handleEditSession
  // -------------------------------------------------------------------------
  describe('handleEditSession', () => {
    it('sets editingSessionId and opens the session form', () => {
      const { result } = renderSessionForm();
      const session: TrainingSession = { ...makeMinimalSession(), id: 'edit-me' };

      act(() => {
        result.current.handleEditSession(session);
      });

      expect(result.current.editingSessionId).toBe('edit-me');
      expect(result.current.isAddingSession).toBe(true);
    });

    it('populates newSession with the session data (excluding id)', () => {
      const { result } = renderSessionForm();
      const session: TrainingSession = {
        ...makeMinimalSession(),
        id: 'some-id',
        category: ['u18'],
        numAthletes: 5,
      };

      act(() => {
        result.current.handleEditSession(session);
      });

      expect(result.current.newSession.category).toEqual(['u18']);
      expect(result.current.newSession.numAthletes).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // 12. setIsAddingSession (public setter)
  // -------------------------------------------------------------------------
  describe('setIsAddingSession', () => {
    it('clears editingSessionId when set to false', () => {
      const { result } = renderSessionForm();
      const session: TrainingSession = { ...makeMinimalSession(), id: 'session-1' };

      act(() => {
        result.current.handleEditSession(session);
      });

      expect(result.current.editingSessionId).toBe('session-1');

      act(() => {
        result.current.setIsAddingSession(false);
      });

      expect(result.current.editingSessionId).toBeNull();
      expect(result.current.isAddingSession).toBe(false);
    });

    it('does not change editingSessionId when set to true', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsAddingSession(true);
      });

      // editingSessionId was never set, so it remains null
      expect(result.current.editingSessionId).toBeNull();
      expect(result.current.isAddingSession).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 13. handleTacticalBoardSave
  // -------------------------------------------------------------------------
  describe('handleTacticalBoardSave', () => {
    it('closes the tactical board after saving', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setIsTacticalBoardOpen(true);
      });

      act(() => {
        result.current.handleTacticalBoardSave('data:image/png;base64,AAA');
      });

      expect(result.current.isTacticalBoardOpen).toBe(false);
    });

    it('stores the diagram on the currentDrill when no editingDrillId', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleTacticalBoardSave('data:image/png;base64,DIAGRAM');
      });

      expect(result.current.currentDrill.diagram).toBe('data:image/png;base64,DIAGRAM');
    });

    it('stores the diagram on the correct main exercise when editingDrillId is set', () => {
      const { result } = renderSessionForm();
      const drill = makeExercise({ id: 'drw-1', title: 'Shot Stop' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), exercises: [drill] });
        result.current.handleEditDrill(drill, 'main');
      });

      act(() => {
        result.current.handleTacticalBoardSave('data:image/png;base64,BOARD');
      });

      expect(result.current.newSession.exercises[0].diagram).toBe('data:image/png;base64,BOARD');
    });

    it('stores the diagram on the correct warmup drill when editingDrillId is set', () => {
      const { result } = renderSessionForm();
      const wDrill = makeExercise({ id: 'wdrw-1', type: 'warmup', title: 'Stretch' });

      act(() => {
        result.current.setNewSession({ ...makeMinimalSession(), warmup: [wDrill] });
        result.current.handleEditDrill(wDrill, 'warmup');
      });

      act(() => {
        result.current.handleTacticalBoardSave('data:image/png;base64,WARMUP_BOARD');
      });

      expect(result.current.newSession.warmup[0].diagram).toBe('data:image/png;base64,WARMUP_BOARD');
    });
  });

  // -------------------------------------------------------------------------
  // 14. handleGeneralObjectivesChange
  // -------------------------------------------------------------------------
  describe('handleGeneralObjectivesChange', () => {
    it('updates generalObjectives on the session', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleGeneralObjectivesChange(['crossesAerialDominance']);
      });

      expect(result.current.newSession.generalObjectives).toEqual(['crossesAerialDominance']);
    });

    it('clears generalObjectives when empty array is passed', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleGeneralObjectivesChange(['crossesAerialDominance']);
      });

      act(() => {
        result.current.handleGeneralObjectivesChange([]);
      });

      expect(result.current.newSession.generalObjectives).toEqual([]);
    });

    it('does not throw for unknown objective keys (no mapping entry)', () => {
      const { result } = renderSessionForm();

      expect(() => {
        act(() => {
          result.current.handleGeneralObjectivesChange(['totally-unknown-key-xyz']);
        });
      }).not.toThrow();
    });

    it('populates specific objectives from a known objective mapping', () => {
      const { result } = renderSessionForm();

      // 'developAerialDominance' has a mapping with technical, tactical, physical, cognitive
      act(() => {
        result.current.handleGeneralObjectivesChange(['developAerialDominance']);
      });

      const { objectives } = result.current.newSession;
      // The mapping entry values get stored directly (as keys, before translation)
      expect(objectives.technical).toContain('uncontestedCrossClaiming');
      expect(objectives.tactical).toContain('setPieceOrganization');
      expect(objectives.physical).toContain('strength');
      expect(objectives.cognitive).toContain('focus');
    });

    it('generates a warmup drill from the mapping warmupObjective', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleGeneralObjectivesChange(['developAerialDominance']);
      });

      expect(result.current.newSession.warmup).toHaveLength(1);
      expect(result.current.newSession.warmup[0].type).toBe('warmup');
    });

    it('does not add a duplicate objective value on repeated calls', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.handleGeneralObjectivesChange(['developAerialDominance']);
      });
      act(() => {
        result.current.handleGeneralObjectivesChange(['developAerialDominance']);
      });

      const technical = result.current.newSession.objectives.technical;
      // 'uncontestedCrossClaiming' should appear only once
      if (Array.isArray(technical)) {
        const count = technical.filter((v: string) => v === 'uncontestedCrossClaiming').length;
        expect(count).toBe(1);
      } else {
        // string path: shouldn't repeat either
        const parts = (technical as string).split('\n').filter(p => p === 'uncontestedCrossClaiming');
        expect(parts.length).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 15. applyDrillTemplate
  // -------------------------------------------------------------------------
  describe('applyDrillTemplate', () => {
    it('sets the title on currentDrill for an unknown template name', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.applyDrillTemplate('My Custom Drill');
      });

      expect(result.current.currentDrill.title).toBe('My Custom Drill');
    });

    it('clears drill fields when an empty string is passed', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.setCurrentDrill({ ...makeExercise(), title: 'Existing' });
        result.current.applyDrillTemplate('');
      });

      expect(result.current.currentDrill.objective).toEqual([]);
      expect(result.current.currentDrill.organization).toEqual([]);
      expect(result.current.currentDrill.execution).toEqual([]);
    });

    it('populates drill fields when a known template title is found in exercisesLibrary', () => {
      // Render with an exercisesLibrary that contains a matching exercise
      const libraryExercise: Exercise = {
        ...makeExercise(),
        id: 'lib-1',
        title: 'Library Drill',
        objective: ['stop the shot'],
        organization: ['goal + server'],
        execution: ['server shoots'],
        progression: ['add pressure'],
        successCriteria: ['clean save'],
        duration: ['20min'],
      };

      const { result } = renderHook(() =>
        useSessionForm(addSession, updateSession, addExerciseToLibrary, [libraryExercise])
      );

      act(() => {
        result.current.applyDrillTemplate('Library Drill');
      });

      expect(result.current.currentDrill.title).toBe('Library Drill');
      expect(result.current.currentDrill.objective).toEqual(['stop the shot']);
    });
  });

  // -------------------------------------------------------------------------
  // 16. applySessionTemplates
  // -------------------------------------------------------------------------
  describe('applySessionTemplates', () => {
    it('does not throw for an empty titles array', () => {
      const { result } = renderSessionForm();

      expect(() => {
        act(() => {
          result.current.applySessionTemplates([]);
        });
      }).not.toThrow();
    });

    it('does not throw for an unknown template key', () => {
      const { result } = renderSessionForm();

      expect(() => {
        act(() => {
          result.current.applySessionTemplates(['nonExistentTemplate999']);
        });
      }).not.toThrow();
    });

    it('populates exercises from a known session template key', () => {
      const { result } = renderSessionForm();

      // 'shotStoppingCentralAngled' is a real SESSION_TEMPLATES key
      act(() => {
        result.current.applySessionTemplates(['shotStoppingCentralAngled']);
      });

      expect(result.current.newSession.exercises.length).toBeGreaterThan(0);
    });

    it('populates warmup from a known session template', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.applySessionTemplates(['shotStoppingCentralAngled']);
      });

      expect(result.current.newSession.warmup.length).toBeGreaterThan(0);
    });

    it('stores resolved template keys in titles', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.applySessionTemplates(['shotStoppingCentralAngled']);
      });

      expect(result.current.newSession.titles).toContain('shotStoppingCentralAngled');
    });

    it('merges exercises from multiple templates', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.applySessionTemplates(['shotStoppingCentralAngled', 'crossesAerialDominance']);
      });

      // Both templates contribute exercises, so the total must be > what one gives
      expect(result.current.newSession.exercises.length).toBeGreaterThan(1);
    });
  });

  // -------------------------------------------------------------------------
  // 17. loadExample
  // -------------------------------------------------------------------------
  describe('loadExample', () => {
    it('populates newSession with example data', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.loadExample();
      });

      expect(result.current.newSession.titles).toContain('crossesAerialDominance');
      expect(result.current.newSession.exercises.length).toBeGreaterThan(0);
      expect(result.current.newSession.warmup.length).toBeGreaterThan(0);
    });

    it('sets numAthletes to 3 in the example', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.loadExample();
      });

      expect(result.current.newSession.numAthletes).toBe(3);
    });

    it('sets a time string in the example', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.loadExample();
      });

      expect(result.current.newSession.time).toBeTruthy();
    });

    it('sets athleteObservations in the example', () => {
      const { result } = renderSessionForm();

      act(() => {
        result.current.loadExample();
      });

      expect(result.current.newSession.athleteObservations!.length).toBeGreaterThan(0);
    });
  });
});
