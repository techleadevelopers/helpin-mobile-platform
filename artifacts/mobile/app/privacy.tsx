import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PRINCIPLES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'map-marker-radius-outline',
    title: 'Localizacao com finalidade clara',
    body: 'A localizacao serve para aproximar ajuda, voluntarios e ONGs. Ela nao deve expor pessoas, lares ou rotinas sem necessidade.',
  },
  {
    icon: 'image-lock-outline',
    title: 'Fotos e documentos protegidos',
    body: 'Imagens de casos, perfil e verificacao sao tratadas como informacao sensivel para confianca, moderacao e prevencao de fraude.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Confianca com revisao humana',
    body: 'Contas de ONG podem passar por analise manual, validacao documental e revisao operacional antes do selo de confianca.',
  },
  {
    icon: 'account-cancel-outline',
    title: 'Controle da conta',
    body: 'A pessoa pode ajustar informacoes, solicitar suporte e pedir exclusao da conta quando necessario.',
  },
];

const DATA_ITEMS = [
  'Conta: nome, e-mail, tipo de perfil e avatar.',
  'Localizacao: cidade, endereco informado no caso e coordenadas quando autorizadas.',
  'Publicacoes: fotos, descricao, comentarios, alertas, status e historico de resgate.',
  'Seguranca: logs tecnicos, denuncias, moderacao, reputacao e sinais antifraude.',
];

export default function PrivacyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 14 : Math.max(insets.top, 8);

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

        <View style={styles.brandBlock}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} contentFit="cover" />
          <View style={styles.headerText}>
            <Text style={[styles.brandName, { color: colors.primary }]}>ZooHelp</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Privacidade e seguranca</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + '12' }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>
            Protecao para uma rede real de resgate animal.
          </Text>
          <Text style={[styles.introText, { color: colors.mutedForeground }]}>
            O ZooHelp usa dados para coordenar ajuda proxima, reduzir abuso, validar perfis confiaveis e manter
            transparencia em casos urgentes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Principios de seguranca</Text>
          <View style={[styles.list, { borderTopColor: colors.border }]}>
            {PRINCIPLES.map((item) => (
              <View key={item.title} style={[styles.principleRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons name={item.icon} size={17} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados tratados</Text>
          <View style={styles.dataList}>
            {DATA_ITEMS.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={15} color={colors.primary} />
                <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Uso em emergencias</Text>
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            Em alertas urgentes, o sistema pode usar raio de proximidade, localizacao do caso, status de resgate e
            notificacoes push para acelerar a resposta comunitaria. A visibilidade deve ser proporcional a necessidade
            operacional do caso.
          </Text>
        </View>

        <View style={[styles.footerNote, { borderTopColor: colors.border }]}>
          <MaterialCommunityIcons name="file-document-check-outline" size={18} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Esta tela resume a politica operacional de privacidade do produto. Termos legais completos podem ser
            publicados em versao dedicada conforme a operacao entrar em producao.
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
    paddingBottom: 13,
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
  brandBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 10 },
  headerText: { flex: 1 },
  brandName: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0, lineHeight: 24 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    gap: 24,
    paddingBottom: 36,
  },
  intro: { gap: 9 },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', lineHeight: 27, letterSpacing: 0 },
  introText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  section: { gap: 11 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  list: { borderTopWidth: 1 },
  principleRow: {
    borderBottomWidth: 1,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 10,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', lineHeight: 17 },
  rowBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  dataList: { gap: 10 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  paragraph: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  footerNote: {
    borderTopWidth: 1,
    paddingTop: 14,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  footerText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
