import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { ZooHelpLoading } from '@/components/ZooHelpLoading';
import { useApp } from '@/context/AppContext';

function NativeTabLayout() {
  const { user } = useApp();
  const isOng = user?.type === 'ong';

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{isOng ? 'Dashboard' : 'Feed'}</Label>
      </NativeTabs.Trigger>
      {isOng && (
        <NativeTabs.Trigger name="feed">
          <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
          <Label>Feed</Label>
        </NativeTabs.Trigger>
      )}
      {isOng && (
        <NativeTabs.Trigger name="cases">
          <Icon sf={{ default: 'list.bullet.clipboard', selected: 'list.bullet.clipboard.fill' }} />
          <Label>Casos</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Mapa</Label>
      </NativeTabs.Trigger>
      {!isOng && (
        <NativeTabs.Trigger name="publish">
          <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
          <Label>Publicar</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useApp();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const isOng = user?.type === 'ong';

  const tabBarHeight = isWeb ? 84 : isAndroid ? 64 + insets.bottom : 58 + insets.bottom;
  const tabBarPaddingBottom = isWeb ? 34 : isAndroid ? Math.max(insets.bottom, 8) : insets.bottom + 4;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: isAndroid ? 10 : 0,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: isAndroid ? 6 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: isAndroid ? 12 : 11,
          fontFamily: 'Inter_500Medium',
          marginTop: isAndroid ? 0 : 2,
        },
        tabBarItemStyle: {
          minHeight: isAndroid ? 52 : undefined,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isOng ? 'Dashboard' : 'Feed',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'house.fill' : 'house'} tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Casos',
          href: isOng ? undefined : null,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'list.bullet.clipboard.fill' : 'list.bullet.clipboard'} tintColor={color} size={24} />
            ) : (
              <Feather name="clipboard" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          href: isOng ? undefined : null,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'list.bullet' : 'list.bullet'} tintColor={color} size={24} />
            ) : (
              <Feather name="list" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'map.fill' : 'map'} tintColor={color} size={24} />
            ) : (
              <Feather name="map-pin" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={
          isOng
            ? {
                href: null,
              }
            : {
                title: '',
                tabBarButton: () => (
                  <TouchableOpacity
                    style={styles.centerBtnWrapper}
                    onPress={() => router.push('/compose')}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.centerBtn,
                        {
                          backgroundColor: colors.primary,
                          shadowColor: colors.primary,
                        },
                      ]}
                    >
                      <Feather name="plus" size={34} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ),
              }
        }
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'message.fill' : 'message'} tintColor={color} size={24} />
            ) : (
              <Feather name="message-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'person.fill' : 'person'} tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) return <ZooHelpLoading />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  centerBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'android' ? 14 : 8,
  },
  centerBtn: {
    width: Platform.OS === 'android' ? 58 : 54,
    height: Platform.OS === 'android' ? 58 : 54,
    borderRadius: Platform.OS === 'android' ? 29 : 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'android' ? 0.18 : 0.4,
    shadowRadius: 10,
    elevation: Platform.OS === 'android' ? 12 : 8,
  },
});
