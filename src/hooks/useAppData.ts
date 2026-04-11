import { useState, useEffect } from 'react';
import { TrainingSession, PerformanceVideo, Goalkeeper, Exercise } from '../types';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

const STORAGE_KEYS = {
  exercises: 'gk_exercises_library',
  sessions: 'gk_sessions',
  goalkeepers: 'gk_goalkeepers',
  videos: 'gk_videos',
} as const;

function loadFromStorage<T>(key: string): T[] {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      console.error(`Failed to parse ${key} from localStorage`);
    }
  }
  return [];
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useAppData() {
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [videos, setVideos] = useState<PerformanceVideo[]>([]);
  const [exercisesLibrary, setExercisesLibrary] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setExercisesLibrary(loadFromStorage<Exercise>(STORAGE_KEYS.exercises));
      setSessions(loadFromStorage<TrainingSession>(STORAGE_KEYS.sessions));
      setGoalkeepers(loadFromStorage<Goalkeeper>(STORAGE_KEYS.goalkeepers));
      setVideos(loadFromStorage<PerformanceVideo>(STORAGE_KEYS.videos));

      if (!hasSupabaseConfig) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: gkData } = await supabase.from('goalkeepers').select('*');
        if (gkData && gkData.length > 0) {
          setGoalkeepers(gkData);
          saveToStorage(STORAGE_KEYS.goalkeepers, gkData);
        }

        const { data: sessionData } = await supabase.from('sessions').select('*');
        if (sessionData && sessionData.length > 0) {
          setSessions(sessionData);
          saveToStorage(STORAGE_KEYS.sessions, sessionData);
        }

        const { data: videoData } = await supabase.from('videos').select('*');
        if (videoData && videoData.length > 0) {
          setVideos(videoData);
          saveToStorage(STORAGE_KEYS.videos, videoData);
        }

        const { data: exerciseData, error: exerciseError } = await supabase.from('exercises').select('*');
        if (!exerciseError && exerciseData && exerciseData.length > 0) {
          setExercisesLibrary(exerciseData);
          saveToStorage(STORAGE_KEYS.exercises, exerciseData);
        }
      } catch (error) {
        console.error('Error loading Supabase data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Exercises CRUD ---

  const addExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>) => {
    const newExercise = { ...exercise, id: crypto.randomUUID() } as Exercise;
    const updateLocal = (ex: Exercise) => {
      setExercisesLibrary(prev => {
        const updated = [ex, ...prev];
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(newExercise); return; }
    try {
      const { data, error } = await supabase.from('exercises').insert([newExercise]).select();
      if (error) throw error;
      if (data) updateLocal(data[0]);
    } catch (error) {
      console.error('Error adding exercise:', error);
      updateLocal(newExercise);
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    const updateLocal = () => {
      setExercisesLibrary(prev => {
        const updated = prev.filter(e => e.id !== exerciseId);
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(); return; }
    try {
      await supabase.from('exercises').delete().eq('id', exerciseId);
      updateLocal();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      updateLocal();
    }
  };

  // --- Sessions CRUD ---

  const addSession = async (newSession: Omit<TrainingSession, 'id'>) => {
    const localSession = { ...newSession, id: crypto.randomUUID() } as TrainingSession;
    const updateLocal = (session: TrainingSession) => {
      setSessions(prev => {
        const updated = [session, ...prev];
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(localSession); return true; }
    try {
      const { data, error } = await supabase.from('sessions').insert([newSession]).select();
      if (error) throw error;
      if (data) updateLocal(data[0]);
    } catch (error) {
      console.error('Error adding session:', error);
      updateLocal(localSession);
    }
    return true;
  };

  const deleteSession = async (sessionId: string) => {
    const updateLocal = () => {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(); return; }
    try {
      await supabase.from('sessions').delete().eq('id', sessionId);
      updateLocal();
    } catch (error) {
      console.error('Error deleting session:', error);
      updateLocal();
    }
  };

  // --- Goalkeepers CRUD ---

  const addGoalkeeper = async (gk: Omit<Goalkeeper, 'id'>) => {
    const newGk = { ...gk, id: crypto.randomUUID() } as Goalkeeper;
    const updateLocal = (keeper: Goalkeeper) => {
      setGoalkeepers(prev => {
        const updated = [...prev, keeper];
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(newGk); return; }
    try {
      const { data, error } = await supabase.from('goalkeepers').insert([newGk]).select();
      if (error) throw error;
      if (data) updateLocal(data[0]);
    } catch (error) {
      console.error('Error adding goalkeeper:', error);
      updateLocal(newGk);
    }
  };

  const updateGoalkeeper = async (gk: Goalkeeper) => {
    const updateLocal = () => {
      setGoalkeepers(prev => {
        const updated = prev.map(k => k.id === gk.id ? gk : k);
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
    };
    updateLocal();
    if (!hasSupabaseConfig) return;
    try {
      await supabase.from('goalkeepers').update(gk).eq('id', gk.id);
    } catch (error) {
      console.error('Error updating goalkeeper:', error);
    }
  };

  const deleteGoalkeeper = async (gkId: string) => {
    const updateLocal = () => {
      setGoalkeepers(prev => {
        const updated = prev.filter(k => k.id !== gkId);
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(); return; }
    try {
      await supabase.from('goalkeepers').delete().eq('id', gkId);
      updateLocal();
    } catch (error) {
      console.error('Error deleting goalkeeper:', error);
      updateLocal();
    }
  };

  // --- Videos CRUD ---

  const addVideo = async (video: Omit<PerformanceVideo, 'id'>) => {
    const newVideo = { ...video, id: crypto.randomUUID() } as PerformanceVideo;
    const updateLocal = (v: PerformanceVideo) => {
      setVideos(prev => {
        const updated = [v, ...prev];
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(newVideo); return; }
    try {
      const { data, error } = await supabase.from('videos').insert([newVideo]).select();
      if (error) throw error;
      if (data) updateLocal(data[0]);
    } catch (error) {
      console.error('Error adding video:', error);
      updateLocal(newVideo);
    }
  };

  const deleteVideo = async (videoId: string) => {
    const updateLocal = () => {
      setVideos(prev => {
        const updated = prev.filter(v => v.id !== videoId);
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
    };
    if (!hasSupabaseConfig) { updateLocal(); return; }
    try {
      await supabase.from('videos').delete().eq('id', videoId);
      updateLocal();
    } catch (error) {
      console.error('Error deleting video:', error);
      updateLocal();
    }
  };

  return {
    goalkeepers,
    sessions,
    videos,
    exercisesLibrary,
    isLoading,
    addExerciseToLibrary,
    deleteExercise,
    addSession,
    deleteSession,
    addGoalkeeper,
    updateGoalkeeper,
    deleteGoalkeeper,
    addVideo,
    deleteVideo,
  };
}
