import { useState, useEffect, useCallback } from 'react';
import { TrainingSession, PerformanceVideo, Goalkeeper, Exercise, SavedMicrocycle } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useTranslation } from './useTranslation';
import { getTodayDateString } from '../lib/utils';

/** Normalizes exercise array fields that may come as JSON strings from Supabase. */
function normalizeExercise(ex: Record<string, unknown>): Exercise {
  if (!ex) return ex as unknown as Exercise;
  const arrayFields = ['objective', 'organization', 'execution', 'progression', 'successCriteria'];
  const normalized = { ...ex };

  arrayFields.forEach(field => {
    let value: unknown = normalized[field];

    while (typeof value === 'string' && value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) || typeof parsed === 'string') {
          value = parsed;
        } else {
          break;
        }
      } catch {
        const trimmed = (value as string).trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          value = trimmed.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
        }
        break;
      }
    }

    if (!Array.isArray(value)) {
      value = value ? [value] : [];
    }

    normalized[field] = value;
  });

  return normalized as unknown as Exercise;
}

/** Maps a Supabase row to the TrainingSession interface. DB columns are camelCase. */
function mapSessionFromDB(s: Record<string, unknown>): TrainingSession {
  return {
    id: s.id as string,
    date: (s.date as string) ?? '',
    category: (s.category as string | string[]) ?? '',
    numAthletes: (s.numAthletes as number) ?? 0,
    duration: (s.duration as string | string[]) ?? '',
    generalObjectives: (s.generalObjectives as string[]) ?? [],
    objectives: (s.objectives as TrainingSession['objectives']) ?? { technical: [], tactical: [], physical: [], cognitive: [] },
    warmup: (s.warmup as Exercise[]) ?? [],
    exercises: (s.exercises as Exercise[]) ?? [],
    integratedWithTeam: (s.integratedWithTeam as TrainingSession['integratedWithTeam']) ?? [],
    coolDown: (s.coolDown as string | string[]) ?? '',
    observations: (s.observations as TrainingSession['observations']) ?? { positives: [], adjustments: [], individualEval: [] },
    titles: (s.titles as string[]) ?? [],
    gameMoments: (s.gameMoments as string[]) ?? [],
    tacticalPrinciples: (s.tacticalPrinciples as string[]) ?? [],
    athleteObservations: (s.athleteObservations as TrainingSession['athleteObservations']) ?? [],
    time: (s.time as string) ?? '',
    focus: (s.focus as string[]) ?? [],
    attending: (s.attending as string[]) ?? [],
    imageUrl: s.imageUrl as string | undefined,
    isLive: (s.isLive as boolean) ?? false,
    mesocycle: (s.mesocycle as string) ?? '',
  };
}

/** Maps a TrainingSession to a Supabase row for insert/update. Uses ?? for nullish safety. */
function mapSessionToDB(s: Partial<TrainingSession>, userId: string) {
  return {
    user_id: userId,
    date: s.date ?? getTodayDateString(),
    numAthletes: s.numAthletes ?? 0,
    generalObjectives: s.generalObjectives ?? [],
    category: s.category ?? '',
    duration: s.duration ?? '',
    objectives: s.objectives ?? {},
    warmup: s.warmup ?? [],
    exercises: s.exercises ?? [],
    integratedWithTeam: s.integratedWithTeam ?? [],
    coolDown: s.coolDown ?? '',
    observations: s.observations ?? {},
    titles: s.titles ?? [],
    gameMoments: s.gameMoments ?? [],
    tacticalPrinciples: s.tacticalPrinciples ?? [],
    mesocycle: s.mesocycle ?? '',
    attending: s.attending ?? [],
    time: s.time ?? '',
    focus: s.focus ?? [],
    imageUrl: s.imageUrl ?? null,
    isLive: s.isLive ?? false,
    athleteObservations: s.athleteObservations ?? [],
  };
}

/** Maps a Supabase microcycles row (snake_case) to the SavedMicrocycle interface (camelCase). */
function mapMicrocycleFromDB(mc: Record<string, unknown>): SavedMicrocycle {
  return {
    id: mc.id as string,
    name: mc.name as string,
    startDate: mc.start_date as string,
    endDate: mc.end_date as string,
    matchDay: (mc.match_day as string) ?? null,
    matchOpponent: mc.match_opponent as string | undefined,
    matchLocation: mc.match_location as string | undefined,
    matchTime: mc.match_time as string | undefined,
    matchCompetition: mc.match_competition as string | undefined,
    restDays: (mc.rest_days as string[]) ?? [],
    mesocycle: mc.mesocycle as string | undefined,
  };
}

/** Maps a SavedMicrocycle (camelCase) to a Supabase row (snake_case) for insert/update. */
function mapMicrocycleToDB(mc: Partial<SavedMicrocycle>, userId: string) {
  return {
    user_id: userId,
    name: mc.name,
    start_date: mc.startDate,
    end_date: mc.endDate,
    match_day: mc.matchDay ?? null,
    match_opponent: mc.matchOpponent ?? null,
    match_location: mc.matchLocation ?? null,
    match_time: mc.matchTime ?? null,
    match_competition: mc.matchCompetition ?? null,
    rest_days: mc.restDays ?? [],
    mesocycle: mc.mesocycle ?? null,
  };
}


export function useAppData() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [videos, setVideos] = useState<PerformanceVideo[]>([]);
  const [exercisesLibrary, setExercisesLibrary] = useState<Exercise[]>([]);
  const [savedMicrocycles, setSavedMicrocycles] = useState<SavedMicrocycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const PAGE_LIMIT = 200;
      const [gkRes, sessRes, vidRes, exRes, mcRes] = await Promise.all([
        supabase.from('goalkeepers').select('*').order('display_order', { ascending: true }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(PAGE_LIMIT),
        supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(PAGE_LIMIT),
        supabase.from('exercises').select('*').order('created_at', { ascending: false }).limit(PAGE_LIMIT),
        supabase.from('microcycles').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (gkRes.data) setGoalkeepers(gkRes.data.map((row: Record<string, unknown>) => ({
        ...row,
        // Map snake_case DB columns to camelCase (only for new extended fields)
        // Note: original fields (imageUrl, birthDate, etc.) are stored as camelCase in DB with quoted identifiers
        preferredFoot: row.preferred_foot ?? row.preferredFoot,
        dominantHand: row.dominant_hand ?? row.dominantHand,
        guardianName: row.guardian_name ?? row.guardianName,
        guardianPhone: row.guardian_phone ?? row.guardianPhone,
        clubAffiliation: row.club_affiliation ?? row.clubAffiliation,
        registrationDate: row.registration_date ?? row.registrationDate,
        jerseyNumber: row.jersey_number ?? row.jerseyNumber,
        displayOrder: row.display_order ?? row.displayOrder,
      })) as unknown as Goalkeeper[]);
      if (sessRes.data) setSessions(sessRes.data.map(mapSessionFromDB));
      if (vidRes.data) setVideos(vidRes.data);
      if (exRes.data) setExercisesLibrary(exRes.data.map(normalizeExercise));
      if (mcRes.data) setSavedMicrocycles(mcRes.data.map(mapMicrocycleFromDB));

      const tables = ['goalkeepers', 'sessions', 'videos', 'exercises', 'microcycles'];
      [gkRes, sessRes, vidRes, exRes, mcRes].forEach((res, i) => {
        if (res.error) showError(`${t('errorLoadTable')} ${tables[i]}: ${res.error.message}`);
      });
    } catch {
      showError(t('errorLoadData'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Exercises CRUD ---

  const addExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>) => {
    if (!user) return;
    const row = {
      type: exercise.type,
      title: exercise.title,
      category: exercise.category || null,
      objective: Array.isArray(exercise.objective) ? exercise.objective.join('\n') : exercise.objective,
      organization: Array.isArray(exercise.organization) ? exercise.organization.join('\n') : exercise.organization,
      execution: Array.isArray(exercise.execution) ? exercise.execution.join('\n') : exercise.execution,
      progression: Array.isArray(exercise.progression) ? exercise.progression.join('\n') : exercise.progression,
      successCriteria: Array.isArray(exercise.successCriteria) ? exercise.successCriteria.join('\n') : exercise.successCriteria,
      duration: Array.isArray(exercise.duration) ? exercise.duration.join(' + ') : exercise.duration,
      intensity: exercise.intensity,
      repetitions: exercise.repetitions || null,
      diagram: exercise.diagram || null,
      user_id: user.id,
    };
    const { data, error } = await supabase
      .from('exercises')
      .insert([row])
      .select();

    if (error) {
      showError(`Erro ao adicionar exercício: ${error.message}`);
      return;
    }
    if (data) {
      setExercisesLibrary(prev => [normalizeExercise(data[0]), ...prev]);
    }
  };

  const updateExercise = async (exercise: Exercise) => {
    const { id, ...rest } = exercise;
    const { error } = await supabase.from('exercises').update(rest).eq('id', id);
    if (error) {
      showError(`Erro ao atualizar exercício: ${error.message}`);
      return;
    }
    setExercisesLibrary(prev => prev.map(e => e.id === id ? exercise : e));
  };

  const deleteExercise = async (exerciseId: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
    if (error) {
      showError(`Erro ao excluir exercício: ${error.message}`);
      return;
    }
    setExercisesLibrary(prev => prev.filter(e => e.id !== exerciseId));
  };

  // --- Sessions CRUD ---

  const addSession = async (newSession: Omit<TrainingSession, 'id'>) => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('sessions')
      .insert([mapSessionToDB(newSession, user.id)])
      .select();

    if (error) {
      showError(`Erro ao salvar sessão: ${error.message}`);
      return false;
    }
    if (data) {
      setSessions(prev => [mapSessionFromDB(data[0]), ...prev]);
      showSuccess('Sessão salva com sucesso!');
    }
    return true;
  };

  const updateSession = async (session: TrainingSession) => {
    if (!user) return;
    const { id } = session;
    const { error } = await supabase
      .from('sessions')
      .update(mapSessionToDB(session, user.id))
      .eq('id', id);

    if (error) {
      showError(`Erro ao atualizar sessão: ${error.message}`);
      return;
    }
    setSessions(prev => prev.map(s => s.id === id ? session : s));
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) {
      showError(`Erro ao excluir sessão: ${error.message}`);
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // --- Goalkeepers CRUD ---

  /** Maps a Goalkeeper (camelCase) to a Supabase row (snake_case) for insert/update. */
  const mapGoalkeeperToDB = (gk: Record<string, unknown>) => {
    const mapped: Record<string, unknown> = {};
    // Only the NEW extended fields use snake_case in DB
    // Original fields (imageUrl, birthDate, etc.) use quoted camelCase in DB
    const keyMap: Record<string, string> = {
      preferredFoot: 'preferred_foot',
      dominantHand: 'dominant_hand',
      guardianName: 'guardian_name',
      guardianPhone: 'guardian_phone',
      clubAffiliation: 'club_affiliation',
      registrationDate: 'registration_date',
      jerseyNumber: 'jersey_number',
    };
    for (const [key, value] of Object.entries(gk)) {
      if (key === 'id') continue;
      mapped[keyMap[key] || key] = value;
    }
    return mapped;
  };

  const addGoalkeeper = async (gk: Omit<Goalkeeper, 'id'>) => {
    if (!user) return;
    const row = mapGoalkeeperToDB(gk as Record<string, unknown>);
    const { data, error } = await supabase
      .from('goalkeepers')
      .insert([{ ...row, user_id: user.id }])
      .select();

    if (error) {
      showError(`Erro ao adicionar goleiro: ${error.message}`);
      return;
    }
    if (data) {
      setGoalkeepers(prev => [...prev, data[0]]);
    }
  };

  const updateGoalkeeper = async (gk: Goalkeeper) => {
    const { id, ...rest } = gk;
    const row = mapGoalkeeperToDB(rest as Record<string, unknown>);
    const { error } = await supabase.from('goalkeepers').update(row).eq('id', id);
    if (error) {
      showError(`Erro ao atualizar goleiro: ${error.message}`);
      return;
    }
    setGoalkeepers(prev => prev.map(k => k.id === id ? gk : k));
  };

  const deleteGoalkeeper = async (gkId: string) => {
    const { error } = await supabase.from('goalkeepers').delete().eq('id', gkId);
    if (error) {
      showError(`Erro ao excluir goleiro: ${error.message}`);
      return;
    }
    setGoalkeepers(prev => prev.filter(k => k.id !== gkId));
  };

  const reorderGoalkeepers = async (orderedGks: Goalkeeper[]) => {
    // Optimistic update
    setGoalkeepers(orderedGks);

    if (!user) return;

    // Update each goalkeeper's position in the database
    // We do this in a single loop - for small lists this is fine
    const updates = orderedGks.map((gk, index) => 
      supabase
        .from('goalkeepers')
        .update({ display_order: index })
        .eq('id', gk.id)
    );

    try {
      await Promise.all(updates);
    } catch (error) {
      showError(t('errorReorderGoalkeepers'));
      fetchAll();
    }
  };

  // --- Videos CRUD ---

  const addVideo = async (video: Omit<PerformanceVideo, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('videos')
      .insert([{ ...video, user_id: user.id }])
      .select();

    if (error) {
      showError(`Erro ao adicionar vídeo: ${error.message}`);
      return;
    }
    if (data) {
      setVideos(prev => [data[0], ...prev]);
    }
  };

  const updateVideo = async (video: PerformanceVideo) => {
    const { id, ...rest } = video;
    const { error } = await supabase.from('videos').update(rest).eq('id', id);
    if (error) {
      showError(`Erro ao atualizar vídeo: ${error.message}`);
      return;
    }
    setVideos(prev => prev.map(v => v.id === id ? video : v));
  };

  const deleteVideo = async (videoId: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) {
      showError(`Erro ao excluir vídeo: ${error.message}`);
      return;
    }
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  // --- Microcycles CRUD ---

  const addMicrocycle = async (mc: Omit<SavedMicrocycle, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('microcycles')
      .insert([mapMicrocycleToDB(mc, user.id)])
      .select();

    if (error) {
      showError(`Erro ao adicionar microciclo: ${error.message}`);
      throw error;
    }
    if (data) {
      setSavedMicrocycles(prev => [mapMicrocycleFromDB(data[0]), ...prev]);
    }
  };

  const updateMicrocycle = async (mc: SavedMicrocycle) => {
    if (!user) return;
    const { id, ...rest } = mc;
    const { error } = await supabase
      .from('microcycles')
      .update(mapMicrocycleToDB(rest, user.id))
      .eq('id', id);

    if (error) {
      showError(`Erro ao atualizar microciclo: ${error.message}`);
      return;
    }
    setSavedMicrocycles(prev => prev.map(m => m.id === id ? mc : m));
  };

  const deleteMicrocycle = async (mcId: string) => {
    const { error } = await supabase.from('microcycles').delete().eq('id', mcId);
    if (error) {
      showError(`Erro ao excluir microciclo: ${error.message}`);
      return;
    }
    setSavedMicrocycles(prev => prev.filter(m => m.id !== mcId));
  };

  return {
    goalkeepers,
    sessions,
    videos,
    exercisesLibrary,
    savedMicrocycles,
    isLoading,
    addExerciseToLibrary,
    updateExercise,
    deleteExercise,
    addSession,
    updateSession,
    deleteSession,
    addGoalkeeper,
    updateGoalkeeper,
    deleteGoalkeeper,
    addVideo,
    updateVideo,
    deleteVideo,
    reorderGoalkeepers,
    addMicrocycle,
    updateMicrocycle,
    deleteMicrocycle,
    refetch: fetchAll,
  };
}
