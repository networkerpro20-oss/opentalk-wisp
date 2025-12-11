import { api } from './api';

// Teams API
export const teamsAPI = {
  list: async () => {
    const { data } = await api.get('/teams');
    return data;
  },
  
  get: async (id: string) => {
    const { data } = await api.get(`/teams/${id}`);
    return data;
  },
  
  create: async (teamData: any) => {
    const { data } = await api.post('/teams', teamData);
    return data;
  },
  
  update: async (id: string, teamData: any) => {
    const { data } = await api.patch(`/teams/${id}`, teamData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/teams/${id}`);
    return data;
  },
  
  addMember: async (teamId: string, memberData: any) => {
    const { data } = await api.post(`/teams/${teamId}/members`, memberData);
    return data;
  },
  
  removeMember: async (teamId: string, memberId: string) => {
    const { data } = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return data;
  },
  
  getStats: async (teamId: string) => {
    const { data } = await api.get(`/teams/${teamId}/stats`);
    return data;
  },
};

// Routing API
export const routingAPI = {
  list: async () => {
    const { data } = await api.get('/routing');
    return data;
  },
  
  create: async (ruleData: any) => {
    const { data } = await api.post('/routing', ruleData);
    return data;
  },
  
  update: async (id: string, ruleData: any) => {
    const { data } = await api.patch(`/routing/${id}`, ruleData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/routing/${id}`);
    return data;
  },
  
  evaluate: async (conversationId: string) => {
    const { data } = await api.post(`/routing/evaluate/${conversationId}`);
    return data;
  },
};

// Presence API
export const presenceAPI = {
  getMyStatus: async () => {
    const { data } = await api.get('/presence/me');
    return data;
  },
  
  updateMyStatus: async (statusData: any) => {
    const { data } = await api.patch('/presence/me', statusData);
    return data;
  },
  
  getUserStatus: async (userId: string) => {
    const { data } = await api.get(`/presence/user/${userId}`);
    return data;
  },
  
  getTeamPresence: async (teamId: string) => {
    const { data } = await api.get(`/presence/team/${teamId}`);
    return data;
  },
  
  getOnlineUsers: async () => {
    const { data } = await api.get('/presence/online');
    return data;
  },
  
  heartbeat: async () => {
    const { data } = await api.patch('/presence/heartbeat');
    return data;
  },
};

// Quick Replies API
export const quickRepliesAPI = {
  list: async (isActive?: boolean) => {
    const params = isActive !== undefined ? { isActive } : {};
    const { data } = await api.get('/quick-replies', { params });
    return data;
  },
  
  search: async (query: string) => {
    const { data } = await api.get('/quick-replies/search', { params: { q: query } });
    return data;
  },
  
  getByShortcut: async (shortcut: string) => {
    const { data } = await api.get(`/quick-replies/shortcut/${shortcut}`);
    return data;
  },
  
  create: async (replyData: any) => {
    const { data } = await api.post('/quick-replies', replyData);
    return data;
  },
  
  update: async (id: string, replyData: any) => {
    const { data } = await api.patch(`/quick-replies/${id}`, replyData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/quick-replies/${id}`);
    return data;
  },
};

// Internal Notes API
export const internalNotesAPI = {
  listByConversation: async (conversationId: string) => {
    const { data } = await api.get(`/internal-notes/conversation/${conversationId}`);
    return data;
  },
  
  listMyNotes: async () => {
    const { data } = await api.get('/internal-notes/my-notes');
    return data;
  },
  
  search: async (query: string) => {
    const { data } = await api.get('/internal-notes/search', { params: { q: query } });
    return data;
  },
  
  create: async (noteData: any) => {
    const { data } = await api.post('/internal-notes', noteData);
    return data;
  },
  
  update: async (id: string, noteData: any) => {
    const { data } = await api.patch(`/internal-notes/${id}`, noteData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/internal-notes/${id}`);
    return data;
  },
};

// Tags API
export const tagsAPI = {
  list: async () => {
    const { data } = await api.get('/tags');
    return data;
  },
  
  create: async (tagData: any) => {
    const { data } = await api.post('/tags', tagData);
    return data;
  },
  
  update: async (id: string, tagData: any) => {
    const { data } = await api.patch(`/tags/${id}`, tagData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/tags/${id}`);
    return data;
  },
  
  assignToContact: async (contactId: string, tagIds: string[]) => {
    const { data } = await api.post(`/tags/contact/${contactId}/assign`, { tagIds });
    return data;
  },
  
  getContactTags: async (contactId: string) => {
    const { data } = await api.get(`/tags/contact/${contactId}`);
    return data;
  },
  
  assignToConversation: async (conversationId: string, tagIds: string[]) => {
    const { data } = await api.post(`/tags/conversation/${conversationId}/assign`, { tagIds });
    return data;
  },
  
  getConversationTags: async (conversationId: string) => {
    const { data } = await api.get(`/tags/conversation/${conversationId}`);
    return data;
  },
};

// Users API (needed for team members)
export const usersAPI = {
  list: async () => {
    const { data } = await api.get('/users');
    return data;
  },
};
