// Simulated latency function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_DATA = {
  users: [
    { id: '1', name: 'Alice Smith', unit: '101', role: 'resident', joined: '2025-01-15' },
    { id: '2', name: 'Bob Johnson', unit: '205', role: 'committee', joined: '2024-11-20' },
    { id: '3', name: 'Charlie Brown', unit: '304', role: 'resident', joined: '2026-03-01' }
  ],
  announcements: [
    { id: 'a1', title: 'Water Shutoff', body: 'Water will be shut off for maintenance tomorrow between 10am and 2pm.', date: '2026-08-31', authorId: '2', category: 'Maintenance' },
    { id: 'a2', title: 'Pool Party', body: 'Annual summer pool party is happening this Saturday!', date: '2026-09-01', authorId: '2', category: 'Social' }
  ],
  events: [
    { id: 'e1', title: 'Summer Pool Party', date: '2026-09-05T14:00:00Z', location: 'Main Pool', description: 'Annual summer gathering for all residents.', rsvpCount: 12 },
    { id: 'e2', title: 'Committee Meeting', date: '2026-09-10T19:00:00Z', location: 'Meeting Room', description: 'Monthly strata committee meeting.', rsvpCount: 5 }
  ],
  documents: [
    { id: 'd1', title: 'Community Guidelines', url: '/docs/guidelines.pdf', category: 'Rules' },
    { id: 'd2', title: 'Gym Equipment Instructions', url: '/docs/gym.pdf', category: 'Amenities' },
    { id: 'd3', title: 'Strata Plan', url: '/docs/plan.pdf', category: 'Legal' }
  ],
  faqs: [
    { question: 'What are the pool hours?', answer: 'The pool is open daily from 6:00 AM to 10:00 PM.' },
    { question: 'How do I book the BBQ area?', answer: 'The BBQ area cannot be booked and is available on a first-come, first-served basis.' },
    { question: 'Who do I contact for emergency plumbing?', answer: 'Contact the building manager on 555-0199 or Swift Plumbing on 555-0123 out of hours.' }
  ]
};

export const MockAPI = {
  getAnnouncements: async () => {
    await delay(300);
    return MOCK_DATA.announcements;
  },
  
  getEvents: async () => {
    await delay(300);
    return MOCK_DATA.events;
  },
  
  getFaqs: async () => {
    await delay(300);
    return MOCK_DATA.faqs;
  },
  
  chatWithAssistant: async (message, history) => {
    await delay(800);
    return {
      reply: "I am currently in mock mode. To chat properly, you need to configure the real MCP server.",
      history: [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: 'I am currently in mock mode. To chat properly, you need to configure the real MCP server.' }
      ]
    };
  }
};
