const path = require('path');

module.exports = {
  mode: 'development',
  entry: require.resolve('expo-router/entry'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules'), 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/constants': path.resolve(__dirname, 'constants'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/context': path.resolve(__dirname, 'context'),
      '@/assets': path.resolve(__dirname, 'assets'),
      '@/services': path.resolve(__dirname, 'services'),
      'react-native$': require.resolve('react-native-web'),
    },
    fallback: {
      'react-native': require.resolve('react-native-web'),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(@expo|expo|react-native|expo-router)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-expo'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg|ttf)$/,
        type: 'asset/resource',
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'web'),
    },
    port: 8081,
    hot: true,
    historyApiFallback: true,
  },
};
