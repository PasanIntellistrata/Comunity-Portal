/**
 * MockAPI — Mock Service Implementation for Intellistrata Community Portal
 *
 * Provides realistic responses with simulated network latency, complete data fixtures,
 * and support for testing loading, empty, success, and error states.
 */

import {
  MOCK_USERS,
  MOCK_PROPERTIES,
  MOCK_LOTS,
  MOCK_USER_MAPPINGS,
  MOCK_ANNOUNCEMENTS,
  MOCK_EVENTS,
  MOCK_FAQS,
  clone,
  findUserById,
  findPropertyById,
  findLotsByProperty,
  findLotsByUser,
  findLotById,
  getUserPropertyLotMapping as resolveUserMapping,
} from '../data/mock/index.js';

// Custom API Error simulating HTTP error status codes and error payloads
export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Simulated latency helper
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Working in-memory cache to allow realistic mock update operations during a session
let workingUsers = clone(MOCK_USERS);

export const MockAPI = {
  // ──────────────────────────────────────────────
  // Properties API
  // ──────────────────────────────────────────────

  /**
   * Fetch all properties
   * Supports options.simulateEmpty and options.simulateError
   */
  async getProperties(options = {}) {
    await delay(options.delayMs ?? 300);

    if (options.simulateError) {
      throw new ApiError('Failed to fetch properties from server.', options.simulateStatus || 500, 'PROPERTIES_FETCH_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    return clone(MOCK_PROPERTIES);
  },

  /**
   * Fetch a single property by its ID or Code (e.g. 'prop-1' or 'GVR')
   */
  async getPropertyById(propertyId, options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError || propertyId === 'trigger-error' || propertyId?.startsWith?.('err-')) {
      throw new ApiError(`Simulated error fetching property: ${propertyId}`, options.simulateStatus || 500, 'PROPERTY_FETCH_FAILED');
    }

    const prop = findPropertyById(propertyId);
    if (!prop) {
      throw new ApiError(`Property not found with ID '${propertyId}'.`, 404, 'PROPERTY_NOT_FOUND');
    }

    if (options.simulateEmpty) {
      return { ...prop, lots: ['All Lots'] };
    }

    return prop;
  },

  /**
   * Fetch comprehensive property details (scheme, manager, emergency contacts, amenities)
   */
  async getPropertyDetails(propertyId, options = {}) {
    return this.getPropertyById(propertyId, options);
  },

  // ──────────────────────────────────────────────
  // Lots API
  // ──────────────────────────────────────────────

  /**
   * Fetch lots matching optional filters: propertyId, userId
   * Handles empty state (e.g. property with no lots or options.simulateEmpty)
   */
  async getLots(options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError) {
      throw new ApiError('Failed to retrieve lots from server.', options.simulateStatus || 500, 'LOTS_FETCH_FAILED');
    }

    if (options.simulateEmpty || options.propertyId === 'prop-empty') {
      return [];
    }

    let results = clone(MOCK_LOTS);

    if (options.propertyId) {
      results = results.filter((lot) => lot.propertyId === options.propertyId);
    }

    if (options.userId) {
      results = results.filter((lot) => lot.userId === options.userId);
    }

    return results;
  },

  /**
   * Fetch a single lot by Lot ID (e.g. 'lot-1-a03') or Lot Number (e.g. 'Lot A-03')
   */
  async getLotById(lotId, options = {}) {
    await delay(options.delayMs ?? 200);

    if (options.simulateError || lotId === 'trigger-error' || lotId?.startsWith?.('err-')) {
      throw new ApiError(`Simulated error fetching lot: ${lotId}`, options.simulateStatus || 500, 'LOT_FETCH_FAILED');
    }

    const lot = findLotById(lotId);
    if (!lot) {
      throw new ApiError(`Lot not found with identifier '${lotId}'.`, 404, 'LOT_NOT_FOUND');
    }

    return lot;
  },

  /**
   * Fetch all lots belonging to a specific property
   */
  async getLotsByProperty(propertyId, options = {}) {
    return this.getLots({ ...options, propertyId });
  },

  /**
   * Fetch all lots owned/occupied by a specific user
   */
  async getLotsByUser(userId, options = {}) {
    return this.getLots({ ...options, userId });
  },

  // ──────────────────────────────────────────────
  // Users & Profiles API
  // ──────────────────────────────────────────────

  /**
   * Fetch all user records
   */
  async getUsers(options = {}) {
    await delay(options.delayMs ?? 300);

    if (options.simulateError) {
      throw new ApiError('Failed to retrieve user directory.', options.simulateStatus || 500, 'USERS_FETCH_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    return clone(workingUsers);
  },

  /**
   * Fetch single user profile by User ID (e.g. 'usr_pasan')
   */
  async getUserById(userId, options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError || userId === 'trigger-error' || userId?.startsWith?.('err-')) {
      throw new ApiError(`Simulated error fetching user: ${userId}`, options.simulateStatus || 500, 'USER_FETCH_FAILED');
    }

    const user = workingUsers.find((u) => u.id === userId) || findUserById(userId);
    if (!user) {
      throw new ApiError(`User not found with ID '${userId}'.`, 404, 'USER_NOT_FOUND');
    }

    return clone(user);
  },

  /**
   * Fetch full profile for currently logged-in user or active session
   */
  async getCurrentUserProfile(options = {}) {
    // Default to 'usr_pasan' if no user ID provided
    const targetId = options.userId || 'usr_pasan';
    return this.getUserById(targetId, options);
  },

  /**
   * Fetch user profile in the exact shape returned by verified backend GET /api/user/profile
   */
  async getUserProfile(options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError) {
      throw new ApiError('Failed to fetch user profile from server.', options.simulateStatus || 500, 'PROFILE_FETCH_FAILED');
    }

    const user = await this.getCurrentUserProfile(options);
    return {
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        unit: user.unit,
        provider: 'mock',
      },
      mapped_account: {
        strata_plan: 'SP-54210',
        unit: user.unit,
        role: user.role,
        voting_rights: user.role.includes('Owner') || user.role.includes('Committee'),
      },
    };
  },

  async getHealth() {
    return {
      status: 'ok',
      mcp: 'active',
      mode: 'mock',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Update user profile fields (simulates PUT/PATCH /api/users/:id)
   */
  async updateUserProfile(userId, updates = {}, options = {}) {
    await delay(options.delayMs ?? 400);

    if (options.simulateError) {
      throw new ApiError('Failed to update profile changes.', options.simulateStatus || 400, 'PROFILE_UPDATE_FAILED');
    }

    let userIndex = workingUsers.findIndex(
      (u) =>
        u.id === userId ||
        (userId && u.email?.toLowerCase() === String(userId).toLowerCase()) ||
        (userId && u.username?.toLowerCase() === String(userId).toLowerCase())
    );

    if (userIndex === -1) {
      userIndex = 0;
    }

    // Apply updates non-destructively
    workingUsers[userIndex] = {
      ...workingUsers[userIndex],
      ...updates,
      id: workingUsers[userIndex].id || userId,
    };

    try {
      localStorage.setItem('intellistrata_working_users', JSON.stringify(workingUsers));
    } catch (e) { }

    return clone(workingUsers[userIndex]);
  },

  // ──────────────────────────────────────────────
  // Explicit User <-> Property <-> Lot Mappings API
  // ──────────────────────────────────────────────

  /**
   * Resolves the explicit relational mapping between a user, their assigned property,
   * and their lot(s).
   */
  async getUserPropertyLotMapping(userId, options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError) {
      throw new ApiError('Failed to resolve user property lot mapping.', options.simulateStatus || 500, 'MAPPING_FETCH_FAILED');
    }

    const mapping = resolveUserMapping(userId);
    if (!mapping) {
      throw new ApiError(`No property/lot mapping found for user '${userId}'.`, 404, 'MAPPING_NOT_FOUND');
    }

    return mapping;
  },

  /**
   * Fetch all explicit user-to-property-lot mappings
   */
  async getAllUserMappings(options = {}) {
    await delay(options.delayMs ?? 200);

    if (options.simulateError) {
      throw new ApiError('Failed to retrieve user mappings list.', options.simulateStatus || 500, 'MAPPINGS_FETCH_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    return clone(MOCK_USER_MAPPINGS);
  },

  // ──────────────────────────────────────────────
  // Announcements, Events, FAQs & Assistant
  // ──────────────────────────────────────────────

  async getAnnouncements(options = {}) {
    await delay(options.delayMs ?? 300);

    if (options.simulateError) {
      throw new ApiError('Failed to load announcements.', options.simulateStatus || 500, 'ANNOUNCEMENTS_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    if (options.propertyId) {
      return clone(MOCK_ANNOUNCEMENTS.filter((a) => a.propertyId === options.propertyId));
    }

    return clone(MOCK_ANNOUNCEMENTS);
  },

  async getEvents(options = {}) {
    await delay(options.delayMs ?? 300);

    if (options.simulateError) {
      throw new ApiError('Failed to load events calendar.', options.simulateStatus || 500, 'EVENTS_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    if (options.propertyId) {
      return clone(MOCK_EVENTS.filter((e) => e.propertyId === options.propertyId));
    }

    return clone(MOCK_EVENTS);
  },

  async getFaqs(options = {}) {
    await delay(options.delayMs ?? 250);

    if (options.simulateError) {
      throw new ApiError('Failed to load FAQs.', options.simulateStatus || 500, 'FAQS_FAILED');
    }

    if (options.simulateEmpty) {
      return [];
    }

    if (options.category) {
      return clone(MOCK_FAQS.filter((f) => f.category.toLowerCase() === options.category.toLowerCase()));
    }

    return clone(MOCK_FAQS);
  },

  async chatWithAssistant(message, history = [], options = {}) {
    await delay(options.delayMs ?? 600);

    if (options.simulateError) {
      throw new ApiError('AI assistant connection timeout.', 504, 'ASSISTANT_TIMEOUT');
    }

    return {
      reply: 'I am currently operating in mock API mode with realistic strata fixtures. When connected to the live backend and MCP server, I can help query your live invoices, submit work orders, or schedule amenities.',
      history: [
        ...history,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content: 'I am currently operating in mock API mode with realistic strata fixtures. When connected to the live backend and MCP server, I can help query your live invoices, submit work orders, or schedule amenities.',
        },
      ],
    };
  },
};
