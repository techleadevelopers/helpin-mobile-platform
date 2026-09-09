/**
 * Push-token registration is intentionally disabled for Expo SDK 57.
 * App notifications continue to be fetched from the API and displayed in-app.
 */
export async function registerRescueAlerts(_userId: string): Promise<null> {
  return null;
}
