import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      label: isOng ? 'Dashboard' : t('nav.feed'),
      icon: 'home-variant-outline',
      route: '/(tabs)',
      activePaths: ['/'],
    },
    {
      label: t('nav.map'),
      icon: 'map-marker-outline',
      route: '/(tabs)/map',
      activePaths: ['/map'],
    },
    isOng
      ? {
          label: t('common.cases'),
          icon: 'clipboard-text-outline',
          route: '/(tabs)/cases',
          activePaths: ['/cases'],
        }
      : {
          label: t('nav.publish'),
          icon: 'plus-circle-outline',
          route: '/composer',
          activePaths: ['/composer'],
        },
    {
      label: t('nav.chat'),
      icon: 'chat-outline',
      route: '/(tabs)/chat',
      activePaths: ['/chat'],
    },
    {
      label: t('nav.profile'),
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
        const isPrimaryAction = item.route === '/composer';
        const itemColor = isPrimaryAction ? '#FFFFFF' : isActive ? colors.primary : colors.mutedForeground;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.bottomNavItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.82}
          >
            <View style={[styles.iconWrap, isPrimaryAction && styles.primaryActionIcon]}>
              <MaterialCommunityIcons name={isPrimaryAction ? 'plus' : item.icon} size={isPrimaryAction ? 29 : 22} color={itemColor} />
              {item.route === '/(tabs)/chat' && chatBadgeCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>{chatBadgeCount > 9 ? '9+' : chatBadgeCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    minHeight: 57,
    paddingTop: 6.3,
    paddingHorizontal: 4.2,
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
    gap: 2.1,
    minWidth: 0,
  },
  iconWrap: {
    position: 'relative',
    width: 29.4,
    height: 25.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionIcon: {
    width: 48.3,
    height: 48.3,
    marginTop: -26.25,
    marginBottom: 1.05,
    borderRadius: 24.15,
    backgroundColor: '#5F6B63',
    borderWidth: 4.2,
    borderColor: '#FFFFFF',
  },
  chatBadge: {
    position: 'absolute',
    top: -3.15,
    right: 0,
    minWidth: 16.8,
    height: 16.8,
    borderRadius: 8.4,
    paddingHorizontal: 4.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#606864',
    borderWidth: 1.575,
    borderColor: '#FFFFFF',
  },
  chatBadgeText: {
    fontSize: 9.45,
    lineHeight: 11.55,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
});
