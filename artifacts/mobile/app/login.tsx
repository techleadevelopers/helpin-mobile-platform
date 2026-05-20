import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
import { createZooHelpApi } from '@/services/zoohelpApi';

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

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail', 'Digite seu e-mail para receber as instruções.');
      return;
    }
    try {
      await createZooHelpApi()?.requestPasswordReset(email.trim());
    } finally {
      Alert.alert('Recuperacao enviada', 'Se o e-mail existir, enviaremos as instrucoes de recuperacao.');
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
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary + '50',
                shadowColor: colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons name="paw" size={34} color="#FFFFFF" />
          </View>
          <Text style={[styles.logoText, { color: colors.primary }]}>ZooHelp</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Plataforma de adocao, resgate e apoio animal
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
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={handlePasswordReset}>
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
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 32 },
  logoSection: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  logoText: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  form: { gap: 14 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 41.8,
    bottom: Platform.OS === 'ios' ? 55 : 45,
    marginBottom: 10,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0,
    paddingLeft: 5,
    paddingRight: 15,
  },
  iconCircle: {
    width: 50,
    height: 30,
    right: 2,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? '#85d0fc34' : '#FFFFFF',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    paddingVertical: 0,
    height: 44,
  },
  loginInput: {
    height: 34,
    bottom: Platform.OS === 'ios' ? 0 : 2,
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  signInButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 28,
    paddingVertical: 8,
    top: Platform.OS === 'ios' ? 0 : 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    bottom: 55,
    marginBottom: Platform.OS === 'ios' ? 35 : 25,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: '#A0CFFF',
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  registerBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 2 },
  registerBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
