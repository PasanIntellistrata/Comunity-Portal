import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const getEvents = {
  name: 'get_events',
  description: 'Retrieve a list of upcoming community events.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of events to return' }
    }
  },
  handler: async (args) => {
    // Return all events, sorted by date
    const sorted = [...data.events].sort((a, b) => new Date(a.date) - new Date(b.date));
    const results = args.limit ? sorted.slice(0, args.limit) : sorted;
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
