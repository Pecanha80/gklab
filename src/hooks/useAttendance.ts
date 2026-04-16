import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Attendance, AttendanceStatus, Goalkeeper } from '../types';
import { categoriesMatch } from '../lib/categoryMatch';
import { useAuth } from './useAuth';

export function useAttendance(sessionId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [eligibleGoalkeepers, setEligibleGoalkeepers] = useState<Goalkeeper[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = useCallback(async (category?: string | string[]) => {
    if (!sessionId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', sessionId);

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);

      const { data: gkData, error: gkError } = await supabase.from('goalkeepers').select('*');
      if (gkError) throw gkError;

      const allGks = gkData || [];
      if (category && allGks.length > 0) {
        const sessionCats = Array.isArray(category) ? category : [category];
        const filtered = allGks.filter(gk =>
          gk.category && categoriesMatch(sessionCats, gk.category)
        );
        setEligibleGoalkeepers(filtered.length > 0 ? filtered : allGks);
      } else {
        setEligibleGoalkeepers(allGks);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  const updateAttendance = async (
    goalkeeperId: string,
    status: AttendanceStatus,
    notes?: string,
    rpe?: number
  ) => {
    if (!user) return;

    try {
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        goalkeeper_id: goalkeeperId,
        status,
        notes,
        user_id: user.id,
      };
      if (rpe !== undefined) payload.rpe = rpe;

      const { data, error: upsertError } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'session_id,goalkeeper_id' })
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

  const updateRpe = async (goalkeeperId: string, rpe: number) => {
    const existing = attendance.find(a => a.goalkeeper_id === goalkeeperId);
    const status = existing?.status || 'present';
    const notes = existing?.notes;
    return updateAttendance(goalkeeperId, status, notes, rpe);
  };

  const bulkUpdateAttendance = async (
    updates: Array<{ goalkeeperId: string; status: AttendanceStatus; notes?: string }>
  ) => {
    if (!user) return;

    try {
      const formattedUpdates = updates.map(u => ({
        session_id: sessionId,
        goalkeeper_id: u.goalkeeperId,
        status: u.status,
        notes: u.notes,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .upsert(formattedUpdates, { onConflict: 'session_id,goalkeeper_id' })
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
    updateRpe,
    bulkUpdateAttendance,
  };
}
