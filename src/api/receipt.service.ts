import { apiClient } from './apiClient';
import type { ReceiptResponse } from './types';

export const ReceiptService = {
  getReceiptById: async (id: number): Promise<ReceiptResponse> => {
    const response = await apiClient.get<ReceiptResponse>(`/receipts/${id}`);
    return response.data;
  },

  getReceiptByMaintenance: async (maintenanceId: number): Promise<ReceiptResponse> => {
    const response = await apiClient.get<ReceiptResponse>(`/receipts/maintenance/${maintenanceId}`);
    return response.data;
  },

  /**
   * Downloads the receipt PDF from the backend and triggers a browser save dialog.
   */
  downloadReceiptPdf: async (id: number): Promise<void> => {
    const response = await apiClient.get(`/receipts/${id}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header, or use default
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `receipt-${id}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
  },

  /**
   * Fetches the receipt PDF as a raw Blob (for Web Share API / WhatsApp sharing).
   */
  getReceiptBlob: async (id: number): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get(`/receipts/${id}/download`, {
      responseType: 'blob',
    });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `receipt-${id}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }
    return { blob: new Blob([response.data], { type: 'application/pdf' }), filename };
  },

  /**
   * Deletes a receipt by ID. Also resets the linked maintenance back to PENDING.
   */
  deleteReceipt: async (id: number): Promise<void> => {
    await apiClient.delete(`/receipts/${id}`);
  },
};
