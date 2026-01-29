
import { supabase } from './supabase';
import { UserProfile } from '../types';
import { INITIAL_SCHEDULE, UNI_SCHEDULE, BLANK_UNI_SCHEDULE } from '../constants';

// Helper to map usernames to emails for Supabase Auth
const getEmail = (username: string) => `${username.toLowerCase().replace(/\s/g, '')}@orbit.local`;

interface AuthResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Helper to sanitize Supabase errors for humans
const mapSupabaseError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Invalid username or password.';
  if (m.includes('rate limit')) return 'Server busy (Rate Limit). Try again later.';
  if (m.includes('user already registered')) return 'Username taken. Please login.';
  if (m.includes('email not confirmed')) return 'Email confirmation required.';
  return message;
};

// --- PROFILE HYDRATION & MIGRATION ---
const hydrateProfile = (profile: UserProfile): UserProfile => {
  const defaults = {
    notes: [],
    academicSchedule: JSON.parse(JSON.stringify(BLANK_UNI_SCHEDULE)),
    preferences: { 
        theme: 'dark' as const, 
        startOfWeek: 'Monday' as const, 
        timeFormat: '12h' as const, 
        notifications: { water: true, schedule: true, academic: true }
    },
    waterConfig: { dailyGoal: 3, adaptiveMode: true, lastDate: new Date().toDateString(), progress: [] }
  };

  const hydrated: UserProfile = {
    ...profile,
    notes: profile.notes || defaults.notes,
    academicSchedule: profile.academicSchedule || defaults.academicSchedule,
    waterConfig: profile.waterConfig || defaults.waterConfig,
    preferences: {
        ...defaults.preferences,
        ...(profile.preferences || {}),
        notifications: {
            ...defaults.preferences.notifications,
            ...(profile.preferences?.notifications || {})
        }
    }
  };

  if (hydrated.username.toLowerCase() === 'arihant') {
      console.debug("[Hydration] Force-updating Owner Schedule from Code Constants");
      hydrated.schedule = JSON.parse(JSON.stringify(INITIAL_SCHEDULE));
      hydrated.academicSchedule = JSON.parse(JSON.stringify(UNI_SCHEDULE));
  }

  return hydrated;
};

// --- AUTHENTICATION ---

export const loginUser = async (username: string, password?: string): Promise<AuthResult> => {
  if (!password) return { success: false, error: "Password required" };
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: getEmail(username),
      password
    });

    if (error) {
      console.warn("Supabase Login Warning:", error.message);
      return { success: false, error: mapSupabaseError(error.message) };
    }
    
    if (data.session) {
      localStorage.setItem('orbit_jwt', data.session.access_token);
    }
    return { success: true, data };
  } catch (e: any) {
    console.error("Login Exception", e);
    return { success: false, error: "Connection error. Check network." };
  }
};

export const registerUser = async (username: string, password?: string): Promise<AuthResult> => {
  if (!password) return { success: false, error: "Password required" };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: getEmail(username),
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      console.warn("Supabase Register Warning:", error.message);
      return { success: false, error: mapSupabaseError(error.message) };
    }

    if (data.user && !data.session) {
      return { success: true, error: "Please confirm your email address" };
    }

    return { success: !!data.user, data };
  } catch (e: any) {
    console.error("Register Exception", e);
    return { success: false, error: "Registration failed. Check network." };
  }
};

// --- DATA SYNC ---

export const syncUserToCloud = async (user: UserProfile) => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return;

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: authUser.id,
      username: user.username,
      profile_data: user,
      last_synced: new Date().toISOString()
    });

  if (error) {
    console.error("Cloud Sync Failed:", error.message);
  } else {
    console.debug(`[Cloud] Synced: ${user.username}`);
  }
};

export const getUserFromCloud = async (username: string): Promise<UserProfile | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile_data')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.warn("Profile fetch warning:", error.message);
    return null;
  }

  if (data && data.profile_data) {
    const hydratedProfile = hydrateProfile(data.profile_data as UserProfile);
    if (JSON.stringify(hydratedProfile) !== JSON.stringify(data.profile_data)) {
        syncUserToCloud(hydratedProfile);
    }
    return hydratedProfile;
  }
  
  return null;
};

// --- USER ACTIONS ---

export const deleteCurrentUser = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  console.log("Attempting Permanent Account Deletion via RPC...");

  // 1. Try to delete the Auth User via RPC (Permanent Delete)
  const { error: rpcError } = await supabase.rpc('delete_user_account');

  if (rpcError) {
    console.error("RPC Delete Failed:", rpcError.message);
    console.warn("Falling back to profile deletion. Note: Account might remain in Auth if SQL script was not run.");

    // 2. Fallback: Delete just the profile data if RPC missing
    const { error: tableError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id);
      
    if (tableError) {
        console.error("Fallback Profile Delete Failed:", tableError.message);
        return false;
    }
  } else {
     console.log("Account permanently deleted via RPC.");
  }

  // Clear session regardless of method
  await supabase.auth.signOut();
  return true;
};

// --- ADMIN FUNCTIONS ---

export const getGlobalUsers = async (): Promise<UserProfile[]> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile_data');
    
  if (error) {
    console.error("Admin Fetch Error:", error.message);
    return [];
  }

  if (data) {
    return data.map((row: any) => hydrateProfile(row.profile_data));
  }
  return [];
};

export const deleteGlobalUser = async (username: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) return false;

  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', profile.id);

  return !error;
};
