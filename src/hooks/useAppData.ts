import { useState, useEffect, useCallback } from 'react';
import { TrainingSession, PerformanceVideo, Goalkeeper, Exercise } from '../types';
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

export function useAppData() {
  const { user } = useAuth();
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [videos, setVideos] = useState<PerformanceVideo[]>([]);
  const [exercisesLibrary, setExercisesLibrary] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const [gkRes, sessRes, vidRes, exRes] = await Promise.all([
        supabase.from('goalkeepers').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('videos').select('*').order('created_at', { ascending: false }),
        supabase.from('exercises').select('*').order('created_at', { ascending: false }),
      ]);

      if (gkRes.data) setGoalkeepers(gkRes.data);
      if (sessRes.data) setSessions(sessRes.data);
      if (vidRes.data) setVideos(vidRes.data);
      if (exRes.data) setExercisesLibrary(exRes.data.map(normalizeExercise));

      [gkRes, sessRes, vidRes, exRes].forEach((res, i) => {
        if (res.error) {
          const tables = ['goalkeepers', 'sessions', 'videos', 'exercises'];
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
      .insert([{ ...newSession, user_id: user.id }])
      .select();

    if (error) {
      console.error('Error adding session:', error);
      return false;
    }
    if (data) {
      setSessions(prev => [data[0], ...prev]);
    }
    return true;
  };

  const updateSession = async (session: TrainingSession) => {
    const { id, ...rest } = session;
    const { error } = await supabase.from('sessions').update(rest).eq('id', id);
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

  return {
    goalkeepers,
    sessions,
    videos,
    exercisesLibrary,
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
    refetch: fetchAll,
  };
}
