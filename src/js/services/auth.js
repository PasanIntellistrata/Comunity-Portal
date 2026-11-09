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
import userMapping from '../../../supabase/seed/user-mapping.json' with { type: 'json' };

const USERNAME_LOOKUP = {};
if (Array.isArray(userMapping)) {
  for (const u of userMapping) {
    if (u.username && u.email) {
      USERNAME_LOOKUP[u.username.toLowerCase().trim()] = u.email.trim();
    }
  }
}

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
    if (user?.propertyId) {
      localStorage.setItem('intellistrata_selected_property_id', user.propertyId);
    }
    if (user?.lotNumber || user?.lotId) {
      localStorage.setItem('intellistrata_selected_lot', user.lotNumber || user.lotId);
    }
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
    if (user?.propertyId) {
      localStorage.setItem('intellistrata_selected_property_id', user.propertyId);
    }
    if (user?.lotNumber || user?.lotId) {
      localStorage.setItem('intellistrata_selected_lot', user.lotNumber || user.lotId);
    }
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
    localStorage.removeItem('intellistrata_selected_property_id');
    localStorage.removeItem('intellistrata_selected_lot');
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
    } catch (e) { }
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
    username: 'resident.owner',
    name: 'Pasan Udara',
    email: 'resident.owner@intellistrata.test',
    unit: '101',
    role: 'Resident Owner',
    propertyId: 'prop-1',
    propertyName: 'Green Valley Residence',
    lotId: 'Lot A-03',
    lotNumber: 'Lot A-03',
    avatar: null,
  },
  {
    id: 'usr_alice',
    username: 'committee.member',
    name: 'Alice Smith',
    email: 'committee.member@intellistrata.test',
    unit: '205',
    role: 'Strata Committee Member',
    propertyId: 'prop-1',
    propertyName: 'Green Valley Residence',
    lotId: 'Lot A-01',
    lotNumber: 'Lot A-01',
    avatar: null,
  },
  {
    id: 'usr_bob',
    username: 'bob',
    name: 'Bob Johnson',
    email: 'bob@demo.com',
    unit: '205',
    role: 'Strata Committee Member',
    propertyId: 'prop-1',
    propertyName: 'Green Valley Residence',
    lotId: 'Lot B-01',
    lotNumber: 'Lot B-01',
    avatar: null,
  },
  {
    id: 'usr_charlie',
    username: 'charlie',
    name: 'Charlie Brown',
    email: 'charlie@demo.com',
    unit: '304',
    role: 'Resident Owner',
    propertyId: 'prop-1',
    propertyName: 'Green Valley Residence',
    lotId: 'Lot B-02',
    lotNumber: 'Lot B-02',
    avatar: null,
  },
  {
    id: 'usr_admin',
    username: 'strata.manager',
    name: 'Admin Manager',
    email: 'strata.manager@intellistrata.test',
    unit: '100',
    role: 'Strata Manager',
    propertyId: 'prop-1',
    propertyName: 'Green Valley Residence',
    lotId: 'All Lots',
    lotNumber: 'All Lots',
    avatar: null,
  },
];

// ---------- Linked Accounts & SSO Access Control Helpers ----------

const LINKED_ACCOUNTS_KEY = 'intellistrata_linked_sso_accounts';

export function getSavedLinkedAccounts() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LINKED_ACCOUNTS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLinkedAccounts(userId, accounts) {
  try {
    if (typeof localStorage === 'undefined' || !userId) return;
    const all = getSavedLinkedAccounts();
    all[userId] = { ...(all[userId] || {}), ...accounts };
    localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(all));
  } catch (e) { }
}

// ---------- Dynamic Email Aliases & Updated Emails ----------

const EMAIL_ALIASES_KEY = 'intellistrata_user_email_aliases';

export function getSavedEmailAliases() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(EMAIL_ALIASES_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveEmailAlias(aliasEmail, underlyingEmail, userId) {
  try {
    if (typeof localStorage === 'undefined' || !aliasEmail) return;
    const cleanAlias = aliasEmail.toLowerCase().trim();
    const cleanUnderlying = (underlyingEmail || '').toLowerCase().trim();
    const all = getSavedEmailAliases();
    all[cleanAlias] = {
      underlyingEmail: cleanUnderlying || cleanAlias,
      userId: userId || null,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(EMAIL_ALIASES_KEY, JSON.stringify(all));
  } catch (e) { }
}

export function removeEmailAlias(aliasEmail) {
  try {
    if (typeof localStorage === 'undefined' || !aliasEmail) return;
    const cleanAlias = aliasEmail.toLowerCase().trim();
    const all = getSavedEmailAliases();
    delete all[cleanAlias];
    localStorage.setItem(EMAIL_ALIASES_KEY, JSON.stringify(all));
    delete USERNAME_LOOKUP[cleanAlias];
  } catch (e) { }
}

export function isOAuthSession(session) {
  if (!session?.user) return false;
  const user = session.user;
  const appMeta = user.app_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];

  const provider = (appMeta.provider || '').toLowerCase();
  if (provider && provider !== 'email') {
    return true;
  }
  if (Array.isArray(appMeta.providers)) {
    if (appMeta.providers.some((p) => p && p.toLowerCase() !== 'email')) {
      return true;
    }
  }
  if (identities.some((id) => id.provider && id.provider.toLowerCase() !== 'email')) {
    return true;
  }
  return false;
}

export function getOAuthProviderLabel(session) {
  if (!session?.user) return 'Google / Microsoft';
  const appMeta = session.user.app_metadata || {};
  const identities = Array.isArray(session.user.identities) ? session.user.identities : [];
  const allProviders = [
    appMeta.provider,
    ...(appMeta.providers || []),
    ...identities.map((i) => i.provider),
  ].filter(Boolean).map((p) => p.toLowerCase());

  if (allProviders.some((p) => p.includes('azure') || p.includes('micro') || p.includes('ms'))) {
    return 'Microsoft';
  }
  if (allProviders.some((p) => p.includes('google'))) {
    return 'Google';
  }
  return 'Google / Microsoft';
}

export function resolveLoginEmail(identifier) {
  if (!identifier) return '';
  const clean = identifier.toLowerCase().trim();

  // 1. Check dynamic aliases saved from profile email updates or linking
  const aliases = getSavedEmailAliases();
  if (aliases[clean]?.underlyingEmail) {
    return aliases[clean].underlyingEmail;
  }

  // 2. Check static username lookup
  if (USERNAME_LOOKUP[clean]) {
    return USERNAME_LOOKUP[clean];
  }

  // 3. Check linked SSO accounts
  const saved = getSavedLinkedAccounts();
  for (const [userId, userSaved] of Object.entries(saved)) {
    if (userSaved.google?.toLowerCase().trim() === clean || userSaved.microsoft?.toLowerCase().trim() === clean) {
      const mappingRecord = Array.isArray(userMapping)
        ? userMapping.find((m) => m.internal_user_id === userId)
        : null;
      if (mappingRecord?.email) {
        return mappingRecord.email;
      }
      const mockUser = MOCK_USERS.find((u) => u.id === userId);
      if (mockUser?.email) {
        return mockUser.email;
      }
    }
  }

  return clean;
}

/**
 * Resolves a Google or Microsoft OAuth email to an existing registered member.
 * IMPORTANT: Google and Microsoft emails are NOT pre-defined. Members must first log in
 * with portal credentials and save their Google/Microsoft account or emails in the Profile section.
 * Access via OAuth is strictly restricted to accounts that have been entered/saved by members in their Profile.
 */
export function findMemberByOAuthEmail(rawEmail, provider = '') {
  if (!rawEmail) return null;
  const cleanEmail = rawEmail.trim().toLowerCase();

  const resolveMember = (userId) => {
    if (!userId) return null;
    const mappingRecord = Array.isArray(userMapping)
      ? userMapping.find((m) => m.internal_user_id === userId || m.id === userId)
      : null;
    const mockUser = MOCK_USERS.find((u) => u.id === userId || u.internal_user_id === userId);
    return mappingRecord || mockUser || null;
  };

  const createMemberResponse = (member, matchedEmail) => {
    const internalId = member.internal_user_id || member.id;
    const saved = getSavedLinkedAccounts()[internalId] || {};
    return {
      internal_user_id: internalId,
      id: internalId,
      username: member.username,
      name: member.name,
      email: member.email,
      sso_email: matchedEmail,
      google_email: saved.google || (matchedEmail.includes('gmail') || matchedEmail.includes('google') ? matchedEmail : null),
      microsoft_email: saved.microsoft || (matchedEmail.includes('outlook') || matchedEmail.includes('hotmail') || matchedEmail.includes('live') || matchedEmail.includes('microsoft') ? matchedEmail : null),
      role: member.role || 'Resident Owner',
      unit: member.unit || '101',
      property_id: member.property_id || member.propertyId || 'prop-1',
      property_name: member.property_name || member.propertyName || 'Green Valley Residence',
      lot_id: member.lot_id || member.lotId || 'Lot A-03',
      lotNumber: member.lotNumber || member.lot_id || member.lotId || 'Lot A-03',
    };
  };

  // 1. Check accounts explicitly linked by members in My Profile -> Security & Access
  const saved = getSavedLinkedAccounts();
  for (const [userId, userSaved] of Object.entries(saved)) {
    const savedGoogle = userSaved.google?.toLowerCase().trim();
    const savedMs = userSaved.microsoft?.toLowerCase().trim();

    if (savedGoogle === cleanEmail || savedMs === cleanEmail) {
      const member = resolveMember(userId);
      if (member) {
        return createMemberResponse(member, cleanEmail);
      }
    }
  }

  // 2. Check dynamic email aliases saved when primary or secondary email was edited in My Profile
  const aliases = getSavedEmailAliases();
  if (aliases[cleanEmail]?.userId || aliases[cleanEmail]?.underlyingEmail) {
    const aliasInfo = aliases[cleanEmail];
    let member = resolveMember(aliasInfo.userId);
    if (!member && aliasInfo.underlyingEmail) {
      const underClean = aliasInfo.underlyingEmail.toLowerCase().trim();
      member = Array.isArray(userMapping)
        ? userMapping.find((m) => m.email?.toLowerCase().trim() === underClean)
        : null;
      if (!member) {
        member = MOCK_USERS.find((u) => u.email?.toLowerCase().trim() === underClean);
      }
    }
    if (member) {
      return createMemberResponse(member, cleanEmail);
    }
  }

  // 3. Check locally saved profile records (intellistrata_saved_profile_<userId>) from Profile section
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('intellistrata_saved_profile_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            const primary = data.email?.toLowerCase().trim();
            const sec = data.secondaryEmail?.toLowerCase().trim();
            if (primary === cleanEmail || sec === cleanEmail) {
              const userId = key.replace('intellistrata_saved_profile_', '');
              const member = resolveMember(userId);
              if (member) {
                return createMemberResponse(member, cleanEmail);
              }
            }
          }
        }
      }
    } catch (e) { }
  }

  // 4. Check intellistrata_working_users in localStorage (saved by profile updates)
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('intellistrata_working_users');
      if (raw) {
        const users = JSON.parse(raw);
        if (Array.isArray(users)) {
          for (const u of users) {
            const primary = u.email?.toLowerCase().trim();
            const sec = u.secondaryEmail?.toLowerCase().trim();
            if (primary === cleanEmail || sec === cleanEmail) {
              const member = resolveMember(u.id);
              if (member) {
                return createMemberResponse(member, cleanEmail);
              }
            }
          }
        }
      }
    } catch (e) { }
  }

  // 5. Check exact match against registered seed user emails in userMapping (e.g. resident.owner@intellistrata.test)
  // CRITICAL: MUST be an EXACT full email match! NEVER match by prefix before '@'!
  if (Array.isArray(userMapping)) {
    const match = userMapping.find(
      (m) => m.email?.toLowerCase().trim() === cleanEmail
    );
    if (match) {
      return createMemberResponse(match, cleanEmail);
    }
  }

  // 6. Check exact match against MOCK_USERS emails
  const mockMatch = MOCK_USERS.find(
    (u) => u.email?.toLowerCase().trim() === cleanEmail
  );
  if (mockMatch) {
    return createMemberResponse(mockMatch, cleanEmail);
  }

  // Strict Access Gatekeeper: Any other email that has NOT been entered/saved in Profile is REJECTED
  return null;
}

export function isOAuthEmailApproved(rawEmail, provider = '') {
  return !!findMemberByOAuthEmail(rawEmail, provider);
}

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
    const resolvedEmail = (resolveLoginEmail(lowerInput) || USERNAME_LOOKUP[lowerInput] || lowerInput).toLowerCase();

    // Explicit mapping check against seed user-mapping.json first
    const mappingRecord = Array.isArray(userMapping)
      ? userMapping.find(
        (m) =>
          m.username?.toLowerCase() === lowerInput ||
          m.email?.toLowerCase() === lowerInput ||
          m.email?.toLowerCase() === resolvedEmail
      )
      : null;

    let user = null;
    if (mappingRecord) {
      user = MOCK_USERS.find(
        (u) =>
          u.id === mappingRecord.internal_user_id ||
          u.email.toLowerCase() === mappingRecord.email.toLowerCase() ||
          u.username?.toLowerCase() === mappingRecord.username?.toLowerCase()
      );
      const linked = this.getLinkedAccounts(mappingRecord.internal_user_id);
      if (user) {
        user = {
          ...user,
          internalUserId: mappingRecord.internal_user_id,
          googleEmail: linked.google,
          microsoftEmail: linked.microsoft,
          propertyId: mappingRecord.property_id || user.propertyId || 'prop-1',
          propertyName: mappingRecord.property_name || user.propertyName || 'Green Valley Residence',
          lotId: mappingRecord.lot_id || user.lotId || 'Lot A-03',
          lotNumber: mappingRecord.lot_id || user.lotNumber || 'Lot A-03',
        };
      } else {
        user = {
          id: mappingRecord.internal_user_id,
          internalUserId: mappingRecord.internal_user_id,
          username: mappingRecord.username,
          name: mappingRecord.name,
          email: mappingRecord.email,
          googleEmail: linked.google,
          microsoftEmail: linked.microsoft,
          unit: mappingRecord.unit || '101',
          role: mappingRecord.role || 'Resident Owner',
          propertyId: mappingRecord.property_id || 'prop-1',
          propertyName: mappingRecord.property_name || 'Green Valley Residence',
          lotId: mappingRecord.lot_id || 'Lot A-03',
          lotNumber: mappingRecord.lot_id || 'Lot A-03',
          avatar: null,
        };
      }
    } else {
      user = MOCK_USERS.find(
        (u) =>
          u.username?.toLowerCase() === lowerInput ||
          u.email.toLowerCase() === lowerInput ||
          u.email.toLowerCase() === resolvedEmail ||
          u.name.toLowerCase() === lowerInput ||
          u.name.split(' ')[0].toLowerCase() === lowerInput ||
          (lowerInput === 'admin' && (u.role.toLowerCase().includes('manager') || u.username === 'admin' || u.username === 'strata.manager')) ||
          (lowerInput === 'pasan' && u.name.toLowerCase().includes('pasan'))
      );
    }

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
        propertyId: 'prop-1',
        propertyName: 'Green Valley Residence',
        lotId: 'Lot A-03',
        lotNumber: 'Lot A-03',
        avatar: null,
      };
    }

    const token = 'jwt_token_' + user.id + '_' + Date.now();
    persistSession(user, token, rememberMe);
    notifyAuthChange({ isAuthenticated: true, user });

    return { success: true, user, token };
  },

  /**
   * OAuth Login with Google or Microsoft in Mock mode.
   * Strictly enforces that only registered members who have their Google or Microsoft
   * email linked in the portal can gain access.
   */
  async loginWithOAuth(provider, options = {}) {
    await delay(350);
    const providerName = (provider || 'Google').toLowerCase();
    const isGoogle = providerName.includes('google');
    const providerLabel = isGoogle ? 'Google' : 'Microsoft';

    // OAuth email must be explicitly entered
    const oauthEmail = (options.email || options.oauthEmail || '').trim();

    if (!oauthEmail) {
      return {
        success: false,
        isUnlinked: true,
        error: `Please enter your ${providerLabel} account email to sign in.`,
      };
    }

    // STRICT ACCESS GATEKEEPER:
    // Only registered members who have their Google or Microsoft email linked through Profile can log in!
    const memberRecord = findMemberByOAuthEmail(oauthEmail, isGoogle ? 'google' : 'azure');

    if (!memberRecord) {
      return {
        success: false,
        isUnlinked: true,
        error: `Access Denied: The ${providerLabel} account "${oauthEmail}" has not been saved in your profile yet. Please log in using your portal credentials (e.g. resident.owner) first and save your ${providerLabel} email in the Profile section.`,
        email: oauthEmail,
      };
    }

    // Authorized member resolved
    const user = {
      id: memberRecord.internal_user_id,
      internalUserId: memberRecord.internal_user_id,
      name: memberRecord.name || 'Portal Resident',
      email: memberRecord.email,
      googleEmail: memberRecord.google_email,
      microsoftEmail: memberRecord.microsoft_email,
      unit: memberRecord.unit || '101',
      role: memberRecord.role || 'Resident Owner',
      propertyId: memberRecord.property_id || 'prop-1',
      propertyName: memberRecord.property_name || 'Green Valley Residence',
      lotId: memberRecord.lot_id || 'Lot A-03',
      lotNumber: memberRecord.lot_id || 'Lot A-03',
      avatar: null,
      provider: isGoogle ? 'google' : 'azure',
      authenticatedViaOAuth: true,
      oauthEmail: oauthEmail,
    };

    const token = `jwt_mock_${isGoogle ? 'google' : 'ms'}_${user.id}_${Date.now()}`;
    persistSession(user, token, true);
    notifyAuthChange({ isAuthenticated: true, user });

    return { success: true, user, token };
  },

  getLinkedAccounts(userId) {
    const id = userId || getStoredUser()?.id;
    if (!id) return { google: null, microsoft: null };
    const saved = getSavedLinkedAccounts()[id] || {};
    return {
      google: saved.google || null,
      microsoft: saved.microsoft || null,
    };
  },

  async updateLinkedAccounts(accounts = {}) {
    await delay(150);
    const currentUser = getStoredUser();
    if (!currentUser || !currentUser.id) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const current = this.getLinkedAccounts(currentUser.id);
    const updated = {
      google: accounts.google !== undefined ? (accounts.google ? accounts.google.trim().toLowerCase() : null) : current.google,
      microsoft: accounts.microsoft !== undefined ? (accounts.microsoft ? accounts.microsoft.trim().toLowerCase() : null) : current.microsoft,
    };

    saveLinkedAccounts(currentUser.id, updated);

    // Save alias mapping so linked email can be used for login
    const primaryUnderlyingEmail = currentUser.primaryEmail || currentUser.email;
    if (updated.google) {
      saveEmailAlias(updated.google, primaryUnderlyingEmail, currentUser.id);
      USERNAME_LOOKUP[updated.google] = primaryUnderlyingEmail;
    } else if (accounts.google === null && current.google) {
      removeEmailAlias(current.google);
    }
    if (updated.microsoft) {
      saveEmailAlias(updated.microsoft, primaryUnderlyingEmail, currentUser.id);
      USERNAME_LOOKUP[updated.microsoft] = primaryUnderlyingEmail;
    } else if (accounts.microsoft === null && current.microsoft) {
      removeEmailAlias(current.microsoft);
    }

    const updatedUser = {
      ...currentUser,
      googleEmail: updated.google,
      microsoftEmail: updated.microsoft,
    };
    persistSession(updatedUser, getStoredToken(), true);
    notifyAuthChange({ isAuthenticated: true, user: updatedUser });

    return { success: true, linkedAccounts: updated, user: updatedUser };
  },

  async updateUserEmail(newEmail, metadata = {}) {
    await delay(150);
    const cleanEmail = (newEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    const user = getStoredUser();
    if (!user) return { success: false, error: 'User is not authenticated.' };

    const primaryUnderlyingEmail = user.primaryEmail || user.email;
    saveEmailAlias(cleanEmail, primaryUnderlyingEmail, user.id);
    USERNAME_LOOKUP[cleanEmail] = primaryUnderlyingEmail;

    // Automatically link for OAuth if user enters a Google or Microsoft email in Profile
    const isGoogle = cleanEmail.includes('gmail.com') || cleanEmail.includes('google');
    const isMicrosoft = cleanEmail.includes('outlook.com') || cleanEmail.includes('hotmail.com') || cleanEmail.includes('live.com') || cleanEmail.includes('microsoft');
    if (isGoogle) {
      saveLinkedAccounts(user.id, { google: cleanEmail });
    }
    if (isMicrosoft) {
      saveLinkedAccounts(user.id, { microsoft: cleanEmail });
    }

    // Also register secondary email if provided in profile
    const secEmail = (metadata.secondaryEmail || '').trim().toLowerCase();
    if (secEmail && secEmail.includes('@')) {
      saveEmailAlias(secEmail, primaryUnderlyingEmail, user.id);
      USERNAME_LOOKUP[secEmail] = primaryUnderlyingEmail;

      const isSecGoogle = secEmail.includes('gmail.com') || secEmail.includes('google');
      const isSecMicrosoft = secEmail.includes('outlook.com') || secEmail.includes('hotmail.com') || secEmail.includes('live.com') || secEmail.includes('microsoft');
      if (isSecGoogle) {
        saveLinkedAccounts(user.id, { google: secEmail });
      }
      if (isSecMicrosoft) {
        saveLinkedAccounts(user.id, { microsoft: secEmail });
      }
    }

    const updatedUser = {
      ...user,
      email: cleanEmail,
      profileEmail: cleanEmail,
      secondaryEmail: secEmail || user.secondaryEmail,
      primaryEmail: primaryUnderlyingEmail,
      googleEmail: isGoogle ? cleanEmail : (secEmail?.includes('gmail.com') ? secEmail : user.googleEmail),
      microsoftEmail: isMicrosoft ? cleanEmail : ((secEmail?.includes('outlook.com') || secEmail?.includes('hotmail.com')) ? secEmail : user.microsoftEmail),
      ...metadata,
    };
    persistSession(updatedUser, getStoredToken(), true);
    notifyAuthChange({ isAuthenticated: true, user: updatedUser });
    return { success: true, user: updatedUser };
  },

  isMockMode() {
    return true;
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

  async getToken() {
    return getStoredToken();
  },

  onAuthChange(callback) {
    if (typeof window === 'undefined') return () => { };
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
  const storedUser = getStoredUser();
  const rawEmail =
    meta.profile_email ||
    meta.email ||
    storedUser?.profileEmail ||
    storedUser?.email ||
    sbUser.email ||
    meta.preferred_username ||
    meta.upn ||
    '';
  const primaryUnderlyingEmail = sbUser.email || storedUser?.primaryEmail || '';
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

  // Explicit mapping resolution against approved seed user-mapping.json and linked accounts
  const mappingRecord = findMemberByOAuthEmail(rawEmail, sbUser.app_metadata?.provider) || (Array.isArray(userMapping)
    ? userMapping.find(
      (m) =>
        m.email?.toLowerCase().trim() === rawEmail.toLowerCase().trim() ||
        m.internal_user_id === sbUser.id
    )
    : null);

  const internalId = mappingRecord ? (mappingRecord.internal_user_id || mappingRecord.id) : (storedUser?.id || sbUser.id);
  const saved = getSavedLinkedAccounts()[internalId] || {};

  return {
    id: internalId,
    supabaseUserId: sbUser.id,
    internalUserId: mappingRecord ? internalId : null,
    name: mappingRecord?.name || formattedName || 'Resident',
    username: mappingRecord?.username || (rawEmail.includes('@') ? rawEmail.split('@')[0] : 'resident.owner'),
    email: rawEmail,
    profileEmail: rawEmail,
    primaryEmail: primaryUnderlyingEmail || rawEmail,
    googleEmail: saved.google || mappingRecord?.google_email || null,
    microsoftEmail: saved.microsoft || mappingRecord?.microsoft_email || null,
    unit: mappingRecord?.unit || meta.unit || '101',
    role: mappingRecord?.role || meta.role || 'Resident Owner',
    propertyId: mappingRecord?.property_id || meta.property_id || 'prop-1',
    propertyName: mappingRecord?.property_name || meta.property_name || 'Green Valley Residence',
    lotId: mappingRecord?.lot_id || meta.lot_id || 'Lot A-03',
    lotNumber: mappingRecord?.lot_id || meta.lot_number || 'Lot A-03',
    avatar: meta.avatar_url || meta.picture || meta.avatar || null,
    // app_metadata.provider is 'google', 'azure', or 'email' (password auth)
    provider: sbUser.app_metadata?.provider || 'email',
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
      const rawEmail = (session.user.email || session.user.user_metadata?.email || '').toLowerCase().trim();
      if (isOAuthSession(session)) {
        const memberRecord = findMemberByOAuthEmail(rawEmail);
        if (!memberRecord) {
          // Unlinked/unsaved OAuth user: terminate session immediately
          supabase.auth.signOut().catch(() => { });
          currentSession = null;
          currentUser = null;
          clearSession();
          notifyAuthChange({ isAuthenticated: false, user: null });
          return;
        }
      }

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
  }).catch(() => { });

  // Subscribe to Supabase auth events (sign in, sign out, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const rawEmail = (session.user.email || session.user.user_metadata?.email || '').toLowerCase().trim();
      if (isOAuthSession(session)) {
        const memberRecord = findMemberByOAuthEmail(rawEmail);
        if (!memberRecord) {
          try { await supabase.auth.signOut(); } catch (e) { }
          currentSession = null;
          currentUser = null;
          clearSession();
          notifyAuthChange({ isAuthenticated: false, user: null });
          return;
        }
      }

      currentSession = session;
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

    const cleanLower = cleanUsername.toLowerCase();
    const resolvedEmail = resolveLoginEmail(cleanLower);
    const emailToTryFirst = cleanUsername.includes('@')
      ? cleanUsername
      : (resolvedEmail || `${cleanLower}@intellistrata.com`);

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailToTryFirst,
        password: cleanPassword,
      });

      // If direct attempt failed (e.g. because Supabase auth email is still seed address while cleanUsername is an alias)
      if (error && resolvedEmail && resolvedEmail.toLowerCase() !== emailToTryFirst.toLowerCase()) {
        const retry = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: cleanPassword,
        });
        if (!retry.error && retry.data?.session) {
          data = retry.data;
          error = null;
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.session) {
        return { success: false, error: 'Authentication succeeded but no session was returned.' };
      }

      currentSession = data.session;
      currentUser = formatSupabaseUser(data.user);

      // If user signed in with an updated profile email, reflect it on the session user
      if (cleanUsername.includes('@')) {
        currentUser.email = cleanUsername;
        currentUser.profileEmail = cleanUsername;
      }

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
      const queryParams = {
        prompt: 'select_account',
        access_type: 'offline',
        ...(options.queryParams || {}),
      };

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo,
          scopes,
          queryParams,
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
        if (supabaseProvider === 'google') {
          // Instantly redirect directly to Google OAuth Account Chooser
          window.location.assign(data.url);
          return { success: true, data };
        }

        // Pre-check authorize URL status for Microsoft/Azure to give clear feedback if unconfigured
        try {
          const preflight = await fetch(data.url, { method: 'GET', redirect: 'manual' });
          if (preflight.status >= 400) {
            const errBody = await preflight.json().catch(() => null);
            if (errBody?.msg && (errBody.msg.includes('not enabled') || errBody.msg.includes('Unsupported provider'))) {
              return {
                success: false,
                error: `Microsoft (Azure) sign-in is not yet enabled in your Supabase project. Please go to Supabase Dashboard -> Authentication -> Providers -> Azure and enable it with your Microsoft Entra App Client ID & Secret.`,
              };
            }
            if (errBody?.msg) {
              return { success: false, error: errBody.msg };
            }
          }
        } catch (e) {
          // If preflight is blocked by CORS/network, proceed with redirect as fallback
        }

        window.location.assign(data.url);
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
        const rawEmail = (session.user.email || session.user.user_metadata?.email || '').toLowerCase().trim();
        const providerLabel = getOAuthProviderLabel(session);

        // STRICT ACCESS GATEKEEPER: Check if rawEmail is linked or registered to any member!
        const memberRecord = findMemberByOAuthEmail(rawEmail);

        if (!memberRecord) {
          // REVOKE AND TERMINATE THE UNAPPROVED SESSION IMMEDIATELY
          try {
            await supabase.auth.signOut();
          } catch (e) { }
          currentSession = null;
          currentUser = null;
          clearSession();
          notifyAuthChange({ isAuthenticated: false, user: null });

          return {
            success: false,
            isUnlinked: true,
            error: `Access Denied: The ${providerLabel} account "${rawEmail}" has not been saved in your profile yet. Please log in using your portal credentials (e.g. resident.owner) first and save your ${providerLabel} email in the Profile section.`,
            email: rawEmail,
          };
        }

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
        } catch (e) { }

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

      if (error) {
        // Only sign out on confirmed session/refresh expiry errors.
        // Do NOT sign out on transient network failures — those should surface
        // as API errors, not as forced logouts.
        const msg = (error.message || '').toLowerCase();
        const isExpiry =
          msg.includes('invalid refresh token') ||
          msg.includes('refresh_token_not_found') ||
          msg.includes('token expired') ||
          msg.includes('session not found') ||
          error.code === 'invalid_refresh_token' ||
          error.status === 401;
        if (isExpiry) {
          currentSession = null;
          currentUser = null;
          clearSession();
          notifyAuthChange({ isAuthenticated: false, user: null });
        }
        return null;
      }

      if (!data?.session) {
        // No active session at all — user has not signed in.
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
      // Treat unexpected exceptions (e.g. SDK errors) as non-recoverable only if
      // there was no in-memory session to preserve.
      if (!currentSession) {
        clearSession();
        notifyAuthChange({ isAuthenticated: false, user: null });
      }
      return null;
    }
  },

  onAuthChange(callback) {
    if (typeof window === 'undefined') return () => { };
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

  getLinkedAccounts(userId) {
    const id = userId || currentUser?.id || getStoredUser()?.id;
    if (!id) return { google: null, microsoft: null };
    const saved = getSavedLinkedAccounts()[id] || {};
    return {
      google: saved.google || null,
      microsoft: saved.microsoft || null,
    };
  },

  async updateLinkedAccounts(accounts = {}) {
    const user = currentUser || getStoredUser();
    if (!user || !user.id) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const current = this.getLinkedAccounts(user.id);
    const updated = {
      google: accounts.google !== undefined ? (accounts.google ? accounts.google.trim().toLowerCase() : null) : current.google,
      microsoft: accounts.microsoft !== undefined ? (accounts.microsoft ? accounts.microsoft.trim().toLowerCase() : null) : current.microsoft,
    };

    saveLinkedAccounts(user.id, updated);

    // Save alias mapping so linked email can also be resolved for login!
    const primaryUnderlyingEmail = user.primaryEmail || user.supabaseEmail || user.email;
    if (updated.google) {
      saveEmailAlias(updated.google, primaryUnderlyingEmail, user.id);
      USERNAME_LOOKUP[updated.google] = primaryUnderlyingEmail;
    } else if (accounts.google === null && current.google) {
      removeEmailAlias(current.google);
    }
    if (updated.microsoft) {
      saveEmailAlias(updated.microsoft, primaryUnderlyingEmail, user.id);
      USERNAME_LOOKUP[updated.microsoft] = primaryUnderlyingEmail;
    } else if (accounts.microsoft === null && current.microsoft) {
      removeEmailAlias(current.microsoft);
    }

    // Also persist to Supabase user_metadata if active session exists
    try {
      await supabase.auth.updateUser({
        data: {
          linked_google_email: updated.google,
          linked_microsoft_email: updated.microsoft,
        },
      });
    } catch (e) { }

    const updatedUser = {
      ...user,
      googleEmail: updated.google,
      microsoftEmail: updated.microsoft,
    };
    persistLiveUser(updatedUser);
    currentUser = updatedUser;
    notifyAuthChange({ isAuthenticated: true, user: updatedUser });

    return { success: true, linkedAccounts: updated, user: updatedUser };
  },

  async updateUserEmail(newEmail, metadata = {}) {
    const cleanEmail = (newEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const user = currentUser || getStoredUser();
    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const primaryUnderlyingEmail = user.primaryEmail || user.supabaseEmail || user.email;

    // 1. Attempt to update user in Supabase Auth
    let supabaseSuccess = false;
    let supabaseError = null;

    try {
      const isEmailChanged = Boolean(
        cleanEmail &&
        cleanEmail.includes('@') &&
        cleanEmail !== (user.primaryEmail || user.supabaseEmail || user.email)?.toLowerCase()
      );

      const updatePayload = {
        data: {
          profile_email: cleanEmail || user.email,
          ...metadata,
        },
      };

      if (isEmailChanged) {
        updatePayload.email = cleanEmail;
      }

      const { data, error } = await supabase.auth.updateUser(updatePayload);

      if (!error) {
        supabaseSuccess = true;
      } else {
        // If direct update failed, save metadata alone
        const metaRes = await supabase.auth.updateUser({
          data: {
            profile_email: cleanEmail || user.email,
            ...metadata,
          },
        });
        if (!metaRes.error) {
          supabaseSuccess = true;
        } else {
          supabaseError = metaRes.error.message;
        }
      }
    } catch (err) {
      supabaseError = err.message;
    }

    // 2. Persist dynamic alias so this new email can immediately be used for login
    if (cleanEmail && cleanEmail.includes('@')) {
      saveEmailAlias(cleanEmail, primaryUnderlyingEmail, user.id);
      USERNAME_LOOKUP[cleanEmail] = primaryUnderlyingEmail;

      const isGoogle = cleanEmail.includes('gmail.com') || cleanEmail.includes('google');
      const isMicrosoft = cleanEmail.includes('outlook.com') || cleanEmail.includes('hotmail.com') || cleanEmail.includes('live.com') || cleanEmail.includes('microsoft');
      if (isGoogle) {
        saveLinkedAccounts(user.id, { google: cleanEmail });
      }
      if (isMicrosoft) {
        saveLinkedAccounts(user.id, { microsoft: cleanEmail });
      }
    }

    // Also register secondary email if provided in profile
    const secEmail = (metadata.secondaryEmail || '').trim().toLowerCase();
    if (secEmail && secEmail.includes('@')) {
      saveEmailAlias(secEmail, primaryUnderlyingEmail, user.id);
      USERNAME_LOOKUP[secEmail] = primaryUnderlyingEmail;

      const isSecGoogle = secEmail.includes('gmail.com') || secEmail.includes('google');
      const isSecMicrosoft = secEmail.includes('outlook.com') || secEmail.includes('hotmail.com') || secEmail.includes('live.com') || secEmail.includes('microsoft');
      if (isSecGoogle) {
        saveLinkedAccounts(user.id, { google: secEmail });
      }
      if (isSecMicrosoft) {
        saveLinkedAccounts(user.id, { microsoft: secEmail });
      }
    }

    // 3. Update in-memory and stored user
    const updatedUser = {
      ...user,
      email: cleanEmail || user.email,
      profileEmail: cleanEmail || user.email,
      secondaryEmail: secEmail || user.secondaryEmail,
      primaryEmail: primaryUnderlyingEmail,
      googleEmail: (cleanEmail && cleanEmail.includes('gmail.com')) ? cleanEmail : (secEmail?.includes('gmail.com') ? secEmail : user.googleEmail),
      microsoftEmail: (cleanEmail && (cleanEmail.includes('outlook.com') || cleanEmail.includes('hotmail.com'))) ? cleanEmail : ((secEmail?.includes('outlook.com') || secEmail?.includes('hotmail.com')) ? secEmail : user.microsoftEmail),
      ...metadata,
    };
    currentUser = updatedUser;
    persistLiveUser(updatedUser);
    notifyAuthChange({ isAuthenticated: true, user: updatedUser });

    return {
      success: true,
      user: updatedUser,
      supabaseSynced: supabaseSuccess,
      note: supabaseError ? `Stored in Supabase metadata: ${supabaseError}` : null,
    };
  },

  isMockMode() {
    return false;
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
