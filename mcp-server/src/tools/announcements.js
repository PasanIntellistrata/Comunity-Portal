import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const getAnnouncements = {
  name: 'get_announcements',
  description: 'Retrieve community announcements and notices. Can be filtered by category or limited in number.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of announcements to return' },
      category: { type: 'string', description: 'Filter by category (e.g. Maintenance, Social)' }
    }
  },
  handler: async (args) => {
    let results = data.announcements;
    
    if (args.category) {
      results = results.filter(a => a.category.toLowerCase() === args.category.toLowerCase());
    }
    
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
