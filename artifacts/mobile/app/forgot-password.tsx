import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { createZooHelpApi } from '@/services/zoohelpApi';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('E-mail invalido', 'Informe o e-mail cadastrado na sua conta.');
      return;
    }

    setLoading(true);
    try {
      await createZooHelpApi()?.requestPasswordReset(cleanEmail);
      setSent(true);
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
            <MaterialCommunityIcons name="email-lock-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={18} color="#7C867C" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#8A928B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={submit}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{loading ? 'Enviando...' : 'Enviar link'}</Text>
          </TouchableOpacity>

          {sent && (
            <View style={styles.notice}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.noticeText}>
                Se esse e-mail existir, o link de redefinicao sera enviado em instantes.
              </Text>
            </View>
          )}
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
  title: { fontSize: 28, fontFamily: 'Montserrat_700Bold', color: '#162018', letterSpacing: 0 },
  subtitle: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: '#5D665E', lineHeight: 21 },
  form: { marginTop: 30, gap: 12 },
  label: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#5D665E', textTransform: 'uppercase' },
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
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 16, backgroundColor: '#EAF3EC' },
  noticeText: { flex: 1, fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#3D473F', lineHeight: 18 },
});
