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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { API_BASE_URL } from '@/services/zoohelpApi';
import { ZooHelpApiError } from '@/services/zoohelpEngine';

const ZOOHELP_LOGIN_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

export default function LoginScreen() {
  const colors = useColors();
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
      Alert.alert('Campos obrigatórios', 'Por favor, preencha email e senha.');
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
      Alert.alert('Erro no login', detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#F0FBF1', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
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
            <Text style={[styles.logoText, { color: colors.primary }]}>Helpin</Text>
          </Animated.View>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Plataforma de resgate e apoio animal
          </Text>
        </View>

        <View style={styles.form}>
          

          <View style={styles.inputWrapper}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="email-outline" size={18} color={colors.mutedForeground} />
            </View>
            <TextInput
              style={[styles.input, styles.loginInput]}
              placeholder="Seu e-mail"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
            </View>
            <TextInput
              style={[styles.input, styles.loginInput]}
              placeholder="Senha"
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
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push({ pathname: '/forgot-password', params: { email } } as any)}>
            <Text style={[styles.forgotText, { color: colors.secondary }]}>
              Esqueceu sua senha?
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
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.primary }]}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>
              Criar conta gratuita
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 25, gap: 32, marginTop: 80, },
  logoSection: { alignItems: 'center', gap: 12 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    left: -8,
    position: 'relative',
  },
  logoImage: {
    width: 38.55,
    height: 38.55,
    borderRadius: 8,
  },
  logoText: {
    marginLeft: -1,
    top: 2,
    fontSize: 29.75,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -1,
    lineHeight: 30.8,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center',  },
  form: { gap: 14 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 4,  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 41.8,
    marginHorizontal: 18,
    marginBottom: 10,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0,
    paddingLeft: 15,
    paddingRight: 5,
  },
  iconCircle: {
    width: 50,
    height: 30,
    right: 8,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? '#16796300' : '#FFFFFF',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    paddingVertical: 0,
    height: 41,
  },
  loginInput: {
    height: 34,
  },
  passwordToggle: {
    left: -14,
  },
  forgotBtn: { alignSelf: 'flex-end', left: -19, },
  forgotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  signInButton: {
    backgroundColor: '#606864',
    borderRadius: 28,
    paddingVertical: 8,
    top: Platform.OS === 'ios' ? 0 : 2,
    width: '75%',
    left: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    bottom: 55,
    marginBottom: 8,
    shadowColor: '#606864',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: '#445e55',
    elevation: 0,
    shadowOpacity: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 42, left: -10, },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  registerBtn: {
    minHeight: 36,
    borderRadius: 28,
    paddingVertical: 8,
    width: '75%',
    left: 35,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  registerBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
