import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { UserBottomNav } from '@/components/UserBottomNav';
import { useApp } from '@/context/AppContext';
import { ZooHelpLoading } from '@/components/ZooHelpLoading';

function ClassicTabLayout() {
  const { user } = useApp();
  const isOng = user?.type === 'ong';

  return (
    <Tabs
      tabBar={() => <UserBottomNav />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isOng ? 'Dashboard' : 'Feed',
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Casos',
          href: isOng ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          href: isOng ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) return <ZooHelpLoading />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return <ClassicTabLayout />;
}
