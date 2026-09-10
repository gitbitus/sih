import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, role, isAuthenticated, logout, setAuth } = useAuthStore();
  
  return {
    user,
    role,
    isAuthenticated,
    logout,
    login: setAuth,
  };
}