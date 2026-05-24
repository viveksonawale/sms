import { apiClient } from './apiClient';
import type { OwnerRequest, OwnerResponse } from './types';

export const OwnerService = {
  getAllOwners: async (): Promise<OwnerResponse[]> => {
    const response = await apiClient.get<OwnerResponse[]>('/owners');
    return response.data;
  },

  getOwnerById: async (id: number): Promise<OwnerResponse> => {
    const response = await apiClient.get<OwnerResponse>(`/owners/${id}`);
    return response.data;
  },

  getOwnerByFlatNumber: async (flatNumber: string): Promise<OwnerResponse> => {
    const response = await apiClient.get<OwnerResponse>(`/owners/flat/${flatNumber}`);
    return response.data;
  },

  createOwner: async (data: OwnerRequest): Promise<OwnerResponse> => {
    const response = await apiClient.post<OwnerResponse>('/owners', data);
    return response.data;
  },

  updateOwner: async (id: number, data: OwnerRequest): Promise<OwnerResponse> => {
    const response = await apiClient.put<OwnerResponse>(`/owners/${id}`, data);
    return response.data;
  },

  deleteOwner: async (id: number): Promise<void> => {
    await apiClient.delete(`/owners/${id}`);
  },
};
