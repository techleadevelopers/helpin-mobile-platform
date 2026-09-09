import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Post } from '@/constants/data';

const FEED_CACHE_KEY = 'zoohelp:feedCache:v1';

export async function loadCachedFeed(): Promise<Post[]> {
  const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Post[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCachedFeed(posts: Post[]) {
  await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(posts.slice(0, 100)));
}
