import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_TOKEN_KEY, createZooHelpApi } from '@/services/zoohelpApi';

const getToken = () => AsyncStorage.getItem(AUTH_TOKEN_KEY);

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
