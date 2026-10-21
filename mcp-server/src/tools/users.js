import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const getUserProfile = {
  name: 'get_user_profile',
  description: 'Look up a resident\'s profile information by ID or name.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'ID of the user (if known)' },
      name: { type: 'string', description: 'Name of the user to search for' }
    }
  },
  handler: async (args) => {
    let results = [];
    
    if (args.userId) {
      const user = data.users.find(u => u.id === args.userId);
      if (user) results.push(user);
    } else if (args.name) {
      const name = args.name.toLowerCase();
      results = data.users.filter(u => u.name.toLowerCase().includes(name));
    } else {
      // If no search params, return a summary of who is in the community
      results = data.users.map(u => ({ id: u.id, name: u.name, role: u.role }));
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
