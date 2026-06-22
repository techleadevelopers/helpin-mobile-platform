import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const DATA_ITEMS = [
  'Conta: nome, e-mail, tipo de perfil e avatar.',
  'Localização: cidade, endereco informado no caso e coordenadas quando autorizadas.',
  'Publicacoes: fotos, descrição, comentarios, alertas, status e historico de resgate.',
  'Seguranca: logs tecnicos, denuncias, moderação, reputação e sinais antifraude.',
];

const PRINCIPLES = [
  'Usamos dados para aproximar ajuda real, voluntarios e ONGs de casos urgentes.',
  'Fotos, documentos e informacoes de verificação recebem tratamento sensivel.',
  'Contas de ONG podem passar por analise manual antes do selo de confianca.',
  'A pessoa pode atualizar dados, pedir suporte e solicitar exclusao da conta.',
];

export default function PrivacyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 18 : Math.max(insets.top, 10);
  const bottomPad = Platform.OS === 'web' ? 24 : Math.max(insets.bottom, 20);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header com navegação no canto direito */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Logo centralizado */}
        <View style={styles.headerCenter}>
          <Image source={require('../assets/images/icon.png')} style={styles.headerLogo} contentFit="cover" />
          <Text style={[styles.headerBrand, { color: colors.foreground }]}>Helpin</Text>
        </View>

        {/* Navegação lateral DIREITA - Privacy, Security, Data */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Text style={[styles.navItem, styles.navActive]}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Text style={[styles.navItem, { color: colors.mutedForeground }]}>Security</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Text style={[styles.navItem, { color: colors.mutedForeground }]}>Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll com conteúdo em tela cheia */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
      >
        {/* Título principal */}
        <View style={styles.titleSection}>
          <Text style={styles.kicker}>Operational privacy policy</Text>
          <Text style={styles.documentTitle}>Privacy Policy</Text>
          <Text style={[styles.lead, { color: colors.mutedForeground }]}>
            O Helpin usa dados para coordenar ajuda proxima, reduzir abuso, validar perfis confiaveis e manter
            transparencia em casos urgentes de resgate animal.
          </Text>
        </View>

        <View style={styles.rule} />

        {/* Coleção de dados */}
        <PolicySection title="Collection And Use of Personal Information">
          {DATA_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </PolicySection>

        {/* Princípios de segurança */}
        <PolicySection title="Security Principles">
          {PRINCIPLES.map((item) => (
            <Text key={item} style={[styles.paragraph, { color: colors.mutedForeground }]}>
              {item}
            </Text>
          ))}
        </PolicySection>

        {/* Uso emergencial */}
        <PolicySection title="Emergency Use">
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            Em alertas urgentes, o sistema pode usar raio de proximidade, localização do caso, status de resgate e
            notificacoes push para acelerar a resposta comunitaria.
          </Text>
        </PolicySection>

        {/* Doações e pagamentos */}
        <PolicySection title="Donations And Payments">
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            O Helpin e gratuito para usuarios que precisam de resgate. Doacoes para ONGs verificadas serao suportadas
            em fase futura. Por enquanto, nao ha transacoes financeiras dentro do app.
          </Text>
        </PolicySection>

        {/* Resumo operacional */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Resumo operacional</Text>
            <Text style={[styles.summaryBody, { color: colors.mutedForeground }]}>
              Esta tela resume a politica de privacidade do produto para a fase atual. A versao legal publica pode ser
              publicada separadamente antes da produção aberta.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.policySection}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', left: 0, right: 0, justifyContent: 'center' },
  headerLogo: { width: 28, height: 28, borderRadius: 8 },
  headerBrand: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerNav: { flexDirection: 'row', gap: 14, marginLeft: 'auto' },
  navItem: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  navActive: { color: '#277A55', borderBottomWidth: 2, borderBottomColor: '#277A55', paddingBottom: 4 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  titleSection: { marginBottom: 16, gap: 6 },
  kicker: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#8A94A3',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  documentTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'Inter_700Bold',
    color: '#101614',
    letterSpacing: -0.5,
  },
  lead: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_500Medium' },
  rule: { height: 1, backgroundColor: '#E5E8EC', marginVertical: 20 },
  policySection: { gap: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  sectionBody: { gap: 10, paddingLeft: 4 },
  paragraph: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#277A55', marginTop: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  summaryText: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  summaryBody: { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
});