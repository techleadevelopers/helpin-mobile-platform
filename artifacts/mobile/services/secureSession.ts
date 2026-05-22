import AsyncStorage from '@react-native-async-storage/async-storage';

declare const require: any;

const SecureStore: any = (() => {
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
})();

export const ACCESS_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

const LEGACY_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY];

async function secureStoreAvailable() {
  if (!SecureStore) return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getSecureItem(key: string) {
  if (await secureStoreAvailable()) {
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;
  }

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue && (await secureStoreAvailable())) {
    await SecureStore.setItemAsync(key, legacyValue, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await AsyncStorage.removeItem(key);
  }
  return legacyValue;
}

export async function setSecureItem(key: string, value: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

export async function removeSecureItem(key: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
  }
  await AsyncStorage.removeItem(key);
}

export async function clearSessionTokens() {
  await Promise.all(LEGACY_KEYS.map(removeSecureItem));
}

export async function getStoredAccessToken() {
  return getSecureItem(ACCESS_TOKEN_KEY);
}
