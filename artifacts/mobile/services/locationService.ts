import * as Location from 'expo-location';

let watcher: Location.LocationSubscription | null = null;

export async function ensureLocationPermission() {
  const permission = await Location.requestForegroundPermissionsAsync();
  return permission.status === 'granted';
}

export async function getCurrentCoords() {
  const allowed = await ensureLocationPermission();
  if (!allowed) return null;
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return location.coords;
}

export async function watchCurrentPosition(
  handler: (coords: Location.LocationObjectCoords) => void,
  options: {
    intervalMs?: number;
    distanceMeters?: number;
    mode?: 'balanced' | 'rescue';
  } = {},
) {
  const allowed = await ensureLocationPermission();
  if (!allowed) return null;

  stopWatchingPosition();
  watcher = await Location.watchPositionAsync(
    {
      accuracy: options.mode === 'rescue' ? Location.Accuracy.High : Location.Accuracy.Balanced,
      timeInterval: options.intervalMs ?? (options.mode === 'rescue' ? 15000 : 30000),
      distanceInterval: options.distanceMeters ?? (options.mode === 'rescue' ? 25 : 75),
    },
    (location) => handler(location.coords),
  );
  return watcher;
}

export function stopWatchingPosition() {
  watcher?.remove();
  watcher = null;
}
