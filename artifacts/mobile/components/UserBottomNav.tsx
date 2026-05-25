import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type NavItem = {
  label: string;
  icon: MCIcon;
  route: string;
  activePaths: string[];
};

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

export function UserBottomNav() {
  const colors = useColors();
  const router = useRouter();
  const pathname = normalizePath(usePathname());
  const insets = useSafeAreaInsets();
  const { user, chatUnreadCount, chatMessageNotifications } = useApp();
  const isOng = user?.type === 'ong';
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const unreadChatNotifications = chatMessageNotifications.filter((item) => !item.isRead).length;
  const chatBadgeCount = Math.max(chatUnreadCount, unreadChatNotifications);

  const items: NavItem[] = [
    {
      label: isOng ? 'Dashboard' : 'Feed',
      icon: 'home-variant-outline',
      route: '/(tabs)',
      activePaths: ['/'],
    },
    {
      label: 'Mapa',
      icon: 'map-marker-outline',
      route: '/(tabs)/map',
      activePaths: ['/map'],
    },
    isOng
      ? {
          label: 'Casos',
          icon: 'clipboard-text-outline',
          route: '/(tabs)/cases',
          activePaths: ['/cases'],
        }
      : {
          label: 'Publicar',
          icon: 'plus-circle-outline',
          route: '/composer',
          activePaths: ['/composer'],
        },
    {
      label: 'Chat',
      icon: 'chat-outline',
      route: '/(tabs)/chat',
      activePaths: ['/chat'],
    },
    {
      label: 'Perfil',
      icon: 'account-outline',
      route: '/(tabs)/profile',
      activePaths: ['/profile'],
    },
  ];

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {items.map((item) => {
        const isActive = item.activePaths.includes(pathname);
        const itemColor = isActive || item.label === 'Publicar' ? colors.primary : colors.mutedForeground;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.bottomNavItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.82}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={item.icon} size={21} color={itemColor} />
              {item.label === 'Chat' && chatBadgeCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>{chatBadgeCount > 9 ? '9+' : chatBadgeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.bottomNavText, { color: itemColor }]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    minHeight: 64,
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    flexDirection: 'row',
    shadowColor: '#14261B',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  bottomNavText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadge: {
    position: 'absolute',
    top: -3,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#606864',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chatBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
});
