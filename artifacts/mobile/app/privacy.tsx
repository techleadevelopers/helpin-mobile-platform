import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PRINCIPLES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'map-marker-radius-outline',
    title: 'Localização com finalidade operacional',
    body: 'Usamos localização para aproximar alertas, voluntários e ONGs. O dado deve servir ao resgate, não à exposição indevida.',
  },
  {
    icon: 'image-lock-outline',
    title: 'Fotos e documentos protegidos',
    body: 'Fotos de casos, perfil e verificação são tratadas como informação sensível e usadas para confiança, moderação e prevenção de fraude.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Confiança e revisão humana',
    body: 'Contas de ONG podem passar por análise manual, validação documental e revisão operacional antes de receber selo de confiança.',
  },
  {
    icon: 'account-cancel-outline',
    title: 'Controle da conta',
    body: 'O usuário pode ajustar informações, solicitar suporte e pedir exclusão da conta quando necessário.',
  },
];

const DATA_ITEMS = [
  'Dados de conta: nome, e-mail, tipo de perfil e avatar.',
  'Dados operacionais: cidade, endereço informado no caso, latitude/longitude quando autorizada.',
  'Conteúdo publicado: fotos, descrição, comentários, alertas, status e histórico de resgate.',
  'Segurança: logs técnicos, denúncias, moderação, reputação e sinais antifraude.',
];

export default function PrivacyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 12 : Math.max(insets.top, 8);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: colors.mutedForeground }]}>ZooHelp Trust & Safety</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Privacidade e segurança</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.heroPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '12' }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Proteção para uma rede real de resgate animal.
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            O ZooHelp usa dados para coordenar ajuda próxima, reduzir abuso, validar perfis confiáveis
            e manter transparência em casos urgentes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Princípios de segurança</Text>
          {PRINCIPLES.map((item) => (
            <View key={item.title} style={[styles.principleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.policyPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados tratados</Text>
          {DATA_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color={colors.primary} />
              <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.policyPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Uso em emergências</Text>
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            Em alertas urgentes, o sistema pode usar raio de proximidade, localização do caso, status de
            resgate e notificações push para acelerar a resposta comunitária. A visibilidade deve ser
            proporcional à necessidade operacional do caso.
          </Text>
        </View>

        <View style={[styles.footerPanel, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="file-document-check-outline" size={18} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Esta tela resume a política operacional de privacidade do produto. Termos legais completos
            podem ser publicados em versão dedicada conforme a operação entrar em produção.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  kicker: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 34,
  },
  heroPanel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', lineHeight: 25, letterSpacing: 0 },
  heroText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  principleRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', lineHeight: 17 },
  rowBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  policyPanel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  paragraph: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  footerPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  footerText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
