
import React, { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { UserProfile } from '../types';

export const useRealtimeSync = (
  currentUser: string | null,
  setUsers: React.Dispatch<React.SetStateAction<Record<string, UserProfile>>>
) => {
  useEffect(() => {
    if (!currentUser) return;

    let channel: any = null;
    let isMounted = true;

    const setupSubscription = async () => {
      // Get the authenticated user's UUID to subscribe to their specific row
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!isMounted) return; // Cleanup check
      if (!user) return;

      channel = supabase
        .channel('realtime-profile-sync')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // We listen for updates to the monolithic profile JSON
            schema: 'public',
            table: 'user_profiles',
            filter: `id=eq.${user.id}`, // CRITICAL: Only listen to this user's data
          },
          (payload) => {
            const newRecord = payload.new as { username: string; profile_data: UserProfile };
            
            if (newRecord && newRecord.profile_data) {
              console.log('Realtime: Cloud profile update received.');
              
              setUsers((prev) => {
                const currentProfile = prev[newRecord.username];
                const incomingProfile = newRecord.profile_data;

                // Deep equality check to prevent infinite loops with local 'syncUserToCloud'
                if (JSON.stringify(currentProfile) === JSON.stringify(incomingProfile)) {
                  return prev;
                }

                return {
                  ...prev,
                  [newRecord.username]: incomingProfile
                };
              });
            }
          }
        )
        .subscribe((status) => {
           if (status === 'SUBSCRIBED') {
               console.log('Realtime channel active.');
           }
        });
    };

    setupSubscription();

    // Cleanup subscription on unmount or user change
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser, setUsers]);
};
