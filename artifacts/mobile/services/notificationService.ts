import type { NotificationContract } from '@/services/zoohelpEngine';
import { createZooHelpApi } from '@/services/zoohelpApi';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  deeplink?: string | null;
  imageUrl?: string | null;
  dedupeKey?: string | null;
  ttlSeconds?: number | null;
  category?: string | null;
  kind: string;
  postId?: string | null;
  distanceKm?: number | null;
  critical: boolean;
  payload?: Record<string, unknown> | null;
}

export function toAppNotification(raw: NotificationContract | any): AppNotification {
  const payload = raw?.payload ?? raw?.meta ?? raw?.data ?? null;
  return {
    id: String(raw?.id ?? ''),
    title: raw?.title ?? payload?.title ?? 'Notificação',
    body: raw?.body ?? raw?.message ?? payload?.message ?? 'Você recebeu uma notificação',
    isRead: Boolean(raw?.read ?? raw?.isRead ?? raw?.readAt ?? raw?.acknowledgedAt),
    createdAt: raw?.createdAt ?? raw?.created_at ?? raw?.timestamp ?? new Date().toISOString(),
    deeplink: raw?.deeplink ?? raw?.deepLink ?? payload?.deeplink ?? payload?.deepLink ?? null,
    imageUrl: raw?.imageUrl ?? raw?.image_url ?? payload?.imageUrl ?? null,
    dedupeKey: raw?.dedupeKey ?? payload?.dedupeKey ?? null,
    ttlSeconds: raw?.ttlSeconds ?? payload?.ttlSeconds ?? null,
    category: raw?.category ?? payload?.category ?? null,
    kind: raw?.kind ?? raw?.type ?? payload?.type ?? 'system',
    postId: raw?.postId ?? raw?.post_id ?? payload?.postId ?? null,
    distanceKm: raw?.distanceKm ?? raw?.distance_km ?? null,
    critical: Boolean(raw?.critical ?? payload?.critical),
    payload,
  };
}

export async function getNotifications(getAccessToken?: () => Promise<string | null>) {
  const api = createZooHelpApi(getAccessToken);
  if (!api) return [];
  const items = await api.notifications();
  return items.map(toAppNotification);
}

export async function markNotificationAsRead(id: string, getAccessToken?: () => Promise<string | null>) {
  return createZooHelpApi(getAccessToken)?.markNotificationAsRead(id);
}

export async function ackNotification(id: string, getAccessToken?: () => Promise<string | null>) {
  return createZooHelpApi(getAccessToken)?.ackNotification(id);
}
