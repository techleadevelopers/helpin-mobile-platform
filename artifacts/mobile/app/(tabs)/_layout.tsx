import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { UserBottomNav } from '@/components/UserBottomNav';
import { useApp } from '@/context/AppContext';
import { ZooHelpLoading } from '@/components/ZooHelpLoading';

function ClassicTabLayout() {
  const { user } = useApp();
  const { t } = useTranslation();
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
          title: isOng ? 'Dashboard' : t('nav.feed'),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t('common.cases'),
          href: isOng ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('nav.feed'),
          href: null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('nav.map'),
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
          title: t('nav.chat'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
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
