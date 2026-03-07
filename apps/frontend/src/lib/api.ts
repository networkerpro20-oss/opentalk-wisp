import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    // Solo acceder a localStorage en el cliente
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login si es 401 y no estamos ya en login
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage'); // Clear zustand persisted state
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationSlug: string;
  }) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
  
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Organizations API
export const organizationsAPI = {
  getMe: async () => {
    const { data } = await api.get('/organizations/me');
    return data;
  },
  
  update: async (updateData: any) => {
    const { data } = await api.patch('/organizations/me', updateData);
    return data;
  },
  
  getStats: async () => {
    const { data } = await api.get('/organizations/me/stats');
    return data;
  },
};

// Users API
export const usersAPI = {
  list: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  
  get: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  
  create: async (userData: any) => {
    const { data } = await api.post('/users', userData);
    return data;
  },
  
  update: async (id: string, updateData: any) => {
    const { data } = await api.patch(`/users/${id}`, updateData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};
