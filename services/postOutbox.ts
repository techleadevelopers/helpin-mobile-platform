import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Post } from '@/constants/data';

const POST_OUTBOX_KEY = 'zoohelp:postOutbox:v2';
const LEGACY_POST_OUTBOX_KEY = 'zoohelp:postOutbox:v1';
const MAX_POST_ATTEMPTS = 8;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;

export type UploadedPostMedia = {
  uploadId: string;
  objectKey: string;
  publicUrl: string;
  contentType: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
};

export type PendingPost = {
  id: string;
  post: Post;
  attempts: number;
  createdAt: string;
  idempotencyKey: string;
  nextAttemptAt: string | null;
  status: 'pending' | 'failed';
  uploadedMedia: UploadedPostMedia[];
  lastError?: string;
};

async function readQueue(): Promise<PendingPost[]> {
  const raw = (await AsyncStorage.getItem(POST_OUTBOX_KEY)) ?? await AsyncStorage.getItem(LEGACY_POST_OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<PendingPost>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingPost => Boolean(item?.id && item.post && item.idempotencyKey)).map((item) => ({
      ...item,
      attempts: item.attempts ?? 0,
      nextAttemptAt: item.nextAttemptAt ?? new Date().toISOString(),
      status: item.status === 'failed' ? 'failed' : 'pending',
      uploadedMedia: item.uploadedMedia ?? [],
    }));
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingPost[]) {
  // Posts are user data; terminal failures remain available for an explicit retry.
  await AsyncStorage.setItem(POST_OUTBOX_KEY, JSON.stringify(queue));
}

export function createPostIdempotencyKey() {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export async function enqueuePost(post: Post, idempotencyKey = createPostIdempotencyKey(), lastError?: string) {
  const queue = await readQueue();
  const existing = queue.find((item) => item.id === post.id);
  if (existing) return existing;
  const next: PendingPost = {
    id: post.id,
    post,
    attempts: 0,
    createdAt: new Date().toISOString(),
    idempotencyKey,
    nextAttemptAt: new Date().toISOString(),
    status: 'pending',
    uploadedMedia: [],
    lastError,
  };
  await writeQueue([next, ...queue]);
  return next;
}

export async function listPendingPosts() {
  return readQueue();
}

export async function listDuePendingPosts(now = Date.now()) {
  return (await readQueue()).filter((item) => item.status === 'pending' && (!item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= now));
}

export async function removePendingPost(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function savePendingPostUploads(id: string, uploadedMedia: UploadedPostMedia[]) {
  await writeQueue((await readQueue()).map((item) => item.id === id ? { ...item, uploadedMedia } : item));
}

export async function markPendingPostAttempt(id: string, lastError?: string, retryAfterMs?: number) {
  const now = Date.now();
  await writeQueue((await readQueue()).map((item) => {
    if (item.id !== id) return item;
    const attempts = item.attempts + 1;
    if (attempts >= MAX_POST_ATTEMPTS) return { ...item, attempts, status: 'failed' as const, nextAttemptAt: null, lastError };
    const exponential = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempts, 12));
    const jittered = Math.round(exponential * (0.75 + Math.random() * 0.5));
    return {
      ...item,
      attempts,
      status: 'pending' as const,
      nextAttemptAt: new Date(now + Math.max(retryAfterMs ?? 0, jittered)).toISOString(),
      lastError,
    };
  }));
}

export async function retryPendingPost(id: string) {
  await writeQueue((await readQueue()).map((item) => item.id === id
    ? { ...item, attempts: 0, status: 'pending' as const, nextAttemptAt: new Date().toISOString(), lastError: undefined }
    : item));
}
