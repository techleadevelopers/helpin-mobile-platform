import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RescueSessionContract, ZooHelpEngine } from '@/services/zoohelpEngine';

const RESCUE_OUTBOX_KEY = 'zoohelp:rescueOutbox:v2';
const RESCUE_DEAD_LETTER_KEY = 'zoohelp:rescueOutbox:dead-letter:v1';
const ACTIVE_RESCUE_KEY = 'activeRescueId';
const MAX_ATTEMPTS = 12;

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
      idempotencyKey: string;
      nextAttemptAt?: string;
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
      idempotencyKey: string;
      nextAttemptAt?: string;
    }
  | {
      id: string;
      type: 'end';
      rescueId: string;
      createdAt: string;
      attempts: number;
      lastError?: string;
      idempotencyKey: string;
      nextAttemptAt?: string;
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
      idempotencyKey: string;
      nextAttemptAt?: string;
    };

type PendingRescueInput = PendingRescueOperation extends infer T
  ? T extends PendingRescueOperation
    ? Omit<T, 'id' | 'createdAt' | 'attempts' | 'idempotencyKey' | 'nextAttemptAt'>
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
  // Critical commands must never be silently discarded due to an arbitrary
  // queue length. Storage pressure is surfaced through the dead-letter queue.
  await AsyncStorage.setItem(RESCUE_OUTBOX_KEY, JSON.stringify(queue));
}

export async function enqueueRescueOperation(operation: PendingRescueInput) {
  const queue = await readQueue();
  // A post can be promoted/replayed several times; triggering it is one
  // causal command. Keep the original key and location rather than enqueueing
  // a second rescue session.
  if (operation.type === 'trigger') {
    const existing = queue.find((item) => item.type === 'trigger' && item.postId === operation.postId);
    if (existing) return existing;
  }
  const next = {
    ...operation,
    id: createLocalId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    idempotencyKey: createLocalId(),
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
    if (item.nextAttemptAt && Date.parse(item.nextAttemptAt) > Date.now()) {
      remaining.push(item);
      continue;
    }
    try {
      if (item.type === 'trigger') {
        const response = await api.triggerRescue({
          postId: item.postId,
          lat: item.lat,
          lng: item.lng,
          accuracy: item.accuracy ?? undefined,
          idempotencyKey: item.idempotencyKey,
        });
        await setActiveRescueId(response.rescue.id);
        // Commands queued while offline refer to the trigger operation's
        // local id. Resolve every dependent command before it can be sent.
        const unresolved = queue.slice(queue.indexOf(item) + 1).map((candidate) =>
          'rescueId' in candidate && candidate.rescueId === item.id
            ? { ...candidate, rescueId: response.rescue.id } as PendingRescueOperation
            : candidate,
        );
        queue.splice(queue.indexOf(item) + 1, unresolved.length, ...unresolved);
      } else if (item.type === 'location') {
        await api.updateRescueLocation(item.rescueId, {
          lat: item.lat,
          lng: item.lng,
          accuracy: item.accuracy ?? undefined,
          idempotencyKey: item.idempotencyKey,
        });
      } else if (item.type === 'end') {
        await api.endRescue(item.rescueId, item.idempotencyKey);
        await clearActiveRescueId();
      } else {
        await api.createRescueIncident(item.rescueId, {
          description: item.description,
          attachments: item.attachments,
          idempotencyKey: item.idempotencyKey,
        });
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      const retry = {
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Falha de rede',
        nextAttemptAt: new Date(Date.now() + retryDelayMs(item.attempts + 1)).toISOString(),
      } as PendingRescueOperation;
      if (retry.attempts >= MAX_ATTEMPTS) {
        const deadLetters = await readDeadLetters();
        await AsyncStorage.setItem(RESCUE_DEAD_LETTER_KEY, JSON.stringify([...deadLetters, retry]));
      } else {
        remaining.push(retry);
        // Preserve causal ordering. A location/end must not overtake a
        // trigger that has not yet received its canonical rescue id.
        remaining.push(...queue.slice(queue.indexOf(item) + 1));
        break;
      }
    }
  }

  await writeQueue(remaining);
  return { sent, failed };
}

async function readDeadLetters(): Promise<PendingRescueOperation[]> {
  const raw = await AsyncStorage.getItem(RESCUE_DEAD_LETTER_KEY);
  try { return raw ? JSON.parse(raw) as PendingRescueOperation[] : []; } catch { return []; }
}

function retryDelayMs(attempt: number) {
  const base = Math.min(5 * 60_000, 1_000 * 2 ** Math.min(attempt, 8));
  return Math.round(base * (0.75 + Math.random() * 0.5));
}

export function createPendingRescueSession(postId: string, lat: number, lng: number, accuracy?: number | null, localId = createLocalId()): RescueSessionContract {
  const now = new Date().toISOString();
  return {
    id: localId,
    postId,
    status: 'pending_sync',
    lat,
    lng,
    accuracy,
    createdAt: now,
    updatedAt: now,
  };
}
