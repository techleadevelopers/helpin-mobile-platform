import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { Post } from '@/constants/data';
import { loadCachedFeed, saveCachedFeed } from '@/services/feedCache';
import { getCurrentCoordsIfGranted } from '@/services/locationService';
import { enqueuePost, listPendingPosts, markPendingPostAttempt, removePendingPost } from '@/services/postOutbox';
import { enqueueRescueOperation, flushRescueOutbox, listPendingRescueOperations } from '@/services/rescueOutbox';
import { registerRescueAlerts } from '@/services/rescueNotifications';
import { clearSessionTokens, getSecureItem, setSecureItem, REFRESH_TOKEN_KEY } from '@/services/secureSession';
import { AUTH_TOKEN_KEY, createZooHelpApi, mapPost, supportPaymentsEnabled, uploadLocalImageToCloudinary } from '@/services/zoohelpApi';
import { ZooHelpApiError } from '@/services/zoohelpEngine';

const DELETED_POST_IDS_KEY = 'zoohelp:deletedPostIds:v1';
const POST_IMAGES_CACHE_KEY = 'zoohelp:postImages:v1';
const MAX_LOCAL_DELETED_POST_IDS = 200;
const MAX_POST_IMAGES_CACHE_ITEMS = 500;

function postSortTime(post: Post) {
  if (post.createdAt === 'agora' || post.createdAt === 'pendente') return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(post.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortPostsNewestFirst(posts: Post[]) {
  return [...posts].sort((a, b) => {
    const byTime = postSortTime(b) - postSortTime(a);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });
}

function isPersistablePostImage(uri: string) {
  return Platform.OS !== 'web' || !uri.startsWith('blob:');
}

function uniquePostImages(images: Array<string | null | undefined>) {
  return Array.from(new Set(images.filter((uri): uri is string => Boolean(uri)))).filter(isPersistablePostImage);
}

function postImageList(post: Post) {
  return uniquePostImages([...(post.images ?? []), post.image]);
}

function mergePostImages(post: Post, fallback?: Post | string[]) {
  const currentImages = postImageList(post);
  const fallbackImages = Array.isArray(fallback) ? uniquePostImages(fallback) : fallback ? postImageList(fallback) : [];
  const bestImages = currentImages.length >= fallbackImages.length ? currentImages : fallbackImages;

  if (bestImages.length === 0) return post;

  return {
    ...post,
    image: bestImages[0],
    images: bestImages,
  };
}

async function loadPostImagesCache() {
  const raw = await AsyncStorage.getItem(POST_IMAGES_CACHE_KEY).catch(() => null);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([postId, images]) => [
          postId,
          Array.isArray(images) ? uniquePostImages(images as Array<string | null | undefined>) : [],
        ] as const)
        .filter(([, images]) => images.length > 0),
    ) as Record<string, string[]>;
  } catch {
    return {};
  }
}

async function rememberPostImages(post: Post) {
  const images = postImageList(post);
  if (images.length < 2) return;

  const cache = await loadPostImagesCache();
  if ((cache[post.id]?.length ?? 0) >= images.length) return;

  cache[post.id] = images;
  const trimmed = Object.fromEntries(Object.entries(cache).slice(-MAX_POST_IMAGES_CACHE_ITEMS));
  await AsyncStorage.setItem(POST_IMAGES_CACHE_KEY, JSON.stringify(trimmed)).catch(() => {});
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  type: 'person' | 'ong' | 'vet';
  gender?: 'male' | 'female' | null;
  verified: boolean;
  verificationStatus?: string | null;
  postsCount: number;
  helpedCount: number;
  adoptionsCount: number;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  posts: Post[];
  likedPosts: string[];
  followedOngs: string[];
  followedUsers: string[];
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    type?: 'person' | 'ong',
    profile?: {
      avatar?: string | null;
      gender?: 'male' | 'female' | null;
      ongType?: string;
      cnpj?: string;
      phone?: string;
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      foundationYear?: number;
    },
  ) => Promise<User>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleFollowOng: (ongId: string) => void;
  toggleFollowUser: (userId: string) => void;
  deletePost: (postId: string) => Promise<void>;
  addPost: (post: Post) => Promise<Post>;
  refreshPosts: () => Promise<void>;
  donateToOng: (ongId: string, amountCents?: number) => Promise<void>;
  updateUserAvatar: (avatarUri: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  pendingOutboxCount: number;
  syncPendingOperations: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [followedOngs, setFollowedOngs] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const authClearingRef = useRef(false);
  const feedRetryAfterRef = useRef(0);
  const feedFailureCountRef = useRef(0);
  const deletedPostIdsRef = useRef<Set<string>>(new Set());

  const api = useMemo(
    () => createZooHelpApi(() => getSecureItem(AUTH_TOKEN_KEY)),
    [],
  );

  useEffect(() => {
    loadStoredData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    registerRescueAlerts(user.id).catch(() => {
      // Push/geolocation permission is optional; the app keeps working without it.
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      registerRescueAlerts(user.id).catch(() => {
        // Foreground refresh keeps push targeting close to the user's real position.
      });
      refreshCurrentUser().catch(() => {});
      refreshPostsFromBackend().catch(() => {});
    });
    return () => subscription.remove();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      refreshPostsFromBackend().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      registerRescueAlerts(user.id).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !api) return;
    if (Platform.OS === 'web') return;
    let closed = false;
    let refreshing = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const refreshFromEvent = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await refreshPostsFromBackend();
      } finally {
        refreshing = false;
      }
    };

    const connect = () => {
      if (closed) return;
      if (reconnectAttempts >= maxReconnectAttempts) return;
      socket = new WebSocket(api.feedWebSocketUrl());
      socket.onopen = () => {
        reconnectAttempts = 0;
      };
      socket.onmessage = () => {
        refreshFromEvent().catch(() => {});
      };
      socket.onclose = () => {
        if (closed) return;
        reconnectAttempts += 1;
        if (reconnectAttempts >= maxReconnectAttempts) return;
        const delayMs = Math.min(30000, 2000 * 2 ** (reconnectAttempts - 1));
        reconnectTimer = setTimeout(connect, delayMs);
      };
      socket.onerror = () => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user?.id, api]);

  async function loadStoredData() {
    try {
      const [storedUser, storedOnboarding, storedLikes, storedFollows, storedUserFollows, storedDeletedPostIds, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('likedPosts'),
        AsyncStorage.getItem('followedOngs'),
        AsyncStorage.getItem('followedUsers'),
        AsyncStorage.getItem(DELETED_POST_IDS_KEY),
        getSecureItem(AUTH_TOKEN_KEY),
      ]);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
        if (storedToken) {
          await refreshCurrentUser();
        }
      }
      if (storedOnboarding === 'true') setHasSeenOnboarding(true);
      if (storedLikes) setLikedPosts(JSON.parse(storedLikes));
      if (storedFollows) setFollowedOngs(JSON.parse(storedFollows));
      if (storedUserFollows) setFollowedUsers(JSON.parse(storedUserFollows));
      if (storedDeletedPostIds) {
        const parsed = JSON.parse(storedDeletedPostIds);
        if (Array.isArray(parsed)) deletedPostIdsRef.current = new Set(parsed.filter((id) => typeof id === 'string'));
      }

      const cachedFeed = await loadCachedFeed();
      const imageCache = await loadPostImagesCache();
      const visibleCachedFeed = cachedFeed
        .map((post) => mergePostImages(post, imageCache[post.id]))
        .filter((post) => !deletedPostIdsRef.current.has(post.id));
      if (visibleCachedFeed.length) setPosts(sortPostsNewestFirst(visibleCachedFeed));
      await refreshOutboxCount();
      await refreshPostsFromBackend();
      await syncPendingOperations();
    } catch {
      // Keep local mock fallback available in development/offline mode.
    } finally {
      setIsLoading(false);
    }
  }

  async function persistUser(nextUser: User) {
    setUser(nextUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('user', JSON.stringify(nextUser));
    return nextUser;
  }

  async function refreshCurrentUser() {
    if (!api) return;
    const currentUser = await api.me().catch(async (error) => {
      if (error instanceof ZooHelpApiError && error.status === 401) {
        await clearInvalidSession();
      }
      return null;
    });
    if (currentUser) {
      await persistUser(mapAuthUser(currentUser));
    }
  }

  async function clearInvalidSession() {
    if (authClearingRef.current) return;
    authClearingRef.current = true;
    try {
      await AsyncStorage.removeItem('user');
      await clearSessionTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      authClearingRef.current = false;
    }
  }

  function mapAuthUser(response: Pick<Awaited<ReturnType<NonNullable<typeof api>['login']>>, 'user' | 'ongProfile'>): User {
    const ongVerificationStatus = response.ongProfile?.verificationStatus ?? null;
    const isApprovedOng =
      response.user.type === 'ong'
        ? ongVerificationStatus === 'APPROVED' || response.user.verified
        : response.user.verified;

    return {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      avatar: response.user.avatar,
      bio: response.user.bio,
      type: response.user.type,
      gender: response.user.gender ?? null,
      verified: isApprovedOng,
      verificationStatus: ongVerificationStatus,
      postsCount: response.user.postsCount,
      helpedCount: response.user.helpedCount,
      adoptionsCount: response.user.adoptionsCount,
    };
  }

  async function login(email: string, password: string) {
    if (api) {
      const response = await api.login(email, password);
      await setSecureItem(AUTH_TOKEN_KEY, response.accessToken);
      await setSecureItem(REFRESH_TOKEN_KEY, response.refreshToken);
      return persistUser(mapAuthUser(response));
    }

    throw new Error('Backend auth is required');
  }

  async function register(
    name: string,
    email: string,
    password: string,
    type: 'person' | 'ong' = 'person',
    profile: {
      avatar?: string | null;
      ongType?: string;
      cnpj?: string;
      phone?: string;
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      foundationYear?: number;
    } = {},
  ) {
    if (api) {
      const response = await api.register({
        name,
        email,
        password,
        accountType: type,
        ...profile,
      });
      await setSecureItem(AUTH_TOKEN_KEY, response.accessToken);
      await setSecureItem(REFRESH_TOKEN_KEY, response.refreshToken);
      const nextUser = mapAuthUser(response);
      if (type === 'ong' && response.ongProfile?.verificationStatus !== 'APPROVED') {
        nextUser.verified = false;
        nextUser.verificationStatus = response.ongProfile?.verificationStatus ?? 'PENDING_MANUAL_REVIEW';
      }
      return persistUser(nextUser);
    }

    throw new Error('Backend auth is required');
  }

  async function logout() {
    await AsyncStorage.removeItem('user');
    await clearSessionTokens();
    setUser(null);
    setIsAuthenticated(false);
  }

  async function deleteAccount() {
    await api?.deleteAccount().catch(() => {});
    await logout();
  }

  async function completeOnboarding() {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  }

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
      AsyncStorage.setItem('likedPosts', JSON.stringify(next));
      return next;
    });
    api?.likePost(postId).catch(() => {});
  }

  function toggleFollowOng(ongId: string) {
    setFollowedOngs((prev) => {
      const next = prev.includes(ongId) ? prev.filter((id) => id !== ongId) : [...prev, ongId];
      AsyncStorage.setItem('followedOngs', JSON.stringify(next));
      return next;
    });
    api?.followOng(ongId).catch(() => {});
  }

  function toggleFollowUser(userId: string) {
    setFollowedUsers((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
      AsyncStorage.setItem('followedUsers', JSON.stringify(next));
      return next;
    });
  }

  async function markPostDeletedLocally(postId: string) {
    const next = new Set(deletedPostIdsRef.current);
    next.add(postId);
    const ids = Array.from(next).slice(-MAX_LOCAL_DELETED_POST_IDS);
    deletedPostIdsRef.current = new Set(ids);
    await AsyncStorage.setItem(DELETED_POST_IDS_KEY, JSON.stringify(ids)).catch(() => {});
  }

  async function deletePost(postId: string) {
    const previousPosts = posts;
    const nextPosts = previousPosts.filter((post) => post.id !== postId);
    const isBackendPost = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    setPosts(nextPosts);
    await saveCachedFeed(nextPosts).catch(() => {});
    await removePendingPost(postId).catch(() => {});
    if (!isBackendPost) {
      await markPostDeletedLocally(postId);
      return;
    }
    try {
      await api?.deletePost(postId);
      await markPostDeletedLocally(postId);
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 405) {
        await markPostDeletedLocally(postId);
        return;
      }
      setPosts(previousPosts);
      await saveCachedFeed(previousPosts).catch(() => {});
      throw error;
    }
  }

  async function publishPostToBackend(post: Post, idempotencyKey?: string) {
    if (!api) throw new Error('Backend unavailable');
    const localImages = Array.from(new Set(
      (post.images?.length ? post.images : post.image ? [post.image] : [])
        .filter((uri): uri is string => Boolean(uri) && !uri.startsWith('http')),
    )).slice(0, 4);
    const uploadedImages = await Promise.all(
      localImages.map((uri) => uploadLocalImageToCloudinary(api, uri)),
    );
    const publicImage = uploadedImages[0]?.publicUrl ?? post.image;
    const response = await api.createPost({
      name: post.name,
      postType: post.type,
      animalType: post.animalType,
      breed: post.breed,
      age: post.age,
      description: post.description,
      location: post.location,
      neighborhood: post.neighborhood,
      image: publicImage,
      images: uploadedImages,
      urgent: post.urgent,
      contact: post.contact,
      tags: post.tags,
      latitude: post.latitude,
      longitude: post.longitude,
      locationAddress: post.locationAddress,
      idempotencyKey,
    });
    return mapPost(response.post);
  }

  function hasVolatileWebMedia(post: Post) {
    if (Platform.OS !== 'web') return false;
    const media = post.images?.length ? post.images : post.image ? [post.image] : [];
    return media.some((uri) => typeof uri === 'string' && uri.startsWith('blob:'));
  }

  async function refreshOutboxCount() {
    const [pendingPosts, pendingRescues] = await Promise.all([
      listPendingPosts(),
      listPendingRescueOperations(),
    ]);
    setPendingOutboxCount(pendingPosts.length + pendingRescues.length);
  }

  async function syncPendingOperations() {
    if (api) {
      const pendingPosts = await listPendingPosts();
      for (const pending of pendingPosts) {
        if (hasVolatileWebMedia(pending.post)) {
          await removePendingPost(pending.id);
          setPosts((prev) => prev.filter((item) => item.id !== pending.post.id));
          continue;
        }
        try {
          const synced = await publishPostToBackend(pending.post, pending.idempotencyKey);
          const syncedWithImages = mergePostImages(synced, pending.post);
          await rememberPostImages(syncedWithImages);
          await removePendingPost(pending.id);
          setPosts((prev) => sortPostsNewestFirst([syncedWithImages, ...prev.filter((item) => item.id !== pending.post.id)]));
          await maybeTriggerRescueForSyncedPost(syncedWithImages);
        } catch (error) {
          await markPendingPostAttempt(
            pending.id,
            error instanceof Error ? error.message : 'Falha de rede',
          );
        }
      }
      await flushRescueOutbox(api);
    }
    await refreshOutboxCount();
  }

  async function addPost(post: Post) {
    try {
      const synced = await publishPostToBackend(post);
      const syncedWithImages = mergePostImages(synced, post);
      await rememberPostImages(syncedWithImages);
      setPosts((prev) => sortPostsNewestFirst([syncedWithImages, ...prev]));
      await maybeTriggerRescueForSyncedPost(syncedWithImages);
      return syncedWithImages;
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 401) {
        await clearInvalidSession();
        throw error;
      }
      if (error instanceof ZooHelpApiError && error.status != null && error.status < 500) {
        throw error;
      }
      if (hasVolatileWebMedia(post)) {
        throw error;
      }
      await enqueuePost(post, error instanceof Error ? error.message : 'Falha de rede');
      await refreshOutboxCount();
      const pendingPost = {
        ...post,
        tags: Array.from(new Set(['pendente', ...post.tags])),
        createdAt: 'pendente',
      };
      setPosts((prev) => sortPostsNewestFirst([pendingPost, ...prev]));
      return pendingPost;
    }
  }

  async function refreshPostsFromBackend() {
    if (!api) return;
    if (Date.now() < feedRetryAfterRef.current) return;
    try {
      const coords = await getCurrentCoordsIfGranted().catch(() => null);
      const feed = await api.feed(
        coords
          ? {
              lat: coords.latitude,
              lng: coords.longitude,
              radiusKm: 30,
            }
          : undefined,
      );
      feedFailureCountRef.current = 0;
      feedRetryAfterRef.current = 0;
      const imageCache = await loadPostImagesCache();
      const mapped = feed
        .map(mapPost)
        .map((post) => mergePostImages(post, imageCache[post.id]))
        .filter((post) => !deletedPostIdsRef.current.has(post.id));
      const backendIds = new Set(mapped.map((post) => post.id));
      let nextFeed = mapped;
      setPosts((prev) => {
        const now = Date.now();
        const previousById = new Map(prev.map((post) => [post.id, post]));
        const mergedMapped = mapped.map((post) => mergePostImages(post, previousById.get(post.id)));
        const stickyLocalPosts = prev.filter((post) => {
          if (deletedPostIdsRef.current.has(post.id)) return false;
          if (backendIds.has(post.id)) return false;
          if (post.createdAt === 'pendente' || post.createdAt === 'agora') return true;
          if (post.author.id !== user?.id) return false;
          const createdAtMs = Date.parse(post.createdAt);
          return Number.isFinite(createdAtMs) && now - createdAtMs < 5 * 60 * 1000;
        });
        nextFeed = sortPostsNewestFirst([...stickyLocalPosts, ...mergedMapped]);
        return nextFeed;
      });
      await saveCachedFeed(nextFeed);
    } catch (error) {
      feedFailureCountRef.current = Math.min(feedFailureCountRef.current + 1, 5);
      feedRetryAfterRef.current =
        Date.now() + Math.min(120000, 10000 * 2 ** (feedFailureCountRef.current - 1));
      throw error;
    }
  }

  async function refreshPosts() {
    try {
      await syncPendingOperations();
      await refreshPostsFromBackend();
    } catch {
      const cachedFeed = await loadCachedFeed();
      const visibleCachedFeed = cachedFeed.filter((post) => !deletedPostIdsRef.current.has(post.id));
      if (visibleCachedFeed.length) setPosts(sortPostsNewestFirst(visibleCachedFeed));
    }
  }

  async function refreshUser() {
    await refreshCurrentUser();
  }

  async function maybeTriggerRescueForSyncedPost(post: Post) {
    if (!api || (!post.urgent && post.type !== 'emergency') || post.latitude == null || post.longitude == null) {
      return;
    }
    try {
      await api.triggerRescue({
        postId: post.id,
        lat: post.latitude,
        lng: post.longitude,
      });
    } catch {
      await enqueueRescueOperation({
        type: 'trigger',
        postId: post.id,
        lat: post.latitude,
        lng: post.longitude,
      });
    }
  }

  async function donateToOng(ongId: string, amountCents = 1000) {
    if (!supportPaymentsEnabled) {
      throw new Error('Apoio financeiro ainda nao esta habilitado');
    }
    if (api) {
      await api.createDonationIntent({ ongId, amountCents, currency: 'BRL' });
    }
  }

  async function updateUserAvatar(avatarUri: string) {
    if (!user) return;

    const uploadedImage =
      api && !avatarUri.startsWith('http')
        ? await uploadLocalImageToCloudinary(api, avatarUri, user.type === 'ong' ? 'ong-logo' : 'profile-avatar')
        : null;
    const avatar = uploadedImage?.publicUrl ?? avatarUri;
    if (api && avatar.startsWith('http')) {
      await api.updateAvatar({ avatarUrl: avatar });
    }
    const nextUser = {
      ...user,
      avatar,
    };

    await persistUser(nextUser);
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        hasSeenOnboarding,
        posts,
        likedPosts,
        followedOngs,
        followedUsers,
        login,
        register,
        logout,
        deleteAccount,
        completeOnboarding,
        toggleLike,
        toggleFollowOng,
        toggleFollowUser,
        deletePost,
        addPost,
        refreshPosts,
        donateToOng,
        updateUserAvatar,
        refreshUser,
        pendingOutboxCount,
        syncPendingOperations,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
