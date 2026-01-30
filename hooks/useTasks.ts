
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  category?: string; // Optional: Match your schema
  description?: string;
}

export const useTasks = (userId: string | null | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
        setTasks([]);
        setLoading(false);
        return;
    }

    // 1. Fetch Initial Data (Persistence)
    // Ensures data is visible immediately on mount/login
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // 2. Realtime Sync Subscription
    const channel = supabase
      .channel('realtime-tasks-hook')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Handle Realtime Events
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 3. Helper Functions (Data Safety)
  
  const addTask = async (title: string, category: string = 'General') => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{ user_id: userId, title, category, is_completed: false }]);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;
    try {
      // Optimistic Update (Optional: Update UI immediately before server confirms)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) {
          // Rollback if needed, or rely on fetch
          throw error;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;
    try {
      // Optimistic Delete
      setTasks(prev => prev.filter(t => t.id !== id));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { tasks, addTask, updateTask, deleteTask, loading, error };
};
