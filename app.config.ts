import type { ExpoConfig, ConfigContext } from "expo/config";

const APP_VERSION = "1.0.12";
const IOS_BUILD_NUMBER = "1";
const ANDROID_VERSION_CODE = 12;
const DEFAULT_API_BASE_URL = "https://helpin-platform-core-production.up.railway.app";

export default ({ config }: ConfigContext): ExpoConfig => {
  const devDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const externalPort = process.env.EXPO_EXTERNAL_PORT || "3000";
  const isProduction = process.env.APP_ENV === "production";
  const origin = devDomain ? `https://${devDomain}:${externalPort}` : "https://zoohelp.app";

  return {
    ...config,
    name: "Helpin",
    slug: "mobile",
    owner: process.env.EXPO_OWNER,
    version: APP_VERSION,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "zoohelp",
    userInterfaceStyle: "automatic",
    // @ts-ignore: Propriedade válida no Expo, mas ausente na tipagem atual do ExpoConfig
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.zoohelp.app",
      buildNumber: IOS_BUILD_NUMBER,
      requireFullScreen: false,
      infoPlist: {
        CFBundleLocalizations: ["en", "en_GB", "de", "tr", "pt_BR"],
        NSCameraUsageDescription:
          "O Helpin precisa acessar sua câmera para que você possa fotografar animais nas publicações.",
        NSPhotoLibraryUsageDescription:
          "O Helpin precisa acessar sua galeria para que você possa escolher fotos nas publicações.",
        NSPhotoLibraryAddUsageDescription:
          "O Helpin precisa salvar fotos na sua galeria.",
        NSLocationWhenInUseUsageDescription:
          "O Helpin usa sua localização para mostrar animais próximos de você.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "O Helpin usa sua localização para mostrar animais próximos e enviar alertas de emergência na sua região.",
        NSMicrophoneUsageDescription:
          "O Helpin pode precisar do microfone para gravação de áudio ou vídeo nas publicações.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon-foreground.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.zoohelp.app",
      // Google Play exige versionCode maior a cada novo upload.
      versionCode: ANDROID_VERSION_CODE,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
      ],
      blockedPermissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.RECORD_AUDIO",
      ],
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      "./plugins/withPhoneOnlyAndroid",
      "expo-secure-store",
      ["expo-notifications", { icon: "./assets/images/icon.png", color: "#4F46E5" }],
      ["expo-location", { locationWhenInUsePermission: "O Helpin usa sua localização para alertas de resgate próximos." }],
      // "expo-router",  // REMOVIDO
      // "expo-font",   // REMOVIDO
      // "expo-web-browser",  // REMOVIDO
      // "expo-location",  // REMOVIDO
      // "expo-image-picker",  // REMOVIDO
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      ...config.extra,
      environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
      // EAS resolves EXPO_PUBLIC_* variables while building and embeds this in the APK.
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "",
      supportedLocales: ["de-DE", "en-US", "en-GB", "tr-TR", "pt-BR"],
      eas: {
        projectId: "6fa106b1-6f9f-4da4-872e-5ba9ee75ff4b"
      },
      router: {
        origin: isProduction ? "https://zoohelp.app" : origin,
      }
    },
  };
};
