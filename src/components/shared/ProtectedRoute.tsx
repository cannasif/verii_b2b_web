import { type ReactElement, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { getUserFromToken, isTokenValid } from '@/utils/jwt';

interface ProtectedRouteProps {
  children: ReactElement;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const storedToken = token || getStoredToken();
  const isAuthenticated = useMemo(() => {
    if (!storedToken || !isTokenValid(storedToken)) {
      return false;
    }

    return !!(user || getUserFromToken(storedToken));
  }, [storedToken, user]);

  useEffect(() => {
    if (!storedToken || isTokenValid(storedToken)) {
      return;
    }

    logout();
  }, [logout, storedToken]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
