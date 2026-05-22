import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RescueSessionContract, ZooHelpEngine } from '@/services/zoohelpEngine';

const RESCUE_OUTBOX_KEY = 'zoohelp:rescueOutbox:v1';
const ACTIVE_RESCUE_KEY = 'activeRescueId';
const MAX_RESCUE_OUTBOX_ITEMS = 50;

type RescueApi = Pick<ZooHelpEngine, 'triggerRescue' | 'updateRescueLocation' | 'endRescue' | 'createRescueIncident'>;

export type PendingRescueOperation =
  | {
      id: string;
      type: 'trigger';
      postId: string;
      lat: number;
      lng: number;
      accuracy?: number | null;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'location';
      rescueId: string;
      lat: number;
      lng: number;
      accuracy?: number | null;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'end';
      rescueId: string;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'incident';
      rescueId: string;
      description: string;
      attachments: string[];
      createdAt: string;
      attempts: number;
      lastError?: string;
    };

type PendingRescueInput = PendingRescueOperation extends infer T
  ? T extends PendingRescueOperation
    ? Omit<T, 'id' | 'createdAt' | 'attempts'>
    : never
  : never;

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function readQueue(): Promise<PendingRescueOperation[]> {
  const raw = await AsyncStorage.getItem(RESCUE_OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingRescueOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingRescueOperation[]) {
  await AsyncStorage.setItem(RESCUE_OUTBOX_KEY, JSON.stringify(queue.slice(0, MAX_RESCUE_OUTBOX_ITEMS)));
}

export async function enqueueRescueOperation(operation: PendingRescueInput) {
  const queue = await readQueue();
  const next = {
    ...operation,
    id: createLocalId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  } as PendingRescueOperation;
  await writeQueue([...queue, next]);
  return next;
}

export async function listPendingRescueOperations() {
  return readQueue();
}

export async function getOperationalOutboxSummary() {
  const queue = await readQueue();
  return {
    pendingRescueOperations: queue.length,
    pendingCriticalOperations: queue.filter((item) => item.type === 'trigger' || item.type === 'location').length,
  };
}

export async function setActiveRescueId(id: string) {
  await AsyncStorage.setItem(ACTIVE_RESCUE_KEY, id);
}

export async function getActiveRescueId() {
  return AsyncStorage.getItem(ACTIVE_RESCUE_KEY);
}

export async function clearActiveRescueId() {
  await AsyncStorage.removeItem(ACTIVE_RESCUE_KEY);
}

export async function flushRescueOutbox(api: RescueApi) {
  const queue = await readQueue();
  if (!queue.length) return { sent: 0, failed: 0 };

  const remaining: PendingRescueOperation[] = [];
  let sent = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'trigger') {
        const response = await api.triggerRescue({
          postId: item.postId,
          lat: item.lat,
          lng: item.lng,
          accuracy: item.accuracy ?? undefined,
        });
        await setActiveRescueId(response.rescue.id);
      } else if (item.type === 'location') {
        await api.updateRescueLocation(item.rescueId, {
          lat: item.lat,
          lng: item.lng,
          accuracy: item.accuracy ?? undefined,
        });
      } else if (item.type === 'end') {
        await api.endRescue(item.rescueId);
        await clearActiveRescueId();
      } else {
        await api.createRescueIncident(item.rescueId, {
          description: item.description,
          attachments: item.attachments,
        });
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      remaining.push({
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Falha de rede',
      } as PendingRescueOperation);
    }
  }

  await writeQueue(remaining);
  return { sent, failed };
}

export function createPendingRescueSession(postId: string, lat: number, lng: number, accuracy?: number | null): RescueSessionContract {
  const now = new Date().toISOString();
  return {
    id: createLocalId(),
    postId,
    status: 'pending_sync',
    lat,
    lng,
    accuracy,
    createdAt: now,
    updatedAt: now,
  };
}
