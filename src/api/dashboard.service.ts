import { apiClient } from './apiClient';
import type { DashboardResponse } from './types';

export const DashboardService = {
  /**
   * Get dashboard summary data.
   */
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>('/dashboard');
    return response.data;
  },
};
