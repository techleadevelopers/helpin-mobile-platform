import { Redirect } from 'expo-router';

import { OngDashboard } from '@/components/OngDashboard';
import { ZooHelpLoading } from '@/components/ZooHelpLoading';
import { useApp } from '@/context/AppContext';

export default function OngDashboardRoute() {
  const { isAuthenticated, isLoading, user } = useApp();

  if (isLoading) return <ZooHelpLoading />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (user?.type !== 'ong') return <Redirect href="/(tabs)" />;

  return <OngDashboard />;
}
