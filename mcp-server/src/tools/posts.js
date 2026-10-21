import { z } from 'zod';
import { data } from '../data/mock-data.js';

export const createPost = {
  name: 'create_post',
  description: 'Create a new community announcement or post. Returns the created post object.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the post' },
      body: { type: 'string', description: 'Main content of the post' },
      category: { type: 'string', description: 'Category (e.g. Social, Maintenance, General)' },
      authorId: { type: 'string', description: 'ID of the user creating the post' }
    },
    required: ['title', 'body', 'category', 'authorId']
  },
  handler: async (args) => {
    const newPost = {
      id: `a${Date.now()}`,
      title: args.title,
      body: args.body,
      category: args.category,
      authorId: args.authorId,
      date: new Date().toISOString().split('T')[0]
    };
    
    data.announcements.push(newPost);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(newPost, null, 2) }]
    };
  }
};
