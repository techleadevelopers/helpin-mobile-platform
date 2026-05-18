import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const devDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const externalPort = process.env.EXPO_EXTERNAL_PORT || "3000";
  const origin = devDomain
    ? `https://${devDomain}:${externalPort}`
    : "https://replit.com/";

  return {
    ...config,
    name: "ZooHelp",
    slug: "mobile",
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
      buildNumber: "1",
      requireFullScreen: false,
      infoPlist: {
        NSCameraUsageDescription:
          "O ZooHelp precisa acessar sua câmera para que você possa fotografar animais nas publicações.",
        NSPhotoLibraryUsageDescription:
          "O ZooHelp precisa acessar sua galeria para que você possa escolher fotos nas publicações.",
        NSPhotoLibraryAddUsageDescription:
          "O ZooHelp precisa salvar fotos na sua galeria.",
        NSLocationWhenInUseUsageDescription:
          "O ZooHelp usa sua localização para mostrar animais próximos de você.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "O ZooHelp usa sua localização para mostrar animais próximos e enviar alertas de emergência na sua região.",
        NSMicrophoneUsageDescription:
          "O ZooHelp pode precisar do microfone para gravação de áudio nas publicações.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#4CAF50",
      },
      package: "com.zoohelp.app",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.RECORD_AUDIO",
      ],
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin,
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "O ZooHelp usa sua localização para mostrar animais próximos e enviar alertas de emergência na sua região.",
          locationWhenInUsePermission:
            "O ZooHelp usa sua localização para mostrar animais próximos de você.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "O ZooHelp precisa acessar sua galeria para que você possa escolher fotos nas publicações.",
          cameraPermission:
            "O ZooHelp precisa acessar sua câmera para fotografar animais.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
