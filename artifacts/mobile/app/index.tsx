import { Redirect } from 'expo-router';

import { ZooHelpLoading } from '@/components/ZooHelpLoading';
import { useApp } from '@/context/AppContext';

export default function Index() {
  const { isAuthenticated, hasSeenOnboarding, isLoading } = useApp();

  if (isLoading) return <ZooHelpLoading />;

  if (!hasSeenOnboarding) return <Redirect href="/welcome" />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
