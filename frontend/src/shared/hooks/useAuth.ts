import { create } from 'zustand';
import { apiClient } from '../../api/apiClient';

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'SITE_ENGINEER';
  projectIds: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  mockLogin?: (role: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchUser: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      localStorage.setItem('userRole', res.role.toLowerCase());
      set({ user: res, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('userRole');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (phone: string, otp: string) => {
    // This expects /verify-otp to set cookies and return success
    await apiClient.post('/auth/verify-otp', { phone, otp });
    
    // Once successful, fetch the user data
    const res = await apiClient.get('/auth/me');
    localStorage.setItem('userRole', res.role.toLowerCase());
    set({ user: res, isAuthenticated: true });
  },

  mockLogin: async (role: string) => {
    await apiClient.post('/auth/mock-login', { role });
    const res = await apiClient.get('/auth/me');
    localStorage.setItem('userRole', res.role.toLowerCase());
    set({ user: res, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('userRole');
      set({ user: null, isAuthenticated: false });
    }
  }
}));
