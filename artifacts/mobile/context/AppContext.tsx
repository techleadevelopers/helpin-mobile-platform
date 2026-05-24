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
      const [storedUser, storedOnboarding, storedLikes, storedFollows, storedUserFollows, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('likedPosts'),
        AsyncStorage.getItem('followedOngs'),
        AsyncStorage.getItem('followedUsers'),
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

      const cachedFeed = await loadCachedFeed();
      if (cachedFeed.length) setPosts(cachedFeed);
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

  async function deletePost(postId: string) {
    const previousPosts = posts;
    const nextPosts = previousPosts.filter((post) => post.id !== postId);
    setPosts(nextPosts);
    await saveCachedFeed(nextPosts).catch(() => {});
    try {
      await api?.deletePost(postId);
    } catch (error) {
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
      idempotencyKey,
    });
    return mapPost(response.post);
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
        try {
          const synced = await publishPostToBackend(pending.post, pending.idempotencyKey);
          await removePendingPost(pending.id);
          setPosts((prev) => [synced, ...prev.filter((item) => item.id !== pending.post.id)]);
          await maybeTriggerRescueForSyncedPost(synced);
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
      setPosts((prev) => [synced, ...prev]);
      await maybeTriggerRescueForSyncedPost(synced);
      return synced;
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 401) {
        await clearInvalidSession();
        throw error;
      }
      await enqueuePost(post, error instanceof Error ? error.message : 'Falha de rede');
      await refreshOutboxCount();
      const pendingPost = {
        ...post,
        tags: Array.from(new Set(['pendente', ...post.tags])),
        createdAt: 'pendente',
      };
      setPosts((prev) => [
        pendingPost,
        ...prev,
      ]);
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
      const mapped = feed.map(mapPost);
      const backendIds = new Set(mapped.map((post) => post.id));
      let nextFeed = mapped;
      setPosts((prev) => {
        const now = Date.now();
        const stickyLocalPosts = prev.filter((post) => {
          if (backendIds.has(post.id)) return false;
          if (post.createdAt === 'pendente' || post.createdAt === 'agora') return true;
          if (post.author.id !== user?.id) return false;
          const createdAtMs = Date.parse(post.createdAt);
          return Number.isFinite(createdAtMs) && now - createdAtMs < 5 * 60 * 1000;
        });
        nextFeed = [...stickyLocalPosts, ...mapped];
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
      if (cachedFeed.length) setPosts(cachedFeed);
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
