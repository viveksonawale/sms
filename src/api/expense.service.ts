import { apiClient } from './apiClient';
import type { ExpenseRequest, ExpenseResponse } from './types';

export const ExpenseService = {
  createExpense: async (data: ExpenseRequest): Promise<ExpenseResponse> => {
    const response = await apiClient.post<ExpenseResponse>('/expenses', data);
    return response.data;
  },

  getAllExpenses: async (): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get<ExpenseResponse[]>('/expenses');
    return response.data;
  },

  getExpensesByRange: async (from: string, to: string): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get<ExpenseResponse[]>('/expenses/range', {
      params: { from, to },
    });
    return response.data;
  },

  getExpenseById: async (id: number): Promise<ExpenseResponse> => {
    const response = await apiClient.get<ExpenseResponse>(`/expenses/${id}`);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  updateExpense: async (id: number, data: ExpenseRequest): Promise<ExpenseResponse> => {
    const response = await apiClient.put<ExpenseResponse>(`/expenses/${id}`, data);
    return response.data;
  },
};
