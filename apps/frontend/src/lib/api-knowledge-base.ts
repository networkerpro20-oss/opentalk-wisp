import { api } from './api';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  systemPrompt: string | null;
  personality: 'PROFESSIONAL' | 'FRIENDLY' | 'AGGRESSIVE' | 'EDUCATIONAL';
  confidenceThreshold: number;
  autoResponseEnabled: boolean;
  customApiKey: string | null;
  businessHours: any;
  outsideHoursMessage: string | null;
  organizationId: string;
  _count?: { items: number };
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string | null;
  priority: number;
  sourceType: 'URL' | 'DOCUMENT' | 'WIZARD' | 'MANUAL';
  sourceUrl: string | null;
  sourceFileName: string | null;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const knowledgeBaseAPI = {
  // Get or create KB config
  getConfig: async (): Promise<KnowledgeBase> => {
    const { data } = await api.get('/knowledge-base');
    return data;
  },

  // Update KB config
  updateConfig: async (config: Partial<KnowledgeBase>): Promise<KnowledgeBase> => {
    const { data } = await api.patch('/knowledge-base', config);
    return data;
  },

  // List items
  listItems: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: KnowledgeItem[]; meta: { page: number; limit: number; total: number; lastPage: number } }> => {
    const { data } = await api.get('/knowledge-base/items', { params });
    return data;
  },

  // Add manual item
  addItem: async (item: {
    title: string;
    content: string;
    category?: string;
    priority?: number;
    keywords?: string[];
  }): Promise<KnowledgeItem> => {
    const { data } = await api.post('/knowledge-base/items', item);
    return data;
  },

  // Generate from URL
  generateFromUrl: async (url: string): Promise<{ items: KnowledgeItem[]; count: number }> => {
    const { data } = await api.post('/knowledge-base/items/from-url', { url });
    return data;
  },

  // Generate from document
  generateFromDocument: async (file: File): Promise<{ items: KnowledgeItem[]; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/knowledge-base/items/from-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Generate from wizard
  generateFromWizard: async (wizardData: {
    businessName: string;
    mainActivity: string;
    servicesAndPricing: string;
    operatingHours: string;
    location: string;
    frequentQuestions: string;
    differentiators: string;
    policies: string;
    experience: string;
    contactMethods: string;
  }): Promise<{ items: KnowledgeItem[]; count: number }> => {
    const { data } = await api.post('/knowledge-base/items/from-wizard', wizardData);
    return data;
  },

  // Update item
  updateItem: async (id: string, item: Partial<KnowledgeItem>): Promise<KnowledgeItem> => {
    const { data } = await api.patch(`/knowledge-base/items/${id}`, item);
    return data;
  },

  // Delete item
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/knowledge-base/items/${id}`);
  },

  // Test response
  testResponse: async (message: string): Promise<{
    query: string;
    kbContext: string;
    personality: string;
    itemsFound: number;
  }> => {
    const { data } = await api.post('/knowledge-base/test-response', { message });
    return data;
  },
};
