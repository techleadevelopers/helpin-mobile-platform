const { withAndroidManifest } = require("expo/config-plugins");

const phoneOnlyScreens = {
  "android:smallScreens": "true",
  "android:normalScreens": "true",
  "android:largeScreens": "false",
  "android:xlargeScreens": "false",
  "android:requiresSmallestWidthDp": "320",
};

module.exports = function withPhoneOnlyAndroid(config) {
  return withAndroidManifest(config, (modConfig) => {
    modConfig.modResults.manifest["supports-screens"] = [
      {
        $: phoneOnlyScreens,
      },
    ];

    return modConfig;
  });
};
