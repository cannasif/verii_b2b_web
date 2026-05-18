import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserFromToken, isTokenValid } from '@/utils/jwt';
import { usePermissionsStore } from '@/stores/permissions-store';
import { useAppShellStore } from '@/stores/app-shell-store';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  branch: Branch | null;
  setAuth: (user: User, token: string, branch: Branch | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const ACCESS_TOKEN_KEY = 'access_token';

function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function clearStoredAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      branch: null,
      setAuth: (user, token, branch) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        set({ user, token, branch });
      },
      logout: () => {
        const currentUserId = get().user?.id ?? null;
        clearStoredAuth();
        usePermissionsStore.getState().clearPermissions(currentUserId);
        useAppShellStore.getState().clearAppShellData();
        set({ user: null, token: null, branch: null });
      },
      isAuthenticated: () => {
        const state = get();
        const token = state.token || getStoredToken();

        if (!token || !isTokenValid(token)) {
          if (state.token || state.user || state.branch) {
            clearStoredAuth();
            set({ user: null, token: null, branch: null });
          }
          return false;
        }

        const user = state.user ?? getUserFromToken(token);
        if (!user) {
          clearStoredAuth();
          set({ user: null, token: null, branch: null });
          return false;
        }

        if (state.token !== token || !state.user) {
          set({ user, token, branch: state.branch });
        }

        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, branch: state.branch }),
    }
  )
);
