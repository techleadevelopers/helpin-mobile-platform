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
  options: { intervalMs?: number; distanceMeters?: number } = {},
) {
  const allowed = await ensureLocationPermission();
  if (!allowed) return null;

  stopWatchingPosition();
  watcher = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: options.intervalMs ?? 5000,
      distanceInterval: options.distanceMeters ?? 10,
    },
    (location) => handler(location.coords),
  );
  return watcher;
}

export function stopWatchingPosition() {
  watcher?.remove();
  watcher = null;
}
