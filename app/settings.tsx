import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const SETTINGS_SECTIONS: Array<{
  title: string;
  items: Array<{ icon: IconName; label: string; detail: string; route?: string; value?: boolean }>;
}> = [
  {
    title: 'Conta',
    items: [
      { icon: 'card-account-details-outline', label: 'Meus dados', detail: 'Nome, endereco e area principal', route: '/account-data' },
      { icon: 'shield-check-outline', label: 'Privacidade e seguranca', detail: 'Dados tratados e controles da conta', route: '/privacy' },
    ],
  },
  {
    title: 'Operação',
    items: [
      { icon: 'bell-ring-outline', label: 'Alertas de resgate', detail: 'Notificacoes proximas e casos urgentes', value: true },
      { icon: 'map-marker-radius-outline', label: 'Usar localização', detail: 'Aproximar casos, ONGs e voluntarios', value: true },
    ],
  },
  {
    title: 'Rede',
    items: [
      { icon: 'account-multiple-plus-outline', label: 'Convidar amigos', detail: 'Compartilhar Helpin com protetores', route: '/invite' },
      { icon: 'help-circle-outline', label: 'Suporte Helpin', detail: 'Atendimento direto no WhatsApp', route: '/support' },
    ],
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, chatUnreadCount } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]} activeOpacity={0.82}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Configuracoes</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{user?.name ?? 'Conta Helpin'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.statusPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: colors.primary + '14' }]}>
            <MaterialCommunityIcons name="check-decagram-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Conta pronta para operar</Text>
            <Text style={[styles.statusBody, { color: colors.mutedForeground }]}>
              Perfil, alertas e controles essenciais estao centralizados para uso diario.
            </Text>
          </View>
          {chatUnreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{Math.min(chatUnreadCount, 99)}</Text>
            </View>
          )}
        </View>

        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={item.route ? 0.82 : 1}
                    onPress={() => item.route && router.push(item.route as any)}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: colors.primary + '10' }]}>
                      <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                      <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
                    </View>
                    {typeof item.value === 'boolean' ? (
                      <Switch value={item.value} disabled trackColor={{ false: '#D8DED8', true: colors.primary + '66' }} thumbColor="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                  {index < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
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
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  content: { padding: 16, gap: 20, paddingBottom: 36 },
  statusPanel: { borderWidth: 1, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 3 },
  statusTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  statusBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#FF5A7A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter_700Bold' },
  section: { gap: 9 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
  list: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  row: { minHeight: 70, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  rowDetail: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  divider: { height: 1, marginLeft: 62 },
});
