import { apiClient } from './apiClient';
import type { MaintenanceRequest, MaintenanceResponse } from './types';

export const MaintenanceService = {
  createMaintenance: async (data: MaintenanceRequest): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>('/maintenance', data);
    return response.data;
  },

  getByOwner: async (ownerId: number): Promise<MaintenanceResponse[]> => {
    const response = await apiClient.get<MaintenanceResponse[]>(`/maintenance/owner/${ownerId}`);
    return response.data;
  },

  getPending: async (): Promise<MaintenanceResponse[]> => {
    const response = await apiClient.get<MaintenanceResponse[]>('/maintenance/pending');
    return response.data;
  },

  getMaintenanceById: async (id: number): Promise<MaintenanceResponse> => {
    const response = await apiClient.get<MaintenanceResponse>(`/maintenance/${id}`);
    return response.data;
  },

  markAsPaid: async (id: number, transactionId?: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.patch<MaintenanceResponse>(`/maintenance/${id}/pay`, null, {
      params: { transactionId },
    });
    return response.data;
  },

  deleteMaintenance: async (id: number): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}`);
  },
};
