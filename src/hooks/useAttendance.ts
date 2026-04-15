import { useState, useCallback } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { Attendance, AttendanceStatus, Goalkeeper } from '../types';

const STORAGE_KEYS = {
  attendance: 'gk_attendance',
  goalkeepers: 'gk_goalkeepers',
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

function saveAttendanceToStorage(data: Attendance[]) {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(data));
}

export function useAttendance(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [eligibleGoalkeepers, setEligibleGoalkeepers] = useState<Goalkeeper[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = useCallback(async (category?: string | string[]) => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    if (!hasSupabaseConfig) {
      const allAttendance = loadFromStorage<Attendance>(STORAGE_KEYS.attendance);
      setAttendance(allAttendance.filter(a => a.session_id === sessionId));

      const allGks = loadFromStorage<Goalkeeper>(STORAGE_KEYS.goalkeepers);
      if (category) {
        const cats = Array.isArray(category) ? category : [category];
        setEligibleGoalkeepers(cats.length > 0 ? allGks.filter(gk => cats.includes(gk.category)) : allGks);
      } else {
        setEligibleGoalkeepers(allGks);
      }
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch current attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', sessionId);

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);

      // 2. Fetch eligible goalkeepers
      let query = supabase.from('goalkeepers').select('*');

      // If category is provided, filter by it
      if (category) {
        if (Array.isArray(category)) {
          if (category.length > 0) {
            query = query.in('category', category);
          }
        } else {
          query = query.eq('category', category);
        }
      }

      const { data: gkData, error: gkError } = await query;
      if (gkError) throw gkError;
      setEligibleGoalkeepers(gkData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updateAttendance = async (
    goalkeeperId: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    if (!hasSupabaseConfig) {
      const allAttendance = loadFromStorage<Attendance>(STORAGE_KEYS.attendance);
      const index = allAttendance.findIndex(
        a => a.session_id === sessionId && a.goalkeeper_id === goalkeeperId
      );
      const record: Attendance = {
        id: index >= 0 ? allAttendance[index].id : crypto.randomUUID(),
        session_id: sessionId,
        goalkeeper_id: goalkeeperId,
        status,
        notes,
      } as Attendance;

      if (index >= 0) {
        allAttendance[index] = record;
      } else {
        allAttendance.push(record);
      }
      saveAttendanceToStorage(allAttendance);

      setAttendance(prev => {
        const idx = prev.findIndex(a => a.goalkeeper_id === goalkeeperId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = record;
          return updated;
        }
        return [...prev, record];
      });

      return record;
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('attendance')
        .upsert({
          session_id: sessionId,
          goalkeeper_id: goalkeeperId,
          status,
          notes,
        }, {
          onConflict: 'session_id,goalkeeper_id'
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      setAttendance(prev => {
        const index = prev.findIndex(a => a.goalkeeper_id === goalkeeperId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const bulkUpdateAttendance = async (
    updates: Array<{ goalkeeperId: string; status: AttendanceStatus; notes?: string }>
  ) => {
    if (!hasSupabaseConfig) {
      const allAttendance = loadFromStorage<Attendance>(STORAGE_KEYS.attendance);
      const sessionRecords: Attendance[] = [];

      for (const u of updates) {
        const index = allAttendance.findIndex(
          a => a.session_id === sessionId && a.goalkeeper_id === u.goalkeeperId
        );
        const record: Attendance = {
          id: index >= 0 ? allAttendance[index].id : crypto.randomUUID(),
          session_id: sessionId,
          goalkeeper_id: u.goalkeeperId,
          status: u.status,
          notes: u.notes,
        } as Attendance;

        if (index >= 0) {
          allAttendance[index] = record;
        } else {
          allAttendance.push(record);
        }
        sessionRecords.push(record);
      }
      saveAttendanceToStorage(allAttendance);
      setAttendance(sessionRecords);
      return sessionRecords;
    }

    try {
      const formattedUpdates = updates.map(u => ({
        session_id: sessionId,
        goalkeeper_id: u.goalkeeperId,
        status: u.status,
        notes: u.notes,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .upsert(formattedUpdates, {
          onConflict: 'session_id,goalkeeper_id'
        })
        .select();

      if (error) throw error;
      setAttendance(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    attendance,
    eligibleGoalkeepers,
    error,
    fetchAttendanceData,
    updateAttendance,
    bulkUpdateAttendance,
  };
}
