import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { MOCK_POSTS, Post } from '@/constants/data';
import { registerRescueAlerts } from '@/services/rescueNotifications';
import { AUTH_TOKEN_KEY, createZooHelpApi, mapPost, uploadLocalImageToCloudinary } from '@/services/zoohelpApi';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  type: 'person' | 'ong' | 'vet';
  verified: boolean;
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
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    type?: 'person' | 'ong',
    profile?: { ongType?: string; cnpj?: string; phone?: string; city?: string; state?: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleFollowOng: (ongId: string) => void;
  addPost: (post: Post) => Promise<void>;
  refreshPosts: () => Promise<void>;
  donateToOng: (ongId: string, amountCents?: number) => Promise<void>;
  updateUserAvatar: (avatarUri: string) => Promise<void>;
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

  const api = useMemo(
    () => createZooHelpApi(() => AsyncStorage.getItem(AUTH_TOKEN_KEY)),
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
      const [storedUser, storedOnboarding, storedLikes, storedFollows] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('likedPosts'),
        AsyncStorage.getItem('followedOngs'),
      ]);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      if (storedOnboarding === 'true') setHasSeenOnboarding(true);
      if (storedLikes) setLikedPosts(JSON.parse(storedLikes));
      if (storedFollows) setFollowedOngs(JSON.parse(storedFollows));

      await refreshPostsFromBackend();
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
  }

  async function login(email: string, password: string) {
    if (api) {
      const response = await api.login(email, password);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      await persistUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar,
        bio: response.user.bio,
        type: response.user.type,
        verified: response.user.verified,
        postsCount: response.user.postsCount,
        helpedCount: response.user.helpedCount,
        adoptionsCount: response.user.adoptionsCount,
      });
      return;
    }

    throw new Error('Backend auth is required');
  }

  async function register(
    name: string,
    email: string,
    password: string,
    type: 'person' | 'ong' = 'person',
    profile: { ongType?: string; cnpj?: string; phone?: string; city?: string; state?: string } = {},
  ) {
    if (api) {
      const response = await api.register({
        name,
        email,
        password,
        accountType: type,
        ...profile,
      });
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      await persistUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar,
        bio: response.user.bio,
        type: response.user.type,
        verified: response.user.verified,
        postsCount: response.user.postsCount,
        helpedCount: response.user.helpedCount,
        adoptionsCount: response.user.adoptionsCount,
      });
      return;
    }

    throw new Error('Backend auth is required');
  }

  async function logout() {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.multiRemove(['user', AUTH_TOKEN_KEY, 'refreshToken']);
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

  async function addPost(post: Post) {
    if (api) {
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
      });
      setPosts((prev) => [mapPost(response.post), ...prev]);
      return;
    }

    setPosts((prev) => [post, ...prev]);
  }

  async function refreshPostsFromBackend() {
    if (!api) return;
    const feed = await api.feed();
    setPosts(feed.map(mapPost));
  }

  async function refreshPosts() {
    try {
      await refreshPostsFromBackend();
    } catch {
      setPosts([...MOCK_POSTS]);
    }
  }

  async function donateToOng(ongId: string, amountCents = 1000) {
    if (api) {
      await api.createDonationIntent({ ongId, amountCents, currency: 'BRL' });
    }
  }

  async function updateUserAvatar(avatarUri: string) {
    if (!user) return;

    const uploadedImage =
      api && !avatarUri.startsWith('http')
        ? await uploadLocalImageToCloudinary(api, avatarUri)
        : null;
    const nextUser = {
      ...user,
      avatar: uploadedImage?.publicUrl ?? avatarUri,
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
