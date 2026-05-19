import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentCoords, watchCurrentPosition, stopWatchingPosition } from '@/services/locationService';
import { AUTH_TOKEN_KEY, createZooHelpApi } from '@/services/zoohelpApi';

const ACTIVE_RESCUE_KEY = 'activeRescueId';

const getToken = () => AsyncStorage.getItem(AUTH_TOKEN_KEY);

export async function triggerRescue(postId: string) {
  const api = createZooHelpApi(getToken);
  const coords = await getCurrentCoords();
  if (!api || !coords) return null;
  const response = await api.triggerRescue({
    postId,
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? undefined,
  });
  await AsyncStorage.setItem(ACTIVE_RESCUE_KEY, response.rescue.id);
  return response.rescue;
}

export async function startRescueLocationSync(rescueId: string) {
  const api = createZooHelpApi(getToken);
  if (!api) return null;
  return watchCurrentPosition((coords) => {
    api.updateRescueLocation(rescueId, {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
    }).catch(() => {});
  });
}

export async function endRescue(rescueId?: string) {
  const api = createZooHelpApi(getToken);
  const resolvedId = rescueId ?? await AsyncStorage.getItem(ACTIVE_RESCUE_KEY);
  if (!api || !resolvedId) return null;
  stopWatchingPosition();
  const response = await api.endRescue(resolvedId);
  await AsyncStorage.removeItem(ACTIVE_RESCUE_KEY);
  return response.rescue;
}

export async function createRescueIncident(rescueId: string, description: string, attachments: string[] = []) {
  return createZooHelpApi(getToken)?.createRescueIncident(rescueId, { description, attachments });
}
