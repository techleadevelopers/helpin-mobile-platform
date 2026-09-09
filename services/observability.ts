import Constants from 'expo-constants';

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

let initialized = false;
let sentry: {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => void;
} | null = null;

export async function initializeObservability() {
  if (initialized) return;
  initialized = true;

  const dsn =
    Constants.expoConfig?.extra?.sentryDsn ??
    process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    const moduleName = '@sentry/react-native';
    const loadedSentry = await import(moduleName) as any;
    sentry = loadedSentry;
    loadedSentry.init({
      dsn,
      environment: Constants.expoConfig?.extra?.environment ?? process.env.NODE_ENV ?? 'development',
      tracesSampleRate: 0.1,
    });
  } catch {
    sentry = null;
  }
}

export function captureException(error: unknown, context?: CaptureContext) {
  if (!error) return;
  if (sentry) {
    sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: context?.tags,
      extra: context?.extra,
    });
    return;
  }
  if (__DEV__) {
    console.warn('[observability]', error, context);
  }
}
