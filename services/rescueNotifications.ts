import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import { createZooHelpApi } from '@/services/zoohelpApi';

declare const require: (moduleName: string) => unknown;

const PUSH_CONSENT_KEY = 'zoohelp:rescue-push-consent:v1';
const DEFAULT_RADIUS_KM = 15;

type NotificationsModule = typeof import('expo-notifications');

let responseListenerInstalled = false;
let lastResponseIdentifier: string | null = null;

async function handleNotificationResponse(
  Notifications: NotificationsModule,
  response: import('expo-notifications').NotificationResponse,
) {
  const data = response.notification.request.content.data as {
    deeplink?: unknown;
    postId?: unknown;
  } | undefined;
  const postId = typeof data?.postId === 'string' ? data.postId : null;
  const action = response.actionIdentifier;

  // An action from the operating-system notification must create the same
  // durable rescue response as the in-app button. The server upsert is safe
  // for duplicate delivery/cold-start replay.
  if (postId && (action === 'going' || action === 'remote_support')) {
    try {
      await createZooHelpApi()?.confirmRescueResponse(postId, {
        action,
        status: 'confirmed',
      });
    } catch {
      // Never trap the user on a failed network request. Opening the case
      // still lets them retry the action from the durable in-app workflow.
    }
  }

  if (typeof data?.deeplink === 'string') {
    await Linking.openURL(data.deeplink).catch(() => {});
  }

  // Prevent a killed-app launch response from being replayed on every later
  // foreground registration pass.
  if (response.notification.request.identifier !== lastResponseIdentifier) {
    lastResponseIdentifier = response.notification.request.identifier;
    await Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }
}

/** Configure the native delivery surface before requesting a token.  A payload
 * marked `critical` is intentionally only high-priority here: iOS Critical
 * Alerts require Apple's entitlement and must not be claimed without it. */
async function configureNotificationSurface(Notifications: NotificationsModule) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rescue-alerts', {
      name: 'Alertas de resgate',
      description: 'Alertas urgentes de resgate próximos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 450],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      enableVibrate: true,
    });
  }

  await Notifications.setNotificationCategoryAsync('rescue', [
    { identifier: 'going', buttonTitle: 'Estou indo', options: { opensAppToForeground: true } },
    { identifier: 'remote_support', buttonTitle: 'Apoiar remoto', options: { opensAppToForeground: true } },
  ]);

  if (!responseListenerInstalled) {
    responseListenerInstalled = true;
    Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(Notifications, response).catch(() => {});
    });
  }

  // Listener callbacks do not cover the notification that launched a fully
  // terminated app. Resolve it explicitly after the native module is ready.
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse && lastResponse.notification.request.identifier !== lastResponseIdentifier) {
    await handleNotificationResponse(Notifications, lastResponse);
  }
}

/**
 * Expo Go no longer includes Android remote-notification support (SDK 53+).
 * Loading the native module at file evaluation time crashes the whole router,
 * so only load it when this optional capability is actually requested.
 */
function loadNotifications(): NotificationsModule | null {
  // `storeClient` is Expo Go. On Android it deliberately has no remote push
  // native module since SDK 53; do not even call require, as Metro reports
  // that native exception before JavaScript can catch it.
  if (Constants.executionEnvironment === 'storeClient') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

/** Registers a physical device after explicit OS consent. Location is
 * foreground-only and refreshed when the app returns to the foreground. */
export async function registerRescueAlerts(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const Notifications = loadNotifications();
  if (!Notifications) {
    await AsyncStorage.setItem(PUSH_CONSENT_KEY, 'unavailable');
    return null;
  }
  await configureNotificationSurface(Notifications);
  const api = createZooHelpApi();
  if (!api) return null;

  const existing = await Notifications.getPermissionsAsync();
  const notificationPermission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!notificationPermission.granted) {
    await AsyncStorage.setItem(PUSH_CONSENT_KEY, 'denied');
    return null;
  }
  await AsyncStorage.setItem(PUSH_CONSENT_KEY, 'granted');

  const existingLocation = await Location.getForegroundPermissionsAsync();
  const locationPermission = existingLocation.granted
    ? existingLocation
    : await Location.requestForegroundPermissionsAsync();
  if (!locationPermission.granted) return null;

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api.registerPushToken({
    userId,
    pushToken: token.data,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    radiusKm: DEFAULT_RADIUS_KM,
    criticalAlerts: true,
  });
  return token.data;
}

export async function rescuePushConsent() {
  return AsyncStorage.getItem(PUSH_CONSENT_KEY);
}
