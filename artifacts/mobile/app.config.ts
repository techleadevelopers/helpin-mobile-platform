import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const devDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const externalPort = process.env.EXPO_EXTERNAL_PORT || "3000";
  const isProduction = process.env.APP_ENV === "production";
  const origin = devDomain ? `https://${devDomain}:${externalPort}` : "https://zoohelp.app";

  return {
    ...config,
    name: "ZooHelp",
    slug: "mobile",
    owner: process.env.EXPO_OWNER,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "zoohelp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#4CAF50",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.zoohelp.app",
      buildNumber: process.env.IOS_BUILD_NUMBER || "1",
      requireFullScreen: false,
      infoPlist: {
        NSCameraUsageDescription:
          "O ZooHelp precisa acessar sua câmera para que você possa fotografar animais nas publicações.",
        NSPhotoLibraryUsageDescription:
          "O ZooHelp precisa acessar sua galeria para que você possa escolher fotos nas publicações.",
        NSPhotoLibraryAddUsageDescription:
          "O ZooHelp precisa salvar fotos na sua galeria.",
        NSLocationWhenInUseUsageDescription:
          "O ZooHelp usa sua localizaçío para mostrar animais próximos de você.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "O ZooHelp usa sua localizaçío para mostrar animais próximos e enviar alertas de emergência na sua regiío.",
        NSMicrophoneUsageDescription:
          "O ZooHelp pode precisar do microfone para gravaçío de áudio ou vídeo nas publicações.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#4CAF50",
      },
      package: "com.zoohelp.app",
      versionCode: Number(process.env.ANDROID_VERSION_CODE || "1"),
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
      [
        "expo-router",
        {
          origin: isProduction ? "https://zoohelp.app" : origin,
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "O ZooHelp usa sua localizaçío para mostrar animais próximos e enviar alertas de emergência na sua regiío.",
          locationWhenInUsePermission:
            "O ZooHelp usa sua localizaçío para mostrar animais próximos de você.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "O ZooHelp precisa acessar sua galeria para que você possa escolher fotos nas publicações.",
          cameraPermission:
            "O ZooHelp precisa acessar sua câmera para fotografar animais.",
          microphonePermission: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      ...config.extra,
      environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "",
    },
  };
};
