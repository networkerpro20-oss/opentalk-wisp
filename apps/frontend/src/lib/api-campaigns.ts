import { api } from './api';

export const campaignsAPI = {
  list: async (status?: string) => {
    const response = await api.get('/campaigns', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    targetSegment: any;
    messageTemplate: string;
    mediaUrl?: string;
    scheduledAt?: string;
    messagesPerMinute?: number;
    autoStart?: boolean;
  }) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/campaigns/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },

  start: async (id: string) => {
    const response = await api.post(`/campaigns/${id}/start`);
    return response.data;
  },

  pause: async (id: string) => {
    const response = await api.post(`/campaigns/${id}/pause`);
    return response.data;
  },

  resume: async (id: string) => {
    const response = await api.post(`/campaigns/${id}/resume`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get(`/campaigns/${id}/stats`);
    return response.data;
  },
};
