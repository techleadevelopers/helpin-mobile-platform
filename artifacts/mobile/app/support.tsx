import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const SUPPORT_WHATSAPP_URL =
  'https://wa.me/551993223932?text=Ola%2C%20preciso%20de%20suporte%20do%20Helpin.';

const SUPPORT_ITEMS: Array<{
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body: string;
}> = [
  {
    icon: 'lifebuoy',
    title: 'Resgate em andamento',
    body: 'Ajuda para casos urgentes, falha ao publicar ou dificuldade para falar com voluntarios.',
  },
  {
    icon: 'shield-alert-outline',
    title: 'Seguranca e denuncia',
    body: 'Relate spam, golpe, caso falso, comportamento abusivo ou risco operacional.',
  },
  {
    icon: 'account-cog-outline',
    title: 'Conta e acesso',
    body: 'Suporte para perfil, verificação, notificacoes, privacidade e exclusao de conta.',
  },
];

export default function SupportScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  async function openWhatsApp() {
    const canOpen = await Linking.canOpenURL(SUPPORT_WHATSAPP_URL);
    if (!canOpen) {
      Alert.alert('WhatsApp indisponivel', 'Nao foi possivel abrir o WhatsApp neste aparelho.');
      return;
    }
    Linking.openURL(SUPPORT_WHATSAPP_URL);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]} activeOpacity={0.82}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Suporte Helpin</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Atendimento direto para operação e conta</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: '#25D36622' }]}>
            <MaterialCommunityIcons name="whatsapp" size={30} color="#128C4A" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Fale com o suporte no WhatsApp</Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Use este canal para problemas de resgate, conta, denuncia ou operação do app.
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={openWhatsApp} activeOpacity={0.86}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Chamar suporte</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Como podemos ajudar</Text>
          <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {SUPPORT_ITEMS.map((item, index) => (
              <React.Fragment key={item.title}>
                <View style={styles.item}>
                  <View style={[styles.itemIcon, { backgroundColor: colors.primary + '10' }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.itemBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                  </View>
                </View>
                {index < SUPPORT_ITEMS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  content: { padding: 16, gap: 20, paddingBottom: 36 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 12 },
  heroIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', lineHeight: 27 },
  heroText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  button: { minHeight: 50, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
  section: { gap: 9 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  list: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  item: { minHeight: 84, padding: 13, flexDirection: 'row', gap: 11, alignItems: 'center' },
  itemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  itemBody: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  divider: { height: 1, marginLeft: 62 },
});
