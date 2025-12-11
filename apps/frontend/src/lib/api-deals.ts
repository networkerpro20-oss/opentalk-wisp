import { api } from './api';

// ==================== PIPELINES ====================

export const pipelinesAPI = {
  list: async () => {
    const response = await api.get('/pipelines');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/pipelines/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/pipelines', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/pipelines/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pipelines/${id}`);
    return response.data;
  },

  // Stages
  createStage: async (pipelineId: string, data: any) => {
    const response = await api.post(`/pipelines/${pipelineId}/stages`, data);
    return response.data;
  },

  updateStage: async (pipelineId: string, stageId: string, data: any) => {
    const response = await api.patch(`/pipelines/${pipelineId}/stages/${stageId}`, data);
    return response.data;
  },

  deleteStage: async (pipelineId: string, stageId: string) => {
    const response = await api.delete(`/pipelines/${pipelineId}/stages/${stageId}`);
    return response.data;
  },

  reorderStages: async (pipelineId: string, stageIds: string[]) => {
    const response = await api.patch(`/pipelines/${pipelineId}/stages/reorder`, { stageIds });
    return response.data;
  },
};

// ==================== DEALS ====================

export const dealsAPI = {
  list: async (params?: {
    page?: number;
    limit?: number;
    pipelineId?: string;
    stageId?: string;
    assignedToId?: string;
    contactId?: string;
    status?: 'OPEN' | 'WON' | 'LOST';
  }) => {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    value: number;
    currency: string;
    pipelineId: string;
    stageId: string;
    contactId: string;
    assignedToId?: string;
    probability?: number;
    expectedCloseDate?: string;
  }) => {
    const response = await api.post('/deals', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/deals/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  },

  // Move deal between stages
  moveToStage: async (id: string, stageId: string) => {
    const response = await api.patch(`/deals/${id}/move/${stageId}`);
    return response.data;
  },

  // Mark as won/lost
  markAsWon: async (id: string) => {
    const response = await api.patch(`/deals/${id}/won`);
    return response.data;
  },

  markAsLost: async (id: string) => {
    const response = await api.patch(`/deals/${id}/lost`);
    return response.data;
  },

  // Statistics
  getStats: async () => {
    const response = await api.get('/deals/stats');
    return response.data;
  },

  // Get deals by pipeline (for Kanban view)
  getByPipeline: async (pipelineId: string) => {
    const response = await api.get(`/deals/pipeline/${pipelineId}`);
    return response.data;
  },
};
