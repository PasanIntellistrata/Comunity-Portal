import { createStore } from 'framework7/lite';
import { api } from './services/api.js';

const store = createStore({
  state: {
    announcements: [],
    events: [],
    faqs: [],
    properties: [],
    lots: [],
    currentUserProfile: null,
    isLoading: false,
    error: null,
  },
  getters: {
    announcements({ state }) {
      return state.announcements;
    },
    events({ state }) {
      return state.events;
    },
    faqs({ state }) {
      return state.faqs;
    },
    properties({ state }) {
      return state.properties;
    },
    lots({ state }) {
      return state.lots;
    },
    currentUserProfile({ state }) {
      return state.currentUserProfile;
    },
    isLoading({ state }) {
      return state.isLoading;
    },
    error({ state }) {
      return state.error;
    },
  },
  actions: {
    async fetchAnnouncements({ state }, options) {
      state.announcements = await api.getAnnouncements(options);
    },
    async fetchEvents({ state }, options) {
      state.events = await api.getEvents(options);
    },
    async fetchFaqs({ state }, options) {
      state.faqs = await api.getFaqs(options);
    },
    async fetchProperties({ state }, options) {
      state.isLoading = true;
      try {
        state.properties = await api.getProperties(options);
        state.error = null;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
      }
    },
    async fetchLots({ state }, options) {
      state.isLoading = true;
      try {
        state.lots = await api.getLots(options);
        state.error = null;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
      }
    },
    async fetchCurrentUserProfile({ state }, options) {
      state.isLoading = true;
      try {
        state.currentUserProfile = await api.getCurrentUserProfile(options);
        state.error = null;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
      }
    },
  },
});

export default store;
