import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { getUserFromToken } from '@/utils/jwt';
import type { LoginRequest, Branch } from '../types/auth';

export const useLogin = (branches?: Branch[]) => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response, variables) => {
      if (response.success && response.data) {
        const user = getUserFromToken(response.data);
        if (user) {
          const selectedBranch = branches?.find((b) => b.id === variables.branchId) || null;
          setAuth(user, response.data, selectedBranch);
          try {
            const portalSession = await authApi.createMyB2bPortalSession();
            if (portalSession.success && portalSession.data) {
              window.localStorage.setItem('v3rii-b2b-portal-session', JSON.stringify(portalSession.data));
              navigate('/b2b-portal');
              return;
            }
          } catch {
            window.localStorage.removeItem('v3rii-b2b-portal-session');
          }
          navigate('/dashboard');
        }
      }
    },
  });
};
