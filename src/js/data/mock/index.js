/**
 * Centralized Mock Data Index — Intellistrata Community Portal
 *
 * Provides typed, clean, decoupled JSON data fixtures for:
 * - Users & Auth Profiles
 * - Properties & Schemes
 * - Lots & Unit Entitlements
 * - Explicit User-Property-Lot Relationship Mappings
 * - Announcements, Events & FAQs
 */

import usersData from './users.json' with { type: 'json' };
import propertiesData from './properties.json' with { type: 'json' };
import lotsData from './lots.json' with { type: 'json' };
import userMappingsData from './user-mappings.json' with { type: 'json' };
import announcementsData from './announcements.json' with { type: 'json' };
import eventsData from './events.json' with { type: 'json' };
import faqsData from './faqs.json' with { type: 'json' };

export const MOCK_USERS = usersData;
export const MOCK_PROPERTIES = propertiesData;
export const MOCK_LOTS = lotsData;
export const MOCK_USER_MAPPINGS = userMappingsData;
export const MOCK_ANNOUNCEMENTS = announcementsData;
export const MOCK_EVENTS = eventsData;
export const MOCK_FAQS = faqsData;

/**
 * Deep clone utility to ensure mock responses are safe from accidental client mutation
 */
export const clone = (data) => JSON.parse(JSON.stringify(data));

// ---------- Query Helpers ----------

export function findUserById(id) {
  if (!id) return null;
  const match = MOCK_USERS.find((u) => u.id === id);
  return match ? clone(match) : null;
}

export function findUserByUsername(username) {
  if (!username) return null;
  const normalized = username.toLowerCase().trim();
  const match = MOCK_USERS.find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      u.email.toLowerCase() === normalized ||
      u.fullName.toLowerCase() === normalized
  );
  return match ? clone(match) : null;
}

export function findPropertyById(id) {
  if (!id) return null;
  const match = MOCK_PROPERTIES.find((p) => p.id === id || p.code === id || p.name === id);
  return match ? clone(match) : null;
}

export function findLotsByProperty(propertyId) {
  if (!propertyId) return [];
  return clone(MOCK_LOTS.filter((l) => l.propertyId === propertyId));
}

export function findLotsByUser(userId) {
  if (!userId) return [];
  return clone(MOCK_LOTS.filter((l) => l.userId === userId));
}

export function findLotById(lotId) {
  if (!lotId) return null;
  const match = MOCK_LOTS.find((l) => l.id === lotId || l.lotNumber === lotId);
  return match ? clone(match) : null;
}

/**
 * Explicit mapping resolver: returns the full relational graph between
 * a user, their primary property, and their primary lot.
 */
export function getUserPropertyLotMapping(userId) {
  const user = findUserById(userId);
  if (!user) return null;

  const property = findPropertyById(user.propertyId);
  const lot = user.lotId ? findLotById(user.lotId) : null;
  const allUserLots = findLotsByUser(userId);

  return {
    user,
    property,
    lot,
    allUserLots,
    explicitMapping: MOCK_USER_MAPPINGS.find((m) => m.internal_user_id === userId) || null,
  };
}
