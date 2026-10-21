/**
 * Auth Service — single entry point for all authentication operations.
 *
 * Centralized session management ensuring "one login for the whole web":
 * - Persists session in localStorage & sessionStorage across all pages, tabs, and refreshes.
 * - Broadcasts auth state changes to all components.
 * - Provides rich mock user profiles and flexible login in dev/mock mode.
 */

import { supabase } from './supabase.js';
import { useState, useEffect } from 'react';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const USE_MOCK = env.VITE_USE_MOCK_API === 'true';
const BASE_URL = env.VITE_API_BASE_URL;

// Storage keys
const TOKEN_KEY = 'cp_auth_token';
const USER_KEY = 'cp_auth_user';
const AUTH_EVENT = 'intellistrata_auth_change';

// ---------- Helpers ----------

function persistSession(user, token, remember = true) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    // storage fallback
  }
}

// Supabase owns its session persistence. Keep only the display profile here;
// writing a Supabase access token ourselves would create a second token store.
function persistLiveUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    // storage fallback
  }
}

function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // storage fallback
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (e) {
    // storage fallback
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function notifyAuthChange(detail) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail }));
    } catch (e) {}
  }
}

// ---------- Mock Auth ----------

/** Simulated latency */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standard Mock users across the portal
 */
export const MOCK_USERS = [
  {
    id: 'usr_pasan',
    name: 'Pasan Udara',
    email: 'pasan.udara@example.com',
    unit: '101',
    role: 'Resident Owner',
    avatar: null,
  },
  {
    id: 'usr_alice',
    name: 'Alice Smith',
    email: 'alice@demo.com',
    unit: '101',
    role: 'Strata Committee Member',
    avatar: null,
  },
  {
    id: 'usr_bob',
    name: 'Bob Johnson',
    email: 'bob@demo.com',
    unit: '205',
    role: 'Strata Committee Member',
    avatar: null,
  },
  {
    id: 'usr_charlie',
    name: 'Charlie Brown',
    email: 'charlie@demo.com',
    unit: '304',
    role: 'Resident Owner',
    avatar: null,
  },
  {
    id: 'usr_admin',
    name: 'Admin Manager',
    email: 'admin@intellistrata.com',
    unit: '100',
    role: 'Strata Manager',
    avatar: null,
  },
];

export const MockAuth = {
  async login(username, password, rememberMe = true) {
    await delay(350);

    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername) {
      return { success: false, error: 'Username or email is required' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Password is required' };
    }

    const lowerInput = cleanUsername.toLowerCase();

    // Check if input matches any pre-configured mock user
    let user = MOCK_USERS.find(
      (u) =>
        u.name.toLowerCase() === lowerInput ||
        u.name.split(' ')[0].toLowerCase() === lowerInput ||
        u.email.toLowerCase() === lowerInput ||
        (lowerInput === 'admin' && u.role.toLowerCase().includes('manager')) ||
        (lowerInput === 'pasan' && u.name.toLowerCase().includes('pasan'))
    );

    // If not found in presets, create a valid session for the entered user
    if (!user) {
      const displayName = cleanUsername.includes('@')
        ? cleanUsername.split('@')[0].replace(/[._]/g, ' ')
        : cleanUsername;
      const formattedName = displayName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      user = {
        id: 'usr_' + Date.now(),
        name: formattedName || 'Portal Resident',
        email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername.toLowerCase()}@intellistrata.com`,
        unit: '101',
        role: 'Resident Owner',
        avatar: null,
      };
    }

    const token = 'jwt_token_' + user.id + '_' + Date.now();
    persistSession(user, token, rememberMe);
    notifyAuthChange({ isAuthenticated: true, user });

    return { success: true, user, token };
  },

  async loginWithOAuth(provider) {
    await delay(350);
    const providerName = (provider || 'Google').toLowerCase();
    const isGoogle = providerName.includes('google');
    const user = {
      id: isGoogle ? 'usr_oauth_google' : 'usr_oauth_ms',
      name: isGoogle ? 'Google Demo User' : 'Microsoft Demo User',
      email: isGoogle ? 'demo.google@intellistrata.com' : 'demo.microsoft@intellistrata.com',
      unit: '101',
      role: 'Resident Owner',
      avatar: null,
      provider: isGoogle ? 'google' : 'azure',
    };
    const token = `jwt_mock_${isGoogle ? 'google' : 'ms'}_${Date.now()}`;
    persistSession(user, token, true);
    notifyAuthChange({ isAuthenticated: true, user });
    return { success: true, user, token };
  },

  async handleAuthCallback() {
    await delay(150);
    const user = getStoredUser();
    return { success: true, user, isInvite: false };
  },

  async updatePassword(newPassword) {
    await delay(200);
    return { success: true, message: 'Password updated successfully!' };
  },

  async logout() {
    await delay(100);
    clearSession();
    notifyAuthChange({ isAuthenticated: false, user: null });
    return { success: true };
  },

  async forgotPassword(email) {
    await delay(300);
    return {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    };
  },

  async register(email, password, userData = {}) {
    await delay(300);
    // Public self-registration is disabled; portal is by invitation only
    return {
      success: false,
      error: 'Public registration is disabled. Community Portal access is by invitation only.',
    };
  },

  async signUp(email, password, userData = {}) {
    return this.register(email, password, userData);
  },

  isAuthenticated() {
    return !!getStoredToken();
  },

  getUser() {
    return getStoredUser();
  },

  getToken() {
    return getStoredToken();
  },

  onAuthChange(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e.detail);
    window.addEventListener(AUTH_EVENT, handler);
    const storageHandler = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        callback({ isAuthenticated: !!getStoredToken(), user: getStoredUser() });
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  },
};

// ---------- Supabase Auth (live backend) ----------

function formatSupabaseUser(sbUser) {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  const rawEmail =
    sbUser.email ||
    meta.email ||
    meta.preferred_username ||
    meta.upn ||
    '';
  const rawName =
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    meta.displayName ||
    (rawEmail ? rawEmail.split('@')[0].replace(/[._]/g, ' ') : 'Resident');
  const formattedName = rawName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: sbUser.id,
    name: formattedName || 'Resident',
    email: rawEmail,
    unit: meta.unit || '101',
    role: meta.role || 'Resident Owner',
    avatar: meta.avatar_url || meta.picture || meta.avatar || null,
    provider: sbUser.app_metadata?.provider || 'azure',
  };
}

let currentSession = null;
let currentUser = getStoredUser();

// Initialize Supabase session sync and listeners when in live mode
if (!USE_MOCK && typeof window !== 'undefined') {
  clearStoredToken();

  // Sync existing session on startup
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (session && !error) {
      currentSession = session;
      currentUser = formatSupabaseUser(session.user);
      persistLiveUser(currentUser);
      notifyAuthChange({ isAuthenticated: true, user: currentUser });
    } else {
      // If no session found and not currently in an OAuth callback flow, clear stale storage
      const hasAuthParams =
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=');
      if (!hasAuthParams && !session) {
        currentSession = null;
        currentUser = null;
        clearSession();
        notifyAuthChange({ isAuthenticated: false, user: null });
      }
    }
  }).catch(() => {});

  // Subscribe to Supabase auth events (sign in, sign out, token refresh)
  supabase.auth.onAuthStateChange((event, session) => {
    currentSession = session;
    if (session) {
      currentUser = formatSupabaseUser(session.user);
      persistLiveUser(currentUser);
      notifyAuthChange({ isAuthenticated: true, user: currentUser });
    } else if (event === 'SIGNED_OUT') {
      currentSession = null;
      currentUser = null;
      clearSession();
      notifyAuthChange({ isAuthenticated: false, user: null });
    }
  });
}

export const SupabaseAuth = {
  async login(username, password, rememberMe = true) {
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername) {
      return { success: false, error: 'Username or email is required' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Password is required' };
    }

    const email = cleanUsername.includes('@')
      ? cleanUsername
      : `${cleanUsername.toLowerCase()}@intellistrata.com`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.session) {
        return { success: false, error: 'Authentication succeeded but no session was returned.' };
      }

      currentSession = data.session;
      currentUser = formatSupabaseUser(data.user);
      persistLiveUser(currentUser);
      notifyAuthChange({ isAuthenticated: true, user: currentUser });

      return {
        success: true,
        user: currentUser,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Authentication error. Please check your connection.',
      };
    }
  },

  /**
   * OAuth Login with Google or Microsoft (Azure AD) via Supabase Auth
   * Redirects user to the identity provider and returns to /auth/callback
   */
  async loginWithOAuth(provider, options = {}) {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Window context is unavailable.' };
    }

    const rawProvider = (provider || '').trim().toLowerCase();
    let supabaseProvider = 'google';
    let scopes = undefined;

    if (rawProvider === 'microsoft' || rawProvider === 'azure' || rawProvider === 'ms') {
      supabaseProvider = 'azure';
      scopes = 'email offline_access openid profile';
    } else if (rawProvider === 'google') {
      supabaseProvider = 'google';
    } else {
      return { success: false, error: `Unsupported OAuth provider: ${provider}` };
    }

    const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback`;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo,
          scopes,
          queryParams: options.queryParams,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        if (error.message && (error.message.includes('not enabled') || error.message.includes('Unsupported provider'))) {
          return {
            success: false,
            error: `${provider} authentication is not enabled in your Supabase dashboard. Please go to Authentication -> Providers -> Azure and enable it with your Client ID & Secret.`,
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.url) {
        // Pre-check authorize URL status to give clear feedback instead of dumping user on raw JSON 400 page
        try {
          const preflight = await fetch(data.url, { method: 'GET', redirect: 'manual' });
          if (preflight.status >= 400) {
            const errBody = await preflight.json().catch(() => null);
            if (errBody?.msg && (errBody.msg.includes('not enabled') || errBody.msg.includes('Unsupported provider'))) {
              return {
                success: false,
                error: `Microsoft (Azure) sign-in is not yet enabled in your Supabase project (qttjnrsbbsucfbbxugeu). Please go to Supabase Dashboard -> Authentication -> Providers -> Azure and enable it with your Microsoft Entra App Client ID & Secret.`,
              };
            }
            if (errBody?.msg) {
              return { success: false, error: errBody.msg };
            }
          }
        } catch (e) {
          // If preflight is blocked by CORS/network, proceed with redirect as fallback
        }

        window.location.href = data.url;
      }

      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.message || `Failed to initiate ${provider} authentication.`,
      };
    }
  },

  /**
   * Handles OAuth redirects and restores Supabase session
   */
  async handleAuthCallback() {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Window context is unavailable.' };
    }

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Check for provider errors or user cancellation
    const errorDesc = params.get('error_description') || hashParams.get('error_description');
    const errorCode = params.get('error') || hashParams.get('error');

    if (errorCode || errorDesc) {
      const friendlyError = errorDesc
        ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        : (errorCode === 'access_denied' ? 'Sign in was cancelled.' : `Authentication failed (${errorCode})`);
      return { success: false, error: friendlyError };
    }

    try {
      const code = params.get('code');
      let session = null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.session) {
          session = data.session;
        }
      }

      // If code exchange did not set session or if hash token was used, getSession handles it
      if (!session) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          return { success: false, error: error.message };
        }
        session = data?.session || null;
      }

      if (session) {
        currentSession = session;
        currentUser = formatSupabaseUser(session.user);
        persistLiveUser(currentUser);
        notifyAuthChange({ isAuthenticated: true, user: currentUser });

        const isInvite =
          params.get('type') === 'invite' ||
          hashParams.get('type') === 'invite' ||
          window.location.hash.includes('type=invite');

        // Clean query/hash parameters from URL without page reload
        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {}

        return { success: true, user: currentUser, session, isInvite };
      }

      return {
        success: false,
        error: 'No active session returned after OAuth redirect.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Error processing authentication callback.',
      };
    }
  },

  /**
   * Updates password for the authenticated user (e.g. after accepting an invitation)
   */
  async updatePassword(newPassword) {
    const cleanPassword = (newPassword || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ password: cleanPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Password set successfully!' };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Unable to update password.',
      };
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore network errors during signout to guarantee clean local state
    }
    currentSession = null;
    currentUser = null;
    clearSession();
    notifyAuthChange({ isAuthenticated: false, user: null });
    return { success: true };
  },

  async forgotPassword(email) {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      return { success: false, error: 'Email is required', message: 'Email is required' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return { success: false, error: error.message, message: error.message };
      }
      return {
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Unable to send reset link.',
        message: err.message || 'Unable to send reset link.',
      };
    }
  },

  /**
   * Public registration is disabled per Intellistrata requirements.
   * Portal registration is strictly invitation-based.
   */
  async register(email, password, userData = {}) {
    return {
      success: false,
      error: 'Public registration is disabled. Community Portal access is by invitation only. Please contact your strata manager for an invitation.',
    };
  },

  async signUp(email, password, userData = {}) {
    return this.register(email, password, userData);
  },

  isAuthenticated() {
    // Synchronously truthy if in-memory session exists OR a persisted user profile exists
    return !!(currentSession?.access_token || getStoredUser());
  },

  getUser() {
    return currentUser || getStoredUser();
  },

  async getToken() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        currentSession = null;
        currentUser = null;
        clearSession();
        notifyAuthChange({ isAuthenticated: false, user: null });
        return null;
      }

      const session = data.session;
      currentSession = session;

      if (!session?.access_token) {
        currentUser = null;
        clearSession();
        notifyAuthChange({ isAuthenticated: false, user: null });
        return null;
      }

      currentUser = formatSupabaseUser(session.user);
      persistLiveUser(currentUser);
      return session.access_token;
    } catch (err) {
      currentSession = null;
      currentUser = null;
      clearSession();
      notifyAuthChange({ isAuthenticated: false, user: null });
      return null;
    }
  },

  onAuthChange(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e.detail);
    window.addEventListener(AUTH_EVENT, handler);
    const storageHandler = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        callback({
          isAuthenticated: !!(currentSession?.access_token || getStoredUser()),
          user: currentUser || getStoredUser(),
        });
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  },
};

// ---------- React hook for reactive auth state ----------

/**
 * useCurrentUser — React hook that returns the currently logged-in user object
 * and re-renders components whenever auth state changes (login, logout, OAuth).
 *
 * Provides a consistent, reactive user data source across ALL portal pages.
 * Falls back to a neutral guest profile if no session is active.
 *
 * @returns {{ user: object, isAuthenticated: boolean }}
 */
export function useCurrentUser() {
  const [authState, setAuthState] = useState(() => {
    const u = authService.getUser();
    return { user: u, isAuthenticated: !!u };
  });

  useEffect(() => {
    // Subscribe to auth changes (login, logout, OAuth callback)
    const unsubscribe = authService.onAuthChange((detail) => {
      setAuthState({
        user: detail?.user || null,
        isAuthenticated: !!detail?.user,
      });
    });

    // Also re-check on mount to pick up any session already in storage
    const u = authService.getUser();
    setAuthState({ user: u, isAuthenticated: !!u });

    return unsubscribe;
  }, []);

  return authState;
}

// ---------- Export ----------

export const authService = USE_MOCK ? MockAuth : SupabaseAuth;
export default authService;
