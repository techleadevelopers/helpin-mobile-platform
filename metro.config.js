const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Força a resolução de módulos problemáticos
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve expo-web-browser
  if (moduleName === 'expo-web-browser') {
    return {
      filePath: require.resolve('expo-web-browser'),
      type: 'sourceFile',
    };
  }
  
  // Resolve @expo/vector-icons
  if (moduleName === '@expo/vector-icons') {
    return {
      filePath: require.resolve('@expo/vector-icons'),
      type: 'sourceFile',
    };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;