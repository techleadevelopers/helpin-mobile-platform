import { OngDashboard } from '@/components/OngDashboard';
import { useApp } from '@/context/AppContext';

import FeedScreen from './feed';

export default function HomeTabScreen() {
  const { user } = useApp();

  if (user?.type === 'ong') {
    return <OngDashboard />;
  }

  return <FeedScreen />;
}
