import { useState, useEffect, useCallback } from 'react';
import { TrainingSession, PerformanceVideo, Goalkeeper, Exercise, SavedMicrocycle } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

function normalizeExercise(ex: any): Exercise {
  if (!ex) return ex;
  const arrayFields = ['objective', 'organization', 'execution', 'progression', 'successCriteria'];
  const normalized = { ...ex };

  arrayFields.forEach(field => {
    let value = normalized[field];

    while (typeof value === 'string' && value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) || typeof parsed === 'string') {
          value = parsed;
        } else {
          break;
        }
      } catch {
        const trimmed = value.trim();
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

  return normalized as Exercise;
}

function mapSessionFromDB(s: any): TrainingSession {
  return {
    ...s,
    numAthletes: s.num_athletes || s.numAthletes,
    generalObjectives: s.general_objectives || s.generalObjectives || [],
    microcycleId: s.microcycle_id,
  };
}

function mapSessionToDB(s: Partial<TrainingSession>, userId: string) {
  const { id, microcycleId, numAthletes, generalObjectives, ...rest } = s;
  return {
    ...rest,
    user_id: userId,
    num_athletes: numAthletes || (s as any).numAthletes,
    general_objectives: generalObjectives || (s as any).generalObjectives,
    microcycle_id: microcycleId || null,
  };
}

function mapMicrocycleFromDB(mc: any): SavedMicrocycle {
  return {
    id: mc.id,
    name: mc.name,
    startDate: mc.start_date,
    endDate: mc.end_date,
    matchDay: mc.match_day,
    matchOpponent: mc.match_opponent,
    matchLocation: mc.match_location,
    matchTime: mc.match_time,
    matchCompetition: mc.match_competition,
    restDays: mc.rest_days || [],
    mesocycle: mc.mesocycle,
  };
}

function mapMicrocycleToDB(mc: Partial<SavedMicrocycle>, userId: string) {
  return {
    user_id: userId,
    name: mc.name,
    start_date: mc.startDate,
    end_date: mc.endDate,
    match_day: mc.matchDay || null,
    match_opponent: mc.matchOpponent || null,
    match_location: mc.matchLocation || null,
    match_time: mc.matchTime || null,
    match_competition: mc.matchCompetition || null,
    rest_days: mc.restDays || [],
    mesocycle: mc.mesocycle || null,
  };
}


export function useAppData() {
  const { user } = useAuth();
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
      const [gkRes, sessRes, vidRes, exRes, mcRes] = await Promise.all([
        supabase.from('goalkeepers').select('*').order('display_order', { ascending: true }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('videos').select('*').order('created_at', { ascending: false }),
        supabase.from('exercises').select('*').order('created_at', { ascending: false }),
        supabase.from('microcycles').select('*').order('created_at', { ascending: false }),
      ]);

      if (gkRes.data) setGoalkeepers(gkRes.data);
      if (sessRes.data) setSessions(sessRes.data.map(mapSessionFromDB));
      if (vidRes.data) setVideos(vidRes.data);
      if (exRes.data) setExercisesLibrary(exRes.data.map(normalizeExercise));
      if (mcRes.data) setSavedMicrocycles(mcRes.data.map(mapMicrocycleFromDB));

      [gkRes, sessRes, vidRes, exRes, mcRes].forEach((res, i) => {
        if (res.error) {
          const tables = ['goalkeepers', 'sessions', 'videos', 'exercises', 'microcycles'];
          console.error(`Error fetching ${tables[i]}:`, res.error);
        }
      });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Exercises CRUD ---

  const addExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('exercises')
      .insert([{ ...exercise, user_id: user.id }])
      .select();

    if (error) {
      console.error('Error adding exercise:', error);
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
      console.error('Error updating exercise:', error);
      return;
    }
    setExercisesLibrary(prev => prev.map(e => e.id === id ? exercise : e));
  };

  const deleteExercise = async (exerciseId: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
    if (error) {
      console.error('Error deleting exercise:', error);
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
      console.error('Error adding session:', error);
      return false;
    }
    if (data) {
      setSessions(prev => [mapSessionFromDB(data[0]), ...prev]);
    }
    return true;
  };

  const updateSession = async (session: TrainingSession) => {
    const { id } = session;
    const { error } = await supabase
      .from('sessions')
      .update(mapSessionToDB(session, user.id))
      .eq('id', id);

    if (error) {
      console.error('Error updating session:', error);
      return;
    }
    setSessions(prev => prev.map(s => s.id === id ? session : s));
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) {
      console.error('Error deleting session:', error);
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // --- Goalkeepers CRUD ---

  const addGoalkeeper = async (gk: Omit<Goalkeeper, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('goalkeepers')
      .insert([{ ...gk, user_id: user.id }])
      .select();

    if (error) {
      console.error('Error adding goalkeeper:', error);
      return;
    }
    if (data) {
      setGoalkeepers(prev => [...prev, data[0]]);
    }
  };

  const updateGoalkeeper = async (gk: Goalkeeper) => {
    const { id, ...rest } = gk;
    const { error } = await supabase.from('goalkeepers').update(rest).eq('id', id);
    if (error) {
      console.error('Error updating goalkeeper:', error);
      return;
    }
    setGoalkeepers(prev => prev.map(k => k.id === id ? gk : k));
  };

  const deleteGoalkeeper = async (gkId: string) => {
    const { error } = await supabase.from('goalkeepers').delete().eq('id', gkId);
    if (error) {
      console.error('Error deleting goalkeeper:', error);
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
      console.error('Error persisting new goalkeeper order:', error);
      // Optional: refetch to revert to server state on error
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
      console.error('Error adding video:', error);
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
      console.error('Error updating video:', error);
      return;
    }
    setVideos(prev => prev.map(v => v.id === id ? video : v));
  };

  const deleteVideo = async (videoId: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) {
      console.error('Error deleting video:', error);
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
      console.error('Error adding microcycle:', error);
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
      console.error('Error updating microcycle:', error);
      return;
    }
    setSavedMicrocycles(prev => prev.map(m => m.id === id ? mc : m));
  };

  const deleteMicrocycle = async (mcId: string) => {
    const { error } = await supabase.from('microcycles').delete().eq('id', mcId);
    if (error) {
      console.error('Error deleting microcycle:', error);
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
