import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

export default function VerificationScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
      </TouchableOpacity>
      <MaterialCommunityIcons name="shield-check-outline" size={46} color="#4CAF50" />
      <Text style={[styles.title, { color: colors.foreground }]}>Verificaçío de conta</Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        ONGs ganham selo após validaçío de CNPJ, telefone, cidade e análise operacional. O cadastro já envia esses dados ao backend.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 16 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  text: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
});
