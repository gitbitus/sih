import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, role) =>
        set({ user, accessToken, role, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);