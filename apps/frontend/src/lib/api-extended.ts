import { api } from './api';

// Contacts API
export const contactsAPI = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get('/contacts', { params });
    return data;
  },
  
  get: async (id: string) => {
    const { data } = await api.get(`/contacts/${id}`);
    return data;
  },
  
  create: async (contactData: any) => {
    const { data } = await api.post('/contacts', contactData);
    return data;
  },
  
  update: async (id: string, updateData: any) => {
    const { data } = await api.patch(`/contacts/${id}`, updateData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/contacts/${id}`);
    return data;
  },
  
  getStats: async () => {
    const { data } = await api.get('/contacts/stats');
    return data;
  },
};

// Conversations API
export const conversationsAPI = {
  list: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await api.get('/conversations', { params });
    return data;
  },
  
  get: async (id: string) => {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  },
  
  create: async (conversationData: any) => {
    const { data } = await api.post('/conversations', conversationData);
    return data;
  },
};

// WhatsApp API
export const whatsappAPI = {
  listInstances: async () => {
    const { data } = await api.get('/whatsapp/instances');
    return data;
  },
  
  createInstance: async (instanceData: { name: string }) => {
    const { data } = await api.post('/whatsapp/instances', instanceData);
    return data;
  },
  
  getQRCode: async (id: string) => {
    const { data } = await api.get(`/whatsapp/instances/${id}/qr`);
    return data;
  },
  
  sendMessage: async (messageData: { instanceId: string; to: string; message: string }) => {
    const { data } = await api.post('/whatsapp/send', messageData);
    return data;
  },

  sendMedia: async (mediaData: { 
    instanceId: string; 
    to: string; 
    type: 'image' | 'video' | 'audio' | 'document';
    mediaUrl: string;
    caption?: string;
    fileName?: string;
    mimeType?: string;
  }) => {
    const { data } = await api.post('/whatsapp/send-media', mediaData);
    return data;
  },

  deleteInstance: async (id: string) => {
    const { data} = await api.delete(`/whatsapp/instances/${id}`);
    return data;
  },
};
