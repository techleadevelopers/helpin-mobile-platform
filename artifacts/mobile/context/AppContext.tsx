import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { MOCK_POSTS, Post } from '@/constants/data';
import { enqueuePost, listPendingPosts, markPendingPostAttempt, removePendingPost } from '@/services/postOutbox';
import { flushRescueOutbox, listPendingRescueOperations } from '@/services/rescueOutbox';
import { registerRescueAlerts } from '@/services/rescueNotifications';
import { clearSessionTokens, getSecureItem, setSecureItem, REFRESH_TOKEN_KEY } from '@/services/secureSession';
import { AUTH_TOKEN_KEY, createZooHelpApi, mapPost, supportPaymentsEnabled, uploadLocalImageToCloudinary } from '@/services/zoohelpApi';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  type: 'person' | 'ong' | 'vet';
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
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    type?: 'person' | 'ong',
    profile?: {
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
    },
  ) => Promise<User>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleFollowOng: (ongId: string) => void;
  addPost: (post: Post) => Promise<Post>;
  refreshPosts: () => Promise<void>;
  donateToOng: (ongId: string, amountCents?: number) => Promise<void>;
  updateUserAvatar: (avatarUri: string) => Promise<void>;
  pendingOutboxCount: number;
  syncPendingOperations: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [followedOngs, setFollowedOngs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);

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

  async function loadStoredData() {
    try {
      const [storedUser, storedOnboarding, storedLikes, storedFollows, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('likedPosts'),
        AsyncStorage.getItem('followedOngs'),
        getSecureItem(AUTH_TOKEN_KEY),
      ]);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
        if (storedToken) {
          const currentUser = await api?.me().catch(() => null);
          if (currentUser) {
            await persistUser(mapAuthUser(currentUser));
          }
        }
      }
      if (storedOnboarding === 'true') setHasSeenOnboarding(true);
      if (storedLikes) setLikedPosts(JSON.parse(storedLikes));
      if (storedFollows) setFollowedOngs(JSON.parse(storedFollows));

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

  async function publishPostToBackend(post: Post, idempotencyKey?: string) {
    if (!api) throw new Error('Backend unavailable');
    const uploadedImage =
      post.image && !post.image.startsWith('http')
        ? await uploadLocalImageToCloudinary(api, post.image)
        : null;
    const publicImage = uploadedImage?.publicUrl ?? post.image;
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
      images: uploadedImage ? [uploadedImage] : [],
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
      return synced;
    } catch (error) {
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
    const feed = await api.feed();
    setPosts(feed.map(mapPost));
  }

  async function refreshPosts() {
    try {
      await syncPendingOperations();
      await refreshPostsFromBackend();
    } catch {
      setPosts([...MOCK_POSTS]);
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
        login,
        register,
        logout,
        deleteAccount,
        completeOnboarding,
        toggleLike,
        toggleFollowOng,
        addPost,
        refreshPosts,
        donateToOng,
        updateUserAvatar,
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
