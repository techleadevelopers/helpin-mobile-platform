import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi } from '@/services/zoohelpApi';

const getToken = getStoredAccessToken;

export const supportService = {
  async getMeta() {
    return createZooHelpApi(getToken)?.supportMeta()
      ?? { categories: ['RESCUE', 'APP', 'DONATION', 'SAFETY', 'OTHER'], severities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] };
  },
  async getTickets() {
    return createZooHelpApi(getToken)?.supportTickets() ?? [];
  },
  async createTicket(input: { subject: string; body: string; category?: string; severity?: string }) {
    return createZooHelpApi(getToken)?.createSupportTicket(input);
  },
  async getTicketDetails(id: string) {
    return createZooHelpApi(getToken)?.supportTicket(id);
  },
  async addMessageToTicket(id: string, body: string) {
    return createZooHelpApi(getToken)?.addSupportMessage(id, body);
  },
};
