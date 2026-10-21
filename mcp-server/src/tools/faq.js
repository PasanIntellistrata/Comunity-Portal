import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const answerFaq = {
  name: 'answer_faq',
  description: 'Search the Frequently Asked Questions (FAQ) knowledge base for an answer to a resident query.',
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'The question being asked (or keywords)' }
    },
    required: ['question']
  },
  handler: async (args) => {
    const q = args.question.toLowerCase();
    const results = data.faqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    
    // If no direct match, return all FAQs so the LLM can try to find the answer itself
    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data.faqs, null, 2) }]
      };
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }
};
