import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const searchCommunity = {
  name: 'search_community',
  description: 'Perform a full-text search across all community content (announcements, events, FAQs, documents).',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term to look for' }
    },
    required: ['query']
  },
  handler: async (args) => {
    const q = args.query.toLowerCase();
    const results = {
      announcements: data.announcements.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)),
      events: data.events.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
      faqs: data.faqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
      documents: data.documents.filter(d => d.title.toLowerCase().includes(q))
    };
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
