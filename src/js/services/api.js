import { MockAPI } from './mock-api.js';
import { authService } from './auth.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * LiveAPI — Centralized HTTP client for the Intellistrata internal backend.
 *
 * Backend Authentication Contract:
 * - Automatically resolves the Supabase access token (JWT) via authService.getToken().
 * - Attaches the token in the `Authorization: Bearer <token>` header on all requests.
 * - If the token is missing or expired and cannot be refreshed, the request is aborted
 *   and authService.logout() is invoked to clean state and redirect to /login/.
 * - If the backend responds with HTTP 401 Unauthorized, the session is cleared centrally.
 * - The backend team is responsible for validating the JWT and mapping `sub` (Supabase user UUID)
 *   to internal user records.
 */
class LiveAPI {
  async request(path, options = {}) {
    let token;

    try {
      token = await authService.getToken();
    } catch {
      throw new Error('Unable to verify your session. Please sign in again.');
    }

    // Never make an authenticated request with a placeholder or empty token.
    if (typeof token !== 'string' || !token.trim()) {
      await authService.logout().catch(() => {});
      throw new Error('Your session has expired. Please sign in again.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    // A rejected credential is no longer usable. Clear it through the
    // centralized auth service so route guards and the UI stay in sync.
    if (res.status === 401) {
      await authService.logout().catch(() => {});
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (!res.ok) {
      throw new Error('API request failed.');
    }

    return res.json();
  }

  async getAnnouncements() {
    return this.request('/api/announcements');
  }

  async getEvents() {
    return this.request('/api/events');
  }

  async getFaqs() {
    return this.request('/api/faqs');
  }

  async chatWithAssistant(message, history) {
    return this.request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory: history })
    });
  }
}

const liveApi = new LiveAPI();

// Export a proxy object that routes to either Mock or Live based on the env flag
export const api = USE_MOCK ? MockAPI : liveApi;