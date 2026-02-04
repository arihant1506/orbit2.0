
import { supabase } from './supabase';
import { UserProfile, WeekSchedule, UniversitySchedule } from '../types';
import { INITIAL_SCHEDULE, UNI_SCHEDULE, BLANK_UNI_SCHEDULE, BLANK_SCHEDULE } from '../constants';

// Helper to map usernames to emails for Supabase Auth
const getEmail = (username: string) => `${username.toLowerCase().replace(/\s/g, '')}@orbit.local`;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

// --- DEBUG CONNECTION ---
export const testDatabaseConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "You are not logged in." };

    try {
        const { error } = await supabase
            .from('user_profiles')
            .upsert({ 
                id: user.id, 
                last_synced: new Date().toISOString() 
            }, { onConflict: 'id' })
            .select();

        if (error) {
            console.error("DB Test Failed:", error);
            return { success: false, message: `DB Error: ${error.message}` };
        }
        return { success: true, message: "Connection Successful! Database is writable." };
    } catch (e: any) {
        return { success: false, message: `Network Error: ${e.message}` };
    }
};

// --- PROFILE HYDRATION & MIGRATION ---
const hydrateProfile = (profile: UserProfile): UserProfile => {
  // 1. Robust Merge Schedule
  // Use spread syntax to prioritize DB data over defaults.
  // This ensures persisted slots are not lost during hydration.
  const safeSchedule: WeekSchedule = {
      ...JSON.parse(JSON.stringify(BLANK_SCHEDULE)),
      ...(profile.schedule || {})
  };

  // 2. Robust Merge Academic Schedule
  const safeAcademic: UniversitySchedule = {
      ...JSON.parse(JSON.stringify(BLANK_UNI_SCHEDULE)),
      ...(profile.academicSchedule || {})
  };

  const defaults = {
    notes: [],
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
    schedule: safeSchedule,
    academicSchedule: safeAcademic,
    notes: profile.notes || defaults.notes,
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

  // REMOVED: The logic that forced 'arihant' to always reset to INITIAL_SCHEDULE.
  // This allows the owner account to save/persist changes like any other user.

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
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
      console.warn("Cannot sync: No authenticated user session.");
      return { success: false, error: "No session" };
  }

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.id,
        username: user.username,
        profile_data: user,
        last_synced: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error("Cloud Sync Failed:", error.message, error.details);
      return { success: false, error: error.message };
    } else {
      return { success: true };
    }
  } catch (e: any) {
      console.error("Cloud Sync Exception:", e);
      return { success: false, error: e.message };
  }
};

export const getUserFromCloud = async (username: string): Promise<UserProfile | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
      console.warn("[Cloud] Fetch aborted: No user session.");
      return null;
  }

  try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('id', authUser.id)
        .maybeSingle(); 

      if (error) {
        console.error("Critical DB Fetch Error:", error);
        throw new Error(error.message);
      }

      if (data && data.profile_data) {
        const hydratedProfile = hydrateProfile(data.profile_data as UserProfile);
        return hydratedProfile;
      }
      
      return null; 
  } catch (e) {
      console.error("Profile fetch exception:", e);
      throw e; 
  }
};

// --- USER ACTIONS ---

export const deleteCurrentUser = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  console.log("Attempting Permanent Account Deletion via RPC...");

  const { error: rpcError } = await supabase.rpc('delete_user_account');

  if (rpcError) {
    console.error("RPC Delete Failed:", rpcError.message);
    const { error: tableError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id);
      
    if (tableError) {
        console.error("Fallback Profile Delete Failed:", tableError.message);
        return false;
    }
  } 

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
