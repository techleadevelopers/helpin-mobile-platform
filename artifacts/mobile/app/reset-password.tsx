import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createZooHelpApi } from '@/services/zoohelpApi';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const cleanToken = token?.trim();
    if (!cleanToken) {
      Alert.alert('Link invalido', 'Solicite um novo link de redefinição de senha.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Senha fraca', 'Use pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'As senhas informadas nao coincidem.');
      return;
    }

    setLoading(true);
    try {
      await createZooHelpApi()?.confirmPasswordReset(cleanToken, password);
      Alert.alert('Senha atualizada', 'Entre novamente usando sua nova senha.', [
        { text: 'Entrar', onPress: () => router.replace('/login') },
      ]);
    } catch {
      Alert.alert('Link expirado', 'Nao foi possivel atualizar a senha. Solicite um novo link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#F0FBF1', '#FFFFFF']} style={styles.root}>
      <View style={[styles.container, { paddingTop: (Platform.OS === 'web' ? 24 : insets.top) + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={21} color="#1D2A20" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="lock-reset" size={30} color="#2D6A4F" />
          </View>
          <Text style={styles.title}>Criar nova senha</Text>
          <Text style={styles.subtitle}>Escolha uma senha forte para proteger sua conta Helpin.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#7C867C" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Nova senha"
              placeholderTextColor="#8A928B"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#7C867C" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="lock-check-outline" size={18} color="#7C867C" />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar senha"
              placeholderTextColor="#8A928B"
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{loading ? 'Atualizando...' : 'Atualizar senha'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF4EF' },
  header: { marginTop: 42, gap: 10 },
  iconBadge: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontFamily: 'Montserrat_700Bold', color: '#162018' },
  subtitle: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: '#5D665E', lineHeight: 21 },
  form: { marginTop: 30, gap: 12 },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE5DF',
  },
  input: { flex: 1, padding: 0, fontSize: 15, fontFamily: 'Montserrat_500Medium', color: '#1D2A20' },
  primaryBtn: { minHeight: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#606864', marginTop: 8 },
  disabledBtn: { opacity: 0.65 },
  primaryText: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
