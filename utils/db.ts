
import { UserProfile } from '../types';

// =========================================================================
// CUSTOM BACKEND CONFIGURATION
// -------------------------------------------------------------------------
// If running locally, use http://localhost:3000
// If hosted on a VPS, use https://your-domain.com/api
// =========================================================================

// Safely access env vars
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3000';

let authToken: string | null = localStorage.getItem('orbit_jwt');
let isOfflineMode = false; // Flag to track connection status

/**
 * Helper to check local storage for users (Fallback mechanism)
 */
const getLocalUsers = (): Record<string, UserProfile> => {
  try {
    const saved = localStorage.getItem('orbit_users');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Helper to handle API requests with Offline Fallback
 */
async function apiRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: any) {
  // If we already detected the server is down, skip network request
  if (isOfflineMode) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 || res.status === 403) {
      if (res.status === 403 && endpoint.includes('admin')) {
          console.warn("Admin access denied");
          return null;
      }
      console.warn("Auth token invalid or expired");
      localStorage.removeItem('orbit_jwt');
      return null;
    }

    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }

    return await res.json();
  } catch (e: any) {
    // Check if it's a network connectivity error
    if (e.name === 'TypeError' || e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      if (!isOfflineMode) {
        // Use console.info or console.log to avoid scary red/yellow warnings for standard offline behavior
        console.info(`[Orbit] Backend unavailable at ${API_URL}. Operating in Offline Mode (Local Storage).`);
        isOfflineMode = true;
      }
      return null;
    }
    console.error(`[API] Request failed to ${endpoint}:`, e);
    return null;
  }
}

// --- AUTHENTICATION ---

export const loginUser = async (username: string, password?: string): Promise<boolean> => {
  if (!password) return false;

  // 1. Try API
  const data = await apiRequest('/auth/login', 'POST', { username, password });
  
  if (data && data.token) {
    authToken = data.token;
    localStorage.setItem('orbit_jwt', data.token);
    return true;
  }

  // 2. Fallback: Local Storage Check (Offline Mode)
  if (isOfflineMode) {
    const users = getLocalUsers();
    const user = users[username];
    if (user && user.password === password) {
      console.debug(`[Offline] Login successful: ${username}`);
      return true;
    }
  }

  return false;
};

export const registerUser = async (username: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    // 1. Try API
    const data = await apiRequest('/auth/register', 'POST', { username, password });
    
    if (data) {
        return await loginUser(username, password);
    }

    // 2. Fallback: Local Storage (Offline Mode)
    if (isOfflineMode) {
        console.debug(`[Offline] Registration simulated: ${username}`);
        return true;
    }

    return false;
};

// --- DATA SYNC ---

export const syncUserToCloud = async (user: UserProfile) => {
    if (isOfflineMode) return;
    if (!authToken) return;
    await apiRequest('/sync', 'POST', user);
    console.debug(`[Cloud] Synced: ${user.username}`);
};

export const getUserFromCloud = async (username: string): Promise<UserProfile | null> => {
    if (isOfflineMode) return null;
    if (!authToken) return null;
    
    const data = await apiRequest('/sync', 'GET');
    
    if (data) {
        console.debug(`[Cloud] Loaded profile for: ${username}`);
        return data as UserProfile;
    }
    
    return null;
};

// --- ADMIN FUNCTIONS ---

export const getGlobalUsers = async (): Promise<UserProfile[]> => {
    if (isOfflineMode) return [];
    if (!authToken) return [];
    
    const data = await apiRequest('/admin/users', 'GET');
    return data || [];
};

export const deleteGlobalUser = async (username: string): Promise<boolean> => {
    if (isOfflineMode) return false;
    if (!authToken) return false;
    
    const data = await apiRequest(`/admin/users/${username}`, 'DELETE');
    return !!data;
};
