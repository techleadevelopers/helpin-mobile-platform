import { getCurrentCoords, watchCurrentPosition, stopWatchingPosition } from '@/services/locationService';
import {
  clearActiveRescueId,
  createPendingRescueSession,
  enqueueRescueOperation,
  flushRescueOutbox,
  getActiveRescueId,
  setActiveRescueId,
} from '@/services/rescueOutbox';
import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi } from '@/services/zoohelpApi';

const getToken = () => getStoredAccessToken();

export async function triggerRescue(postId: string) {
  const api = createZooHelpApi(getToken);
  const coords = await getCurrentCoords();
  if (!api || !coords) return null;
  try {
    await flushRescueOutbox(api);
    const response = await api.triggerRescue({
      postId,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
    });
    await setActiveRescueId(response.rescue.id);
    return response.rescue;
  } catch {
    await enqueueRescueOperation({
      type: 'trigger',
      postId,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
    });
    const pending = createPendingRescueSession(postId, coords.latitude, coords.longitude, coords.accuracy ?? undefined);
    await setActiveRescueId(pending.id);
    return pending;
  }
}

export async function startRescueLocationSync(rescueId: string) {
  const api = createZooHelpApi(getToken);
  if (!api) return null;
  return watchCurrentPosition((coords) => {
    if (rescueId.startsWith('local-')) {
      enqueueRescueOperation({
        type: 'location',
        rescueId,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy ?? undefined,
      }).catch(() => {});
      return;
    }
    api.updateRescueLocation(rescueId, {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
    }).catch(() => {
      enqueueRescueOperation({
        type: 'location',
        rescueId,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy ?? undefined,
      }).catch(() => {});
    });
  }, { mode: 'rescue' });
}

export async function endRescue(rescueId?: string) {
  const api = createZooHelpApi(getToken);
  const resolvedId = rescueId ?? await getActiveRescueId();
  if (!api || !resolvedId) return null;
  stopWatchingPosition();
  try {
    if (resolvedId.startsWith('local-')) {
      await clearActiveRescueId();
      return null;
    }
    const response = await api.endRescue(resolvedId);
    await clearActiveRescueId();
    return response.rescue;
  } catch {
    await enqueueRescueOperation({ type: 'end', rescueId: resolvedId });
    await clearActiveRescueId();
    return null;
  }
}

export async function createRescueIncident(rescueId: string, description: string, attachments: string[] = []) {
  const api = createZooHelpApi(getToken);
  if (!api) return null;
  try {
    return await api.createRescueIncident(rescueId, { description, attachments });
  } catch {
    await enqueueRescueOperation({ type: 'incident', rescueId, description, attachments });
    return null;
  }
}
