import { api } from './api';

export const webhooksAPI = {
  list: async () => {
    const { data } = await api.get('/webhooks');
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/webhooks/${id}`);
    return data;
  },

  create: async (webhook: { name: string; url: string; secret?: string; events: string[] }) => {
    const { data } = await api.post('/webhooks', webhook);
    return data;
  },

  update: async (id: string, webhook: any) => {
    const { data } = await api.patch(`/webhooks/${id}`, webhook);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/webhooks/${id}`);
    return data;
  },

  test: async (id: string) => {
    const { data } = await api.post(`/webhooks/${id}/test`);
    return data;
  },

  getLogs: async (id: string, page = 1) => {
    const { data } = await api.get(`/webhooks/${id}/logs`, { params: { page } });
    return data;
  },

  getEvents: async () => {
    const { data } = await api.get('/webhooks/events');
    return data;
  },
};

export const apiKeysAPI = {
  list: async () => {
    const { data } = await api.get('/api-keys');
    return data;
  },

  generate: async (name: string, permissions: string[]) => {
    const { data } = await api.post('/api-keys', { name, permissions });
    return data;
  },

  revoke: async (id: string) => {
    const { data } = await api.post(`/api-keys/${id}/revoke`);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api-keys/${id}`);
    return data;
  },
};
