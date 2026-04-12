import { useState, useEffect, useCallback } from 'react';
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

  // --- Load all data ---
  const fetchAll = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setGoalkeepers(loadFromStorage<Goalkeeper>(STORAGE_KEYS.goalkeepers));
      setSessions(loadFromStorage<TrainingSession>(STORAGE_KEYS.sessions));
      setVideos(loadFromStorage<PerformanceVideo>(STORAGE_KEYS.videos));
      setExercisesLibrary(loadFromStorage<Exercise>(STORAGE_KEYS.exercises));
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

      if (gkRes.data) {
        setGoalkeepers(gkRes.data);
        saveToStorage(STORAGE_KEYS.goalkeepers, gkRes.data);
      }
      if (sessRes.data) {
        setSessions(sessRes.data);
        saveToStorage(STORAGE_KEYS.sessions, sessRes.data);
      }
      if (vidRes.data) {
        setVideos(vidRes.data);
        saveToStorage(STORAGE_KEYS.videos, vidRes.data);
      }
      if (exRes.data) {
        setExercisesLibrary(exRes.data);
        saveToStorage(STORAGE_KEYS.exercises, exRes.data);
      }

      // Log any errors
      [gkRes, sessRes, vidRes, exRes].forEach((res, i) => {
        if (res.error) {
          const tables = ['goalkeepers', 'sessions', 'videos', 'exercises'];
          console.error(`Error fetching ${tables[i]}:`, res.error);
        }
      });
    } catch (error) {
      console.error('Error loading data from Supabase, falling back to cache:', error);
      setGoalkeepers(loadFromStorage<Goalkeeper>(STORAGE_KEYS.goalkeepers));
      setSessions(loadFromStorage<TrainingSession>(STORAGE_KEYS.sessions));
      setVideos(loadFromStorage<PerformanceVideo>(STORAGE_KEYS.videos));
      setExercisesLibrary(loadFromStorage<Exercise>(STORAGE_KEYS.exercises));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Exercises CRUD ---

  const addExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>) => {
    if (!hasSupabaseConfig) {
      const local = { ...exercise, id: crypto.randomUUID() } as Exercise;
      setExercisesLibrary(prev => {
        const updated = [local, ...prev];
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
      return;
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert([exercise])
      .select();

    if (error) {
      console.error('Error adding exercise:', error);
      return;
    }
    if (data) {
      setExercisesLibrary(prev => {
        const updated = [data[0], ...prev];
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
    }
  };

  const updateExercise = async (exercise: Exercise) => {
    if (!hasSupabaseConfig) {
      setExercisesLibrary(prev => {
        const updated = prev.map(e => e.id === exercise.id ? exercise : e);
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
      return;
    }

    const { id, ...rest } = exercise;
    const { error } = await supabase.from('exercises').update(rest).eq('id', id);
    if (error) {
      console.error('Error updating exercise:', error);
      return;
    }
    setExercisesLibrary(prev => {
      const updated = prev.map(e => e.id === id ? exercise : e);
      saveToStorage(STORAGE_KEYS.exercises, updated);
      return updated;
    });
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!hasSupabaseConfig) {
      setExercisesLibrary(prev => {
        const updated = prev.filter(e => e.id !== exerciseId);
        saveToStorage(STORAGE_KEYS.exercises, updated);
        return updated;
      });
      return;
    }

    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
    if (error) {
      console.error('Error deleting exercise:', error);
      return;
    }
    setExercisesLibrary(prev => {
      const updated = prev.filter(e => e.id !== exerciseId);
      saveToStorage(STORAGE_KEYS.exercises, updated);
      return updated;
    });
  };

  // --- Sessions CRUD ---

  const addSession = async (newSession: Omit<TrainingSession, 'id'>) => {
    if (!hasSupabaseConfig) {
      const local = { ...newSession, id: crypto.randomUUID() } as TrainingSession;
      setSessions(prev => {
        const updated = [local, ...prev];
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
      return true;
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([newSession])
      .select();

    if (error) {
      console.error('Error adding session:', error);
      return false;
    }
    if (data) {
      setSessions(prev => {
        const updated = [data[0], ...prev];
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
    }
    return true;
  };

  const updateSession = async (session: TrainingSession) => {
    if (!hasSupabaseConfig) {
      setSessions(prev => {
        const updated = prev.map(s => s.id === session.id ? session : s);
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
      return;
    }

    const { id, ...rest } = session;
    const { error } = await supabase.from('sessions').update(rest).eq('id', id);
    if (error) {
      console.error('Error updating session:', error);
      return;
    }
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? session : s);
      saveToStorage(STORAGE_KEYS.sessions, updated);
      return updated;
    });
  };

  const deleteSession = async (sessionId: string) => {
    if (!hasSupabaseConfig) {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        saveToStorage(STORAGE_KEYS.sessions, updated);
        return updated;
      });
      return;
    }

    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) {
      console.error('Error deleting session:', error);
      return;
    }
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveToStorage(STORAGE_KEYS.sessions, updated);
      return updated;
    });
  };

  // --- Goalkeepers CRUD ---

  const addGoalkeeper = async (gk: Omit<Goalkeeper, 'id'>) => {
    if (!hasSupabaseConfig) {
      const local = { ...gk, id: crypto.randomUUID() } as Goalkeeper;
      setGoalkeepers(prev => {
        const updated = [...prev, local];
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
      return;
    }

    const { data, error } = await supabase
      .from('goalkeepers')
      .insert([gk])
      .select();

    if (error) {
      console.error('Error adding goalkeeper:', error);
      return;
    }
    if (data) {
      setGoalkeepers(prev => {
        const updated = [...prev, data[0]];
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
    }
  };

  const updateGoalkeeper = async (gk: Goalkeeper) => {
    if (!hasSupabaseConfig) {
      setGoalkeepers(prev => {
        const updated = prev.map(k => k.id === gk.id ? gk : k);
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
      return;
    }

    const { id, ...rest } = gk;
    const { error } = await supabase.from('goalkeepers').update(rest).eq('id', id);
    if (error) {
      console.error('Error updating goalkeeper:', error);
      return;
    }
    setGoalkeepers(prev => {
      const updated = prev.map(k => k.id === id ? gk : k);
      saveToStorage(STORAGE_KEYS.goalkeepers, updated);
      return updated;
    });
  };

  const deleteGoalkeeper = async (gkId: string) => {
    if (!hasSupabaseConfig) {
      setGoalkeepers(prev => {
        const updated = prev.filter(k => k.id !== gkId);
        saveToStorage(STORAGE_KEYS.goalkeepers, updated);
        return updated;
      });
      return;
    }

    const { error } = await supabase.from('goalkeepers').delete().eq('id', gkId);
    if (error) {
      console.error('Error deleting goalkeeper:', error);
      return;
    }
    setGoalkeepers(prev => {
      const updated = prev.filter(k => k.id !== gkId);
      saveToStorage(STORAGE_KEYS.goalkeepers, updated);
      return updated;
    });
  };

  // --- Videos CRUD ---

  const addVideo = async (video: Omit<PerformanceVideo, 'id'>) => {
    if (!hasSupabaseConfig) {
      const local = { ...video, id: crypto.randomUUID() } as PerformanceVideo;
      setVideos(prev => {
        const updated = [local, ...prev];
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
      return;
    }

    const { data, error } = await supabase
      .from('videos')
      .insert([video])
      .select();

    if (error) {
      console.error('Error adding video:', error);
      return;
    }
    if (data) {
      setVideos(prev => {
        const updated = [data[0], ...prev];
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
    }
  };

  const updateVideo = async (video: PerformanceVideo) => {
    if (!hasSupabaseConfig) {
      setVideos(prev => {
        const updated = prev.map(v => v.id === video.id ? video : v);
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
      return;
    }

    const { id, ...rest } = video;
    const { error } = await supabase.from('videos').update(rest).eq('id', id);
    if (error) {
      console.error('Error updating video:', error);
      return;
    }
    setVideos(prev => {
      const updated = prev.map(v => v.id === id ? video : v);
      saveToStorage(STORAGE_KEYS.videos, updated);
      return updated;
    });
  };

  const deleteVideo = async (videoId: string) => {
    if (!hasSupabaseConfig) {
      setVideos(prev => {
        const updated = prev.filter(v => v.id !== videoId);
        saveToStorage(STORAGE_KEYS.videos, updated);
        return updated;
      });
      return;
    }

    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) {
      console.error('Error deleting video:', error);
      return;
    }
    setVideos(prev => {
      const updated = prev.filter(v => v.id !== videoId);
      saveToStorage(STORAGE_KEYS.videos, updated);
      return updated;
    });
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
