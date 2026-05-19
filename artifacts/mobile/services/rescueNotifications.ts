import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { AUTH_TOKEN_KEY, createZooHelpApi } from '@/services/zoohelpApi';

const PUSH_TOKEN_KEY = 'zoohelpPushToken';
const DEFAULT_RADIUS_KM = 8;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerRescueAlerts(userId: string) {
  const api = createZooHelpApi(() => AsyncStorage.getItem(AUTH_TOKEN_KEY));
  if (!api || Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rescue-alerts', {
      name: 'Alertas de resgate',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 350, 200, 350],
      lightColor: '#FF3B30',
      sound: 'default',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission = permission.granted
    ? permission
    : await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
        },
      });

  if (!finalPermission.granted) return null;

  const locationPermission = await Location.requestForegroundPermissionsAsync();
  if (locationPermission.status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
  return api.registerPushToken({
    userId,
    pushToken: token.data,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    radiusKm: DEFAULT_RADIUS_KM,
    criticalAlerts: false,
  });
}
