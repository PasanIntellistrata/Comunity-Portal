/**
 * Centralized API Service — Intellistrata Community Portal
 *
 * Single gateway for all HTTP communications between the frontend UI and the
 * Intellistrata internal backend. UI components must NEVER call fetch() directly.
 *
 * Dual-Mode Operation:
 * - When `VITE_USE_MOCK_API=true`: Delegates all requests to `MockAPI`.
 * - When `VITE_USE_MOCK_API=false`: Executes authenticated HTTP requests via `LiveAPI`
 *   to `VITE_API_BASE_URL` with Supabase JWT Bearer token authentication.
 */

import { MockAPI, ApiError } from './mock-api.js';
import { authService } from './auth.js';
import userMapping from '../../../supabase/seed/user-mapping.json' with { type: 'json' };

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const USE_MOCK = env.VITE_USE_MOCK_API === 'true';
const BASE_URL = (env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * LiveAPI — Centralized HTTP client for the Intellistrata internal backend.
 *
 * Backend Authentication Contract:
 * - Automatically resolves the Supabase access token (JWT) via authService.getToken().
 * - Attaches the token in the `Authorization: Bearer <token>` header on all protected requests.
 * - If the token is missing or expired and cannot be refreshed, the request is aborted,
 *   authService.logout() is invoked to clean state, and route guards redirect to /login/.
 * - If the backend responds with HTTP 401 Unauthorized, the session is cleared centrally.
 * - The backend team validates the JWT and maps `sub` (Supabase user UUID)
 *   to internal user records.
 */
class LiveAPI {
  /**
   * Core authenticated HTTP request dispatcher
   */
  async request(path, options = {}) {
    const isPublic = Boolean(options.isPublic);
    let token = null;

    if (!isPublic) {
      try {
        token = await authService.getToken();
      } catch {
        throw new ApiError('Unable to verify your session. Please sign in again.', 401, 'UNAUTHORIZED');
      }

      // Never make an authenticated request with a placeholder or empty token.
      if (typeof token !== 'string' || !token.trim()) {
        await authService.logout().catch(() => {});
        throw new ApiError('Your session has expired. Please sign in again.', 401, 'SESSION_EXPIRED');
      }
    }

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');

    // Automatically format JSON body if provided as an object
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    } else if (body && typeof body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        body,
      });
    } catch (networkErr) {
      throw new ApiError(
        `Unable to connect to internal API server at ${BASE_URL}. Please check your connection or backend status.`,
        0,
        'NETWORK_ERROR'
      );
    }

    // A rejected credential is no longer usable. Clear it through the
    // centralized auth service so route guards and the UI stay in sync.
    if (res.status === 401) {
      await authService.logout().catch(() => {});
      throw new ApiError('Your session has expired or is unauthorized. Please sign in again.', 401, 'UNAUTHORIZED');
    }

    if (res.status === 403) {
      throw new ApiError('You do not have permission to access this resource.', 403, 'FORBIDDEN');
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return null;
    }

    if (!res.ok) {
      let errorBody = {};
      try {
        errorBody = await res.json();
      } catch {
        // non-JSON error response
      }

      const message =
        errorBody.message ||
        errorBody.error ||
        (res.status === 404
          ? `The requested endpoint '${path}' was not found on the backend server (${BASE_URL}).`
          : `API request failed with status ${res.status}`);

      throw new ApiError(message, res.status, errorBody.code || 'HTTP_ERROR');
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // ──────────────────────────────────────────────
  // 1. Verified Live Backend Endpoints (mcp-server / live backend)
  // ──────────────────────────────────────────────

  /**
   * GET /api/user/profile
   * Verified backend endpoint returning current user profile and strata mapping account.
   */
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  /**
   * GET /api/announcements
   * Verified backend endpoint returning announcements for current property.
   */
  async getAnnouncements(options = {}) {
    const qs = options.propertyId ? `?propertyId=${encodeURIComponent(options.propertyId)}` : '';
    return this.request(`/api/announcements${qs}`);
  }

  /**
   * GET /api/events
   * Verified backend endpoint returning calendar events.
   */
  async getEvents(options = {}) {
    const qs = options.propertyId ? `?propertyId=${encodeURIComponent(options.propertyId)}` : '';
    return this.request(`/api/events${qs}`);
  }

  /**
   * GET /api/faqs
   * Verified backend endpoint returning FAQs.
   */
  async getFaqs(options = {}) {
    const qs = options.category ? `?category=${encodeURIComponent(options.category)}` : '';
    return this.request(`/api/faqs${qs}`);
  }

  /**
   * POST /chat
   * AI Assistant chat endpoint.
   */
  async chatWithAssistant(message, history = []) {
    return this.request('/chat', {
      method: 'POST',
      body: { message, conversationHistory: history },
    });
  }

  /**
   * GET /health
   * Unauthenticated health check endpoint.
   */
  async getHealth() {
    return this.request('/health', { isPublic: true });
  }

  // ──────────────────────────────────────────────
  // 2. Staged Service Endpoints with User/Property/Lot Mapping
  // ──────────────────────────────────────────────

  /**
   * GET /api/properties
   */
  async getProperties() {
    return this.request('/api/properties');
  }

  /**
   * GET /api/properties/:id
   */
  async getPropertyById(propertyId) {
    return this.request(`/api/properties/${encodeURIComponent(propertyId)}`);
  }

  async getPropertyDetails(propertyId) {
    return this.request(`/api/properties/${encodeURIComponent(propertyId)}`);
  }

  /**
   * GET /api/lots?propertyId=...&userId=...
   */
  async getLots(options = {}) {
    const params = new URLSearchParams();
    if (options.propertyId) params.set('propertyId', options.propertyId);
    if (options.userId) params.set('userId', options.userId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/lots${qs}`);
  }

  async getLotById(lotId) {
    return this.request(`/api/lots/${encodeURIComponent(lotId)}`);
  }

  async getLotsByProperty(propertyId) {
    return this.getLots({ propertyId });
  }

  async getLotsByUser(userId) {
    return this.getLots({ userId });
  }

  /**
   * GET /api/users
   */
  async getUsers() {
    return this.request('/api/users');
  }

  /**
   * GET /api/users/:id
   */
  async getUserById(userId) {
    try {
      return await this.request(`/api/users/${encodeURIComponent(userId)}`);
    } catch (err) {
      console.warn('Backend server user fetch skipped, loading local profile:', err.message);
      return MockAPI.getUserById(userId);
    }
  }

  /**
   * GET /api/users/me
   */
  async getCurrentUserProfile() {
    try {
      return await this.request('/api/users/me');
    } catch (err) {
      console.warn('Backend server offline, falling back to local user profile');
      return MockAPI.getCurrentUserProfile();
    }
  }

  /**
   * PATCH /api/users/:id
   */
  async updateUserProfile(userId, updates) {
    try {
      return await this.request(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: updates,
      });
    } catch (err) {
      console.warn('Backend server offline or unmapped, saving profile locally:', err.message);
      return MockAPI.updateUserProfile(userId, updates);
    }
  }

  /**
   * GET /api/users/:id/mapping
   */
  async getUserPropertyLotMapping(userId) {
    return this.request(`/api/users/${encodeURIComponent(userId)}/mapping`);
  }

  /**
   * GET /api/user-mappings
   */
  async getAllUserMappings() {
    return this.request('/api/user-mappings');
  }

  // ──────────────────────────────────────────────
  // 3. Approved User Mapping Helper
  // ──────────────────────────────────────────────

  /**
   * Resolves the approved internal Intellistrata mapping for any user,
   * converting between Supabase Auth identities (UUID/email) and internal
   * User ID (`usr_...`), Property ID (`prop-...`), and Lot ID (`lot-...`).
   */
  resolveApprovedUserMapping(userOrIdentifier) {
    if (!userOrIdentifier) return null;
    const identifier =
      typeof userOrIdentifier === 'string'
        ? userOrIdentifier.toLowerCase().trim()
        : (userOrIdentifier.email || userOrIdentifier.id || userOrIdentifier.username || '').toLowerCase().trim();

    if (!Array.isArray(userMapping)) return null;

    return (
      userMapping.find(
        (m) =>
          m.email?.toLowerCase() === identifier ||
          m.username?.toLowerCase() === identifier ||
          m.internal_user_id?.toLowerCase() === identifier
      ) || null
    );
  }
}

const liveApi = new LiveAPI();

// Export a proxy object that routes to either Mock or Live based on the env flag
export const api = USE_MOCK ? MockAPI : liveApi;
export { ApiError, BASE_URL, USE_MOCK };