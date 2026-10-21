import { createStore } from 'framework7/lite';
import { api } from './services/api.js';

const store = createStore({
  state: {
    announcements: [],
    events: [],
    faqs: []
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
    }
  },
  actions: {
    async fetchAnnouncements({ state }) {
      state.announcements = await api.getAnnouncements();
    },
    async fetchEvents({ state }) {
      state.events = await api.getEvents();
    },
    async fetchFaqs({ state }) {
      state.faqs = await api.getFaqs();
    }
  },
});

export default store;
