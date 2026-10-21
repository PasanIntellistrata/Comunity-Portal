import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const getDocuments = {
  name: 'get_documents',
  description: 'Retrieve community documents, forms, and guidelines.',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Filter by category (e.g. Rules, Amenities, Legal)' }
    }
  },
  handler: async (args) => {
    let results = data.documents;
    
    if (args.category) {
      results = results.filter(d => d.category.toLowerCase() === args.category.toLowerCase());
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
