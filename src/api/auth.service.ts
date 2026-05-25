import { apiClient } from './apiClient';
import type { AuthRequest, AuthResponse } from './types';

export const AuthService = {
  /**
   * Login to the backend and receive a JWT.
   */
  login: async (credentials: AuthRequest): Promise<AuthResponse> => {
    // Intentionally overriding the base url to match the backend path structure from the controller
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout function (frontend only) - clear token
   */
  logout: () => {
    sessionStorage.removeItem('token');
  },
};
