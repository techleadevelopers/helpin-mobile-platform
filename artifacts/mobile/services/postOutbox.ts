import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Post } from '@/constants/data';

const POST_OUTBOX_KEY = 'zoohelp:postOutbox:v1';
const MAX_POST_OUTBOX_ITEMS = 20;

export type PendingPost = {
  id: string;
  post: Post;
  attempts: number;
  createdAt: string;
  idempotencyKey: string;
  lastError?: string;
};

async function readQueue(): Promise<PendingPost[]> {
  const raw = await AsyncStorage.getItem(POST_OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingPost[]) {
  await AsyncStorage.setItem(POST_OUTBOX_KEY, JSON.stringify(queue.slice(0, MAX_POST_OUTBOX_ITEMS)));
}

export async function enqueuePost(post: Post, lastError?: string) {
  const queue = await readQueue();
  const next: PendingPost = {
    id: post.id,
    post,
    attempts: 0,
    createdAt: new Date().toISOString(),
    idempotencyKey: createIdempotencyKey(),
    lastError,
  };
  await writeQueue([next, ...queue.filter((item) => item.id !== post.id)]);
  return next;
}

function createIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function listPendingPosts() {
  return readQueue();
}

export async function removePendingPost(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function markPendingPostAttempt(id: string, lastError?: string) {
  const queue = await readQueue();
  await writeQueue(
    queue.map((item) =>
      item.id === id
        ? { ...item, attempts: item.attempts + 1, lastError }
        : item,
    ),
  );
}
