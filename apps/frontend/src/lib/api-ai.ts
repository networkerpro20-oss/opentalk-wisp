import { api } from './api';

export const aiAPI = {
  // Generate auto-response
  generateResponse: async (data: {
    conversationId: string;
    context?: string;
  }) => {
    const response = await api.post('/ai/generate-response', data);
    return response.data;
  },

  // Analyze sentiment
  analyzeSentiment: async (data: {
    text: string;
    messageId?: string;
  }) => {
    const response = await api.post('/ai/analyze-sentiment', data);
    return response.data;
  },

  // Score lead potential
  scoreLead: async (data: {
    contactId: string;
    conversationId?: string;
  }) => {
    const response = await api.post('/ai/score-lead', data);
    return response.data;
  },

  // Summarize conversation
  summarizeConversation: async (conversationId: string) => {
    const response = await api.post('/ai/summarize-conversation', {
      conversationId,
    });
    return response.data;
  },

  // Extract contact info
  extractContactInfo: async (text: string) => {
    const response = await api.post('/ai/extract-contact-info', { text });
    return response.data;
  },

  // Suggest actions
  suggestActions: async (conversationId: string) => {
    const response = await api.post('/ai/suggest-actions', {
      conversationId,
    });
    return response.data;
  },

  // Classify message
  classifyMessage: async (data: {
    text: string;
    categories?: string[];
  }) => {
    const response = await api.post('/ai/classify-message', data);
    return response.data;
  },

  // Get AI config
  getConfig: async () => {
    const response = await api.get('/ai/config');
    return response.data;
  },
};
