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
      Alert.alert('Erro', 'Não foi possível fazer login. Tente novamente.');
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
      Alert.alert('Recuperação enviada', 'Se o e-mail existir, enviaremos as instruções de recuperação.');
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
            Plataforma de adoção, resgate e apoio animal
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.foreground }]}>Entrar</Text>

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="email-outline" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Seu e-mail"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
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
              styles.loginBtn,
              {
                backgroundColor: loading ? colors.muted : colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.loginBtnText, { color: loading ? colors.mutedForeground : '#FFFFFF' }]}>
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

          <TouchableOpacity
            style={styles.bypassBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={[styles.bypassText, { color: colors.mutedForeground }]}>
              Explorar sem conta →
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
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
  bypassBtn: { alignItems: 'center', paddingVertical: 10 },
  bypassText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
