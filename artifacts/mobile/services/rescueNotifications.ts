import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi } from '@/services/zoohelpApi';

const PUSH_TOKEN_KEY = 'zoohelpPushToken';
const PUSH_LOCATION_CACHE_KEY = 'zoohelpPushLocation:v1';
const DEFAULT_RADIUS_KM = 8;
const LOCATION_CACHE_TTL_MS = 10 * 60 * 1000;
const HIGH_ACCURACY_TIMEOUT_MS = 8000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerRescueAlerts(userId: string) {
  const api = createZooHelpApi(getStoredAccessToken);
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

  const position = await getPushRegistrationLocation();
  if (!position) return null;

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
    criticalAlerts: true,
  });
}

async function getPushRegistrationLocation() {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LOCATION_CACHE_TTL_MS,
    requiredAccuracy: 500,
  }).catch(() => null);
  if (lastKnown) {
    await rememberPushLocation(lastKnown).catch(() => {});
    return lastKnown;
  }

  const cached = await readCachedPushLocation();
  const cachedTimestamp = cached?.timestamp;
  if (cached && typeof cachedTimestamp === 'number' && Date.now() - cachedTimestamp <= LOCATION_CACHE_TTL_MS) {
    return {
      timestamp: cachedTimestamp,
      coords: {
        latitude: cached.latitude,
        longitude: cached.longitude,
        altitude: null,
        accuracy: cached.accuracy,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    } as Location.LocationObject;
  }

  const current = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), HIGH_ACCURACY_TIMEOUT_MS)),
  ]).catch(() => null);
  if (current) {
    await rememberPushLocation(current).catch(() => {});
  }
  return current;
}

async function rememberPushLocation(position: Location.LocationObject) {
  await AsyncStorage.setItem(PUSH_LOCATION_CACHE_KEY, JSON.stringify({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp || Date.now(),
  }));
}

async function readCachedPushLocation() {
  const raw = await AsyncStorage.getItem(PUSH_LOCATION_CACHE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      latitude?: number;
      longitude?: number;
      accuracy?: number | null;
      timestamp?: number;
    };
    if (
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number' ||
      typeof parsed.timestamp !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
