import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavigationLoadingOverlay } from "@/components/NavigationLoadingOverlay";
import { ZooHelpLoading } from "@/components/ZooHelpLoading";
import { AppProvider } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import "@/i18n";
import { initializeObservability } from "@/services/observability";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function notificationTargetFromResponse(response: Notifications.NotificationResponse | null | undefined) {
  const data = response?.notification.request.content.data;
  if (!data) return null;

  const deeplink = typeof data.deeplink === "string" ? data.deeplink : "";
  const postIdFromData = typeof data.postId === "string" ? data.postId : "";
  const chatIdFromData = typeof data.roomId === "string" ? data.roomId : "";
  const postMatch = deeplink.match(/zoohelp:\/\/post\/([^?]+)/);
  const chatMatch = deeplink.match(/zoohelp:\/\/chat\/([^?]+)/);
  const postId = postMatch?.[1] || postIdFromData;
  const chatId = chatMatch?.[1] || chatIdFromData;

  if (postId) return { pathname: "/post/[id]" as const, params: { id: postId } };
  if (chatId) return { pathname: "/chat/[id]" as const, params: { id: chatId } };
  return null;
}

function NotificationDeepLinkHandler() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useApp();
  const pendingTargetRef = React.useRef<ReturnType<typeof notificationTargetFromResponse>>(null);
  const lastHandledRef = React.useRef<string | null>(null);

  const handleResponse = React.useCallback((response: Notifications.NotificationResponse | null | undefined) => {
    const target = notificationTargetFromResponse(response);
    if (!target) return;
    const key = `${target.pathname}:${target.params.id}`;
    if (lastHandledRef.current === key) return;
    lastHandledRef.current = key;
    if (isLoading || !isAuthenticated) {
      pendingTargetRef.current = target;
      return;
    }
    router.push(target);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch(() => {});
    return () => subscription.remove();
  }, [handleResponse]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !pendingTargetRef.current) return;
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    router.push(target);
  }, [isAuthenticated, isLoading, router]);

  return null;
}

function RootLayoutNav() {
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useApp();
  const firstSegment = segments[0] as string | undefined;
  const isPublicRoute =
    !firstSegment ||
    firstSegment === "login" ||
    firstSegment === "register" ||
    firstSegment === "forgot-password" ||
    firstSegment === "reset-password";

  if (isLoading) return <ZooHelpLoading />;
  if (!isAuthenticated && !isPublicRoute) return <Redirect href="/login" />;

  return (
    <>
    <NotificationDeepLinkHandler />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="ong-dashboard" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="ongs"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="compose"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="composer"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="verification" options={{ headerShown: false }} />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account-data" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="marketplace" />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    initializeObservability();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <StatusBar style="auto" backgroundColor="#F5F7F5" translucent={false} />
                <RootLayoutNav />
                <NavigationLoadingOverlay />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
