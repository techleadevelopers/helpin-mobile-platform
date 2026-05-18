import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { MOCK_POSTS, Post } from '@/constants/data';

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
  register: (name: string, email: string, password: string, type?: 'person' | 'ong') => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleFollowOng: (ongId: string) => void;
  addPost: (post: Post) => void;
  refreshPosts: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USER: User = {
  id: 'me',
  name: 'Você',
  email: 'voce@zoohelp.com',
  avatar: null,
  bio: 'Apaixonada por animais 🐾',
  type: 'person',
  verified: false,
  postsCount: 3,
  helpedCount: 12,
  adoptionsCount: 2,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [followedOngs, setFollowedOngs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

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
      if (storedOnboarding === 'true') {
        setHasSeenOnboarding(true);
      }
      if (storedLikes) {
        setLikedPosts(JSON.parse(storedLikes));
      }
      if (storedFollows) {
        setFollowedOngs(JSON.parse(storedFollows));
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, _password: string) {
    const newUser = { ...DEFAULT_USER, email, name: email.split('@')[0] };
    setUser(newUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  }

  async function register(name: string, email: string, _password: string, type: 'person' | 'ong' = 'person') {
    const newUser = { ...DEFAULT_USER, name, email, type };
    setUser(newUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  }

  async function logout() {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('user');
  }

  async function completeOnboarding() {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  }

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];
      AsyncStorage.setItem('likedPosts', JSON.stringify(next));
      return next;
    });
  }

  function toggleFollowOng(ongId: string) {
    setFollowedOngs((prev) => {
      const next = prev.includes(ongId)
        ? prev.filter((id) => id !== ongId)
        : [...prev, ongId];
      AsyncStorage.setItem('followedOngs', JSON.stringify(next));
      return next;
    });
  }

  function addPost(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function refreshPosts() {
    setPosts([...MOCK_POSTS]);
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
        completeOnboarding,
        toggleLike,
        toggleFollowOng,
        addPost,
        refreshPosts,
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
