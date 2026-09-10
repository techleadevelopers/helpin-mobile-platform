import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { API_BASE_URL } from '@/services/zoohelpApi';
import { ZooHelpApiError } from '@/services/zoohelpEngine';

const ZOOHELP_LOGIN_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

export default function LoginScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const logoAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(700),
      ])
    );

    logoLoop.start();
    return () => logoLoop.stop();
  }, [logoAnimation]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('auth.errRequiredTitle'), t('auth.errRequired'));
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      const detail =
        error instanceof ZooHelpApiError
          ? `API: ${API_BASE_URL}\nStatus: ${error.status ?? 'rede'}\n${error.message}`
          : `API: ${API_BASE_URL}\n${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      Alert.alert(t('auth.errLoginTitle'), detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#F0FBF1', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 22.8, paddingBottom: bottomPad + 22.8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoRow,
              {
                transform: [
                  {
                    translateY: logoAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -1.6, 0],
                    }),
                  },
                  {
                    rotate: logoAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['0deg', '-0.8deg', '0deg'],
                    }),
                  },
                  {
                    scale: logoAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.018, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.Image source={{ uri: ZOOHELP_LOGIN_LOGO }} resizeMode="contain" style={styles.logoImage} />
            <Text style={[styles.logoText, { color: colors.primary }]}>Helpers</Text>
          </Animated.View>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            {t('common.tagline')}
          </Text>
        </View>

        <View style={styles.form}>
          

          <View style={styles.inputWrapper}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="email-outline" size={17} color={colors.mutedForeground} />
            </View>
            <TextInput
              style={[styles.input, styles.loginInput]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-outline" size={17} color={colors.mutedForeground} />
            </View>
            <TextInput
              style={[styles.input, styles.loginInput]}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push({ pathname: '/forgot-password', params: { email } } as any)}>
            <Text style={[styles.forgotText, { color: colors.secondary }]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.signInButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.signInButtonText}>
              {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>{t('auth.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.primary }]}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>
              {t('auth.createAccount')}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 23.75, gap: 30.4, marginTop: 138 },
  logoSection: { alignItems: 'center', gap: 11.4, marginTop: 6 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    bottom: 10,
    left: -10.6,
    position: 'relative',
  },
  logoImage: {
    width: 43.62,
    height: 43.62,
    borderRadius: 7.6,
    opacity: 0.98,
  },
  logoText: {
    marginLeft: -0.95,
    top: 1.9,
    fontSize: 33.26,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -0.95,
    lineHeight: 29.26,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: { fontSize: 13.3, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  form: { gap: 13.3 },
  title: { fontSize: 24.7, fontFamily: 'Inter_700Bold', letterSpacing: -0.475, marginBottom: 3.8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26.6,
    height: 39.71,
    marginHorizontal: 17.1,
    marginBottom: 9.5,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 7.6 },
    shadowOpacity: 1,
    shadowRadius: 14.25,
    elevation: 0,
    paddingLeft: 14.25,
    paddingRight: 4.75,
  },
  iconCircle: {
    width: 47.5,
    height: 28.5,
    right: 7.6,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? '#16796300' : '#FFFFFF',
    marginRight: 9.5,
  },
  input: {
    flex: 1,
    fontSize: 14.25,
    color: '#2D3748',
    paddingVertical: 0,
    height: 38.95,
  },
  loginInput: {
    height: 32.3,
  },
  passwordToggle: {
    left: -13.3,
  },
  forgotBtn: { alignSelf: 'flex-end', left: -18.05 },
  forgotText: { fontSize: 12.35, fontFamily: 'Inter_500Medium' },
  signInButton: {
    backgroundColor: '#606864',
    borderRadius: 26.6,
    paddingVertical: 7.6,
    top: Platform.OS === 'ios' ? 0 : 1.9,
    width: '71.25%',
    left: 48.25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
    bottom: 52.25,
    marginBottom: 7.6,
    shadowColor: '#606864',
    shadowOffset: { width: 0, height: 4.75 },
    shadowOpacity: 0.3,
    shadowRadius: 7.6,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: '#445e55',
    elevation: 0,
    shadowOpacity: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14.25,
    fontWeight: '600',
  },
  loginBtn: {
    paddingVertical: 15.2,
    borderRadius: 13.3,
    alignItems: 'center',
    marginTop: 3.8,
    shadowOffset: { width: 0, height: 3.8 },
    shadowOpacity: 0.3,
    shadowRadius: 11.4,
    elevation: 6,
  },
  loginBtnText: { fontSize: 16.15, fontFamily: 'Inter_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 11.4, marginHorizontal: 39.9, left: -10.5 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11.4, fontFamily: 'Inter_400Regular' },
  registerBtn: {
    minHeight: 34.2,
    borderRadius: 26.6,
    paddingVertical: 7.6,
    width: '71.25%',
    left: 48.25,
    marginTop: 7.6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  registerBtnText: { fontSize: 13.3, fontFamily: 'Inter_600SemiBold' },
});
