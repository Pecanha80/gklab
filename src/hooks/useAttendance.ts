import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Attendance, AttendanceStatus, Goalkeeper } from '../types';

export function useAttendance(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [eligibleGoalkeepers, setEligibleGoalkeepers] = useState<Goalkeeper[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = useCallback(async (category?: string | string[]) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
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
